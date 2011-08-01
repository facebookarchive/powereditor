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
requireCss("./token.css");

var fun  = require("../../../uki-core/function"),
    view = require("../../../uki-core/view"),
    dom  = require("../../../uki-core/dom"),

    Base = require("../../../uki-core/view/base").Base;


var Token = view.newClass('fb.Token', Base, {
  info: function(v) {
    if (v === undefined) {
      return { text: this.label(), id: this.value() };
    }
    this.value(v.id);
    return this.labelText(v.text);
  },

  labelText: function(v) {
    return this.label(v && dom.escapeHTML(v));
  },

  isClickOnRemove: function(e) {
    return dom.hasClass(e.target, 'ufb-token-remove');
  },

  _createDom: function() {
    this._remove = dom.createElement('a', {
      href: '#',
      title: 'Remove',
      className: 'ufb-token-remove',
      html: ', '
    });

    this._label = dom.createElement('span');

    this._dom = dom.createElement('span', {
      className: 'removable ufb-token'
    }, [this._label, this._remove]);
  }
});

fun.addProp(Token.prototype, 'value');

fun.delegateProp(Token.prototype, 'label', '_label', 'innerHTML');


exports.Token = Token;
