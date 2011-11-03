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
    urllib = require("../../../lib/urllib"),

    asyncUtils = require("../../../lib/async"),
    adsConnect = require("../../../lib/connect"),
    FB = adsConnect.FB,
    FBBatch = adsConnect.FBBatch,
    pathUtils = require("../../../lib/pathUtils"),
    App = require("../app").App,
    CampaignUtils = require("../../model/campaign/CampaignUtils").CampaignUtils,
    UploadUtils = require("./UploadUtils").UploadUtils,
    Config = require("../../lib/config").Config,
    models = require("../../models");

/**
 * Class - ImageUploader
 * Responsible for uploading images
 */
var ImageUploader = fun.newClass({
  init: function() {
    this.uploadingRanges = {};
    this.toTryAgain = [];
    this.progressMessageHandler = this.onError = function() {};
    this.CHUNK_SIZE = Config.get('CHUNK_SIZE', 1);
    this.N_RETRIES = Config.get('N_RETRIES', 1);
    this.nthRetry = 0;
  },

  setProgressMessage: function(msg) {
    var range_strings = [];
    for (var r in this.uploadingRanges) {
      range_strings.push(r);
    }
    var final_message = ['Images:'];
    if (range_strings.length > 0) {
      final_message.push('[' + range_strings.join(',') + ']');
    }
    final_message.push(msg);
    final_message = final_message.join(' ');
    this.progressMessageHandler(final_message);
    return this;
  },

  setErrorHandler: function(on_error) {
    this.onError = on_error;
    return this;
  },

  setProgressMessageHandler: function(f) {
    this.progressMessageHandler = f;
    return this;
  },

  _handleError: function(old_image, message) {
    this.onError(message);
  },

  _handleErrorDoNotRetry: function(old_image, message) {
    this._handleError(old_image, message);
  },

  _handleErrorAndRetry: function(old_image, message) {
    if (this.toTryAgain.indexOf(old_image) < 0) {
      this.toTryAgain.push(old_image);
    }
    this._handleError(old_image, message);
  },


  /**
   * The main entrypoint.
   *
   * Uploads any images needed.  Calls the "callback" if successful.
   */
  uploadAllImages: function(final_callback) {
    var changed_campaigns = CampaignUtils.getChanged();

    // fetch the "changed ads" from the campaigns...
    // ... then process them in a callback.
    UploadUtils.getChangedAdsFromCampaigns(
      changed_campaigns, fun.bind(function(ads) {

      // first, create a hash-map:  map[hash][account-id] = ads
      // store this in the object so that we can use it later.
      this.adsByHashAndAccount = this._organizeAdsByImageHashAndAccount(ads);

      // now extract the "image_hashes" that we're going to upload
      var image_hashes = utils.keys(this.adsByHashAndAccount);

      this.setProgressMessage(tx('ads:pe:starting_to_upload_n_images',
        {n: image_hashes.length}));

      // return early if there are no image hashes.
      if (image_hashes.length === 0) {
        final_callback();
        return;
      }

      var after_upload = fun.bind(function() {
        if (this.toTryAgain.length === 0 || this.nthRetry >= this.N_RETRIES) {
          final_callback();
        } else {
          this.setProgressMessage(tx('ads:pe:retrying_n_images',
            {n: this.toTryAgain.length}));
          this.nthRetry++;
          var retry_image_hashes = this.toTryAgain;
          this.toTryAgain = [];
          this._uploadImageHashes(retry_image_hashes, after_upload);
        }
      }, this);

      this._uploadImageHashes(image_hashes, after_upload);
    }, this));
  },

  _uploadImageHashes: function(image_hashes, callback) {
    if (image_hashes.length === 0) { callback(); return; }

    var chunks_image_hashes =
      AdsUtils.chunkArray(image_hashes, this.CHUNK_SIZE);

    // for each chunk... process the chunk
    var parallel_foreach = new asyncUtils.ParallelForEach(
      chunks_image_hashes,
      fun.bindOnce(this._uploadChunkOfImageHashes, this),
      callback);
    parallel_foreach.setExceptionHandler(function(e) {
      require("../../../lib/errorReport").handleException(
        e, 'async:foreach:upload:image');
    });
    parallel_foreach.setConcurrency(Config.get('N_UPLOAD_CONCURRENCY', 4));
    parallel_foreach.run();
  },

  /**
   * returns array of form arr[hash][account_id] = ads
   */
  _organizeAdsByImageHashAndAccount: function(ads) {
    var ads_by_hash_and_account = {};
    ads.forEach(function(ad) {
      var hash = ad.image_hash();
      var account_id = ad.account_id();
      if (models.Image.isHashLocal(hash) ||
          models.Image.isReferenceID(hash)) {
        if (!ads_by_hash_and_account[hash]) {
          ads_by_hash_and_account[hash] = {};
        }
        if (!ads_by_hash_and_account[hash][account_id]) {
          ads_by_hash_and_account[hash][account_id] = [];
        }
        ads_by_hash_and_account[hash][account_id].push(ad);
      }
    });
    return ads_by_hash_and_account;
  },

  /**
   * processes the upload for a "chunk" of hashes, that will
   * be fetched using the batch api in one call
   */
  _uploadChunkOfImageHashes:
      function(chunk_hashes, nth_chunk, iterator_callback) {

    var offset = nth_chunk * this.CHUNK_SIZE;

    var range_string = tx('ads:pe:upload_range',
        {from: (offset + 1), to: (offset + chunk_hashes.length)});
    if (this.nthRetry > 0) {
      range_string = tx('ads:pe:retry_prefix',
        {n: this.nthRetry, msg: range_string});
    }
    this.uploadingRanges[range_string] = 1;
    this.setProgressMessage(tx('ads:pe:Uploading'));

    // first, load the images by id (hash is the id here)
    models.Image.findAllBy('id', chunk_hashes,
      fun.bind(this._uploadChunkOfImages, this,
        iterator_callback, chunk_hashes));
  },

  /**
   * uploads a chunk of images (that have now been fetched from their hashes)
   */
  _uploadChunkOfImages: function(
      callback, image_hashes, images) {
    // we're going to call the api in batch, so assemble
    // the "batches" argument which we'll send to the api

    images.prefetch();
    var batch_request = new FBBatch();

    for (var i = 0; i < images.length; i++) {
      var image = images[i];
      var image_hash = image.id();
      var account_id = image.account_id();
      var ads = this.adsByHashAndAccount[image_hash][account_id];

      // "ads" are empty here in the case that there is more than
      // one image hash that matches, and we're only uploading one.
      if (!ads) { continue; }
      if (image.isReference()) {
        var source_account_id = image.getSourceAccountFromReference();
        var hash = image.getHashFromReference();
        batch_request.add('POST',
          pathUtils.join('/act_' + image.account_id(), '/adimages'),
          {copy_from: {source_account_id: source_account_id,
             hash: hash}},
          fun.bind(this._processUploadResult, this, image, ads, hash));
      } else {
        var bytes = image.url().split(',')[1];
        batch_request.add('POST',
          pathUtils.join('/act_' + image.account_id(), '/adimages'),
          {bytes: bytes},
          fun.bind(this._processUploadResult, this, image, ads, 'bytes'));
      }

    }

    batch_request.run(callback);
  },

  /**
   * processes the result of one image upload
   */
  _processUploadResult: function(old_image, ads, key, resp, iter_callback) {
    var ad_name = '';
    if (ads.length > 0) {
      ad_name = ads[0].name();
    }
    this.setProgressMessage(tx('ads:pe:processing_result_for_thing',
      {thing: ad_name}));

    var account_id = old_image.account_id();
    var result = resp.body && JSON.parse(resp.body);
    if (!result || resp.code != 200 || adsConnect.isError(result)) {
      var message = tx(
        'ads:pe:upload-fail-image', {
          name: ad_name,
          message: adsConnect.getErrorMessage(result).msg || ''});
      if (!result && this.nthRetry < this.N_RETRIES) {
        this._handleErrorAndRetry(old_image, message);
      } else {
        this._handleErrorDoNotRetry(old_image, message);
      }
      iter_callback();
      return;
    }
    var new_image = result.images[key];
    ads.forEach(function(ad) {
      ad.image_hash(new_image.hash).image_url(new_image.url);
      });
    models.Ad.storeMulti(ads, fun.bind(function() {
      // update local image object
      models.Image.updateImageHash(
        old_image.account_id(),
        old_image.id(),
        new_image.hash,
        new_image.url);
      iter_callback();
    }, this));
  }
});

exports.ImageUploader = ImageUploader;


