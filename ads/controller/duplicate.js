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

var view = require("../../uki-core/view");

var Ad = require("../model/ad").Ad;
var Campaign = require("../model/campaign").Campaign;
var CampImporterJob = require("../job/campImporter").Importer;
var AdImporterJob = require("../job/adImporter").Importer;


/**
* Duplicate all selected ads
* @namespace
*/
var Duplicate = {};

/**
* Main handler
*/
Duplicate.duplicateAdsHandler = function() {
  var ads = view.byId('adPane-data').selectedRows();
  if (!ads.length) {
    require("../../uki-fb/view/dialog").Dialog
      .alert(tx('ads:pe:no-ads-to-duplicate'));
    return;
  }

  var newAds = ads.map(function(ad) {
    return new Ad()
      .muteChanges(true)
      .fromDBObject(ad.toDBObject())
      .id('')
      .muteChanges(false);
  });

  var importer = new AdImporterJob(ads[0].account(), newAds, []);
  importer
    .useNameMatching(false)
    .oncomplete(function() { view.byId('adPane').refreshAndSelect(newAds); })
    .start();
};

Duplicate.duplicateCampsHandler = function() {
  var camps = view.byId('campPane-data').selectedRows();
  if (!camps.length) {
    require("../../uki-fb/view/dialog").Dialog
      .alert(tx('ads:pe:no-camps-to-duplicate'));
    return;
  }

  var newCamps = camps.map(function(camp) {
    return new Campaign()
      .muteChanges(true)
      .fromDBObject(camp.toDBObject())
      .id('')
      .muteChanges(false);
  });

  var importer = new CampImporterJob(camps[0].account(), newCamps, []);
  importer
    .useNameMatching(false)
    .oncomplete(function() {
      require("./app").App.reload();
    })
    .start();
};


exports.Duplicate = Duplicate;
