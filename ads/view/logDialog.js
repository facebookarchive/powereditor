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
requireCss("./logDialog/loadDialog.css");

var fun   = require("../../uki-core/function"),
    view  = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,

    Dialog = require("../../uki-fb/view/dialog").Dialog;

var LogDialog = view.newClass('ads.LogDialog', Dialog,
  require("../lib/loggingState").getMixinForDialog('log_dialog'), {

  header: function() {
    return this._collection.view('header');
  },

  closeButton: function() {
    return this._collection.view('closeButton');
  },

  title: fun.newDelegateProp('header', 'html'),

  log: function(message, className) {
    return build({ view: 'Text', text: message, addClass: className })
      .appendTo(this._collection.view('log'));
  },

  append: function(view) {
    return build(view).appendTo(this._collection.view('log'))[0];
  },

  clear: function(message, className) {
    this._collection.view('log').html('');
    return this;
  },

  _createDom: function(initArgs) {
    Dialog.prototype._createDom.call(this, initArgs);

    this
      .modal(true)
      .addClass('logDialog');

    this._collection = build([
      { view: 'DialogHeader', html: "Log", as: 'header' },
      { view: 'DialogContent', childViews: [
        { view: 'DialogBody', as: 'log', addClass: 'logDialog-log' },
        { view: 'DialogFooter', childViews: [
          { view: 'Button', label: 'Close', large: true, as: 'closeButton' }
        ] }
      ] }
    ]).appendTo(this);

    this.closeButton().on('click', fun.bind(function() {
      this.visible(false);
    }, this));
  }
});


exports.LogDialog = LogDialog;
