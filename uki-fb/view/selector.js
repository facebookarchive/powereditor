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
requireCss("./selector/selector.css");


var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    evt   = require("../../uki-core/event"),
    env   = require("../../uki-core/env"),
    dom   = require("../../uki-core/dom"),
    view  = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,

    Base = require("../../uki-core/view/base").Base,

    Selectable = require("./selectable").Selectable,
    Focusable  = require("./focusable").Focusable,
    Menu       = require("./menu").Menu;
    Button     = require("./button").Button;

var Selector = view.newClass('fb.Selector', Base, Focusable, {}),
    proto = Selector.prototype;

var TOGGLE_CLASS = 'ufb-selector-toggler';

var wrapperHTML =
  '<div class="ufb-selector-wrapper">' +
  '<div class="ufb-selector-menu-wrapper"></div></div>';

proto._createDom = function() {
  this._dom = dom.createElement('div', {
    className: 'ufb-selector ufb-selector_left ufb-selector_top',
    html: wrapperHTML
  });
  this._wrap = this._dom.firstChild;
  this._menuWrapper = this._wrap.firstChild;
  this._button = build({
    view: Button,
    addClass: 'ufb-selector-button',
    parent: this
  })[0];
  this._menu = build({
    view: Menu,
    addClass: 'ufb-selector-menu',
    parent: this
  })[0];
  this._wrap.appendChild(this._button.dom());
  this._menuWrapper.appendChild(this._menu.dom());

  this._button.addListener('click', fun.bind(this._click, this));
};

fun.delegateCall(proto, ['appendChild', 'removeChild', 'insertBefore',
  'childViews', 'lastChild', 'firstChild'], '_menu');
fun.delegateProp(proto, ['large', 'disabled', 'suppressed', 'depressed',
  'disabled', 'icon', 'label'], '_button');

proto.alignh = view.newClassMapProp({
  left: 'ufb-selector_left',
  right: 'ufb-selector_rigth'
});

proto.alignv = view.newClassMapProp({
  top: 'ufb-selector_top',
  bottom: 'ufb-selector_bottom-up'
});

proto.opened = function(v) {
  if (v === undefined) {
    return dom.hasClass(this._wrap, TOGGLE_CLASS);
  }
  var current = dom.hasClass(this._wrap, TOGGLE_CLASS);
  v = !!v;
  if (current != v) {
    this._toggleListeners(v);
    dom.toggleClass(this._wrap, TOGGLE_CLASS, v);
  }
  return this;
};

proto._toggleListeners = function(state) {
  var method = state ? 'addListener' : 'removeListener';
  evt[method](env.docElem, 'click', fun.bindOnce(this._docClick, this));
  evt[method](
    env.docElem,
    Selectable.keyPressEvent(),
    fun.bindOnce(this._keypress, this));
};

proto._click = function(e) {
  this.opened(!this.opened());
};

proto._keypress = function(e) {
  var v = e.targetView();
  if (!v || !view.contains(this._menu, v)) {
    this._menu._keypress(e);
  }
};

proto._docClick = function(e) {
  var v = e.targetView();
  if (v && view.contains(this, v)) {
    // do nothing
  } else {
    this.opened(false);
  }
};


exports.Selector = Selector;
