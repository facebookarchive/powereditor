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

var view = require("../../uki-core/view"),
  env = require("../../uki-core/env"),
  utils = require("../../uki-core/utils"),
  models = require("../models"),
  Ad = require("../model/ad").Ad,
  Campaign = require("../model/campaign").Campaign,
  CampImporterJob = require("../job/campImporter").Importer,
  AdImporterJob = require("../job/adImporter").Importer,
  Paste = require("./paste").Paste,
  DuplicateUtils =
    require("./duplicate/DuplicateUtils").DuplicateUtils;

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

  var account = ads[0].account();
  Paste.selectCampaign(account, function(campaign) {
    var newAds = ads.map(function(ad) {
      return new Ad()
        .muteChanges(true)
        .fromDBObject(ad.toDBObject())
        .id('')
        .campaign_id(campaign.id())
        .muteChanges(false);
    });

    var importer = new AdImporterJob(account, newAds, []);
    importer
      .useNameMatching(false)
      .oncomplete(function() { view.byId('adPane').refreshAndSelect(newAds); })
      .start();
  });

};

Duplicate.duplicateCampsHandler = function() {
  require("../lib/loggingState").startFlow('duplicate_campaigns');
  var camps = view.byId('campPane-data').selectedRows();
  if (!camps.length) {
    require("../../uki-fb/view/dialog").Dialog
      .alert(tx('ads:pe:no-camps-to-duplicate'));
    require("../lib/loggingState").endFlow('duplicate_campaigns');
    return;
  }

  var account = camps[0].account();

  DuplicateUtils.cloneCampaignsWithAds(camps, function(new_campaigns, new_ads) {
    // if the account has a contract, allow the user to select the topline
    // to duplicate into (if the user wants to duplicate the campaign
    // into a different account, they need to use "paste" and pre-select
    // the topline)
    if (account.hasContract()) {
      require("./paste").Paste.selectTopline(account,
          function(line_number) {
        Duplicate._importCampaigns(
          account, new_campaigns, new_ads, line_number);
        });
    } else {
      Duplicate._importCampaigns(account, new_campaigns, new_ads, null);
    }
  });
};

/**
 * just a helper function
 */
Duplicate._importCampaigns = function(
  account, new_campaigns, new_ads, line_number) {

  var importer = new CampImporterJob(
    account, line_number, new_campaigns, []);
  importer
    .useNameMatching(false)
    .ads(new_ads)
    .oncomplete(function() {
      Campaign.prepare(function() {
        var adimporter = new AdImporterJob(account, new_ads, []);
          adimporter.useNameMatching(false);
          adimporter.oncomplete(function() {
            require("./app").App.reload();
            require("../lib/loggingState").endFlow('duplicate_campaigns');
            });
          adimporter.start();
      });
    })
    .start();
};


exports.Duplicate = Duplicate;
