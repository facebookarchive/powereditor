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

var view  = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,
    fun   = require("../../uki-core/function"),

    Dialog = require("../../uki-fb/view/dialog").Dialog;

var RefreshDialog = view.newClass('ads.RefreshDialog', Dialog,
  require("../lib/loggingState").getMixinForDialog('Refresh Dialog'), {

  _createDom: function(initArgs) {
    Dialog.prototype._createDom.call(this, initArgs);
    // set explicitly, this dialog should not be dismiss-able at all!
    this.closeOnEsc(false);
    this._collection = build([
      { view: 'DialogHeader', text: tx('cs:require-login-title') },
      { view: 'DialogContent', childViews: [
        { view: 'DialogBody', childViews: [
          { view: 'Text', as: 'dbody',
            text: tx('ads:pe:dialog-logged-out') }
        ] },
        { view: 'DialogFooter', childViews: [
          { view: 'Button', label: 'Refresh', large: true,
            as: 'refresh', use: 'confirm',
            on: { click: this._onrefresh }
          }
        ] }
      ] }
    ]).appendTo(this);
  },

  _onrefresh: function(e) {
    e.stopPropagation && e.stopPropagation();
    // reloading the page, AAAAH!
    window.location.reload(true);
  }

});

exports.RefreshDialog = RefreshDialog;
