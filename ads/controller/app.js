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
requireCss("../ads.css");
requireCss("../spacing.css");




require("../lib/monkeyPatches");
var dom   = require("../../uki-core/dom"),
    env   = require("../../uki-core/env"),
    fun   = require("../../uki-core/function"),
    evt   = require("../../uki-core/event"),
    utils = require("../../uki-core/utils"),
    view  = require("../../uki-core/view"),
    find  = require("../../uki-core/selector").find,
    build = require("../../uki-core/builder").build,
    builder = require("../../uki-core/builder"),

    db     = require("../db"),
    models = require("../models"),

    UserStorage = require("../../lib/userStorage").UserStorage,

    AccountResultWrapper =
        require("../lib/accountResultWrapper").AccountResultWrapper,

    CampResultSet = require("../model/campaign/campResultSet").CampResultSet,
    ResultSet = require("../../storage/resultSet").ResultSet;

var ADPREVIEWSCSS_PATH = '/adpreviewscss/';

var App = {
  userStorage: fun.newProp(),

  init: init,

  // reload and reselect campaigns on db update
  // so we basically refresh the whole ui
  reload: function() {
    initList(true);
  },

  isActive: function() {
    return !!models.Account.cached();
  },

  // Use this flag to show different views (PowerEditor(false)/Dragon(true))
  hasCorpAct: function() {
    return withCorpAct;
  }
  
};

function checkInstalled() {
  if (global.chrome) {
    if (chrome.app && !chrome.app.isInstalled) {
      var installLink = './install.php';
      build({ view: 'Dialog', modal: true, visible: true, childViews: [
        { view: 'DialogHeader', text: "Install" },
        { view: 'DialogContent', childViews: [
          { view: 'DialogBody', childViews: [
            { view: 'Text',
              text: tx('ads:pe:please-install-chrome')
              }
          ] },
          { view: 'DialogFooter', childViews: [
            { view: 'Button', use: 'confirm',
              label: tx('ads:pe:chrome-install-button'), large: true,
              on: { click: function() { location.href = installLink; } } }
          ] }
        ] }
      ]});
      return false;
    }
  }
  return true;
}

/**
* Main application entrance point,
* we're supposed to be here when everything is loaded
* @namespace
*/
function init(uid) {
  var flow_name = 'app_init';
  require("../lib/loggingState").startFlow(flow_name);
  builder.namespaces.unshift(require("../views"));

  env.doc.body.style.cssText += 'overflow: hidden';

  App.userStorage(new UserStorage(uid, 'powereditor'));
  
  layout();
  if (checkInstalled()) {
    db.init(uid, initList);
  }
  require("../lib/loggingState").endFlow(flow_name);
}

/**
* Reload all toplines and supporting objects
* Select the first one, or the same as before if
* preserveVisState is provides
* @param preserveVisState if true will select the same camps as before
*                         reload
*/
function initList(preserveVisState) {

  // preload Campaigns and Accounts
  models.Account.prepare(function(accounts) {
    // init the UI right after we can determine the account type
    // always make preparing accounts first step since the UI is
    // depended on this.
    models.ConnectedObject.prepare(function() {
      // preload Campaigns and Accounts
      models.Contract.prepare(function(contracts) {
        models.Topline.prepare(function(toplines) {
          models.Campaign.prepare(function(campaigns) {

            _buildOrRestoreCampaignList(
              preserveVisState,
              accounts, campaigns,
              contracts, toplines);

          }, true);
        }, true);
      }, true);
    }, true);
  }, true);

}

function _buildOrRestoreCampaignList(
  preserveVisState,
  accounts, campaigns,
  contracts, toplines) {
  // update the hierachical structure
  _buildContractToplineMap(contracts, toplines, campaigns);

  find('[requireActive]', appLayout).prop(
      'disabled',
      !App.isActive());

  withCorpAct = models.Account.hasCorpAct();
  view.byId('content').toggleCorpActTab(withCorpAct);

  var listType = 'campaignList-list';
  var list = view.byId(listType),
      selectedIndexes = preserveVisState ?
          list.selectedIndexes() : [0],
      lastClickIndex = preserveVisState ?
          list.lastClickIndex() : 0;

  // restore visual state from previously selected contracts, toplines.
  // toOpen contains the ids of the collapsed list that must be expanded
  var toOpen = [];
  // contains map from ids of selected items to 'true' (essentially an int set)
  var selectedIds = {};

  if (preserveVisState) {
    var original = list.data();

    // don't bother refreshing the view if there was nothing there originally.
    // this happens when we drop all data, then redownload
    if (original && original.length) {
      var open_accounts_map = {};

      // preserve original open/expanded accounts
      original.forEach(function(m) {
        if (m.opened) {
          open_accounts_map[m.data.id()] = true;
        }
      });

      accounts.forEach(function(a, i) {
        if (open_accounts_map[a.id()]) {
          toOpen.push(i);
        }
      });

      // preserve original selected campaigns
      selectedIndexes.forEach(function(si) {
        selectedIds[original[si].data.id()] = true;
      });
    }
  }

  // load the account-pane with account info;
  view.byId('content').accounts(accounts);

  // wrap accounts and camps into something that can talk to DataTree
  var wrapper = new AccountResultWrapper(accounts, campaigns);
  list.treeData(wrapper);

  // If we want to preserve previous visual state, go through temp items and
  // ensure new list is updated with items open and selected
  if (preserveVisState) {
    // if there are things to open go in reverse order and open them
    // items must be ordered in reverse because opening an item expands its
    // children into the array. toOpen should have items in increasing order
    for (var i = toOpen.length - 1; i >= 0; --i) {
      list.open(toOpen[i]);
    }

    // update the list of indexes of selected items by ID
    selectedIndexes = [];

    if (selectedIds && list.data()) {
      list.data().forEach(function(m, i) {
        if (selectedIds[m.data.id()]) {
          selectedIndexes.push(i);
        }
      });
    }
  }

  list.layoutIfVisible()
      .selectedIndexes(selectedIndexes)
      .lastClickIndex(lastClickIndex)
      .triggerSelection()
      .focus();
}

function _buildContractToplineMap(contracts, toplines, campaigns) {
  if (contracts.length && toplines.length) {
    var contracts_map = {};
    contracts.forEach(function(c) {
      contracts_map[c.id()] = c;
    });

    var toplines_map = {};
    toplines.forEach(function(t) {
      contracts_map[t.account_id()].children().push(t);
      toplines_map[t.id()] = t;
    });

    campaigns.forEach(function(c) {
      if (c.isFromTopline()) {
        toplines_map[c.idx_line_id()].children().push(c);
      }
    });
  }
}

var appLayout;

var withCorpAct = false;
/**
* Create ui. This can be called even before connect-js is loaded
*/
function layout() {
  var listType = 'CampaignList';
  appLayout = build([
      { view: 'Head', pos: 'l:0 t:0 r:0 h:39px' },

      { view: 'SplitPane', init: { vertical: true },
        id: 'split', leftMin: 100, handlePosition: 150,
        pos: 't:40px l:0px r:0px b:0px',
        persistent: { storage: App.userStorage(), key: 'layout:splitPane' },
        leftChildViews: [
          { view: listType, pos: 'l:0 t:0 r:0 b:0' }
        ],
        rightChildViews: [
          { view: 'Content', pos: 'l:0 t:0 r:0 b:0',
            id: 'content',
            persistent: { storage: App.userStorage(), key: 'content' }
          }
        ]}
  ]).attach();

  /**
   * fetches css from adpreviewscss api
   * for all preview ad types
   */
  FB.api(ADPREVIEWSCSS_PATH,
    fun.bind(
      function(response) {
        var css = response.result;
        dom.createStylesheet(css);
      },
      this
    )
  );
  _initHandler();
}

function _initHandler() {
    require("./paste").Paste.init();
    require("./delete").Delete.init();
    require("./newAd").NewAd.init();

    view.byId('adPane-data').list().on('selection', function() {
        if (this.selectedIndexes().length > 1) {
            // is several ads are selected proxy props
            // through ad.Group
            var AdGroup = require("../model/ad/group").Group;
            var group = new AdGroup(this.selectedRows());
            view.byId('adEditor').model(group);
        } else {
            view.byId('adEditor').model(this.selectedRow() || null);
        }
    });

    view.byId('campPane-data').list().on('selection', function() {
        if (this.selectedIndexes().length > 1) {
            // is several camps are selected proxy props
            // through campaign.Group
            var CampGroup = require("../model/campaign/group").Group;
            var group = new CampGroup(this.selectedRows());
            view.byId('campEditor').model(group);
        } else {
            view.byId('campEditor').model(this.selectedRow() || null);
        }
    });

    _initCampaignListHandler();
}

function _initCampaignListHandler() {

  view.byId('campaignList-list').on('selection', function() {

      var camps = this.selectedRows(),
          selected = [],
          usedAccsMap = {};

      if (!camps.length) {
        return;
      }

      // unpack selected accounts into a list of campaigns
      camps.forEach(function(c) {
          if (c.children) {
              usedAccsMap[c.id()] = true;
              selected = selected.concat(c.children());
          } else {
              if (!usedAccsMap[c.account_id()]) {
                  selected.push(c);
              }
          }
      });

      // clean up the previously created result set if exists
      if (view.byId('content').contract()) {
          view.byId('content').contract().destruct();
      }

      // clean up the previously created result set if exists
      if (view.byId('content').toplines()) {
          view.byId('content').toplines().destruct();
      }

      // clean up the previously created result set if exists
      if (view.byId('content').campaigns()) {
          view.byId('content').campaigns().destruct();
      }

      // wrap selected campaigns into a result set
      view.byId('content').campaigns(CampResultSet.fromArray(selected));

      var selectedContract = selected[0] ?
        selected[0].contract() :
        models.Contract.byId(camps[0].id());

      if (selectedContract) {
        var contract = selectedContract;
        view.byId('content').contract(contract);

        models.Topline.findAllBy(
          'account_id', contract.id(),
          function(toplines) {
            toplines && toplines.prefetch();
            models.Topline.loadToplinesStats(toplines,
              fun.bind(function() {
                view.byId('content').toplines(toplines);
              }, this));
        });
      } else {
        view.byId('content').cleanupContract();
      }
  });
}

exports.App = App;
