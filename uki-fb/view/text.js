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
requireCss("./text/text.css");


var fun  = require("../../uki-core/function"),
    dom  = require("../../uki-core/dom"),
    view = require("../../uki-core/view"),

    Container = require("../../uki-core/view/container").Container;


var Text = view.newClass('fb.Text', Container, {}),
    proto = Text.prototype;

proto._createDom = function(initArgs) {
  this._content = dom.createElement('span', { className: 'ufb-text-content' });
  this._dom = dom.createElement(
    initArgs.tagName || 'div',
    { className: 'ufb-text ufb-text_size-medium' },
    [this._content]);
};

fun.delegateProp(proto, 'html', '_content', 'innerHTML');

proto.size = view.newClassMapProp({
  'small': 'ufb-text_size-small',
  'medium': 'ufb-text_size-medium',
  'large': 'ufb-text_size-large',
  'huge': 'ufb-text_size-huge',
  'giant': 'ufb-text_size-giant'
});

proto.color = view.newClassMapProp({
  'black': 'ufb-text_color-black',
  'gray': 'ufb-text_color-gray'
});

proto.weight = view.newClassMapProp({
  'normal': 'ufb-text_weight-normal',
  'bold': 'ufb-text_weight-bold'
});

proto.text = function(v) {
  return this.html(v && dom.escapeHTML(v));
};

exports.Text = Text;
