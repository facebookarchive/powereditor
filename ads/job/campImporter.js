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
var env = require("../../uki-core/env");

var uniqName = require("../lib/uniqName").uniqName;
var Job = require("./base").Job;
var Campaign = require("../model/campaign").Campaign;
var Topline = require("../model/topline").Topline;
var AdError = require("../lib/error").Error;
var AdImporter = require("./adImporter").Importer;


var Importer = fun.newClass(Job,
  require("../lib/loggingState").getMixinForJob('campaign_importer'), {

  // in params
  account: fun.newProp('account'),
  camps: fun.newProp('camps'),
  propsToCopy: fun.newProp('propsToCopy'),
  line_number: fun.newProp('line_number'),

  // optional in params
  useNameMatching: fun.newProp('useNameMatching'),
  ads: fun.newProp('ads'),
  adPropsToCopy: fun.newProp('adPropsToCopy'),
  useToplineDates: fun.newProp('useToplineDates'),

  // out params
  results: fun.newProp('results'),

  // private
  mapById: fun.newProp('mapById'),
  mapByName: fun.newProp('mapByName'),

  init: function(account, line_number, camps, propsToCopy) {
    Job.prototype.init.call(this);

    this
      .results([])

      .useNameMatching(true)
      .account(account)
      .line_number(line_number)
      .camps(camps)
      .propsToCopy(propsToCopy)
      .useToplineDates(false);
  },

  start: function() {
    this._prepare();
  },

  _prepare: function() {
    Campaign.findAllBy(
      'account_id',
      this.account().id(),
      fun.bind(this._create, this));
  },

  _create: function(existingCamps) {
    var mapById = {};
    var mapByName = {};
    existingCamps.forEach(function(camp) {
      mapById[camp.id()] = camp;
      mapByName[camp.name().toLowerCase()] = camp;
    });
    this
      .mapById(mapById)
      .mapByName(mapByName);

    this._status = {
      complete: 0,
      total: this.camps().length
    };
    this._progress(this._status);

    require("../../lib/async").forEach(
      this.camps(),
      this._routeCamp,
      this._importAds,
      this);
  },

  _importAds: function() {
    var ads = this.ads();
    var adsToImport = [];

    if (ads && ads.length) {
      this.results().forEach(function(result, index) {
        var ad = ads[index];
        if (result.action == 'create' || result.action == 'update') {
          ad.muteChanges(true);
          if (result.action == 'create') { ad.id(''); }
          ad.campaign_id(result.id);
          ad.muteChanges(false);
          adsToImport.push(ad);
        }
      });
    }

    if (adsToImport.length) {
      Campaign.prepare(fun.bind(function() {
        var importer = new AdImporter(
          this.account(),
          adsToImport,
          this.adPropsToCopy()
        );
        importer.useNameMatching(this.useNameMatching());
        this._startChild(importer);
      }, this), true);
    } else {
      this._complete();
    }
  },

  /**
   * campaign_id present, campaign found
   *  + any campaign_name
   *  = OK - update
   *
   * campaign_id present, campaign not found
   *  + any campaign_name
   *  = ERROR - trying to update campaign that does not exist,
   *    all ads associated with this campaign are skipped
   *
   * campaign_id not present
   *  + campaign found by campaign_name
   *  = OK - update
   *
   * campaign_id not present
   *  + campaign not found by campaign_name
   *  = OK - create
   *
   * campaign_id not present
   *  + campaign_name not present
   *  = OK - create
   *
   * This code is deliberetely explict. I tryed to avoid merging cases for
   * better readability and consistence with ads.
   */
  _routeCamp: function(newCamp, index, callback) {
    try {
      this._status.complete++;
      this._progress(this._status);
      var mapById = this.mapById();
      var mapByName = this.mapByName();
      var name = (newCamp.name() || '').toLowerCase();
      if (!this.useNameMatching()) { name = ''; }

      var new_camp_id = newCamp.id();
      var valid_id = new_camp_id && (new_camp_id > 0);
      if (valid_id && mapById[new_camp_id]) {
        this._updateCamp(mapById[new_camp_id], newCamp, callback);

      } else if (valid_id && !mapById[new_camp_id]) {
        this._failCamp(new MissingCampaignUpdateError(newCamp));
        callback();

      } else if (!valid_id && name && mapByName[name]) {
        this._updateCamp(mapByName[name], newCamp, callback);

      } else if (!valid_id && name && !mapByName[name]) {
        this._createCamp(newCamp, callback);

      } else {
        this._createCamp(newCamp, callback);
      }
    } catch (e) {
      require("../../lib/errorReport").handleException(e, 'ci:route');
    }
  },

  _failCamp: function(error) {
    this.results().push({ action: 'fail' });

    this._error(error);
  },

  _updateCamp: function(existingCamp, newCamp, callback) {
    try {
      this.results().push({ action: 'update', id: existingCamp.id() });

      var updated = false;
      // remove camp from the name map in case we update the name
      delete this.mapByName()[existingCamp.name().toLowerCase()];

      this.propsToCopy().forEach(function(found) {
        if (['id', 'account_id'].indexOf(found) !== -1) { return; }
        updated = true;
        existingCamp[found](newCamp[found]());
      });

      this.mapByName()[existingCamp.name().toLowerCase()] = existingCamp;

      if (updated) {
        existingCamp.store(callback);
      } else {
        callback();
      }
    } catch (e) {
      require("../../lib/errorReport").handleException(e, 'ci:update');
    }
  },

  _createCamp: function(newCamp, callback) {
    try {
      if (!newCamp.id() || newCamp.id() === '' || newCamp.id() > 0) {
        newCamp.id(- new Date() - (env.guid++));
      }

      // enforce parent
      newCamp.account_id(this.account().id());

      if (this.line_number() && this.line_number() > 0) {
        newCamp.line_number(this.line_number());
      }

      // attach the newCamp with its declared topline_id (unique)
      if (newCamp.line_number()) {
        var topline_id = Topline.getIdbyLineNumber(
          newCamp.account_id(), newCamp.line_number());

        if (topline_id) {
          newCamp.topline_id(topline_id);
          var shifted_flight_start_time =
            Topline.byId(topline_id).shifted_flight_start_date();
          var shifted_flight_end_time =
            Topline.byId(topline_id).shifted_flight_end_date();

          if (this.useToplineDates()) {
            newCamp.adjusted_start_time(shifted_flight_start_time);
            newCamp.adjusted_end_time(shifted_flight_end_time);
          } else {
            // adjusted the camp start_time to the start of the daytime
            // of topline flight start date when the new camp start_time
            // is eariler than the topline flight start date.
            if (newCamp.adjusted_start_time() < shifted_flight_start_time) {
              newCamp.adjusted_start_time(shifted_flight_start_time);
            }
            // adjusted the camp end_time to the end of last minute
            // of topline flight end date when the new camp end_time
            // is later than the topline flight end date.
            if (newCamp.adjusted_end_time() > shifted_flight_end_time) {
              newCamp.adjusted_end_time(shifted_flight_end_time);
            }
          }
        } else {
          // reset the line_number to be empty since the topline_id is not found
          newCamp.line_number('');
        }
      }
      if (!this.useNameMatching()) {
        newCamp.name(uniqName(newCamp.name(), this.mapByName()));
      }
      this.mapByName()[newCamp.name().toLowerCase()] = newCamp;

      // update map with new campaign name
      this.mapById()[newCamp.id()] = newCamp;
      this.results().push({ action: 'create', id: newCamp.id() });
      newCamp.validateAll();

      newCamp.store(callback);

    } catch (e) {
      require("../../lib/errorReport").handleException(e, 'ci:create');
    }
  }

});

var MissingCampaignUpdateError = AdError.newClass(
  1305338182794,
  function() {
    var data = { id: this.data().id() };
    return tx('ads:pe:import-missing-camp-update-error', data);
  }
);

exports.Importer = Importer;
