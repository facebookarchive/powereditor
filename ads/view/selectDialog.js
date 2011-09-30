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

var SelectDialog = view.newClass('ads.SelectDialog', Dialog,
  require("../lib/loggingState").getMixinForDialog('select_dialog'), {
  _createDom: function(initArgs) {
    Dialog.prototype._createDom.call(this, initArgs);

    this.selectType = initArgs.toString().toLowerCase();
    this._collection = build([
      { view: 'DialogHeader', html: ("Select target " + this.selectType),
          as: 'header' },
      { view: 'DialogContent', childViews: [
        { view: 'DialogBody', childViews: [
          { view: 'Text', text: '', as: 'text' },
          { view: 'Select', options: [], as: 'select' }
        ] },
        { view: 'DialogFooter', childViews: [
          { view: 'Button', label: 'OK', large: true, as: 'ok',
            use: 'confirm',
            on: { click: fun.bind(function() {
              this.trigger({ type: ('select.' + this.selectType) });
            }, this) }
          },
          { view: 'Button', label: 'Close', large: true,
            on: { click: fun.bind(function() {
              this.visible(false);
          }, this) } }
        ] }
      ] }
    ]).appendTo(this);
    this._text = this._collection.view('text');
    this._select = this._collection.view('select');
  },


  text: fun.newDelegateProp('_text', 'text'),

  selectOptions: fun.newDelegateProp('_select', 'options'),

  selectValue: fun.newDelegateProp('_select', 'value')
});

exports.SelectDialog = SelectDialog;
