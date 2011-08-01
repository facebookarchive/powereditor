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

    dateRange = require("../lib/dateRange"),
    props     = require("../lib/props"),
    asyncUtils = require("../../storage/lib/async"),
    storeUtils   = require("../../storage/lib/utils"),

    FB        = require("../../storage/lib/connect").FB,
    formatters = require("../lib/formatters"),
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
  db: true, remote: true,
  tabSeparated: 'Spent'
});

BaseStat.addProp({
  name: 'clicks',
  db: true, remote: true,
  tabSeparated: 'Clicks'
});

BaseStat.addProp({
  name: 'impressions',
  db: true, remote: true,
  tabSeparated: 'Impressions'
});

BaseStat.addProp({
  name: 'date_range',
  remote: true,
  indexed: 'TEXT NOT NULL'
});

BaseStat.addProp({
  name: 'actions',
  db: true, remote: true,
  tabSeparated: 'Actions'
});

BaseStat.addProp({
  name: 'connections',
  db: true, remote: true
});

BaseStat.addProp({
  name: 'social_clicks',
  db: true, remote: true
});

BaseStat.addProp({
  name: 'social_impressions',
  db: true, remote: true
});

BaseStat.addProp({
  name: 'social_spent',
  db: true, remote: true
});

BaseStat.addProp({
  name: 'social_unique_clicks',
  db: true, remote: true
});

BaseStat.addProp({
  name: 'social_unique_impressions',
  db: true, remote: true
});

BaseStat.addProp({
  name: 'unique_clicks',
  db: true, remote: true
});

BaseStat.addProp({
  name: 'unique_impressions',
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

  accounts = storeUtils.wrapArray(accounts);

  var range = dateRange.encode(from, to),
      start_time,
      end_time;
  if (range === '0-0') {
    start_time = 0;
    end_time = 0;
  } else {
    start_time = (new Date(from)).getTime();
    end_time = (new Date(to)).getTime();
  }

  var edgeCall = true;
  var options = {
    start_time: start_time,
    end_time: end_time
  };
  // clear old stats
  this.clear(fun.bind(function() {

    asyncUtils.forEach(
      accounts,
      fun.bind(function(account, i, iterCallback) {
        storage.Storage.loadAndStore.call(
          this, this.pathFormat(account.id()),
          options, edgeCall, iterCallback);
      }, this),
      callback
    );

  }, this));
};

BaseStat.loadCallback = function(data, isDone, callback) {

  storage.Storage.loadCallback.call(this, data, isDone,
    function(items, isDone) {
      items.forEach(function(item) {
        var range = dateRange.encode(item.start_time(), item.end_time());
        item
          .muteChanges(true)
          .date_range(range)
          .muteChanges(false);
      });
      callback(items, isDone);
    }
  );

};

// --- END Syncing with Graph API stuff ---

exports.BaseStat = BaseStat;
