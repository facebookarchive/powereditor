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
var AdsUtils = require("../../lib/utils");
var env = require("../../uki-core/env");
var rs = require("../lib/runStatus");
var asyncUtils = require("../../lib/async");

var uniqName = require("../lib/uniqName").uniqName;
var Job = require("./base").Job;
var Campaign = require("../model/campaign").Campaign;
var Ad = require("../model/ad").Ad;
var AdError = require("../lib/error").Error;

var Importer = fun.newClass(Job,
  require("../lib/loggingState").getMixinForJob('campaign_importer'), {

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
    var campaign_map_by_id = {};
    var ad_map_by_id = {};
    var ad_map_by_name = {};

    Campaign.findAllBy('account_id', account_id,
        fun.bind(function(campaigns) {
      campaigns.forEach(function(camp) {
        campaign_map_by_id[camp.id()] = camp;
      });
      var chunks = AdsUtils.chunkArray(campaigns, 300); // chunks of 300
      var existing_ads = [];
      asyncUtils.forEach(chunks, function(chunk_campaigns, i_chunk, itercb) {
        Ad.findAllBy('campaign_id', utils.pluck(chunk_campaigns, 'id'),
            function(ads) {
          ads.forEach(function(ad) {
            ad_map_by_id[ad.id()] = ad;
            ad_map_by_name[nameKey(ad)] = ad;
          });
          itercb();
        });
      }, fun.bind(function() {
        this.campMapById(campaign_map_by_id);
        this.adMapById(ad_map_by_id);
        this.adMapByName(ad_map_by_name);
        next(campaign_map_by_id, ad_map_by_id, ad_map_by_name);
      }, this));
    }, this));
  },

  _create: function(existingCamps, existingAds) {

    this._status = {
      complete: 0,
      total: this.ads().length
    };
    this._progress(this._status);
    require("../../lib/async").forEach(
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
  _routeAd: function(new_ad, index, callback) {
    try {

    this._status.complete++;
    this._progress(this._status);
    var campMapById = this.campMapById();
    var adMapById = this.adMapById();
    var adMapByName = this.adMapByName();
    var id = new_ad.id();
    var name = (new_ad.name() || '').toLowerCase();
    var key = nameKey(new_ad);
    var referencedCamp = new_ad.campaign_id() &&
      campMapById[new_ad.campaign_id()];

    if (!this.useNameMatching()) { key = ''; }

    // enforce parent
    new_ad.account_id(this.account().id());

    if (!id || id < 0) {
      if (new_ad.adgroup_status() == rs.PENDING_REVIEW ||
          new_ad.adgroup_status() == rs.DELETED ||
          new_ad.adgroup_status() == rs.DISAPPROVED) {
        new_ad.adgroup_status(rs.ADGROUP_PAUSED);
      }
    }

    if (id && adMapById[id] && referencedCamp &&
      adMapById[id].campaign_id() == referencedCamp.id()) {
      this._updateAd(adMapById[id], new_ad, callback);

    } else if (id && adMapById[id] && referencedCamp &&
      adMapById[id].campaign_id() != referencedCamp.id()) {
      this._failAd(new AdCannotBeMovedError({
        ad: new_ad,
        oldCamp: campMapById[adMapById[id].campaign_id()],
        newCamp: referencedCamp
      }));
      callback();

    } else if (id && adMapById[id] && new_ad.campaign_id() && !referencedCamp) {
      this._failAd(new AdCannotBeMovedToNowhereError({
        ad: new_ad,
        oldCamp: campMapById[adMapById[id].campaign_id()]
      }));
      callback();

    } else if (id && adMapById[id] && !new_ad.campaign_id()) {
      this._updateAd(adMapById[id], new_ad, callback);

    } else if (id && !adMapById[id]) {
      this._failAd(new MissingAdUpdateError(new_ad));
      callback();

    } else if (!id && name && adMapByName[key]) {
      this._updateAd(adMapByName[key], new_ad, callback);

    } else if (!id && name && !adMapByName[key] && referencedCamp) {
      this._createAd(new_ad, referencedCamp, callback);

    } else if (!id && name && !adMapByName[key] && !referencedCamp) {
      this._failAd(new CreateAdWithoutCampaignError({
        ad: new_ad,
        index: index
      }));
      callback();

    } else if (!id && !name && referencedCamp) {
      this._createAd(new_ad, referencedCamp, callback);

    } else {
      this._failAd(new CreateAdWithoutCampaignError({
        ad: new_ad,
        index: index
      }));
      callback();
    }
    } catch (e) {
      require("../../lib/errorReport").handleException(e, 'ai:route');
    }
  },

  _failAd: function(error) {
    this.results().push({ action: 'fail' });
    this._error(error);
  },

  _updateAd: function(existingAd, new_ad, callback) {
    try {
      this.results().push({ action: 'update', id: existingAd.id() });

      // remove camp from the name map in case we update the name
      delete this.adMapByName()[nameKey(existingAd)];

      var updated = false;
      this.propsToCopy().forEach(function(name) {
        if (['id', 'account_id', 'campaign_id'].indexOf(name) !== -1) {
          return;
        }
        updated = true;
        existingAd[name](new_ad[name]());
      });

      this.adMapByName()[nameKey(existingAd)] = existingAd;

      if (updated) {
        existingAd
          .updateCampaign()
          .validateAll()
          .store(callback);
      } else {
        callback();
      }
    } catch (e) {
      require("../../lib/errorReport").handleException(e, 'ai:update');
    }
  },

  _createAd: function(new_ad, camp, callback) {
    try {
      // enforce parents
      new_ad
        .muteChanges(true)
        .id(- new Date() - (env.guid++))
        .account_id(this.account().id())
        .campaign_id(camp.id());

      if (!this.useNameMatching()) {
        new_ad.name(uniqName(
          new_ad.name(),
          this.adMapByName(),
          function(name) {
            return new_ad.campaign_id() + '_' + name.toLowerCase();
          }
        ));
      }
      this.adMapByName()[nameKey(new_ad)] = new_ad;

      new_ad.muteChanges(false);
      new_ad.validateAll();
      new_ad.updateCampaign();

      this.adMapById()[new_ad.id()] = new_ad;
      this.results().push({ action: 'create' });

      new_ad.store(callback);
    } catch (e) {
      require("../../lib/errorReport").handleException(e, 'ai:create');
    }
  }

});

function nameKey(ad) {
  return ad.campaign_id() + '_' + ad.name().toLowerCase();
}

var AdCannotBeMovedError = AdError.newClass(
  1305338615454,
  function() {
    var data = this.data();
    data.ad_id = data.ad.id();
    data.ad_name = data.ad.name();
    data.old_id = data.oldCamp.id();
    data.new_id = data.newCamp.id();
    return tx('ads:pe:import-ad-cannot-be-moved-error', data);
  }
);

var AdCannotBeMovedToNowhereError = AdError.newClass(
  1305338900547,
  function() {
    var data = this.data();
    data.ad_id = data.ad.id();
    data.ad_name = data.ad.name();
    data.old_id = data.oldCamp.id();
    data.new_id = data.ad.campaign_id();
    return tx('ads:pe:import-ad-cannot-be-moved-to-nowhere-error', data);
  }
);

var MissingAdUpdateError = AdError.newClass(
  1305339005820,
  function() {
    var data = { id: this.data().id() };
    return tx('ads:pe:import-missing-ad-update-error', data);
  }
);

var CreateAdWithoutCampaignError = AdError.newClass(
  1305339379733,
  function() {
    var data = this.data();
    data.ad_name = data.ad.name();
    return tx('ads:pe:import-cannot-create-ad-without-camp-error', data);
  }
);

exports.Importer = Importer;
