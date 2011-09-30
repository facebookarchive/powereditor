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

    storage   = require("../../storage/storage"),

    dateRange = require("../../lib/dateRange"),
    props     = require("../lib/props"),
    asyncUtils = require("../../lib/async"),
    libUtils   = require("../../lib/utils"),
    pathUtils = require("../../lib/pathUtils"),

    formatters = require("../../lib/formatters"),
    TabSeparated  = require("../lib/model/tabSeparated").TabSeparated;

/**
* Base class for Stat model
* @class
*/
var BaseStat = storage.newStorage(TabSeparated, {
  spent_100: function() {
    return this.spent() / 100;
  }
});

BaseStat
  .defaultPropType(props.Base);

BaseStat.addProp({
  name: 'id',
  indexed: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
  autoincrement: true,
  remote: false
});

BaseStat.addProp({
  name: 'spent',
  type: props.Number,
  db: true, remote: true,
  tabSeparated: 'Spent',
  getTabSeparated: function(obj) {
    // TODO: revisit the spent_100 and spent logic after
    // currency offset is implemented
    var value = this.getValue(obj);
    value /= 100;
    return value;
  }
});

BaseStat.addProp({
  name: 'clicks',
  type: props.Number,
  db: true, remote: true,
  tabSeparated: 'Clicks'
});

BaseStat.addProp({
  name: 'impressions',
  type: props.Number,
  db: true, remote: true,
  tabSeparated: 'Impressions'
});

BaseStat.addProp({
  name: 'date_range',
  //type:
  remote: true,
  indexed: 'TEXT NOT NULL'
});

BaseStat.addProp({
  name: 'actions',
  //type:
  db: true, remote: true,
  tabSeparated: 'Actions'
});

BaseStat.addProp({
  name: 'connections',
  //type
  db: true, remote: true
});

BaseStat.addProp({
  name: 'social_clicks',
  type: props.Number,
  db: true, remote: true
});

BaseStat.addProp({
  name: 'social_impressions',
  type: props.Number,
  db: true, remote: true
});

BaseStat.addProp({
  name: 'social_spent',
  type: props.Number,
  db: true, remote: true
});

BaseStat.addProp({
  name: 'social_unique_clicks',
  type: props.Number,
  db: true, remote: true
});

BaseStat.addProp({
  name: 'social_unique_impressions',
  type: props.Number,
  db: true, remote: true
});

BaseStat.addProp({
  name: 'unique_clicks',
  type: props.Number,
  db: true, remote: true
});

BaseStat.addProp({
  name: 'unique_impressions',
  type: props.Number,
  db: true, remote: true
});

// dates
BaseStat.addProp({
  type: props.Timestamp,
  name: 'start_time',
  db: true,
  remote: true
});

BaseStat.addProp({
  type: props.Timestamp,
  name: 'end_time',
  db: true,
  remote: true
});

// --- Syncing with Graph API stuff ---

BaseStat.loadFromAccountsAndRange = function(accounts, from, to, callback) {

  accounts = libUtils.wrapArray(accounts);

  var range = dateRange.encode(from, to),
      start_time,
      end_time;
  if (range === '0-0') {
    start_time = 0;
    end_time = 0;
  } else {
    start_time = from.getTime() / 1000;
    end_time = to.getTime() / 1000;
  }

  var edgeCall = true;
  // clear old stats
  this.clear(fun.bind(function() {
    var paths = accounts.map(fun.bind(function(account) {
      return pathUtils.join(
                    this.pathFormat(account.id()),
                    start_time,
                    end_time);
    }, this));
    BaseStat.fetchAndStoreEdges.call(this, paths, callback);
  }, this));
};

BaseStat.createFromRemote = function(data) {
  var item = storage.Storage.createFromRemote.call(this, data);
  var range = dateRange.encode(item.start_time(), item.end_time());
  item
    .muteChanges(true)
    .date_range(range)
    .muteChanges(false);
  return item;
};

// --- END Syncing with Graph API stuff ---

exports.BaseStat = BaseStat;
