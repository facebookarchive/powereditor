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


var utils = require("../../uki-core/utils"),
    fun   = require("../../uki-core/function"),
    view  = require("../../uki-core/view"),
    dom   = require("../../uki-core/dom"),
    build = require("../../uki-core/builder").build,

    Container = require("../../uki-core/view/container").Container,
    Mustache  = require("../../uki-core/mustache").Mustache;


/**
* Power to the users!
*
* Quick and dirty solution for views you don't know how to implement.
* Write your messy html in a template and then fill it with views and text.
* HTMLLayout will automatically insert views in the positions specified
* in template.
*
* @example
*   build({
*       view: 'HTMLLayout',
*       template: '<dl><dt>{{label}}</dt><dd>{{{input}}}</dd></dl>',
*       content: {
*           label: 'My Label',
*           input: { view: 'TextInput', placeholder: 'woo hoo! html!' }
*       }
*   })
*/
var HTMLLayout = view.newClass('fb.HTMLLayout', Container, {}),
    proto = HTMLLayout.prototype;


var PLACEHOLDER_CLASSNAME = '__layout__placeholder';

fun.addProp(proto, 'template');
proto._template = '';

fun.addProp(proto, 'content', function(c) {
    this._content = c;

    this._buildViews(this._content);
    this._render();
});
proto._content = {};

proto.childViews = function() {
    return this._childViews;
};
proto._childViews = [];

proto._createDom = function(initArgs) {
  this._dom = dom.createElement(initArgs.tagName || 'div',
    { className: 'HTMLLayout' });
};

proto._buildViews = function(views) {
    // build view declaration
    utils.forEach(views, function(v, key) {
        if (typeof v === 'object') {
            if (v.typeName) { //view
            } else if (v.view) { // declaration
                views[key] = build(v)[0];
            } else {
                this._buildViews(v);
            }
        }
    }, this);
};

proto._contentToPlaceholders = function(views, prefix) {
    var result = utils.isArray(views) ? [] : {};
    prefix = prefix ? prefix + '.' : '';
    utils.forEach(views, function(v, key) {
        if (typeof v === 'object') {
            if (v.typeName) {
                result[key] = '<div class="' + PLACEHOLDER_CLASSNAME +
                    '" data-path="' + dom.escapeHTML(prefix + key) +
                    '"></div>';
                result[key + '__view'] = v;
            } else {
                result[key] = this._contentToPlaceholders(v, prefix + key);
            }
        } else {
            result[key] = v;
        }
    }, this);
    return result;
};

proto._render = function() {
    this._childViews = [];

    var data = this._contentToPlaceholders(this.content());
    this.dom().innerHTML = Mustache.to_html(this.template(), data);
    var count = 0;
    var els = [];
    var divs = this.dom().getElementsByTagName('div');
    for (var i = 0; i < divs.length; i++) {
      if (divs[i].className.indexOf(PLACEHOLDER_CLASSNAME) != -1) {
        els.push(divs[i]);
      }
    }
    utils.forEach(els, function(el) {

        var key   = el.getAttribute('data-path'),
            child = utils.path2obj(key, this.content());

        child._viewIndex = count++;
        child.parent(this);

        el.parentNode.replaceChild(child.dom(), el);
        this._childViews.push(child);
    }, this);
};

proto.destruct = function() {
    this.clear(true);
    Container.prototype.destruct.call(this);
};

proto.clear = function(skipDestruct) {
    this.childViews().forEach(function(child) {
        dom.removeElement(child.dom());
        if (!skipDestruct) {
            child.destruct();
        }
    }, this);
};


exports.HTMLLayout = HTMLLayout;
