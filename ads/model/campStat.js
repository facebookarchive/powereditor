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
* Stat for campaign, inheriting from BaseStat
* @class
*/
var CampStat = storage.newStorage(BaseStat, {
});

CampStat
  .tableName('camp_stat');

CampStat.addProp({
  name: 'object_id',
  type: props.LongNumber,
  remote: 'campaign_id',
  indexed: 'TEXT NOT NULL'
});

// dates

CampStat.addProp({
  name: 'last_update_time',
  db: true
});

CampStat.pathFormat = function(account_id) {
  return pathUtils.join('act_' + account_id, 'adcampaignstats');
};

CampStat.loadFromAccountsAndRange = BaseStat.loadFromAccountsAndRange;

CampStat.createFromRemote = function(data) {
  var ts = +new Date();
  var item = BaseStat.createFromRemote.call(CampStat, data);
  item
    .muteChanges(true)
    .last_update_time(ts)
    .muteChanges(false);
  return item;
};

/*

REMOVE FROM HERE ONWARDS
YEAH!
RED DIFFS
                *
||===     --   ***
|               *

*/

exports.CampStat = CampStat;
