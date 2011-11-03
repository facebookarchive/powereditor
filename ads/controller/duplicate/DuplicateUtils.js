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
    asyncUtils = require("../../../lib/async"),
    ImageImporter = require("../../model/ad/image_importer").ImageImporter,
    fun = require("../../../uki-core/function"),
    env = require("../../../uki-core/env"),
    models = require("../../models"),
    Ad = require("../../model/ad").Ad,
    Campaign = require("../../model/campaign").Campaign;

DuplicateUtils = {

  cloneCampaignsWithAds: function(campaigns, callback) {
    // first we need to fetch the ads...
    // ... we can only do this asynchronously
    var campaign_ids = utils.pluck(campaigns, 'id');
    models.Ad.findAllBy('campaign_id', campaign_ids, function(ads) {

      // organize the ads, by campaign id.
      var ads_by_campaign_id = {};
      campaign_ids.forEach(function(campaign_id) {
        ads_by_campaign_id[campaign_id] = [];
      });
      ads.forEach(function(ad) {
        var campaign_id = ad.campaign_id();
        ads_by_campaign_id[campaign_id].push(ad);
      });

      // clone the campaigns...
      // ... and the ads
      var new_campaigns = [];
      var new_ads = [];
      asyncUtils.forEach(campaigns, function(camp, i, iterator_callback1) {
        // generate a new id for the campaign
        // so we can attach the ad to it.
        var new_id = - new Date() - (env.guid++);
        new_campaigns.push(new Campaign()
          .muteChanges(true)
          .fromDBObject(camp.toDBObject())
          .id(new_id)
          .muteChanges(false));
        asyncUtils.forEach(ads_by_campaign_id[camp.id()],
            function(ad, j, iterator_callback2) {
          var new_ad = new Ad();
          new_ad.muteChanges(true)
            .fromDBObject(ad.toDBObject())
            .id('')
            .campaign_id(new_id)
            .account_id(camp.account_id())
            .muteChanges(false);
          var importer = new ImageImporter(
            new_ad, new_ad.image_hash(), new_ad.imageLookup);
          importer.run(function() {
            new_ads.push(new_ad);
            iterator_callback2();
            });
          }, iterator_callback1);
      }, fun.bind(callback, null, new_campaigns, new_ads));
    });
  }
};

exports.DuplicateUtils = DuplicateUtils;
