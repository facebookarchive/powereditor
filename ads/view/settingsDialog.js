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


var view  = require("../../uki-core/view");
var build = require("../../uki-core/builder").build;
var fun   = require("../../uki-core/function");
var find  = require("../../uki-core/selector").find;
var utils = require("../../uki-core/utils");
var Dialog = require("../../uki-fb/view/dialog").Dialog;
var ColumnSelector = require("./columnSelector").ColumnSelector;
var controls = require("./controls");

var PaneMap = {
  'adPane': 0,
  'campPane': 1,
  'contractPane': 2
 };

var SettingsDialog = view.newClass('ads.SettingsDialog', Dialog,
  require("../lib/loggingState").getMixinForDialog('Settings Dialog'), {

  _createDom: function(initArgs) {
    Dialog.prototype._createDom.call(this, initArgs);
    this.closeOnEsc(true);
    this.addClass('settingsDialog');

    this._collection = build([
      { view: 'DialogHeader', html: "Settings" },
      { view: 'DialogContent', childViews: [
        { view: 'DialogBody', childViews: [
          { view: 'PillList', horizontal: true, addClass: 'pbm',
            as: 'pill-list', childViews: [
            { view: 'PillButton', label: 'Ad Columns', selected: true },
            { view: 'PillButton', label: 'Campaign Columns' },
            { view: 'PillButton', label: 'Topline Columns',
              as: 'topline-tab', visible: false }
          ], on: { selected: fun.bind(this._tabSelected, this) }
          },
         { view: 'Container', as: 'container', addClass: 'mtm',
            childViews: [
            { view: ColumnSelector, as: 'ad-columns', name: 'ad-columns',
              columns: view.byId('adPane-data').columns() },
            { view: ColumnSelector, as: 'camp-columns', name: 'camp-columns',
              columns: view.byId('campPane-data').columns() },
            { view: ColumnSelector, as: 'topline-columns',
              name: 'topline-columns',
              columns: view.byId('topline-table').columns() }
          ] }
        ] },
        { view: 'DialogFooter', childViews: [
          { view: 'Button', label: 'Save', large: true, use: 'confirm',
            on: { click: fun.bindOnce(this._dialogOk, this) } },
          { view: 'Button', label: 'Cancel', large: true,
            on: { click: fun.bind(this.visible, this, false) } }
        ] }
      ] }
    ]).appendTo(this);

    

    this.on('show', this._onshow);
    this._tabSelected();
  },

  toggleToplineTab: function(show) {
    this._collection.view('topline-tab').visible(show);
  },

  setPane: function(paneName) {
    var paneType = 0;
    switch (paneName) {
      case 'adPane':
      case 'campPane':
      case 'contractPane':
        paneType = PaneMap[paneName];
        break;
      default:
        alert('not supported pane type');
        break;
    }
    this._collection.view('pill-list').selected(paneType);
    this._tabSelected();
  },

  _tabSelected: function() {
    var tabs = find('> *', this._collection.view('container'));
    tabs.prop('visible', false);
    var currentTab = tabs[this._collection.view('pill-list').selected()];
    currentTab.visible(true);
    currentTab.setCBStatus && currentTab.setCBStatus();
  },

  _onshow: function() {
    this._collection.view('ad-columns')
      .values(view.byId('adPane-data').visibleColumnIndexes());
    this._collection.view('camp-columns')
      .values(view.byId('campPane-data').visibleColumnIndexes());
    this._collection.view('topline-columns')
      .values(view.byId('topline-table').visibleColumnIndexes());
  },

  _dialogOk: function() {
    this.visible(false);

    view.byId('adPane-data').visibleColumnIndexes(
      this._collection.view('ad-columns').values());
    view.byId('campPane-data').visibleColumnIndexes(
      this._collection.view('camp-columns').values());
    view.byId('topline-table').visibleColumnIndexes(
      this._collection.view('topline-columns').values());
  }

});


exports.SettingsDialog = SettingsDialog;
