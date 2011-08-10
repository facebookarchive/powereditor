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

var fun       = require("../../uki-core/function"),
    utils     = require("../../uki-core/utils"),

    props     = require("../lib/props"),
    storage   = require("../../storage/storage"),
    pathUtils = require("../../lib/pathUtils"),

    BaseStat  = require("./baseStat").BaseStat;

/**
* Stat for a given Ad
* @class
*/
var AdStat = storage.newStorage(BaseStat, {
  social_percent: function() {
    return this.impressions() > 0 ?
      (this.social_impressions() / this.impressions()) : 0;
  },

  ctr: function() {
    return this.impressions() > 0 ?
      (this.clicks() / this.impressions()) : 0;
  },

  avg_cpc: function() {
    return this.clicks() > 0 ?
      (this.spent_100() / this.clicks()) : 0;
  },

  avg_cpm: function() {
    return this.impressions() > 0 ?
      (this.spent_100() / this.impressions() * 1000) : 0;
  }
});

AdStat
  .tableName('ad_stat');

AdStat.addProp({
  name: 'object_id',
  type: props.LongNumber,
  remote: 'adgroup_id',
  indexed: 'TEXT NOT NULL'
});

AdStat.pathFormat = function(account_id) {
  return pathUtils.join('act_' + account_id, 'adgroupstats');
};

AdStat.loadFromAccountsAndRange = BaseStat.loadFromAccountsAndRange;
AdStat.createFromRemote = BaseStat.createFromRemote;

/*

REMOVE FROM HERE ONWARDS
YEAH!
RED DIFFS
                *
||===     --   ***
|               *

*/

exports.AdStat = AdStat;
