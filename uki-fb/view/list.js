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
requireCss("./list/list.css");


var utils = require("../../uki-core/utils"),
    fun   = require("../../uki-core/function"),
    dom   = require("../../uki-core/dom"),
    view  = require("../../uki-core/view"),

    Container = require("../../uki-core/view/container").Container;


var List = view.newClass('fb.List', Container, {
  spacing: view.newClassMapProp({
    none: 'ufb-list_spacing-none',
    small: 'ufb-list_spacing-small',
    medium: 'ufb-list_spacing-medium',
    large: 'ufb-list_spacing-large'
  }),

  border: view.newClassMapProp({
    none: 'ufb-list_border-none',
    light: 'ufb-list_border-light',
    medium: 'ufb-list_border-medium',
    dark: 'ufb-list_border-dark'
  }),

  horizontal: view.newToggleClassProp('ufb-list_horizontal'),

  _createDom: function() {
    this._dom = dom.createElement(
      'ul',
      { className: 'ufb-list ufb-list_spacing-small ufb-list_border-none' });
  },

  /* Wrap children in lis */
  _removeChildFromDom: function(child) {
    this.dom().removeChild(child.dom().parentNode);
  },

  _appendChildToDom: function(child) {
    var listClass = utils.prop(child, 'listRowClass');
    var li = dom.createElement(
      'li',
      { className: 'ufb-list-item' + (listClass ? ' ' + listClass : '') });

    li.appendChild(child.dom());
    this.dom().appendChild(li);
  },

  _insertBeforeInDom: function(child, beforeChild) {
    this.dom().insertBefore(
      child.dom().parentNode,
      beforeChild.dom().parentNode
    );
  }
});


exports.List = List;
