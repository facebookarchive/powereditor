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
requireCss("./searchInput/searchInput.css");


var fun  = require("../../uki-core/function"),
    dom  = require("../../uki-core/dom"),
    evt  = require("../../uki-core/event"),
    view = require("../../uki-core/view"),

    Focusable = require("./focusable").Focusable,
    Base      = require("../../uki-core/view/base").Base;


var SearchInput = view.newClass('fb.SearchInput', Base, Focusable, {
  _createDom: function() {
    this._input = dom.createElement(
      'input',
      { type: 'text', className: 'ufb-search-input-input' });

    this._button = dom.createElement(
      'input',
      { type: 'button', className: 'ufb-search-input-button' });

    this._dom = dom.createElement(
      'div',
      { className: 'ufb-search-input' }, [this._input, this._button]);

    evt.addListener(
      this._button,
      'click',
      fun.bind(this._buttonClick, this));
  },

  _buttonClick: function() {
    this.trigger({type: 'search'});
  },

  select: function() {
    return this._input.select();
  },

  setSelectionRange: function(from, to) {
    return this._input.setSelectionRange(from, to);
  },

  flex: view.newToggleClassProp('ufb-search-input_flex'),
  buttonless: view.newToggleClassProp('ufb-search-input_buttonless')
});

fun.delegateProp(SearchInput.prototype,
  ['value', 'placeholder', 'size', 'disabled'], '_input');


exports.SearchInput = SearchInput;
