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
requireCss("./sideNav/sideNav.css");


var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    dom   = require("../../uki-core/dom"),
    view  = require("../../uki-core/view"),
    find  = require("../../uki-core/selector").find,

    Mustache = require("../../uki-core/mustache").Mustache,

    Base      = require("../../uki-core/view/base").Base,
    Container = require("../../uki-core/view/container").Container;


var SideNav = view.newClass('fb.SideNav', Container, {
  _createDom: function() {
    this._dom = dom.createElement('ul', { className: 'ufb-side-nav' });
    this.on('click', this._click);
  },

  selected: function(number) {
    if (number === undefined) {
      return find('> [selected]', this)[0]._viewIndex;
    }
    find('> [selected]', this).prop('selected', false);
    this.childViews()[number].selected(true);
    return this;
  },

  _click: function(e) {
    var child = e.targetView();
    if (child && child != this) {
      this.selected(child._viewIndex);
      this.trigger({ type: 'selected', target: this, button: child });
    }
  }
});


var SideNavItem = view.newClass('fb.SideNavItem', Base, {
  _template: requireText('sideNav/sideNavItem.html'),

  _createDom: function() {
    this._dom = dom.createElement(
      'li',
      { className: 'ufb-side-nav-item-container' });
  },

  _redraw: function() {
    this._dom.innerHTML = Mustache.to_html(this._template, {
      icon: this.icon(),
      label: this.label(),
      count: this.count()
    });
  },

  selected: view.newToggleClassProp('ufb-side-nav-item_selected')
});

var proto = SideNavItem.prototype;
fun.addProp(proto, 'count', function(v) {
  this._count = v;
  this._redraw();
});

fun.addProp(proto, 'label', function(v) {
    this._label = v;
    this._redraw();
});

fun.addProp(proto, 'icon', function(v) {
  this._icon = v;
  this._redraw();
});

fun.addProps(proto, 'template');


exports.SideNav = SideNav;
exports.SideNavItem = SideNavItem;
