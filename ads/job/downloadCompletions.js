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
var Completion = require("../model/completion").Completion;
var Job = require("./base").Job;

var REFRESH_TIMEOUT = 1000 * 60 * 60 * 24 * 7; // once per week
var CACHE_KEY = 'model:completion:2';

var DownloadCompletions = fun.newClass(Job, {
  userStorage: fun.newProp('userStorage'),

  categories: fun.newProp('categories'),

  init: function() {
    Job.prototype.init.call(this);

    var userStorage = require("../controller/app").App.userStorage();
    this.userStorage(userStorage);
  },

  clearLastSync: function() {
    require("../controller/app").App.userStorage().deleteItem(CACHE_KEY);
  },

  start: function() {
    this._findCorporateAccount(fun.bind(this._startDownloading, this));
  },

  _findCorporateAccount: function(callback) {
    require("../model/account").Account.findAll(fun.bind(function(accounts) {
      accounts.prefetch();
      var selectedAccount = accounts[0];
      accounts.forEach(function(acc) {
        if (acc.isCorporate()) { selectedAccount = acc; }
      });
      // only process when we have found at least an account.
      if (selectedAccount) {
        callback(selectedAccount);
      } else {
        this._complete();
      }
    }, this));
  },

  _startDownloading: function(selectedAccount) {
    var categories = Completion.categories(selectedAccount);
    this.categories(categories);
    this._progress({
      category: '',
      total: this.categories().length,
      completed: 0
    });
    this._downloadCategory(
      selectedAccount,
      categories,
      fun.bind(this._complete, this));
  },

  _downloadCategory: function(selectedAccount, categories, callback) {
    var category = categories[0];
    if (!category) {
      callback();
    } else {
      categories = categories.slice(1);
      var status = {
        category: category,
        total: this.categories().length,
        completed: this.categories().length - categories.length
      };

      var next = fun.bind(
        this._downloadCategory,
        this,
        selectedAccount,
        categories,
        callback);
      var stored = this.userStorage().getItem(CACHE_KEY) || {};
      var t = +new Date();

      if (stored[category] && (t - stored[category].time) < REFRESH_TIMEOUT) {
        status.cached = true;
        this._progress(status);
        next();
      } else {
        this._progress(status);
        Completion.loadFromRESTAPI(
          {
            account_id: selectedAccount.id(),
            category: category
          },
          fun.bind(function() {
            stored[category] = { time: t };
            this.userStorage().setItem(CACHE_KEY, stored);
            next();
          }, this));
      }
    }
  }
});

exports.DownloadCompletions = DownloadCompletions;
