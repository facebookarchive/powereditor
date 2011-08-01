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
requireCss("./menu/menu.css");


var fun   = require("../../uki-core/function"),
    dom   = require("../../uki-core/dom"),
    view  = require("../../uki-core/view"),
    find  = require("../../uki-core/selector").find,
    build = require("../../uki-core/builder").build,

    Base      = require("../../uki-core/view/base").Base,
    Container = require("../../uki-core/view/container").Container,

    Text      = require("./text").Text,
    Focusable = require("./focusable").Focusable;

var Menu = view.newClass('fb.Menu', Container, Focusable, {
  // do not notify children of resize
  layout: fun.FS,

  _createDom: function() {
    this._dom = dom.createElement(
      'ul',
      { className: 'ufb-menu', role: 'menu' });
    this.addListener('mouseover', this._mouseover);
    this.addListener('click', this._click);
    this.addListener(
      require("./selectable").Selectable.keyPressEvent(),
      this._keypress);
  },

  _keypress: function(e) {
    if (e.which == 38 || e.keyCode == 38) { // UP
      var focused = this.focused();
      this.focused(focused - 1);
      e.preventDefault();
    } else if (e.which == 40 || e.keyCode == 40) { // DOWN
      this.focused(this.focused() + 1);
      e.preventDefault();
    }
  },

  activeItems: function() {
    return (this._activeItems = this._activeItems ||
      find('[menuItem][disabled!=true]', this));
  },

  focused: function(pos) {
    if (pos === undefined) {
      for (var i = 0, items = this.activeItems();
      i < items.length; i++) {

        if (items[i].hasFocus()) { return i; }
      }
      return -1;
    }
    var item = this.activeItems()[pos];
    if (item) { item.focus(); }
    return this;
  },

  _childrenChanged: function() {
    this._activeItems = null;
  },

  _click: function(e) {
    var item = e.targetView();
    if (item && item.menuItem && !item.disabled()) {
      this.trigger({ type: 'select', targetView: this, item: item });
    }
  },

  _mouseover: function(e) {
    var item = e.targetView();
    if (item && item.menuItem && !item.disabled()) {
      item.focus();
    }
  }
});


var MenuItemGroup = view.newClass('fb.MenuItemGroup', Container, {
  _createDom: function() {
    this._dom = dom.createElement(
      'li',
      { className: 'ufb-menu-item-group' });
    this._title =
      build({ view: Text, addClass: 'ufb-menu-item-group-title' })[0];
    this._ul = dom.createElement(
      'ul',
      { className: 'ufb-menu-item-group-items' });

    this.dom().appendChild(this._title.dom());
    this.dom().appendChild(this._ul);
  },

  _removeChildFromDom: function(child) {
    this._ul.removeChild(child.dom());
  },

  _appendChildToDom: function(child) {
    this._ul.appendChild(child.dom());
  },

  _insertBeforeInDom: function(child, beforeChild) {
    this._ul.insertBefore(child.dom(), beforeChild.dom());
  }
});
fun.delegateProp(MenuItemGroup.prototype, 'title', '_title', 'text');


var MenuItem = view.newClass('fb.MenuItem', Base, Focusable, {
  // Menu uses this to differentiate Items from others
  menuItem: true,

  _createDom: function() {
    this._label =
      dom.createElement('span', { className: 'ufb-menu-item-label' });
    this._a = this._createA();
    this._a.appendChild(this._label);

    this._dom = dom.createElement(
      'li',
      { className: 'ufb-menu-item' },
      [this._a]);
  },

  _createA: function(disabled) {
    return dom.createElement(
      disabled ? 'span' : 'a',
      {
        className: 'ufb-menu-item-anchor' +
          (disabled ? ' ufb-menu-item-anchor_disabled' : ''),
        href: '#',
        role: 'menuitem',
        rel: 'ignore',
        tabIndex: disabled ? undefined : -1
      }
    );
  },

  focusableDom: function() {
    return this._a;
  },

  text: function(v) {
    return this.html(v && dom.escapeHTML(v));
  },

  disabled: function(v) {
    if (v === undefined) {
      return this.hasClass('ufb-menu-item_disabled');
    }
    if (v !== this.disabled()) {
      this._dom.removeChild(this._a);
      this._a = this._createA(v);
      this._dom.appendChild(this._a);
      this._a.appendChild(this._label);
      this.toggleClass('ufb-menu-item_disabled', v);
    }
    return this;
  }

});
fun.delegateProp(MenuItem.prototype, 'html', '_label', 'innerHTML');


var MenuSeparator = view.newClass('fb.MenuSeparator', Base, {
  _createDom: function() {
    this._dom = dom.createElement('li', { className: 'ufb-menu-separator' });
  }
});


exports.Menu             = Menu;
exports.MenuItem         = MenuItem;
exports.MenuItemGroup    = MenuItemGroup;
exports.MenuSeparator    = MenuSeparator;
