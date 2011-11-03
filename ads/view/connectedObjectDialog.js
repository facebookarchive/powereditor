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
requireCss("./connectedObjectDialog/connectedObjectDialog.css");

var view  = require("../../uki-core/view");
var build = require("../../uki-core/builder").build;
var fun   = require("../../uki-core/function");
var find  = require("../../uki-core/selector").find;
var utils = require("../../uki-core/utils");
var Dialog = require("../../uki-fb/view/dialog").Dialog;

var App = require("../controller/app").App,
    ConnectedObject = require("../model/connectedObject").ConnectedObject;

var MESSAGE_OBJS = 'Downloading {objs} Objects ...';

var ConnectedObjectDialog = view.newClass('ads.ConnectedObjectDialog', Dialog,
  require("../lib/loggingState").getMixinForDialog('Connected Object Dialog'), {

  init: function(initArgs) {
    Dialog.prototype.init.call(this, initArgs);
    this.on('download', this._ondownload);
    this.reset();
    return this;
  },

  _createDom: function(initArgs) {

    Dialog.prototype._createDom.call(this, initArgs);
    this.closeOnEsc(true);
    this.modal(true);

    this._collection = build([
      { view: 'DialogHeader', html: "Download Objects" },
      { view: 'DialogContent', childViews: [
        { view: 'DialogBody', childViews: [
          { view: 'TextInput', as: 'object-id',
            addClass: 'connectDialog-obj-id mts' },

          { view: 'Text', addClass: "mts", visible: false,
            as: 'progress', html: '' }
        ] },
        { view: 'DialogFooter', childViews: [
          { view: 'Button', label: 'Download', large: true, use: 'confirm',
            as: 'download',
            on: { click: fun.bindOnce(this._onok, this) } },
          { view: 'Button', label: 'Cancel', large: true, as: 'action',
            on: { click: fun.bind(this.visible, this, false) } }
        ] }
      ] }
    ]).appendTo(this);
  },

  preset: function(id) {
    this._collection.view('object-id').value(id);
  },

  _onok: function() {
    var ids = null;
    var col = this._collection;
    ids = col.view('object-id')
             .value()
             .replace(' ', '')
             .split(',');

    if (!ids.length) {
      require("../../uki-fb/view/dialog").Dialog
        .alert(tx('ads:pe:no-objectid-selected'));
      return;
    }

    var row = view.byId('campaignList-list').selectedRow();
    var account = row.account ? row.account() : row;

    // testing obj id (techcrunch, showroomprivate.com)
    // ['8062627951', '126321144088217'];
    col.view('object-id').visible(false);
    col.view('download').visible(false);

    col.view('progress').visible(true);
    this.trigger({
      type: 'download',
      account: account,
      extra_fbids: ids
    });
  },

  _ondownload: function(e) {
    if (e.account && e.account.isCorporate()) {
      ConnectedObject.loadExtraFromIds(e.account.id(), e.extra_fbids,
        fun.bind(function(objects) {
          this.updateProgress(objects.length);
          // update is_extra_object to true
          objects.forEach(function(obj) {
            obj.is_extra_object(true);
          });
          ConnectedObject.storeMulti(objects, fun.bind(function() {
            ConnectedObject.prepare(fun.bind(function() {
              this.notifyComplete();
              App.reload();
            }, this));
          }, this));
        }, this)
      );
    }
  },

  updateProgress: function(num_objs) {
    var message = MESSAGE_OBJS;
    message = message.replace('{objs}', num_objs);

    this._collection.view('progress')
      .visible(true).text(message);
  },

  notifyComplete: function() {
    find('DialogHeader', this)[0].html('Download Completed');
    this._collection.view('progress').visible(false);
    this._collection.view('action').label('OK');
  },

  reset: function() {
    find('DialogHeader', this)[0].html('Download Objects');
    this._collection.view('object-id').visible(true);
    this._collection.view('download').visible(true);
    this._collection.view('action').label('Cancel');
    return this;
  }
});


exports.ConnectedObjectDialog = ConnectedObjectDialog;
