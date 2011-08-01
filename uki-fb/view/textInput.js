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
requireCss("./textInput/textInput.css");


var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    dom   = require("../../uki-core/dom"),
    view  = require("../../uki-core/view"),

    Base      = require("../../uki-core/view/base").Base,
    Focusable = require("./focusable").Focusable;


var TextInput = view.newClass('fb.TextInput', Base, Focusable, {}),
    proto = TextInput.prototype;

fun.delegateProp(
  proto,
  ['value', 'select', 'placeholder', 'size', 'maxlen', 'disabled', 'name'],
  '_dom');

proto.value = function(v) {
  if (v === undefined) {
    return this._dom.value;
  }
  this._dom.value = v;
  return this;
};

fun.addProp(proto, 'binding', function(val) {
  if (this._binding) {
    this._binding.destruct();
  }
  var Binding = require("../binding").Binding;
  this._binding = val && new Binding(
    utils.extend({
      view: this,
      model: val.model,
      viewEvent: 'blur change'
    }, val));
});

proto._createDom = function() {
  this._dom = dom.createElement(
    'input',
    { type: 'text', className: 'ufb-text-input' });
};


exports.TextInput = TextInput;
