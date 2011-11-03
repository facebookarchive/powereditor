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

var fun   = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");
var async = require("../../../lib/async");

var DELIMITER = '\t';
var DELIMITER_LINE = '\n';
var DELIMITER_PATTERN = new RegExp(DELIMITER, 'g');

var TEST_RE = /[\t\n"]/;
var QUOTE_RE = /"/g;
var LINE_BREAK_RE = /(\r\n|\r|\n)/g;

var FORMATTER = function(string) {
  string = string.replace(LINE_BREAK_RE, '\n');
  if (string.match(TEST_RE)) {
    return '"' + string.replace(QUOTE_RE, '""') + '"';
  }
  return string;
};

/**
* TabSeparated
*
* @mixin
*/
var TabSeparated = {
  /**
   * Excel data
   */
  fromTabSeparatedMap: function(row, map, callback) {
    async.forEach(map, function(item, index, iteratorCallback) {
      try { // error report

      var prop = this.storage().prop(item.name);
      var value = row[item.index] || '';
      if (prop.importFormatter) {
        value = prop.importFormatter(value);
      }
      prop.setTabSeparated(this, value, iteratorCallback);

      } catch (e) {
        require("../../../lib/errorReport").handleException(e, 'ts:fromMap');
      }
    }, callback, this);
  },

  _tabSeparatedGetHeaders: function(options) {
    var header = [];

    this.storage().props().forEach(function(prop) {
      if (this._shouldPropBeExported(prop, options)) {
        header.push(
          utils.isArray(prop.tabSeparated) ?
            prop.tabSeparated[0] : prop.tabSeparated);
      }
    }, this);

    return header;
  },

  _tabSeparatedExportAsArray: function(options) {
    var result = [];
    this.storage().props().forEach(function(prop) {
      if (this._shouldPropBeExported(prop, options)) {
        var value = prop.getTabSeparated(this);
        if (prop.exportFormatter) {
          value = prop.exportFormatter(value);
        }
        if (value === undefined) {
          value = '';
        }
        result.push(value);
      }
    }, this);

    result = result.map(function(x) {
      return (x + '').replace(DELIMITER_PATTERN, ' '); });
    return result;
  },

  _shouldPropBeExported: function(prop, options) {
    if (options.include && options.include.indexOf(prop.name) > -1) {
      return true;
    }
    if (!prop.tabSeparated) {
      return false;
    }
    if (!options.isCorpAct && prop.corpExportedOnly) {
      return false;
    }
    if (options.exclude && options.exclude.indexOf(prop.name) > -1) {
      return false;
    }
    return true;
  },

  tabSeparatedHeader: function(options) {
    options || (options = {});
    var header = this._tabSeparatedGetHeaders(options);
    header = header.map(options.FORMATTER || FORMATTER);
    return header.join(options.DELIMITER || DELIMITER);
  },

  /**
  * @param options
  *   {
  *     include: [], // array of extra columns to include
  *     exclude: [], // array of columns to exclude
  *     formatter: function(x) { return x; } // called on all values before
  *                                             storing
  *     DELIMITER: '\t' // delimiter between words
  *   }
  */
  toTabSeparated: function(options) {
    options || (options = {});
    var result = this._tabSeparatedExportAsArray(options);
    result = result.map(options.FORMATTER || FORMATTER);
    var text = result.join(options.DELIMITER || DELIMITER);
    return text;
  },

  commitChanges: fun.FS
};


exports.DELIMITER = DELIMITER;
exports.DELIMITER_LINE = DELIMITER_LINE;
exports.TabSeparated = TabSeparated;
