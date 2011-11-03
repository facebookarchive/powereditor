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

var utils = require("../../uki-core/utils"),
    fun   = require("../../uki-core/function"),

    App = require("./app").App,
    UploadDialog = require("../view/uploadDialog").UploadDialog,
    CampaignUtils = require("../model/campaign/CampaignUtils").CampaignUtils,

    UploadUtils = require("./upload/UploadUtils").UploadUtils,
    CampaignUploader =
      require("./upload/CampaignUploader").CampaignUploader,
    AdUploader =
      require("./upload/AdUploader").AdUploader,
    ImageUploader =
      require("./upload/ImageUploader").ImageUploader,
    UploaderState =
      require("./upload/PowerEditorUploaderState").UploaderState;

/**
 * Upload camps and ads back to server
 * Create new ones, update existing
 * Resolve issues with images.
 */
var Upload = {
  /**
   * this function delegates its implementation to an instance of
   * the "PowerEditorUploader" class.
   */
  handleUpload: function() {
    var power_editor_uploader = new PowerEditorUploader();
    power_editor_uploader.start();
  }
};

var PowerEditorUploader = fun.newClass({
  _nAds: 0,
  _nCampaigns: 0,
  _dialog: null,
  _nUploaded: 0,

  init: function() {
    this._dialog = null;
    UploaderState.stopped = false;
    this._nAds = 0;
    this._nCampaigns = 0;
    this._nUploaded = 0;
  },

  /**
   * Displays the upload dialog, and hands off to "uploadAll"
   */
  start: function() {
    // try to see if we created this earlier.
    this._dialog = UploaderState.dialog;

    // if not, create it now. :)
    if (!this._dialog) {
      UploaderState.dialog =
        this._dialog = new UploadDialog();
    }

    this._dialog.reset();
    var changed_campaigns = CampaignUtils.getChanged();

    this._dialog.on('continueWithErrors',
      fun.bind(this._uploadAll, this, changed_campaigns))
      .on('stop', UploaderState.signalStopped);
    this._dialog.visible(true);

    if (changed_campaigns.length === 0) {
      this._dialog.notifyNoChanges();
      return;
    }

    if (CampaignUtils.haveErrors(changed_campaigns)) {
      this._dialog.confirmContinueWithErrors();
    } else {
      this._uploadAll(changed_campaigns);
    }
  },

  /**
   * The heavy lifting happens here.  This is extracted out
   * so it can be started either after the error dialog or not (see "start")
   *
   * (note - "changed_campaigns" is different than "changed_campaigns_directly")
   */
  _uploadAll: function(changed_campaigns) {
    UploadUtils.getChangedAdsFromCampaigns(
      changed_campaigns, fun.bind(function(ads) {

      // as opposed to "changed_campaigns" which might not have changed
      // but have changes in their child ads.
      var changed_campaigns_directly = CampaignUtils.getChangedDirectly();

      this._nAds = ads.length;
      this._nCampaigns = changed_campaigns_directly.length;
      this._updateProgress();

      // the "image_uploader" handles image uploading.
      var image_uploader = new ImageUploader();
      image_uploader
        .setErrorHandler(fun.bindOnce(this._logErrorAndQuit, this))
        .setProgressMessageHandler(
          fun.bindOnce(this._setProgressMessage, this));

      // the "campaign_uplader" handles campaign uploading
      var campaign_uploader = new CampaignUploader();
      campaign_uploader
        .setErrorHandler(fun.bindOnce(this._logError, this))
        .setProgressReportHandler(fun.bindOnce(this._incrCampaigns, this))
        .setProgressMessageHandler(
          fun.bindOnce(this._setProgressMessage, this));

      // the "ad_uploader" handles ad uploading.
      var ad_uploader = new AdUploader();
      ad_uploader
        .setErrorHandler(fun.bindOnce(this._logError, this))
        .setProgressReportHandler(fun.bindOnce(this._incrAds, this))
        .setProgressMessageHandler(fun.bindOnce(
          this._setProgressMessage, this));

      // upload all images...
      image_uploader.uploadAllImages(fun.bind(function() {

        // ... then upload all direct campaign changes.
        campaign_uploader.uploadAllCampaigns(
          changed_campaigns_directly,

          // ... then upload all ads
          fun.bind(ad_uploader.uploadAllAds,
            ad_uploader, changed_campaigns,

            // ... then, "stop"
            fun.bindOnce(this._finish, this)));
      }, this));
    }, this));
  },

  /**
   * called at the very end of the upload process,
   * whether or not the upload finishes successfully
   */
  _finish: function() {
     this._dialog.notifyComplete();
     App.reload();
  },

  /**
   * Logs an error
   */
  _logError: function(msg) {
    this._dialog.logError(msg);
  },

  /**
   * Logs an error, then quits
   */
  _logErrorAndQuit: function(msg) {
    this._logError(msg);
    this._finish();
  },

  _setProgressMessage: function(msg) {
    this._dialog.updateProgressMessage(msg);
    return this;
  },

  /**
   * delegates to the UploadDialog
   */
  _updateProgress: function() {
    this._dialog.updateProgress(
      this._nUploaded, this._nAds, this._nCampaigns);
    return this;
  },

  /**
   * Increments the number of ads processed by "n"
   */
  _incrAds: function(n) {
    this._nUploaded += n;
    this._updateProgress();
  },

  /**
   * Increments the number of campaigns processed by "n"
   */
  _incrCampaigns: function(n) {
    this._nUploaded += n;
    this._updateProgress();
  }
});

exports.Upload = Upload;
