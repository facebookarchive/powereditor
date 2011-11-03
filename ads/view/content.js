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
requireCss("./content/content.css");

var fun   = require("../../uki-core/function"),
    dom   = require("../../uki-core/dom"),
    utils = require("../../uki-core/utils"),
    build = require("../../uki-core/builder").build,
    find  = require("../../uki-core/selector").find,
    view  = require("../../uki-core/view"),
    App = require("../controller/app").App,

    PersistentState = require("../../uki-fb/persistentState").PersistentState,
    Container    = require("../../uki-core/view/container").Container;


var Content = view.newClass('ads.Content', Container, PersistentState, {

    pane: fun.newProp('pane'),

    campaigns: function(value) {

      if (value === undefined) {
        return this.pane().campaigns();
      }
      this.pane().campaigns(value).layoutIfVisible();
      return this;
    },

    toplines: function(value) {
      this._toplines = value;
      if (value === undefined) {
        return this.contractPane().toplines();
      }

      if (this.curSelectedPane() === 'contractPane') {
        this.contractPane().toplines(value);
      }
      return this;
    },

    contract: function(value) {
      this._contract = value;

      if (value === undefined) {
        return this.contractPane().contract();
      }

      if (this.curSelectedPane() === 'contractPane') {
        this.contractPane().contract(value);
      }
      return this;
    },

    accounts: function(value) {
      this._accounts = value;

      if (value === undefined) {
        this.accountPane().accounts();
      }

      if (this.curSelectedPane() === 'accountPane') {
        this.accountPane().accounts(value);
      }
      return this;
    },

    cleanupContract: function() {
      this.contractPane().cleanup();
    },

    _createDom: function() {
        this._dom = dom.createElement('div', { className: 'content' });

        build([

            { view: 'PillList', horizontal: true,
              addClass: 'pvs phm container-tabs', childViews: [
                { view: 'PillButton', label: 'Ads', paneType: 'AdPane',
                  selected: true },
                { view: 'PillButton', label: 'Ads Stats', visible: false },
                { view: 'PillButton', label: 'Campaigns',
                  paneType: 'CampPane' },
                { view: 'PillButton', label: 'Contract/Toplines',
                  paneType: 'ContractPane' },
                { view: 'PillButton', label: 'Accounts',
                  paneType: 'AccountPane' }
              ] }

        ]).appendTo(this);

        this._panes = {};
        this.selectPane('AccountPane');
        this.selectPane('CampPane');
        this.selectPane('ContractPane');
        this.selectPane('AdPane');
        find('> PillList', this)[0]
            .addListener('selected', fun.bind(this._selected, this));
    },

    getPersistentState: function() {
      if (this.curSelectedPane() === 'contractPane') {
        var hasCorp = require("../controller/app").hasCorpAct();
        if (!hasCorp) {
          this.selectPane('AdPane');
        }
      }

      return {
        pane: find('> PillList > PillButton[selected]', this)
          .prop('paneType')
      };
    },

    setPersistentState: function(state) {
      if (state.pane) {
        this.selectPane(state.pane);
      }
    },

    destruct: function() {
      this._persistentStateDestruct();
      Container.destruct.call(this);
    },

    _selected: function(e) {
        this.selectPane(e.button.paneType);
    },

    selectPane: function(type) {
        // do not react on reclicks
        if (this.pane() && this.pane() == this._panes[type]) {
            return;
        }

        find('> PillList > PillButton[selected]', this).prop('selected', false);

        if (!this._panes[type]) {
            var id = type.substr(0, 1).toLowerCase() + type.substr(1);
            this._panes[type] = build(
                { view: type, addClass: 'container-' + id, id: id,
                  pos: 't:40px l:0 r:0 b:0', visible: false }
            ).appendTo(this)[0];
        }
        if (this.pane() && this.pane().campaigns()) {
            this._panes[type].campaigns(this.pane().campaigns());
        }

        if (type === 'ContractPane') {
          this.contractPane().toplines(this._toplines);
          this.contractPane().contract(this._contract);
        }

        if (type === 'AccountPane') {
          this.accountPane().accounts(this._accounts);
        }

        find('> PillList > PillButton[paneType=' + type + ']', this)
            .prop('selected', true);

        this.pane(this._panes[type]);
        utils.forEach(this._panes, function(pane, t) {
            pane.visible(t === type);
        });
    },

    toggleCorpActTab: function(show) {
      find('> PillList > PillButton[paneType=ContractPane]', this)
          .visible(show);
    },

    curSelectedPane: function() {
      var type =
        find('> PillList > PillButton[selected]', this).prop('paneType');
      var paneName = type.substr(0, 1).toLowerCase() + type.substr(1);
      return paneName;
    },

    adPane: function() {
      return this._panes.AdPane;
    },

    campPane: function() {
      return this._panes.CampPane;
    },

    contractPane: function() {
      return this._panes.ContractPane;
    },

    accountPane: function() {
      return this._panes.AccountPane;
   }
});


exports.Content = Content;

