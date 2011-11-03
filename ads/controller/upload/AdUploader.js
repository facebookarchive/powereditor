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

var utils = require("../../../uki-core/utils"),
    AdsUtils = require("../../../lib/utils"),
    fun   = require("../../../uki-core/function"),
    build = require("../../../uki-core/builder").build,
    urllib = require("../../../lib/urllib"),

    asyncUtils = require("../../../lib/async"),
    adsConnect = require("../../../lib/connect"),
    FB = adsConnect.FB,
    FBBatch = adsConnect.FBBatch,
    graphlink = require("../../../lib/graphlink").gl,
    pathUtils = require("../../../lib/pathUtils"),

    App = require("../app").App,
    UploadDialog = require("../../view/uploadDialog").UploadDialog,
    rs = require("../../lib/runStatus"),
    CampaignUtils = require("../../model/campaign/CampaignUtils").CampaignUtils,

    UploadUtils = require("./UploadUtils").UploadUtils,
    Config = require("../../lib/config").Config,
    models = require("../../models");

/**
 * Class - AdUploader
 * Responsible for uploading ads
 */
var AdUploader = fun.newClass({
  init: function() {
    this.uploadingRanges = {};
    this.onError = this.progressReportHandler = function() {};
    this.toTryAgain = [];
    this.CHUNK_SIZE = Config.get('CHUNK_SIZE', 1);
    this.N_RETRIES = Config.get('N_RETRIES', 1);
    this.nthRetry = 0;
  },

  setErrorHandler: function(on_error) {
    this.onError = on_error;
    return this;
  },

  setProgressMessage: function(msg) {
    var range_strings = [];
    for (var r in this.uploadingRanges) {
      range_strings.push(r);
    }
    var category = tx('ads:pe:Ads');
    var final_message;
    if (range_strings.length > 0) {
      final_message = tx('ads:pe:upload_status_message_with_range',
        {category: category, range_string: range_strings.join(','), msg: msg});
    } else {
      final_message = tx('ads:pe:upload_status_message',
        {category: category, msg: msg});
    }
    this.progressMessageHandler(final_message);
    return this;
  },

  setProgressMessageHandler: function(f) {
    this.progressMessageHandler = f;
    return this;
  },

  setProgressReportHandler: function(f) {
    this.progressReportHandler = f;
    return this;
  },

  /**
   * Batch upload all changed ads, under the specified campaigns.
   * Then, call the callback.
   */
  uploadAllAds: function(campaigns, final_callback) {
    this.setProgressMessage(tx('ads:pe:fetching_ads_to_upload'));
    // fetching the ads is asynchronous, so the bulk is in the callback.
    this.toTryAgain = [];
    this.nthRetry = 0;

    var after_upload = fun.bind(function() {
      if (this.toTryAgain.length === 0 || this.nthRetry >= this.N_RETRIES) {
        this.setProgressMessage(tx('ads:pe:Done'));
        final_callback();
        return;
      } else {
        this.setProgressMessage(
          tx('ads:pe:retrying_n_ads', {n: this.toTryAgain.length}));
        this.nthRetry++;
        var ads = this.toTryAgain;
        this.toTryAgain = [];
        this._uploadAds(after_upload, ads);
      }
    }, this);

    UploadUtils.getChangedAdsFromCampaigns(
      campaigns, fun.bind(function(ads) {
        this.nTotalAds = ads.length;
        this.setProgressMessage(
          tx('ads:pe:starting_to_upload_n_ads', {n: this.nTotalAds}));
        this._uploadAds(after_upload, ads);
      }, this));
  },

  _uploadAds: function(callback, ads) {
    // don't bother uploading ads whose campaign wasn't created.
    ads = ads.filter(function(ad) {
      return ad.campaign_id() > 0;
    });

    // if we don't have any changed ads, return early.
    if (ads.length === 0) {
      callback();
      return;
    }

    var chunks_ads = AdsUtils.chunkArray(ads, this.CHUNK_SIZE);

    // for each chunk... process the chunk
    var parallel_foreach = new asyncUtils.ParallelForEach(
      chunks_ads,
      fun.bindOnce(this._uploadChunkOfAds, this),
      callback);
    parallel_foreach.setExceptionHandler(function(e) {
      require("../../../lib/errorReport").handleException(
        e, 'async:foreach:ad:upload');
    });
    parallel_foreach.setConcurrency(Config.get('N_UPLOAD_CONCURRENCY', 4));
    parallel_foreach.run();
  },

  _uploadChunkOfAds: function(ads, nth_chunk, iterator_callback) {
    if (!ads || ads.length === 0) { iterator_callback(); }
    var offset = nth_chunk * this.CHUNK_SIZE;
    var range_string = tx('ads:pe:upload_range',
        {from: (offset + 1), to: (offset + ads.length)});
    if (this.nthRetry > 0) {
      range_string = tx('ads:pe:retry_prefix',
        {n: this.nthRetry, msg: range_string});
    }
    this.uploadingRanges[range_string] = 1;
    this.setProgressMessage(tx('ads:pe:Uploading'));
    var wrapped_iterator_callback = fun.bind(function() {
      delete this.uploadingRanges[range_string];
      iterator_callback();
    }, this);

    var batch_request = new FBBatch();

    for (var i = 0; i < ads.length; i++) {
      var ad = ads[i];
      var params;
      if (ad.isNew()) {
        params = ad.dataForRemoteCreate();
        params.redownload = 1;
        batch_request.add('POST',
          pathUtils.join('/act_' + ad.account_id(), '/adgroups'),
          params,
          fun.bind(this._processCreateResult, this, ad));
      } else {
        params = ad.dataForRemoteUpdate();
        params.redownload = 1;
        batch_request.add('POST', '/' + ad.id(), params,
          fun.bind(this._processUpdateResult, this, ad));
      }
    }

    // run the batch request, and then continue to the next batch.
    batch_request.run(wrapped_iterator_callback);
  },

  /**
   * Processes a particular result part from the batch call
   * Calls "callback" when finished processing this result
   */
  _processCreateResult: function(old_ad, resp, iter_callback) {
    this.setProgressMessage(tx('ads:pe:processing_result_for_thing',
      {thing: old_ad.name()}));
    var result = resp && resp.body && JSON.parse(resp.body);
    if (!result || resp.code != 200 || adsConnect.isError(result)) {
      var data = {
        name: old_ad.name(),
        message: adsConnect.getErrorMessage(result).msg || ''
      };
      var message = tx('ads:pe:upload-fail-create-ad', data);
      if (!result && this.nthRetry < this.N_RETRIES) {
        this._handleErrorAndRetry(old_ad, message);
      } else {
        this._handleErrorDoNotRetry(old_ad, message);
      }
      iter_callback();
      return;
    }
    this._processRedownloadResults(
      old_ad, result.id, result.data, iter_callback);
  },

  _handleError: function(old_ad, message) {
    this.onError(message);
  },

  _handleErrorDoNotRetry: function(old_ad, message) {
    this._handleError(old_ad, message);
    this.progressReportHandler(1);
  },

  _handleErrorAndRetry: function(old_ad, message) {
    if (this.toTryAgain.indexOf(old_ad) < 0) {
      this.toTryAgain.push(old_ad);
    } else {
      this.progressReportHandler(1);
    }
    this._handleError(old_ad, message);
  },

  /**
   * Processes a particular result part from the batch call, when
   * updating a ad.  Calls "callback" when done.
   */
  _processUpdateResult: function(old_ad, resp, iter_callback) {
    this.setProgressMessage(tx('ads:pe:processing_result_for_thing',
      {thing: old_ad.name()}));
    var result = resp && resp.body && JSON.parse(resp.body);
    if (!result || resp.code != 200 || adsConnect.isError(result)) {
      var data = {
        name: old_ad.name(),
        message: adsConnect.getErrorMessage(result).msg || ''
      };
      var message = tx('ads:pe:upload-fail-update-ad', data);
      if (!result && this.nthRetry < this.N_RETRIES) {
        this._handleErrorAndRetry(old_ad,
          tx('ads:pe:will_retry_suffix', {msg: message}));
      } else {
        this._handleErrorDoNotRetry(old_ad, message);
      }
      iter_callback();
      return;
    }

    this._processRedownloadResults(
      old_ad, old_ad.id(), result.data, iter_callback);
  },

  /**
   * re-creates the ad and creative.
   */
  _processRedownloadResults:
      function(old_ad, new_adgroup_id, redownload_data, iter_callback) {
    var new_ad_data = redownload_data.adgroups[new_adgroup_id];
    if (!new_ad_data) {
      var message = tx('ads:pe:upload-fail-update-ad',
        {name: old_ad.name(), message: tx('ads:pe:redownload_failed')});
      this._handleErrorDoNotRetry(old_ad, message);
      iter_callback();
      return;
    }
    var new_creative_id = this._getFirstCreativeIdFromAdData(new_ad_data);
    var new_creative_data = redownload_data.creatives[new_creative_id];
    var reloaded_ad = models.Ad.createFromRemote(new_ad_data);
    if (new_creative_data) {
      delete new_creative_data.name;
      delete new_creative_data.id;
      reloaded_ad.muteChanges(true);
      reloaded_ad.fromRemoteObject(new_creative_data);
      reloaded_ad.initChangeable();
      reloaded_ad.validateAll();
      reloaded_ad.errors({});
      reloaded_ad.muteChanges(false);
    }

    old_ad.remove(fun.bind(function() {
      var wrapped = fun.bind(function() {
        this.progressReportHandler(1);
        iter_callback();
      }, this);
      if (reloaded_ad.adgroup_status() == rs.DELETED) {
        wrapped();
      } else {
        reloaded_ad.store(wrapped);
      }
    }, this));
  },

  _getFirstCreativeIdFromAdData: function(ad_data) {
    if (!ad_data || !ad_data.creative_ids) { return null; }
    if (ad_data.creative_ids.length === 0) { return null; }
    return ad_data.creative_ids[0];
  },

  _getFirstCreativeIdFromAd: function(ad) {
    if (!ad) { return null; }
    var creative_ids = ad.creative_ids();
    if (creative_ids.length === 0) { return null; }
    return creative_ids[0];
  }

});

exports.AdUploader = AdUploader;
