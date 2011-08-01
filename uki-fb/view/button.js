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
requireCss("./button/button.css");


var fun   = require("../../uki-core/function"),
    dom   = require("../../uki-core/dom"),
    view  = require("../../uki-core/view"),
    utils = require("../../uki-core/utils"),

    Base = require("../../uki-core/view/base").Base,
    Focusable = require("./focusable").Focusable;

var Button = view.newClass('fb.Button', Base, Focusable, {

  _createDom: function() {
    this._input = dom.createElement(
      'input',
      { type: 'button', className: 'ufb-button-input' });

    this._dom = dom.createElement(
      'label',
      { className: 'ufb-button ufb-button_no-text' },
      [this._input]);
  },

  focusableDom: function(type) {
    return this._input;
  },

  domForEvent: function() {
    return this._input;
  },

  label: function(v) {
    if (v === undefined) { return this._input.value; }
    this._input.value = v;
    this.toggleClass('ufb-button_no-text', !v);
    return this;
  },

  disabled: function(state) {
    if (state === undefined) { return this._input.disabled; }
    this._input.disabled = state;
    this.toggleClass('ufb-button_disabled', state);
    return this;
  },

  use: view.newClassMapProp({
    special: 'ufb-button_special',
    confirm: 'ufb-button_confirm'
  }),

  large: view.newToggleClassProp('ufb-button_large'),
  suppressed: view.newToggleClassProp('ufb-button_suppressed'),
  depressed: view.newToggleClassProp('ufb-button_depressed')
});

fun.addProp(Button.prototype, 'icon', function(v) {
  dom.removeElement(this._iconDom);
  this._icon = v;
  if (v) {
    this._iconDom =
    dom.createElement('img', { className: 'ufb-button-img', src: v });
    this._dom.insertBefore(this._iconDom, this._input);
  }
});



exports.Button = Button;
