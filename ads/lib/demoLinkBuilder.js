/**
*/


var fun = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    Campaign = require("../model/campaign").Campaign,
    Ad = require("../model/ad").Ad,
    StatusMap = require("./prop/adgroupStatus").STATUS_MAP;

var PROFILE_BASE = "http://www.facebook.com/profile.php",
    HOME_BASE = "http://www.facebook.com/";

var headerArr = [
  'campaign_id',
  'campaign_name',
  'name',
  'adgroup_id',
  'status',
  'profile',
  'home'
];

function build(accountId, callback) {
  _fillCSV(accountId, function(data) {
    var dataURI =
      'data:text/csv,' + encodeURIComponent(data);
    callback(dataURI);
  });
}

function _buildCVSHeader() {
  // Generate worksheet header details.
  return headerArr.map(function(value) {
    return '"' + value.replace(/"/g, '""') + '"';
  }).join(',') + '\n';
}

function _fillCSV(accountId, callback) {
  // items of all the ads for this account
  Campaign.findAllBy('account_id', accountId,
  function(camps) {

    Ad.findAllBy('campaign_id',
    utils.pluck(camps, 'id'), function(ads) {

      // Generate the data rows from the data in the Store
      var dataCSV = '';
      ads.forEach(function(ad) {
        var values = [];
        values.push(ad.campaign_id());
        values.push(ad.campaign_name());
        values.push(ad.name());
        values.push(ad.id());
        values.push(StatusMap[ad.adgroup_status()]);
        values.push(_buildDemoAdLink(PROFILE_BASE, ad.id(),
          ad.demolink_hash()));
        values.push(_buildDemoAdLink(HOME_BASE, ad.id(), ad.demolink_hash()));

        dataCSV += values.map(function(value) {
          return '"' + value.replace(/"/g, '""') + '"';
        }).join(',') + '\n';

      });

      dataCSV += '\n';
      var data = _buildCVSHeader() + dataCSV;
      callback(data);
    });
  });

}

/**
 * Generates the 10 digit hash needed for non-fb employees to view a demo ad
 *
 * adgroup_id string   a string of the adgroup id to be shown
 * return: string the 10 digit hash that must match the 'h' param
 *
 */
function _buildDemoAdLink(base, adgroup_id, hash) {
  var str = base + '?demo_ad=' + adgroup_id +
    '&h=' + hash;
  return str;
}


function getDemoLink(ad) {
  var link = null;
  if (!ad.isNew()) {
    var is_home =
      ad.original().locations &&
      ad.original().locations.length > 0 &&
      ad.original().locations[0] == require("./impressionLocation").HOME;
    link = _buildDemoAdLink(is_home ? HOME_BASE : PROFILE_BASE,
      ad.id(),
      ad.demolink_hash());
  }

  return link;
}

exports.build = build;
exports.getDemoLink = getDemoLink;
