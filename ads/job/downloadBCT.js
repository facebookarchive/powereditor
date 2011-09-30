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

var fun = require("../../uki-core/function");
var utils = require("../../uki-core/utils");
var Account = require("../model/account").Account;
var BCT = require("../model/bct").BCT;
var Job = require("./base").Job;

var REFRESH_TIMEOUT = 0; // always download
var CACHE_KEY = 'model:bct:1';

var DownloadBCT = fun.newClass(Job,
  require("../lib/loggingState").getMixinForJob('campaign_importer'), {

  userStorage: fun.newProp('userStorage'),
  init: function() {
    Job.prototype.init.call(this);
    var userStorage = require("../controller/app").App.userStorage();
    this.userStorage(userStorage);
  },

  clearLastSync: function() {
    require("../controller/app").App.userStorage().deleteItem(CACHE_KEY);
  },

  start: function() {
    var stored = this.userStorage().getItem(CACHE_KEY) || undefined;
    var t = +new Date();

    // synch only if cached data is stale
    if (Account !== undefined &&
      (stored === undefined ||
      (t - stored.time) >= REFRESH_TIMEOUT)) {
      Account.findAll(fun.bind(function(accounts) {
        accounts.prefetch();
        if (accounts.length > 0) {
          var first_account = accounts[0];
          var account_id = first_account.id();
          var user_id = require("../controller/app").App.userStorage().uid;
          BCT.loadFromRESTAPI(
            { account_id: account_id, user_id: user_id},
            fun.bind(function() {
            stored = { time: t };
            this.userStorage().setItem(CACHE_KEY, stored);
            this._complete();
          }, this));
        } else {
          this._complete();
        }
      }, this));
    } else {
      this._complete();
    }
  }
});

exports.DownloadBCT = DownloadBCT;
