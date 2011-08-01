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
requireCss("./select/select.css");


var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    view  = require("../../uki-core/view"),
    dom   = require("../../uki-core/dom"),

    BaseBinding = require("../binding").Binding,
    Focusable   = require("./focusable").Focusable,
    Base        = require("../../uki-core/view/base").Base;


var Select = view.newClass('fb.Select', Base, Focusable, {
  _createDom: function() {
    this._dom = dom.createElement(
      'select',
      { className: 'ufb-native-select', tabIndex: 1 });
  }
});

function appendOptions(root, options) {
  var node;
  options.forEach(function(option) {
    if (option.options) {
      node = dom.createElement('optgroup', {
        label: option.html ? option.html : dom.escapeHTML(option.text)
      });
      appendOptions(node, option.options);
    } else {
      node = dom.createElement('option', {
        html: option.html ? option.html : dom.escapeHTML(option.text),
        value: option.value,
        selected: option.selected
      });
    }
    root.appendChild(node);
  });
}

fun.addProp(Select.prototype, 'options', function(val) {
  this._options = val;
  this._dom.innerHTML = '';
  appendOptions(this._dom, val);
  return this;
});

fun.addProp(Select.prototype, 'binding', function(val) {
  if (this._binding) {
    this._binding.destruct();
  }
  this._binding = val && new Binding(utils.extend({
    view: this,
    model: val.model,
    viewEvent: 'blur change'
  }, val));
});

fun.delegateProp(Select.prototype,
  ['name', 'disabled', 'value', 'selectedIndex'], '_dom');


var Binding = fun.newClass(BaseBinding, {
  updateView: function(e) {
    this._lockUpdate(function() {
      this.viewValue(this.modelValue());
      // if there's no options with the given value,
      // select the first available
      if (this.viewValue() != this.modelValue()) {
        this.view.selectedIndex(0);
        if (this.selectDefault) {
          this.updateModel();
        }
      }
    });
  }
});


exports.select = {
  Binding: Binding
};
exports.Select = Select;
