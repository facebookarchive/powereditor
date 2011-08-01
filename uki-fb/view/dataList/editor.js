/**
* Copyright (c) 2011, Facebook, Inc.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
*   * Redistributions of source code must retain the above copyright notice,
*     this list of conditions and the following disclaimer.
*   * Redistributions in binary form must reproduce the above copyright notice,
*     this list of conditions and the following disclaimer in the documentation
*     and/or other materials provided with the distribution.
*   * Neither the name Facebook nor the names of its contributors may be used to
*     endorse or promote products derived from this software without specific
*     prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
* AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*
*/
requireCss("./editor/editor.css");



var fun   = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");
var view  = require("../../../uki-core/view");
var build = require("../../../uki-core/builder").build;

var Container = require("../../../uki-core/view/container").Container;

var TextInput = require("../textInput").TextInput;


var Editor = view.newClass('fb.dataList.Editor', Container, {

  bindingOptions: fun.newProp('bindingOptions'),
  _bindingOptions: {},

  _createDom: function(initArgs) {
    Container.prototype._createDom.call(this, initArgs);
    this._createInput();

    this.on('blur', fun.bind(this.finishEditing, this, false));
    this.on('keydown', this._onkeydown);
    this.on('keyup', this._onkeyup);
    this.on('mousedown', function(e) { e.stopPropagation(); });

    this.addClass('ufb-dataList-editor');
  },

  _createInput: function() {
    this._input = build({
      view: TextInput,
      addClass: 'ufb-dataList-editor-input'
    }).appendTo(this)[0];
  },

  _onkeyup: function(e) {
    if (e.which == 13) { // RETURN
      this.finishEditing(true);
    } else if (e.which == 27) { // ESC
      this._input.value(this._originalValue);
      this.finishEditing(true);
    }
  },

  _onkeydown: function(e) {
    if (e.which == 38) { // UP or DOWN
      this.trigger({
        type: 'move',
        vertical: -1,
        horizontal: 0
      });
    } else if (e.which == 40) {
      this.trigger({
        type: 'move',
        vertical: 1,
        horizontal: 0
      });
    } else if (e.which == 9) {
      this.trigger({
        type: 'move',
        vertical: 0,
        horizontal: e.shiftKey ? -1 : 1
      });
    } else {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  },

  edit: function(binding) {
    this._editing = true;
    this._input.binding(utils.extend(binding, this.bindingOptions()));
    this._originalValue = this._input.binding().viewValue();
    this._input.select();
  },

  finishEditing: function(remainFocused) {
    if (!this._editing) { return; }
    this._editing = false;
    this._input.trigger({ type: 'blur' });
    this._input.binding(null);
    this.trigger({
      type: 'close',
      remainFocused: remainFocused
    });
  },

  domForEvent: function(type) {
    return this._input.dom();
  }
});


exports.Editor = Editor;
