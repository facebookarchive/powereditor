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
var Ad = require("../model/ad").Ad;
var AdError = require("../lib/error").Error;

var Importer = fun.newClass(Job, {

  // in params
  account: fun.newProp('account'),
  ads: fun.newProp('ads'),
  propsToCopy: fun.newProp('propsToCopy'),

  // optional in params
  selectedCamps: fun.newProp('selectedCamps'),
  useNameMatching: fun.newProp('useNameMatching'),

  // out params
  results: fun.newProp('results'),

  // private
  campMapById: fun.newProp('campMapById'),
  adMapById: fun.newProp('adMapById'),
  adMapByName: fun.newProp('adMapByName'),

  init: function(account, ads, propsToCopy) {
    Job.prototype.init.call(this);

    this
      .results([])

      .useNameMatching(true)
      .selectedCamps(null)

      .account(account)
      .ads(ads)
      .propsToCopy(propsToCopy);
  },

  start: function() {
    this._prepare();
  },

  _prepare: function() {
    var next = fun.bind(this._create, this);
    var account_id = this.account().id();
    if (this.selectedCamps()) {
      var camps = this.selectedCamps();
      Ad.findAllBy('campaign_id', utils.pluck(camps, 'id'), function(ads) {
        next(camps, ads);
      });
    } else {
      Campaign.findAllBy('account_id', account_id, function(camps) {
        Ad.findAllBy('campaign_id', utils.pluck(camps, 'id'), function(ads) {
          next(camps, ads);
        });
      });
    }
  },

  _create: function(existingCamps, existingAds) {
    var mapById = {};
    var mapByName = {};

    existingCamps.forEach(function(camp) {
      mapById[camp.id()] = camp;
    });
    this.campMapById(mapById);

    mapById = {};
    mayByName = {};
    existingAds.forEach(function(ad) {
      mapById[ad.id()] = ad;
      mapByName[nameKey(ad)] = ad;
    });
    this
      .adMapById(mapById)
      .adMapByName(mapByName);

    require("../../storage/lib/async").forEach(
      this.ads(),
      this._routeAd,
      this._complete,
      this);
  },

  /**
   * ad_id present, ad found
   *  + any ad_name
   *  + campaign ident present, campaign found,
   *    campaign is the same as found for ad
   *  = OK - update ad
   *
   * ad_id present, ad found
   *  + any ad_name
   *  + campaign ident present, campaign found,
   *    campaign is different from found for ad
   *  = ERROR - ad cannot be moved between campaigns
   *
   * ad_id present, ad found
   *  + any ad_name
   *  + campaign ident present, campaign not found
   *  = ERROR - ad cannot be moved between campaigns
   *
   * ad_id present, ad found
   *  + any ad_name
   *  + campaign ident not present
   *  = OK - update ad
   *
   * ad_id present, ad not found
   *  + any ad_name
   *  + any campaign ident
   *  = ERROR - trying to update ad that does not exist
   *
   * ad_id not present
   *  + ad_name present, ad found
   *  + campaign ident present, campaign found,
   *    campaign is the same as found for ad
   *  = OK - update ad
   *
   * ad_id not present
   *  + ad_name present, ad found
   *  + campaign ident present, campaign found,
   *    campaign is different from found for ad
   *  = ERROR - ad cannot be moved between campaigns
   *
   * ad_id not present
   *  + ad_name present, ad found
   *  + campaign ident present, campaign not found
   *  = ERROR - ad cannot be moved between campaigns
   *
   * ad_id not present
   *  + ad_name present, ad found
   *  + campaign ident not present
   *  = OK - update ad
   *
   * ad_id not present
   *  + ad_name present, ad not found
   *  + campaign ident present, campaign found
   *  = OK - create ad
   *
   * ad_id not present
   *  + ad_name present, ad not found
   *  + campaign ident present, campaign not found
   *  = ERROR - cannot create ad without campaign id or campaign name
   *
   * ad_id not present
   *  + ad_name present, ad not found
   *  + campaign ident not present
   *  = ERROR - cannot create ad without campaign id or campaign name
   *
   * ad_id not present
   *  + and_name not present
   *  + campaign ident present, campaign found
   *  = OK - create ad
   *
   * ad_id not present
   *  + ad_name not present
   *  + campaign ident present, campaign not found
   *  = ERROR - cannot create ad without campaign id or campaign name
   *
   * ad_id not present
   *  + ad_name not present
   *  + campaign ident not present
   *  = ERROR - cannot create ad without campaign id or campaign name
   *
   * This code is deliberetely explict. I tryed to avoid merging cases for
   * better readability and consistence with camps.
   */
  _routeAd: function(newAd, index, callback) {
    var campMapById = this.campMapById();
    var adMapById = this.adMapById();
    var adMapByName = this.adMapByName();
    var id = newAd.id();
    var name = (newAd.name() || '').toLowerCase();
    var key = nameKey(newAd);
    var referencedCamp = newAd.campaign_id() &&
      campMapById[newAd.campaign_id()];

    if (!this.useNameMatching()) { key = ''; }

    // enforce parent
    newAd.account_id(this.account().id());

    if (id && adMapById[id] && referencedCamp &&
      adMapById[id].campaign_id() == referencedCamp.id()) {
      this._updateAd(adMapById[id], newAd, callback);

    } else if (id && adMapById[id] && referencedCamp &&
      adMapById[id].campaign_id() != referencedCamp.id()) {
      this._failAd(new AdCannotBeMovedError({
        ad: newAd,
        oldCamp: campMapById[adMapById[id].campaign_id()],
        newCamp: referencedCamp
      }));
      callback();

    } else if (id && adMapById[id] && newAd.campaign_id() && !referencedCamp) {
      this._failAd(new AdCannotBeMovedToNowhereError({
        ad: newAd,
        oldCamp: campMapById[adMapById[id].campaign_id()]
      }));
      callback();

    } else if (id && adMapById[id] && !newAd.campaign_id()) {
      this._updateAd(adMapById[id], newAd, callback);

    } else if (id && !adMapById[id]) {
      this._failAd(new MissingAdUpdateError(newAd));
      callback();

    } else if (!id && name && adMapByName[key]) {
      this._updateAd(adMapByName[key], newAd, callback);

    } else if (!id && name && !adMapByName[key] && referencedCamp) {
      this._createAd(newAd, referencedCamp, callback);

    } else if (!id && name && !adMapByName[key] && !referencedCamp) {
      this._failAd(new CreateAdWithoutCampaignError({
        ad: newAd,
        index: index
      }));
      callback();

    } else if (!id && !name && referencedCamp) {
      this._createAd(newAd, referencedCamp, callback);

    } else {
      this._failAd(new CreateAdWithoutCampaignError({
        ad: newAd,
        index: index
      }));
      callback();
    }
  },

  _failAd: function(error) {
    this.results().push({ action: 'fail' });
    this._error(error);
  },

  _updateAd: function(existingAd, newAd, callback) {
    this.results().push({ action: 'update', id: existingAd.id() });

    // remove camp from the name map in case we update the name
    delete this.adMapByName()[nameKey(existingAd)];

    var updated = false;
    this.propsToCopy().forEach(function(name) {
      if (['id', 'account_id', 'campaign_id'].indexOf(name) !== -1) {
        return;
      }
      updated = true;
      existingAd[name](newAd[name]());
    });

    this.adMapByName()[nameKey(existingAd)] = existingAd;

    if (updated) {
      existingAd
        .resetCampaign()
        .validateAll()
        .store(callback);
    } else {
      callback();
    }
  },

  _createAd: function(newAd, camp, callback) {
    // enforce parents
    newAd
      .muteChanges(true)
      .id(- new Date() - (env.guid++))
      .account_id(this.account().id())
      .campaign_id(camp.id());

    if (!this.useNameMatching()) {
      newAd.name(uniqName(
        newAd.name(),
        this.adMapByName(),
        function(name) {
          return newAd.campaign_id() + '_' + name.toLowerCase();
        }
      ));
    }
    this.adMapByName()[nameKey(newAd)] = newAd;

    newAd.muteChanges(false);
    newAd.validateAll();
    newAd.updateCampaign();

    this.adMapById()[newAd.id()] = newAd;
    this.results().push({ action: 'create' });

    newAd.store(callback);
  }

});

function nameKey(ad) {
  return ad.campaign_id() + '_' + ad.name().toLowerCase();
}

var AdCannotBeMovedError = AdError.newClass(
  1305338615454,
  'Ad ({{#ad}}id: {{id}}, name: {{name}}{{/ad}}) cannot be moved between ' +
  ' campaigns:' +
  ' from {{#oldCamp}}{{id}} {{/oldCamp}}to {{#newCamp}}{{id}}{{/newCamp}}'
);

var AdCannotBeMovedToNowhereError = AdError.newClass(
  1305338900547,
  'Ad ({{#ad}}id: {{id}}, name: {{name}}{{/ad}}) cannot be moved between ' +
  ' campaigns:' +
  ' from {{#oldCamp}}{{id}} {{/oldCamp}}to non-existent campaign' +
  ' {{#ad}}{{campaign_id}}{{/ad}}'
);

var MissingAdUpdateError = AdError.newClass(
  1305339005820,
  'Trying to update ad ({{id}}) that does not exist'
);

var CreateAdWithoutCampaignError = AdError.newClass(
  1305339379733,
  'Cannot create ad (name: {{#ad}}{{name}}{{/ad}}, index: {{index}})' +
  ' without campaign id or campaign name'
);

exports.Importer = Importer;
