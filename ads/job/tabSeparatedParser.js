/**
* Copyright 2011 Facebook, Inc.
*
* You are hereby granted a non-exclusive, worldwide, royalty-free license to
* use, copy, modify, and distribute this software in source code or binary
* form for use in connection with the web services and APIs provided by
* Facebook.
*
* As with any software that integrates with the Facebook platform, your use
* of this software is subject to the Facebook Developer Principles and
* Policies [http://developers.facebook.com/policy/]. This copyright notice
* shall be included in all copies or substantial portions of the software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
* THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*
*
*/

var fun = require("../../uki-core/function");
var utils = require("../../uki-core/utils");
var Job = require("./base").Job;
var AdError = require("../lib/error").Error;
var async = require("../../lib/async");

var ESCAPED_CHAR_RE = /"(.)/g;
var ESCAPED_CHECK_RE = /[\t\n]/;
var LINE_BREAK_RE = /(\r\n|\r|\n)/g;

// Excel is inconsistent in escaping.
// On copy&paste it will escape only when \t or \n is the value.
// On save it will escape in much more cases.
//
// The problem case is if you get something like:
//   "string in quotes ""with a quote"
// When c&p it will be the actual value
// When save it will be: string in quotes "with a quote
var CHUNKER_RE = /(\t|\n|^)(?:"((?:(?:"")*[^"]*)*)"|([^\t\n]*))/gi;
var CHUNKER_RE_PASTE =
  /(\t|\n|^)(?:"((?:(?:(?:"")*[^"]*)*)|(?:[^\t\n]*))"|([^\t\n]*))/gi;

function parseTSV(string, excelPaste) {
  try { // error report
  // exit fast
  if (!string) { return []; }
  var re = excelPaste ? CHUNKER_RE_PASTE : CHUNKER_RE;
  var result = [], current = [], value, match;
  string = string.replace(LINE_BREAK_RE, '\n');
  while (match = re.exec(string)) {
    // new line found (either line break or start)
    if (match[1] != '\t') {
      result.push(current = []);
    }

    if (match[2]) {
      value = match[2].replace(ESCAPED_CHAR_RE, '$1');
      if (excelPaste && !value.match(ESCAPED_CHECK_RE)) {
        value = '"' + match[2] + '"';
      }
    } else {
      value = match[3];
    }
    current.push(value);
  }
  result = utils.filter(result, function(s) {
    return s.join('').match(/\S/);
  });

  } catch (e) {
    require("../../lib/errorReport").handleException(e, 'tsp:pars');
  }

  return result;
}

function mapProps(props, header) {
  var found = [],
  missed = [];

  header.forEach(function(h, hi) {
    for (var i = 0; i < props.length; i++) {
      if (props[i].matchTSHeader(h)) {
        found.push({
          index: hi,
          name: props[i].name
        });
        return;
      }
    }
    missed.push(h);
  });

  return { found: found, missed: missed };
}

var Parser = fun.newClass(Job,
  require("../lib/loggingState").getMixinForJob('campaign_importer'), {

  // in params
  imageLookup: fun.newProp('imageLookup'),
  account: fun.newProp('account'),
  string: fun.newProp('string'),

  // optional in
  excelPaste: fun.newProp('excelPaste'),

  // out params
  ads: fun.newProp('ads'),
  camps: fun.newProp('camps'),
  foundAdProps: fun.newProp('foundAdProps'),
  foundCampProps: fun.newProp('foundCampProps'),

  init: function(account, string, imageLookup) {
    Job.prototype.init.call(this);

    this
      .ads([])
      .camps([])
      .foundAdProps([])
      .foundCampProps([])
      .account(account)
      .string(string)
      .imageLookup(imageLookup);
  },

  start: function() {
    this._prepare();
  },

  _prepare: function() {
    var next = fun.bind(this._parse, this);

    require("../model/connectedObject").ConnectedObject.prepare(next);
  },

  _parse: function() {
    try { // error report

    var rows = parseTSV(this.string(), this.excelPaste());
    if (rows.length < 2) {
      this._fail(new NotEnoughRowsError());
      return;
    }

    // properties supporting tabSeparated
    var adProps = require("../model/ad").Ad.props().filter(
      function(p) { return !!p.tabSeparated; });
    var campProps = require("../model/campaign").Campaign.props().filter(
      function(p) { return !!p.tabSeparated; });

    // support ad image lookup
    adProps.push(require("../model/ad").Ad.prop('image'));

    this.foundAdProps(mapProps(adProps, rows[0]).found);
    this.foundCampProps(mapProps(campProps, rows[0]).found);

    if (this.foundAdProps().length < 2 && this.foundCampProps().length < 2) {
      this._fail(new InvalidHeaderError());
      return;
    }

    var dataRows = rows.slice(1);
    this._status = {
      ads: 0,
      camps: 0,
      complete: 0,
      totalAds: dataRows.length,
      totalCamps: dataRows.length,
      total: dataRows.length * 2
    };
    this._progress(this._status);
    this._createAds(dataRows, function() {
      this._createCamps(dataRows, this._complete);
    });

    } catch (e) {
      require("../../lib/errorReport").handleException(e, 'tsp:parse');
    }
  },

  _createAds: function(rows, callback) {
    var Ad = require("../model/ad").Ad;
    if (this.foundAdProps().length < 1) {
      callback.call(this);
      return;
    }
    async.forEach(
      rows,
      function(row, index, iteratorCallback) {
        try {
          var ad = new Ad()
            .muteChanges(true)
            .account_id(this.account().id());
          this.ads().push(ad);

          // a bit faster then bind, we do this too many times
          var _this = this;
          ad.fromTabSeparatedMap(
            row,
            this.foundAdProps(),
            function() {
              _this._status.ads++;
              _this._status.complete++;
              _this._progress(_this._status);
              ad.muteChanges(false);
              iteratorCallback();
            },
            this.imageLookup() || { data: {}, hashes: {} });
        } catch (e) {
          require("../../lib/errorReport").handleException(e, 'tsp:ads');
        }
      },
      callback,
      this);
  },

  _createCamps: function(rows, callback) {
    var Campaign = require("../model/campaign").Campaign;

    if (this.foundCampProps().length < 1) {
      callback.call(this);
      return;
    }

    async.forEach(
      rows,
      function(row, index, iteratorCallback) {
        try {
          var camp = new Campaign()
            .muteChanges(true)
            .account_id(this.account().id());
          this.camps().push(camp);

          // a bit faster then bind, we do this too many times
          var _this = this;
          camp.fromTabSeparatedMap(row, this.foundCampProps(), function() {
            _this._status.camps++;
            _this._status.complete++;
            _this._progress(_this._status);
            camp.muteChanges(false);
            iteratorCallback();
          });
        } catch (e) {
          require("../../lib/errorReport").handleException(e, 'tsp:camps');
        }
      },
      callback,
      this);
  }
});

var NotEnoughRowsError = AdError.newClass(
  1305338405270,
  function() {
    return tx('ads:pe:parse-not-enough-rows');
  }
);

var InvalidHeaderError = AdError.newClass(
  1305338470030,
  function() {
    return tx('ads:pe:parse-invalid-header');
  }
);

exports.Parser = Parser;
