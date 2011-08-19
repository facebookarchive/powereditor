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

var view  = require("../../uki-core/view"),
    utils = require("../../uki-core/utils"),
    fun   = require("../../uki-core/function"),
    build = require("../../uki-core/builder").build,

    asyncUtils = require("../../lib/async"),
    FB = require("../../lib/connect").FBWithErrors,
    graphlink = require("../../lib/graphlink").gl,
    pathUtils = require("../../lib/pathUtils"),

    App = require("./app").App,
    UploadDialog = require("../view/uploadDialog").UploadDialog,

    models = require("../models");


var dialog = null;


/**
* Upload camps and ads back to server
* Create new ones, update existing
* Resolve issues with images.
*
* TODO: support separate creative update/create
*/
var Upload = {
  stopped: false,

  uploaded: 0,
  ads: 0,
  campaigns: 0,

  handleUpload: function() {
    Upload.stopped = false;
    Upload.uploaded = Upload.ads = Upload.campaigns = 0;

    createDialog();
    dialog.reset().visible(true);

    var camps = view.byId('content').campaigns();
    var errors = 0;
    var changes = 0;

    camps.forEach(function(c) {
      if (c.hasErrors()) { errors++; }
      if (c.isChanged()) { changes++; }
    });
    if (!changes) {
      dialog.notifyNoChanges();
    } else if (errors) {
      dialog.confirmContinueWithErrors();
    } else {
      start();
    }
  }
};

function updateProgress() {
  dialog.updateProgress(Upload.uploaded, Upload.ads, Upload.campaigns);
}

function stop() {
  Upload.stopped = true;
}

function createDialog() {
  if (dialog) { return; }
  dialog = new UploadDialog();
  dialog
    .on('continueWithErrors', start)
    .on('stop', stop);
}

function complete() {
  dialog.notifyComplete();
  App.reload();
}

/**
 * Upload all ads and withing selected camps + upload selected camps
 */
function start() {
  var camps = view.byId('content').campaigns();

  // filter changed camps that need to be uploaded
  var changedCamps = camps.filter(function(c) {
    return c.isChangedSelf();
  });

  for (var i = 0; i < changedCamps.length; i++) {
    var c = changedCamps[i];
    if (c.isCorporate() && !c.isFromTopline()) {
      // corp account's campaign needs to be attached to a topline
      var message = 'Campaigns of ' + c.account().name() +
        ' must belong to a line. Please try to ' +
        'select a line for the campaign.';
      dialog.logError(message);
      return;
    }
  }

  if (changedCamps.length) {
    Upload.campaigns = changedCamps.length;
    updateProgress();
  }

  uploadCamps(changedCamps, function() {
    if (changedCamps.length) {
      // if we createded/updated camps refetch them from db
      models.Campaign.prepare(fun.bind(startAds, this, camps), true);
    } else {
      startAds(camps);
    }
  });
}



/**
 * Upload selected camps one by one
 *
 * @param camps array of campaigns to upload
 * @param callback to be called after uploading is complete
 */
function uploadCamps(camps, callback) {
  if (Upload.stopped) { return; }

  if (camps.length === 0) {
    callback();
    return;
  }

  var camp = camps.slice(0, 1)[0];
  camps = camps.slice(1);

  

  var next = fun.bind(function(data) {
    

    uploadCampsResponse.call(this, camp, camps, callback, data);
  }, this);

  if (camp.isNew()) {
    FB.api(camp.graphCreatePath(), 'post', camp.dataForRemoteCreate(), next);
  } else {
    FB.api(camp.graphUpdatePath(), 'post', camp.dataForRemoteUpdate(), next);
  }
}

/**
 * Process response from uploadCamps
 *
 * @param camp campaign being uploaded
 * @param camps remaining campaigns
 * @param callback to be callback after uploading is complete
 * @param r result of FB.api call
 */
function uploadCampsResponse(camp, camps, callback, result) {
  var next = fun.bind(uploadCamps, this, camps, callback);

  Upload.uploaded++;
  updateProgress();
  // find errors
  if (result.error) {
    var data = {
      name: camp.name(),
      message: result.error.message || ''
    };

    var message = camp.isNew() ?
      tx('ads:pe:upload-fail-create-camp', data) :
      tx('ads:pe:upload-fail-update-camp', data);

    dialog.logError(message);
    next();
  } else {
    // remove old camp before creating/updating new one
    camp.remove(function() {
      graphlink.fetchObject(
        '/' + (result.id || camp.id()),
        {},
        function(reloadedCampData) {
          if (!reloadedCampData) {
            dialog.logError(tx(
              'ads:pe:upload-fail-download-updates-camp',
              { name: camp.name() }));
            next();
            return;
          }
          var reloadedCamp = models.Campaign.createFromRemote(reloadedCampData);
          function finish() {
            reloadedCamp.changes(camp.changes());
            reloadedCamp.store(next);
          }
          if (reloadedCamp.campaign_status() === 3) {
            next();
            return;
          }

          // if camp is new update all child ads
          if (camp.isNew()) {
            models.Ad.findAllBy('campaign_id', camp.id(), function(ads) {
              camp.id(reloadedCamp.id());
              ads.forEach(function(ad) {
                ad.campaign_id(reloadedCamp.id());
              });
              models.Ad.storeMulti(ads, finish);
            });
          } else {
            finish();
          }
        }
      );
    });
  }
};

function uploadImages(ads, callback) {
  // find local image hashes and corresponding images
  var imageHashesMap = {};
  var imageHashes = [];
  ads.forEach(function(ad) {
    var hash = ad.image_hash();
    var key = ad.account_id() + '|' + hash;
    if (models.Image.isHashLocal(hash)) {
      if (!imageHashesMap[key]) {
        imageHashesMap[key] = [];
        imageHashes.push(hash);
      }
      imageHashesMap[key].push(ad);
    }
  });

  // find local images by hashes
  if (imageHashes.length) {
    models.Image.findAllBy('id', imageHashes, function(images) {
      images.prefetch();
      asyncUtils.forEach(images, function(image, tmp, iteratorCallback) {
        var ads = imageHashesMap[image.account_id() + '|' + image.id()];
        // if images are from another account => skip
        if (!ads[0]) {
          iteratorCallback();
          return;
        }
        // update remote image on the server
        FB.api(
          pathUtils.join('/act_' + image.account_id(), '/adimages'),
          'POST', {
            bytes: image.url().split(',')[1]
          }, function(result) {
            if (result.error || !result.images || !result.images.bytes) {
              // if image uploading failed, fail the whole upload
              dialog.logError(tx(
                'ads:pe:upload-fail-image', {
                  name: ads[0].name(),
                  message: result.error ? result.error.message : ''
              }));
              complete();
              return;
            }
            var bytes = result.images.bytes;

            // update all local ads for the given image
            ads.forEach(function(ad) {
              ad.image_hash(bytes.hash).image_url(bytes.url);
            });
            models.Ad.storeMulti(ads, function() {
              // update local image object
              models.Image.updateImageHash(
                image.account_id(),
                image.id(),
                bytes.hash,
                bytes.url,
                // move to the next image
                iteratorCallback
              );
            });
          });
      }, callback);
    });
  } else {
    callback();
  }
}


/**
* Setup ads uploading after finishing with camps
*/
function startAds(camps) {
  models.Ad.findAllBy('campaign_id', utils.pluck(camps, 'id'), function(ads) {
    ads = ads.filter(function(a) {
      return a.isChanged() && !a.hasErrors();
    });

    Upload.ads = ads.length;
    updateProgress();

    if (!ads.length) {
      // if no ads to upload finish here
      complete();
    } else {
      uploadImages(ads, function() {
        uploadAds(ads);
      });
    }
  });
}

/**
* Upload ads one by one
*
* @param ads array of ads to be uploaded
*/
function uploadAds(ads, originalAds) {
  originalAds = originalAds || ads;
  if (!Upload.stopped) {
    var ad = ads.slice(0, 1)[0];
    ads = ads.slice(1);
    var next = fun.bind(uploadAdsResponse, this, ad, ads, originalAds);

    if (ad.isNew()) {
      FB.api(ad.graphCreatePath(), 'post', ad.dataForRemoteCreate(), next);
    } else {
      FB.api(ad.graphUpdatePath(), 'post', ad.dataForRemoteUpdate(), next);
    }
  }
}

/**
* Process response of _uploadAds
*
* @param ad current uploaded ad
* @param ads remaining ads
* @param r FB.api call response
*/
function uploadAdsResponse(ad, ads, originalAds, result) {
  var next = fun.bind(function() {
    if (ads.length === 0) {
      complete();
    } else {
      uploadAds(ads);
    }
  }, this);

  Upload.uploaded++;
  updateProgress();

  if (result.error) {
    var data = {
      name: ad.name(),
      message: result.error.message || ''
    };

    var message = ad.isNew() ?
      tx('ads:pe:upload-fail-create-ad', data) :
      tx('ads:pe:upload-fail-update-ad', data);

    dialog.logError(message);
    next();
  } else {
    ad.resetCampaign();

    // reload the ad from server after update/create
    var path = '/' + (result.id || ad.id());
    graphlink.fetchObject(path, {}, function(reloadedAdData) {

      if (!reloadedAdData) {
        dialog.logError(tx(
          'ads:pe:upload-fail-download-updates-ad',
          { name: ad.name() }));
        next();
        return;
      }

      var reloadedAd = models.Ad.createFromRemote(reloadedAdData);
      if (reloadedAd.adgroup_status() === 3) {
        ad.remove(next);
        return;
      }

      var path = '/' + reloadedAd.creative_ids()[0];
      graphlink.fetchObject(path, {}, function(creative) {
        delete creative.name;
        ad.remove(function() {
          reloadedAd.muteChanges(true);
          reloadedAd.fromRemoteObject(creative);
          reloadedAd.initChangeable();
          reloadedAd.validateAll();
          reloadedAd.errors({});
          reloadedAd.muteChanges(false);
          reloadedAd.store(next);
        });
      });
    });
  }
}


exports.Upload = Upload;
