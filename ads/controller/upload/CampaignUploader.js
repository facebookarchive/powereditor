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

var view  = require("../../../uki-core/view"),
    utils = require("../../../uki-core/utils"),
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
    Config = require("../../lib/config").Config,
    UploadUtils = require("./UploadUtils").UploadUtils,
    UploaderState =
      require("./PowerEditorUploaderState").UploaderState,

    models = require("../../models");

/**
 * Class - CampaignUploader
 * Responsible for uploading campaigns
 */
var CampaignUploader = fun.newClass({
  init: function() {
    this.uploadingRanges = {};
    this.toTryAgain = [];
    this.progressMessageHandler =
      this.onError =
      this.progressReportHandler = function() {};
    this.CHUNK_SIZE = Config.get('CHUNK_SIZE', 1);
    this.N_RETRIES = Config.get('N_RETRIES', 1);
    this.GRAPH_INTERN = Config.get(
      'GRAPH_INTERN', 'http://graph.intern.facebook.com');
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

    var category = tx('ads:pe:Campaigns');
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

  hasOrphanCampaignsInContract: function(campaigns) {
    for (var i = 0; i < campaigns.length; i++) {
      var c = campaigns[i];
      // we allow user to delete such campaign in the account.
      if (c.campaign_status() !== rs.DELETED && c.hasContract() &&
        !c.isFromTopline()) {
        return true;
      }
    }
  },

  uploadAllCampaigns: function(campaigns, final_callback) {
    this.setProgressMessage(tx('ads:pe:starting_to_upload_n_campaigns',
      {n: campaigns.length}));

    if (this.hasOrphanCampaignsInContract(campaigns)) {
      var message = tx('ads:pe:error_campaigns_in_account_must_belong_to_line',
        {account_name: c.account().name()});
      this.onError(message);
      UploaderState.signalStopped();
      return; // don't call callback, here.
    }

    this.toTryAgain = [];
    this.nthRetry = 0;

    var after_upload = fun.bind(function() {
      if (this.toTryAgain.length === 0 || this.nthRetry >= this.N_RETRIES) {
        if (campaigns.length > 0) {
          models.Campaign.prepare(final_callback, true);
        } else {
          final_callback();
        }
      } else {
        this.setProgressMessage(tx('ads:pe:retrying_n_campaigns',
          {n: this.toTryAgain.length}));
        this.nthRetry++;
        var retry_campaigns = this.toTryAgain;
        this.toTryAgain = [];
        this._uploadCampaigns(retry_campaigns, after_upload);
      }
    }, this);

    this.nTotalCampaigns = campaigns.length;
    this.setProgressMessage(tx('ads:pe:starting_to_upload_n_campaigns',
      {n: campaigns.length}));
    this._uploadCampaigns(campaigns, after_upload);
  },

  _uploadCampaigns: function(campaigns, callback) {
    if (campaigns.length === 0) { callback(); return; }

    var chunks_campaigns =
      AdsUtils.chunkArray(campaigns, this.CHUNK_SIZE);

    // for each chunk... process the chunk
    var parallel_foreach = new asyncUtils.ParallelForEach(
      chunks_campaigns,
      fun.bindOnce(this._uploadChunkOfCampaigns, this),
      callback);
    parallel_foreach.setExceptionHandler(function(e) {
      require("../../../lib/errorReport").handleException(
        e, 'async:foreach:upload:campaign');
    });
    parallel_foreach.setConcurrency(Config.get('N_UPLOAD_CONCURRENCY', 4));
    parallel_foreach.run();
  },

  /**
   * Uploads one chunk of campaigns in batch.
   * When absolutely finished with the chunk, call iterator_callback
   * @param campaigns to upload
   * @param integer nth chunk
   * @param function callback to call after we've finished uploading
   *   this batch of campaigns
   */
  _uploadChunkOfCampaigns: function(
     campaigns, nth_chunk, iterator_callback) {
    var offset = nth_chunk * this.CHUNK_SIZE;
    var range_string = tx('ads:pe:upload_range',
        {from: (offset + 1), to: (offset + campaigns.length)});
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

    for (var i = 0; i < campaigns.length; i++) {
      var campaign = campaigns[i];
      var params;
      if (campaign.isNew()) {
        params = campaign.dataForRemoteCreate();
        params.redownload = 1;
        batch_request.add('POST',
          pathUtils.join('/act_' + campaign.account_id(), '/adcampaigns'),
          params, fun.bind(this._processCreateResult, this, campaign));
      } else {
        params = campaign.dataForRemoteUpdate();
        params.redownload = 1;
        batch_request.add('POST', '/' + campaign.id(),
          params, fun.bind(this._processUpdateResult, this, campaign));
      }
    }

    batch_request.run(wrapped_iterator_callback);
  },

  _handleError: function(old_campaign, message) {
    this.onError(message);
  },

  _handleErrorDoNotRetry: function(old_campaign, message) {
    this._handleError(old_campaign, message);
    this.progressReportHandler(1);
  },

  _handleErrorAndRetry: function(old_campaign, message) {
    if (this.toTryAgain.indexOf(old_campaign) < 0) {
      this.toTryAgain.push(old_campaign);
    } else {
      this.progressReportHandler(1);
    }
    this._handleError(old_campaign, message);
  },

  /**
   * Processes a particular result part from the batch call
   * Calls "callback" when finished processing this result
   */
  _processCreateResult: function(old_campaign, resp, iter_callback) {
    var message;
    this.setProgressMessage(tx('ads:pe:processing_result_for_thing',
      {thing: old_campaign.name()}));
    var result = resp && resp.body && JSON.parse(resp.body);
    if (!result || resp.code != 200 || adsConnect.isError(result)) {
      var data = {
        name: old_campaign.name(),
        message: adsConnect.getErrorMessage(result).msg || ''
      };
      message = tx('ads:pe:upload-fail-create-camp', data);
      if (!result && this.nthRetry < this.N_RETRIES) {
        this._handleErrorAndRetry(old_campaign, message);
      } else {
        this._handleErrorDoNotRetry(old_campaign, message);
      }
      iter_callback();
      return;
    }

    var new_campaign_id = result.id;
    var new_campaign_data = result.data && result.data.campaigns &&
      result.data.campaigns[new_campaign_id];

    if (!new_campaign_data) {
      message = tx('ads:pe:upload-fail-download-updates-camp',
        { name: old_campaign.name() });
      this.handleErrorDoNotRetry(old_campaign, message);
      return;
    }

    // remove the old campaign...
    // ... and replace the ads.
    old_campaign.removeSelf(fun.bind(function() {

      var wrapped = fun.bind(function() {
        this.progressReportHandler(1);
        iter_callback();
      }, this);

      var reloaded_campaign =
        models.Campaign.createFromRemote(new_campaign_data);

      // update all the ads.
      models.Ad.findAllBy('campaign_id', old_campaign.id(),
          fun.bind(function(ads) {
        old_campaign.id(reloaded_campaign.id());
        ads.forEach(function(ad) {
          ad.campaign_id(reloaded_campaign.id());
        });
        models.Ad.storeMulti(ads, function() {
          reloaded_campaign.changes(old_campaign.changes());
          reloaded_campaign.store(wrapped);
        });
      }, this));
    }, this));
  },

  /**
   * Processes a particular result part from the batch call, when
   * updating a campaign.  Calls "callback" when done.
   */
  _processUpdateResult: function(old_campaign, resp, iter_callback) {
    this.setProgressMessage(tx('ads:pe:processing_result_for_thing',
      {thing: old_campaign.name()}));
    var result = resp.body && JSON.parse(resp.body);
    if (!result || resp.code != 200 || adsConnect.isError(result)) {
      var data = {
        name: old_campaign.name(),
        message: adsConnect.getErrorMessage(result).msg || ''
      };
      var message = tx('ads:pe:upload-fail-update-camp', data);
      if (!result && this.nthRetry < this.N_RETRIES) {
        this._handleErrorAndRetry(old_campaign, message + ' - will retry');
      } else {
        this._handleErrorDoNotRetry(old_campaign, message);
      }
      iter_callback();
      return;
    }

    var new_campaign_data = result.data && result.data.campaigns &&
      result.data.campaigns[old_campaign.id()];

    if (!new_campaign_data) {
      this._handleErrorDoNotRetry(old_campaign,
          tx('ads:pe:upload-fail-download-updates-camp',
            { name: old_campaign.name() }));
      iter_callback();
      return;
    }

    old_campaign.removeSelf(fun.bind(function() {
      var wrapped = fun.bind(function() {
        this.progressReportHandler(1);
        iter_callback();
      }, this);

      var reloaded_campaign =
        models.Campaign.createFromRemote(new_campaign_data);
      if (reloaded_campaign.campaign_status() === rs.DELETED) {
        wrapped();
      } else {
        reloaded_campaign.changes(old_campaign.changes());
        reloaded_campaign.store(wrapped);
      }
    }, this));
  }
});



exports.CampaignUploader = CampaignUploader;


