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
requireCss("./radio/radio.css");


var fun   = require("../../uki-core/function"),
    view  = require("../../uki-core/view"),
    utils = require("../../uki-core/utils"),
    dom   = require("../../uki-core/dom"),

    Base = require("../../uki-core/view/base").Base,

    Binding = require("../binding").Binding;


var Radio = view.newClass('fb.Radio', Base, {
  _createDom: function(initArgs) {
    this._input = dom.createElement('input',
      { className: 'ufb-radio-input', type: 'radio', name: initArgs.name });
    this._label = dom.createElement('span',
      { className: 'ufb-radio-label' });
    this._dom = dom.createElement(initArgs.tagName || 'label',
      { className: 'ufb-radio' }, [this._input, this._label]);
  },

  domForEvent: function(type) {
    return this._input;
  }
});

fun.addProp(Radio.prototype, 'binding', function(val) {
  if (this._binding) {
    this._binding.destruct();
  }
  this._binding = val &&
    new Binding(utils.extend({
      view: this,
      model: val.model,
      viewEvent: 'click',
      viewProp: 'checked',
      commitChangesViewEvent: 'click'
    }, val));
});

fun.delegateProp(Radio.prototype,
  ['name', 'checked', 'disabled', 'value'], '_input');
fun.delegateProp(Radio.prototype,
  'html', '_label', 'innerHTML');

Radio.prototype.label = Radio.prototype.text;


exports.Radio = Radio;
