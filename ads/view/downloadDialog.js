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
requireCss("./downloadDialog/downloadDialog.css");

var view  = require("../../uki-core/view");
var build = require("../../uki-core/builder").build;
var fun   = require("../../uki-core/function");
var find  = require("../../uki-core/selector").find;
var utils = require("../../uki-core/utils");
var Dialog = require("../../uki-fb/view/dialog").Dialog;
var LocalDataSource =
  require("../lib/typeahead/LocalDataSource").LocalDataSource;
var AccountGraphAPIDataSource =
  require("../lib/typeahead/graph/AccountsGraphAPIDataSource").AccountGraphAPIDataSource;
var Searcher = require("../lib/accountSearcher").Searcher;
var Account = require("../model/account").Account;

var DownloadDialog = view.newClass('ads.DownloadDialog', Dialog,
  require("../lib/loggingState").getMixinForDialog('download_dialog'), {

  _createDom: function(initArgs) {
    Dialog.prototype._createDom.call(this, initArgs);
    this.closeOnEsc(true);

    this._collection = build([
      { view: 'DialogHeader', html: "Download" },
      { view: 'DialogContent', childViews: [
        { view: 'DialogBody', childViews: [
          { view: 'List', spacing: 'medium',
            as: 'option-list', childViews: [
            { view: 'Container', childViews: [
              { view: 'Radio', name: 'download-option',
                on: { click: fun.bindOnce(this._onchange, this) },
                as: 'option-all-accounts', checked: true,
                text: 'All my accounts' }
            ] },
            { view: 'Container', childViews: [
              { view: 'Radio', name: 'download-option',
                on: { click: fun.bindOnce(this._onchange, this) },
                as: 'option-account-list',
                text: 'Selected accounts' },
              { view: 'List', as: 'account-list', visible: false,
                addClass: 'downloadDialog-account-list pas' }
            ] },
            { view: 'Container', childViews: [
              { view: 'Radio', name: 'download-option',
                on: { click: fun.bindOnce(this._onchange, this) },
                as: 'option-account-id',
                text: 'Account by ID' },
              { view: 'Typeahead', as: 'account-id', visible: false,
                setValueOnSelect: true,
                addClass: 'downloadDialog-account-id mts' }
            ] },
            { view: 'Container', childViews: [
              { view: 'Radio', name: 'download-option',
                on: { click: fun.bindOnce(this._onchange, this) },
                as: 'option-account-name',
                text: 'Search for account by name' },
              { view: 'Tokenizer', as: 'account-name', visible: false,
                addClass: "textField", childName: 'accounts',
                inline: true, id: 'account-name',
                value2info: function(v) {
                  return  {id: v.id, text: v.name};
                },
                info2value: function(i) {
                  return {id: i.id, name: i.text};
                },
                placeholder: "Enter the name of an account..." }
            ] }
          ] }
        ] },
        { view: 'DialogFooter', childViews: [
          { view: 'Button', label: 'Download', large: true, use: 'confirm',
            on: { click: fun.bindOnce(this._onok, this) } },
          { view: 'Button', label: 'Cancel', large: true,
            on: { click: fun.bind(this.visible, this, false) } }
        ] }
      ] }
    ]).appendTo(this);
    this.on('show', this._onshow);
  },

  _onchange: function() {
    var col = this._collection;
    col.view('account-list').visible(col.view('option-account-list').checked());
    col.view('account-id').visible(col.view('option-account-id').checked());
    col.view('account-name').visible(col.view('option-account-name').checked());
  },

  _onshow: function() {
    Account.findAll(fun.bind(function(accounts) {
      var childViews = accounts.map(function(a) {
        return {
          view: 'Checkbox',
          text: a.name() + ' (' + a.id() + ')',
          value: a.id()
        };
      });
      this._collection.view('account-list').childViews(childViews);
      this._collection.view('option-account-list').disabled(!accounts.length);
      this._collection.view('account-id').data(
        (new LocalDataSource()).queryEndpoint(new Searcher(accounts))
      );
      this._collection.view('account-name').data(
        (new AccountGraphAPIDataSource())
            .queryData({ type: 'adaccount' })
      );
    }, this));
  },

  _onok: function() {
    var ids = null;
    var col = this._collection;

    if (col.view('option-account-list').checked())  {
      ids = find('[checked]', col.view('account-list'))
        .map(function(acc) {
          return acc.value();
        });
      if (!ids.length) {
        require("../../uki-fb/view/dialog").Dialog
          .alert(tx('ads:pe:no-account-selected'));
        return;
      }
    } else if (col.view('option-account-id').checked()) {
      ids = [col.view('account-id').value().trim()];
    } else if (col.view('option-account-name').checked()) {
      var matches = col.view('account-name').value();

      ids = matches.map(function(account) {
          return account.id;
      });
    }

    var existingActs =
      ids && ids.map(fun.bind(Account.byId, Account))
                .filter(Boolean);

    if (Account.hasChangedAct(existingActs)) {
      this._onConfirm(ids);
      return;
    }

    this.visible(false);
    this.trigger({ type: 'download', ids: ids });
  },

  _onConfirm: function(ids) {
    var dialog = this.getConfirmDialog();

    dialog.view('continue').removeListener('click')
      .on('click', fun.bind(function() {
        dialog.visible(false);
        this.trigger({ type: 'download', ids: ids });
        return;
      }, this)
    );

    dialog.visible(true);
    this.visible(false);
  },

  getConfirmDialog: function() {
    if (!this._confirmDialog) {
      this._confirmDialog =
        build({ view: 'Dialog', childViews: [
          { view: 'DialogHeader', html: "Download Accounts" },
          { view: 'DialogContent', childViews: [
            { view: 'DialogBody', childViews: [
              { view: 'Text', text:
                'Downloading data will erase ' +
                'any changes that have not been uploaded. Continue?' }
            ] },

            { view: 'DialogFooter', childViews: [
              { view: 'Button', label: 'Continue',
                large: true, as: 'continue', use: 'confirm' },
              { view: 'Button', label: 'No', large: true,
                on: { click: fun.bind(function() {
                  this._confirmDialog.visible(false);
                  this.visible(true);
              }, this) } }
            ] }
          ] }
        ] });
    }
    return this._confirmDialog;
  }

});


exports.DownloadDialog = DownloadDialog;
