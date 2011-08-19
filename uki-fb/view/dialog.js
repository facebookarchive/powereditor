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
requireCss("./dialog/dialog.css");

var env   = require("../../uki-core/env");
var evt   = require("../../uki-core/event");
var fun   = require("../../uki-core/function");
var dom   = require("../../uki-core/dom");
var utils = require("../../uki-core/utils");
var build = require("../../uki-core/builder").build;
var view  = require("../../uki-core/view");

var Attaching = require("../../uki-core/attaching").Attaching;
var Text      = require("./text").Text;
var Container = require("../../uki-core/view/container").Container;

var Dialog = view.newClass('fb.Dialog', Container, {
    visible: function(state) {
        if (state === undefined) {
            return this._dom.style.display != 'none';
        }

        var prevState = this.visible();
        this._wrapper.style.display =
            this._dom.style.display = state ? '' : 'none';

        this.modal(this.modal());

        if (state && !this.parent()) {
            env.doc.body.appendChild(this._wrapper);
            env.doc.body.appendChild(this._overlay);
            Attaching.attach(this._wrapper, this);
        }
        if (state) { this.layout(); }
        if (state) {
            evt.addListener(
                env.doc,
                'keyup',
                fun.bindOnce(this._keyup, this));
        } else {
            evt.removeListener(
                env.doc,
                'keyup',
                fun.bindOnce(this._keyup, this));
        }

        if (state != prevState) {
            this.trigger({ type: state ? 'show' : 'hide' });
        }

        return this;
    },

    _keyup: function(e) {
        if (this.closeOnEsc() && e.which === 27) {
            this.visible(false);
        }
    },

    wide: view.newToggleClassProp('ufb-dialog_wide'),

    destruct: function() {
        Container.prototype.destruct.call(this);
        dom.removeElement(this._wrapper);
        dom.removeElement(this._overlay);
    },

    _createDom: function() {
        this._wrapper = dom.createElement(
            'div',
            { className: 'ufb-dialog-wrapper', style: 'display: none'});
        this._overlay = dom.createElement(
            'div',
            { className: 'ufb-dialog-overlay', style: 'display: none'});
        this._dom = dom.createElement('div', {
            className: 'ufb-dialog',
            style: 'display: none',
            html: '<div class="ufb-dialog-bg"></div>'
        });
    }
});

var proto = Dialog.prototype;
fun.addProp(proto, 'closeOnEsc');
proto._closeOnEsc = false;

fun.addProp(proto, 'modal', function(v) {
    this._modal = v;
    this._overlay.style.display = this.visible() && v ? '' : 'none';
});
proto._modal = false;




var DialogHeader = view.newClass('fb.DialogHeader', Text, {
    _createDom: function(initArgs) {
        Text.prototype._createDom.call(this, initArgs);
        this.size('large');
        this.addClass('ufb-dialog-header');
    }
});

var DialogBody = view.newClass('fb.DialogBody', Container, {
    _createDom: function(initArgs) {
        Container.prototype._createDom.call(this, initArgs);
        this.addClass('ufb-dialog-body');
    }
});

var DialogContent = view.newClass('fb.DialogContent', Container, {
    _createDom: function(initArgs) {
        Container.prototype._createDom.call(this, initArgs);
        this.addClass('ufb-dialog-content');
    }
});

var DialogFooter = view.newClass('fb.DialogFooter', Container, {
    _createDom: function(initArgs) {
        Container.prototype._createDom.call(this, initArgs);
        this.addClass('ufb-dialog-footer');
    }
});


Dialog.alert = function(message, title) {
  var dialog = build(
    { view: 'Dialog', modal: true, visible: true, closeOnEsc: true,
      childViews: [
      { view: 'DialogHeader', text: title || 'Facebook' },
      { view: 'DialogContent', childViews: [
        { view: 'DialogBody', text: message },
        { view: 'DialogFooter', childViews: [
          { view: 'Button', label: 'Close', large: true,
            on: { click: function() { dialog.visible(false).destruct(); } } }
        ] }
      ] }
    ]});
};


exports.Dialog        = Dialog;
exports.DialogHeader  = DialogHeader;
exports.DialogBody    = DialogBody;
exports.DialogContent = DialogContent;
exports.DialogFooter  = DialogFooter;
