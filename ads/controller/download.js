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

    Dialog  = require("../../uki-fb/view/dialog").Dialog,

    storage = require("../../storage/storage"),
    libUtils = require("../../lib/utils"),
    asyncUtils = require("../../lib/async"),
    graphlink = require("../../lib/graphlink").gl,
    pathUtils = require("../../lib/pathUtils"),
    conflicter = require("../../lib/conflicter").cc,
    Config = require("../lib/config").Config,

    App     = require("./app").App,
    DownloadDialog = require("../view/downloadDialog").DownloadDialog,
    DownloadProgress = require("../view/downloadProgress").DownloadProgress,

    Account         = require("../model/account").Account,
    Ad              = require("../model/ad").Ad,
    Img             = require("../model/image").Image,
    Campaign        = require("../model/campaign").Campaign,
    ConnectedObject = require("../model/connectedObject").ConnectedObject,
    Contract        = require("../model/contract").Contract,
    Topline         = require("../model/topline").Topline;

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
      require("./downloadBCT")
      .DownloadBCT.download(progress, function() {

        // activate dismiss button
        progress.disableDismiss(false);
        if (!progress.conflicts) {
          progress.triggerDismiss({ type: 'click' });
        }

        // force app update upon completion
        App.reload();
      });
    }, e.ids);
};


/** --- Download Flow ---
 *
 *  HERE BE
 *
 *        .==.        .==.
 *       //`^\\      //^`\\
 *      // ^ ^\(\__/)/^ ^^\\
 *     //^ ^^ ^/6  6\ ^^ ^ \\
 *    //^ ^^ ^/( .. )\^ ^ ^ \\
 *   // ^^ ^/\| v""v |/\^ ^ ^\\
 *  // ^^/\/ /  `~~`  \ \/\^ ^\\
 *  -----------------------------
 *  WARNING FOR THE WISE!
 */

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
    conflicter.removeListener('conflict');
    cb && cb();
  };

  progress.statusUpdate();
  graphlink.on('progress', function(e) {
     progress.statusUpdate(e.update);
  });
  graphlink.on('error', function(e) {
    var err = e.error;
    Dialog.alert(err.message);
    callback();
  });
  conflicter.on('conflict', function(e) {
    progress.conflictsUpdate(e.numconflicts);
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
  loadAccounts(account_ids, null, progress, function(used_accounts) {

    used_accounts = used_accounts.filter(Boolean);
    account_ids = utils.pluck(used_accounts, 'id');

    // numerous checks for valid account_ids since things can go wrong
    // server or client side
    if (!account_ids || !account_ids.length) {
      callback();
      return;
    }

    state = used_accounts;
    var loaders = [loadTimezoneOffsets, removeOldData, loadObjects,
      loadContracts, loadToplines, loadCampaigns, loadAds];

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
  Account.loadFromIds(
    account_ids,
    function(accounts) {
      progress.completeStep('accounts');
      callback(accounts);
    }
  );
}

/**
 * Download account timezone offsets
 *
 * @param account_ids array of account ids being dl'd
 * @param list of accounts
 * @param progress DownloadProgress instance
 * @param callback called on finish
 * @return none
 */
function loadTimezoneOffsets(account_ids, accounts, progress, callback) {
  progress.setStep('timezones');
  this._updatedAccounts = 0;
  this._totalAccounts = accounts.length;
  for (var i = 0; i < accounts.length; i++) {
    var act_id = accounts[i].id();
    var path = pathUtils.join('act_' + act_id, 'timezoneoffsets');

    // TODO use graphlink.batchFetchEdges when it's implemented
    var offsets = [i]; // pass array index to the callback for fetchEdge
    graphlink.fetchEdge(path, {},
      fun.bind(function(fetched) {
        var index = fetched[0];
        fetched = fetched.slice(1);
        accounts[index]
          .fromRemoteObject({ 'timezone_offsets': fetched });
        _updateTZProgress(accounts, progress, callback);
      }, this),
      null, offsets
    );
  }
}

/**
 * Update the progress of the job when the timezone offsets for an account is
 * fetched.
 * TODO replace with graphlink.batchFetchEdges
 *
 * @param accounts to update
 * @param progress DownloadProgress instance
 * @param callback function after progress is complete
 * @return none
 */
function _updateTZProgress(accounts, progress, callback) {
  this._updatedAccounts++;
  if (this._updatedAccounts == this._totalAccounts) {
    progress.completeStep('timezones');
    this._updatedAccounts = 0;
    Account.storeMulti(accounts, function() {
      callback(null);
    });
  }
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

  // clean up all previous campaigns
  Campaign.deleteBy(
    'account_id',
    account_ids,
    function() {
      callback(null);
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

  Campaign.loadFromAccountIds(
    account_ids,
    function(campaigns) {
      progress.completeStep('campaigns');
      Campaign.prepare(callback, true);
    }
  );
}


// ---
// Ads from here on
// Sigh, they are complicated

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

  var paths = Ad.pathsFromAccountIds(account_ids);

  graphlink.serialFetchEdges(paths, { 'include_demolink_hashes': true },
    function(fetched) {
      // sometimes, we will receive current ads in deleted campaigns.
      // remove those here.
      for (var i = fetched.length - 1; i >= 0; i--) {
        var campaign_id = fetched[i].campaign_id;
        if (!Campaign.byId(campaign_id)) {
          fetched.splice(i, 1);
        }
      }
      var createdAds = Ad.createMultipleFromRemote(fetched);
      progress.completeStep('ads');
      fetchAdCreatives(account_ids, createdAds, progress, function(adimages) {
        // store all ads now, after adcreatives and adimages are done
        createdAds.forEach(function(ad) {
          ad.initChangeable();
          ad.validateAll();
        });
        Ad.checkAllForConflicts(createdAds, function() {
          Ad.deleteBy('account_id', account_ids, function() {
            Ad.storeMulti(createdAds, callback);
          });
        }, this);
      });
    });
}


/**
 * fetch ad creatives
 */
function fetchAdCreatives(account_ids, ads, progress, callback) {

  progress.setStep('adcreatives');
  if (!ads.length) {
    progress.completeStep('adcreatives');
    updateAdImages(account_ids, ads, progress, callback);
    return;
  }

  var creative_ids = utils.pluck(ads, 'creative_ids');
  creative_ids = creative_ids.map(function(creative_id) {
    return utils.isArray(creative_id) ? creative_id[0] : creative_id;
  });
  // apparently ads don't have creatives
  creative_ids = utils.unique(creative_ids).filter(Boolean);

  // load creatives all together

  graphlink.fetchObjectsById(creative_ids, {},
    function(adcreatives) {
      var fetchedIdMap = {};
      adcreatives.forEach(function(creative) {
        // do not use creative_id for indexing
        fetchedIdMap[creative.id * 1] = creative;
      });

      var missing_objs_by_account = {};
      ads.forEach(function(ad) {
        var creative_id = ad.creative_ids();
        creative_id = utils.isArray(creative_id) ? creative_id[0] : creative_id;
        var creative = fetchedIdMap[creative_id];
        if (!creative) {
          return;
        }
        var obj_id = creative.object_id;
        var account_id = ad.account_id();
        if (obj_id) {
          var connected_object = ConnectedObject.byId(obj_id);
          if (!connected_object) {
            if (!missing_objs_by_account[account_id]) {
              missing_objs_by_account[account_id] = {};
            }
            missing_objs_by_account[account_id][obj_id] = 1;
          }
        }
      });

      var account_ids_with_missing_objs = utils.keys(missing_objs_by_account);
      // fyi - asyncUtils.forEach takes two functions as paramters...
      // ... one that runs on each iteraction, and one that runs
      // after all iterations are done.
      asyncUtils.forEach(account_ids_with_missing_objs,
          function(account_id, i, iteratorcb) {
        var obj_ids = utils.keys(missing_objs_by_account[account_id]);
        ConnectedObject.loadExtraFromIds(account_id,
          obj_ids, iteratorcb);
      }, function() {
        ads.forEach(function(ad) {
          var creative_id = ad.creative_ids();
          utils.isArray(creative_id) ? creative_id[0] : creative_id;
          var creative = fetchedIdMap[creative_id];
          if (creative) {
            delete creative.name;
            ad
              .muteChanges(true)
              .fromRemoteObject(creative)
              .muteChanges(false);
            // revalidate the ad, now that we have our connected objects.
            Ad.prop('object_id').validate(ad);
          }
        });

        progress.completeStep('adcreatives');
        // finish with Ad Images before storing ads
        updateAdImages(account_ids, ads, progress, callback);
      });
    }
  );
  // end load creatives
}

/**
 * Ultimately load adimages distinctly
 * for now, update images / hashes in ads from the creatives
 */
function updateAdImages(account_ids, ads, progress, callback) {
  progress.setStep('adimages');
  // when you're done loading ads
  // populate image lookup table with newly downloaded ads
  if (!ads.length) {
    callback();
    return;
  }
  Img.updateImagesInAllAccounts(account_ids, ads, function(adimages) {
    // finally, save the ads to db
    progress.statusUpdate(ads.length);
    progress.completeStep('adimages');
    callback(adimages);
  });
}

// --- END Download Flow ---

exports.Download = Download;
