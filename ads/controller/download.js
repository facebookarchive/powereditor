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
    evt     = require("../../uki-core/event"),
    env     = require("../../uki-core/env"),

    storage = require("../../storage/storage"),
    libUtils = require("../../lib/utils"),
    asyncUtils = require("../../lib/async"),
    graphlink = require("../../lib/graphlink").gl,

    App     = require("./app").App,
    DownloadDialog = require("../view/downloadDialog").DownloadDialog,
    DownloadProgress = require("../view/downloadProgress").DownloadProgress,

    Account         = require("../model/account").Account,
    Ad              = require("../model/ad").Ad,
    AdCreative      = require("../model/adCreative").AdCreative,
    Img             = require("../model/image").Image,
    Campaign        = require("../model/campaign").Campaign,
    ConnectedObject = require("../model/connectedObject").ConnectedObject,
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
  var progress = new DownloadProgress();
  progress.visible(true);

  Download.loadModels(
    progress,
    function() {
      progress.visible(false);
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
* @param progress DownloadProgress instance
* @param callback called on finish
* @param account_ids array of account ids being dl'd
*/
Download.loadModels = function(progress, cb, account_ids) {
  progress = progress || fun.FT;
  var callback = function() {
    // unset progress handler
    graphlink.removeListener('progress');
    graphlink.removeListener('error');
    cb && cb();
  };

  progress.statusUpdate();
  graphlink.on('progress', function(e) {
     progress.statusUpdate(e.update);
  });
  graphlink.on('error', function(e) {
    var err = e.error;
    alert(err.message);
    callback();
  });

  var state = null;

  // If you manually enter accounts, they should be valid account numbers
  // if you just ask to download your own accounts though, that should work
  if (!!account_ids) {
    // strip out invalid accounts
    account_ids = account_ids.filter(function(acc_id) {
      // nothing but numbers
      return (/^\d+$/).test(acc_id + '');
    });
    if (!account_ids.length) {
      callback();
      return;
    }
  }
  account_ids = account_ids || [];

  // Special treatment since we need the account_ids for everything
  // subsequently, and the download may be invoked without explicitly
  // specifying ids
  loadAccounts(account_ids, null, progress, function(used_account_ids) {

    account_ids = libUtils.wrapArray(used_account_ids).filter(
      function(acc_id) {
        return !!acc_id;
      }
    );

    // numerous checks for valid account_ids since things can go wrong
    // server or client side
    if (!account_ids || !account_ids.length) {
      callback();
      return;
    }

    var loaders = [removeOldData, loadObjects, loadContracts, loadToplines,
      loadCampaigns, loadAds, loadAdCreatives, loadAdImages];

    asyncUtils.forEach(loaders,
      function(loader, i, iterCallback) {

        loader(account_ids, state, progress, function(returnedState) {
          state = returnedState;
          iterCallback();
        });

      }, function() {
        // all loading is done.
        // dismiss the progress loader
        // celebrate!
        callback();
      },
      this);

  });

};


/**
* Download all accounts in one chunk. Clears related ads and
* campaigns in next loader
*
* @param account_ids array of account ids being dl'd
* @param state unused
* @param progress DownloadProgress instance
* @param callback called on finish
*/
function loadAccounts(account_ids, state, progress, callback) {
  progress.setStep('accounts');
  var allAccounts = [];
  Account.loadFromIds(
    account_ids,
    function(accounts) {
      progress.completeStep('accounts');
      allAccounts.push.apply(allAccounts, accounts);
      callback(utils.pluck(allAccounts, 'id'));
    }
  );
}


/**
 * removing data associated with accounts being refreshed
 */
function removeOldData(account_ids, state, progress, callback) {
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
* @param account_ids array of account ids being dl'd
* @param state unused
* @param progress DownloadProgress instance
* @param callback called on finish
*/
function loadObjects(account_ids, state, progress, callback) {
  progress.setStep('objects');
  ConnectedObject.loadFromAccountIds(account_ids,
    function(cobjs) {
      // filter objects here?
      progress.completeStep('objects');
      ConnectedObject.prepare(function() {
        callback(null);
      }, true);
  });
}


/**
 * load contracts
 */
function loadContracts(account_ids, state, progress, callback) {
  progress.setStep('contracts');
  var account_options = {};
  if (account_ids) {
    account_options.account_ids = account_ids;
  }

  Contract.loadFromRESTAPI(account_options, function(contracts) {
    progress.statusUpdate(contracts.length);
    progress.completeStep('contracts');
    contracts.prefetch && contracts.prefetch();
    callback(contracts);
  });

}


/**
* Download toplines by contracts
* Download all toplines in contracts[0], then
* in contracts[1], etc
*
* @param account_ids array of account ids being dl'd
* @param contracts array of contracts to download from
* @param progress DownloadProgress instance
* @param callback called on finish with all topliness downloaded
*                 as a parameter
*/
function loadToplines(acc_ids, contracts, progress, callback, _totalToplines) {

  progress.setStep('toplines');
  _totalToplines = _totalToplines || [];

  if (!contracts.length) {
    Topline.prepare(function(toplines) {
      callback(null);
    }, true);
    return;
  }

  

  Topline.loadFromRESTAPI(
    { account_id: contracts[0].id() },
    function(toplines) {
      progress.statusUpdate(toplines.length);
      progress.completeStep('toplines');
      _totalToplines = _totalToplines.concat(toplines);
      

      loadToplines(acc_ids, contracts.slice(1),
        progress, callback, _totalToplines);
    }
  );
}


/**
* Download campaigns by accounts
* Download all campaigns in accounts[0], then
* in accounts[1], etc
*
* @param account_ids array of account ids to download from
* @param state unused
* @param progress DownloadProgress instance
* @param callback called on finish with all campaigns downloaded
*                 as a parameter
*/
function loadCampaigns(account_ids, state, progress, callback) {

  progress.setStep('campaigns');
  var totalCampaigns = [];

  Campaign.loadFromAccountIds(
    account_ids,
    function(campaigns) {

      progress.completeStep('campaigns');
      totalCampaigns = totalCampaigns.concat(campaigns);

      Campaign.prepare(function(campaigns) {
        totalCampaigns.prefetch && totalcampaigns.prefetch();
        callback(totalCampaigns);
      }, true);
    }
  );
}

/**
* Download ads by campaigns
* Downloads ads from up to 10 campaigns from a single account
* in on chunk
*
* @param account_ids array of account ids to dl from
* @param state unused
* @param progress DownloadProgress instance
* @param callback called on finish
*/
function loadAds(account_ids, state, progress, callback) {

  progress.setStep('ads');
  var totalAds = [];

  Ad.loadFromAccountIds(account_ids,
    function(ads, isDone) {

      progress.completeStep('ads');
      totalAds.push.apply(totalAds, ads);

      totalAds.prefetch && totalAds.prefetch();
      callback(totalAds);
    }
  );
}


/**
 * load ad creatives
 */
function loadAdCreatives(account_ids, ads, progress, callback) {

  progress.setStep('adcreatives');
  if (!ads.length) {
    callback([]);
    return;
  }

  var adMapByCreative = {};
  var creative_ids = [];
  libUtils.wrapArray(ads).map(function(ad) {
    var creativeId = (ad.creative_ids() || [])[0];
    if (creativeId) {
      adMapByCreative[creativeId] = adMapByCreative[creativeId] || [];
      adMapByCreative[creativeId].push(ad);
      creative_ids.push(creativeId);
    }
  });

  creative_ids = utils.unique(creative_ids);

  // load creatives all together
  AdCreative.loadFromIds(creative_ids,
    function(data) {
      libUtils.wrapArray(data).map(function(creative) {
        var creativeId = String(creative.creative_id);
        if (adMapByCreative[creativeId]) {
          delete creative.name;
          libUtils.wrapArray(adMapByCreative[creativeId]).map(function(ad) {
            ad
              .muteChanges(true)
              .fromRemoteObject(creative)
              .muteChanges(false);
          });
        }
      });

      progress.completeStep('adcreatives');

      // commit the ad changes back to db
      storage.Storage.storeMulti.call(Ad, ads, function(data) {
          callback(data);
      });
    }
  );
  // end load creatives
}

/**
 * Ultimately load adimages distinctly
 * for now, update images / hashes in ads from the creatives
 */
function loadAdImages(account_ids, ads, progress, callback) {
  progress.setStep('adimages');
  // when you're done loading ads
  // populate image lookup table with newly downloaded ads
  if (!ads.length) {
    callback(null);
    return;
  }
  Img.updateImagesInAllAccounts(account_ids, ads, function() {
    // commit the ad changes back to db
    storage.Storage.storeMulti.call(Ad, ads, function(data) {
      progress.statusUpdate(ads.length);
      progress.completeStep('adimages');
      callback(null);
    });
  });
}

// --- END Download Flow ---

exports.Download = Download;
