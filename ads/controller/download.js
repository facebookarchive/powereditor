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

var utils   = require("../../uki-core/utils"),
    fun     = require("../../uki-core/function"),
    storage = require("../../storage/storage"),
    App     = require("./app").App,
    storeUtils = require("../../storage/lib/utils"),

    asyncUtils = require("../../storage/lib/async"),
    evt     = require("../../uki-core/event"),
    env     = require("../../uki-core/env"),
    DownloadDialog = require("../view/downloadDialog").DownloadDialog,
    DownloadProgress = require("../view/downloadProgress").DownloadProgress;

var Account         = require("../model/account").Account,
    Ad              = require("../model/ad").Ad,
    AdCreative      = require("../model/adCreative").AdCreative,
    AdGroup         = require("../model/ad/group").Group,
    Img             = require("../model/image").Image,
    AdStat          = require("../model/adStat").AdStat,
    Campaign        = require("../model/campaign").Campaign,
    CampGroup       = require("../model/campaign/group").Group,
    CampStat        = require("../model/campStat").CampStat,
    ConnectedObject = require("../model/connectedObject").ConnectedObject,
    Group           = require("../model/group").Group,
    Completion      = require("../model/completion").Completion,

    Contract        = require("../model/contract").Contract,
    Topline         = require("../model/topline").Topline;

var META_REFRESH_TIMEOUT = 1000 * 60 * 60 * 24 * 7; // once per week

/**
* Download ads and campaigns from server
* @namespace
*/
var Download = {};



// -------- DOWNLOAD DIALOG SETUP -----------
// Logic from old sync.js
// Moved flow logic to make syncing easier later

/**
* Helper to create DownloadProgress status
*/
function createProgressStatus() {
  return {
    accounts: 0,
    contracts: 0,
    toplines: 0,
    campaigns: 0,
    accounts_with_campaigns: 0,
    contracts_with_toplines: 0,
    ads: 0,
    adcreatives: 0,
    campaigns_with_ads: 0,
    objects: 0
  };
}

Download.dialog = function() {
  if (!this._dialog) {
    this._dialog = new DownloadDialog();
    this._dialog.on('download', this._ondownload);
  }

  // set up the listener
  this._onOk = this._onOk ||
    fun.bind(function(e) {
      // press enter & alt to start download
      if (e.keyCode === 13 && e.baseEvent.altKey) {
        this._dialog._onok();
      }
    }, this);

  this._dialog.on('show', fun.bind(function() {
    evt.on(env.doc, 'keyup', this._onOk);
  }, this));

  this._dialog.on('hide', fun.bind(function() {
    evt.removeListener(env.doc, 'keyup', this._onOk);
  }, this));

  return this._dialog;
};

Download.handle = function() {
  this.dialog().visible(true);
};

Download._ondownload = function(e) {
  var progress = this._progress || (this._progress = new DownloadProgress());
  progress.visible(true);

  Download.loadModels(
    function(status) { progress.status(status); },
    function() {
      progress.visible(false);
      require("./downloadCompletions")
        .DownloadCompletions.download(function() {
          // force app update upon completion
          App.reload();
        });
      require("./downloadBCT")
      .DownloadBCT.download(function() {
        // force app update upon completion
        App.reload();
      });
    }, e.ids);
};


// --- Download Flow ---

/**
* handler to start downloading including contract/topline
*
* @param pc DownloadProgress callback
* @param callback called on finish
* @param account_ids limit donwload to account_ids specified
*/
Download.loadModels = function(pc, callback, account_ids) {
  var status = createProgressStatus();
  pc = pc || fun.FT;

  callback = callback || fun.FT;
  pc(status);

  var state = null;
  account_ids = account_ids || [];
  account_ids = account_ids.filter(function(acc_id) {
    // is true for numbers too apparently
    return (/\d+/).test(acc_id);
  });

  // Special treatment since we need the account_ids for everything
  // subsequently, and the download may be invoked without explicitly
  // specifying ids
  loadAccounts(account_ids, null, status, pc, function(used_account_ids) {
    account_ids = storeUtils.wrapArray(used_account_ids).filter(
      function(acc_id) {
        return !!acc_id;
      }
    );

    if (!account_ids || !account_ids.length) {
      callback();
      return;
    }

    var loaders = [removeOldData, loadObjects, loadContracts, loadToplines,
      loadCampaigns, loadAds, loadAdCreatives, loadAdImages];

    asyncUtils.forEach(loaders,
      function(loader, i, iterCallback) {

        loader(account_ids, state, status, pc, function(returnedState) {
          state = returnedState;
          iterCallback();
        });

      }, function() {
        // all loading is done.
        // dismiss the progress loader
        // celebrate!
        // alert("We're all done loading here!");
        callback();
      },
      this);

  });

};


/**
* Download all accounts in one chunk. Clears related ads and
* campaigns in next loader
*
* @param accounts array of campaigns to download from
* @param status current download status for DownloadProgress
* @param pc DownloadProgress callback
* @param callback called on finish
*/
function loadAccounts(account_ids, state, status, pc, callback) {
  var allAccounts = [];
  Account.loadFromIds(
    account_ids,
    function(accounts, isDone) {
      status.accounts = accounts.length;
      pc(status);
      allAccounts.push.apply(allAccounts, accounts);
      if (isDone) {
        callback(utils.pluck(allAccounts, 'id'));
      }
    }
  );
}


/**
 * removing data associated with accounts being refreshed
 */
function removeOldData(account_ids, state, status, pc, callback) {
  // clean up all previous contracts and toplines
  Contract.findAllBy(
    'id',
    account_ids,
    function(contracts) {
      Topline.deleteBy(
        'account_id',
        utils.pluck(contracts, 'id'),
        function() {
          Contract.deleteBy(
            'id',
            account_ids,
            function() {});
      });
  });

  // clean up all previous campaigns and ads
  Campaign.findAllBy(
    'account_id',
    account_ids,
    function(campaigns) {
      Ad.deleteBy(
        'campaign_id',
        utils.pluck(campaigns, 'id'),
        function() {
          Campaign.deleteBy(
            'account_id',
            account_ids,
            function() {
              callback(null);
          });
      });
  });
}


/**
* Download ConnectedObjects
*
* @param accounts array of campaigns to download from
* @param status current download status for DownloadProgress
* @param pc DownloadProgress callback
* @param callback called on finish
*/
function loadObjects(account_ids, state, status, pc, callback) {
    status.objects = 1;
    pc(status);
    ConnectedObject.loadFromAccountIds(account_ids,
      function(cobjs) {
        // filter objects here?
        status.objects = 2;
        pc(status);
        ConnectedObject.prepare(function() {
          callback(null);
        }, true);
    });
}


/**
 * load contracts
 */
function loadContracts(account_ids, state, status, pc, callback) {
  var account_options = {};
  if (account_ids) {
    account_options.account_ids = account_ids;
  }

  Contract.loadFromRESTAPI(account_options, function(contracts) {
    status.contracts = contracts.length;
    pc(status);
    contracts.prefetch && contracts.prefetch();
    callback(contracts);
  });

}


/**
* Download toplines by contracts
* Download all toplines in contracts[0], then
* in contracts[1], etc
*
* @param contracts array of contracts to download from
* @param status current download status for DownloadProgress
* @param pc DownloadProgress callback
* @param callback called on finish with all topliness downloaded
*                 as a parameter
*/
function loadToplines(acc_ids, contracts, status, pc, callback,
  totalToplines) {

  totalToplines = totalToplines || [];

  if (!contracts.length) {
    Topline.prepare(function(toplines) {
      callback(null);
    }, true);
    return;
  }

  Topline.loadFromRESTAPI(
    { account_id: contracts[0].id() },
    function(toplines) {
      status.contracts_with_toplines++;
      status.toplines += toplines.length;
      pc(status);
      totalToplines = totalToplines.concat(toplines);

      loadToplines(acc_ids, contracts.slice(1),
        status, pc, callback, totalToplines);
    }
  );
}


/**
* Download campaigns by accounts
* Download all campaigns in accounts[0], then
* in accounts[1], etc
*
* @param accounts array of accounts to download from
* @param status current download status for DownloadProgress
* @param pc DownloadProgress callback
* @param callback called on finish with all campaigns downloaded
*                 as a parameter
*/
function loadCampaigns(account_ids, state, status, pc, callback) {

  var totalCampaigns = [];

  Campaign.loadFromAccountIds(
    account_ids,
    function(campaigns, isDone) {

      status.campaigns += campaigns.length;
      pc(status);
      totalCampaigns = totalCampaigns.concat(campaigns);

      if (isDone) {
        status.campaigns_isdone = true;
        pc(status);

        Campaign.prepare(function(campaigns) {
          totalCampaigns.prefetch && totalcampaigns.prefetch();
          callback(null);
        }, true);
      }
    }
  );
}

/**
* Download ads by campaigns
* Downloads ads from up to 10 campaigns from a single account
* in on chunk
*
* @param campaigns array of campaigns to download from
* @param status current download status for DownloadProgress
* @param pc DownloadProgress callback
* @param callback called on finish
*/
function loadAds(account_ids, state, status, pc, callback) {

  var totalAds = [];

  Ad.loadFromAccountIds(account_ids,
    function(ads, isDone) {
      status.ads += ads.length;
      pc(status);

      totalAds.push.apply(totalAds, ads);

      if (isDone) {
        status.ads_isdone = true;
        pc(status);

        totalAds.prefetch && totalAds.prefetch();
        callback(totalAds);
      }
    }
  );
}


/**
 * load ad creatives
 */
function loadAdCreatives(account_ids, ads, status, pc, callback) {

  if (!ads.length) {
    callback([]);
    return;
  }

  var adMapByCreative = {};
  storeUtils.wrapArray(ads).map(function(ad) {
    var creativeId = (ad.creative_ids() || [])[0];
    if (creativeId) {
      adMapByCreative[creativeId] = adMapByCreative[creativeId] || [];
      adMapByCreative[creativeId].push(ad);
    }
  });

  // load creatives all together
  AdCreative.loadFromAccountIds(account_ids,
    function(data, isCreativesDone) {

      status.adcreatives += data.length;
      pc(status);

      storeUtils.wrapArray(data).map(function(creative) {
        var creativeId = String(creative.creative_id);
        if (adMapByCreative[creativeId]) {
          delete creative.name;
          storeUtils.wrapArray(adMapByCreative[creativeId]).map(function(ad) {
            ad
              .muteChanges(true)
              .fromRemoteObject(creative)
              .muteChanges(false);
          });
        }
      });
      if (isCreativesDone) {

        status.adcreatives_isdone = true;
        pc(status);

        // commit the ad changes back to db
        storage.Storage.storeMulti.call(Ad, ads, function(data) {
            callback(data);
        });
      }
    }
  );
  // end load creatives
}

/**
 * Ultimately load adimages distinctly
 * for now, update images / hashes in ads from the creatives
 */
function loadAdImages(account_ids, ads, status, pc, callback) {
  // when you're done loading ads
  // populate image lookup table with newly downloaded ads
  if (!ads.length) {
    callback(null);
    return;
  }
  Img.updateImagesInAllAccounts(account_ids, ads, function() {
    // commit the ad changes back to db
    storage.Storage.storeMulti.call(Ad, ads, function(data) {
        callback(null);
    });
  });
}

// --- END Download Flow ---

exports.Download = Download;
