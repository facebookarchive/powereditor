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

var env = require("../../uki-core/env"),
    dom = require("../../uki-core/dom"),
    fun = require("../../uki-core/function");

var Focusable = {};

Focusable.focusableDom = function() {
    return this.dom();
};

Focusable._domForEvent = function(type) {
    if (type == 'focus' || type == 'blur') {
        return this.focusableDom();
    }
    return false;
};

fun.delegateProp(Focusable, 'tabIndex', 'focusableDom');


Focusable._initFocusEvents = function() {
    this._focusEventsInited = true;
    this.on('focus', fun.bindOnce(this._focus, this));
    this.on('blur', fun.bindOnce(this._blur, this));
};

Focusable._destruct = function() {
    this.removeListener('focus', fun.bindOnce(this._focus, this));
    this.removeListener('blur', fun.bindOnce(this._blur, this));
};

Focusable._focus = function() {
    if (this.focusedClass()) {
        this.addClass(this.focusedClass());
    }
};

Focusable._blur = function() {
    if (this.focusedClass()) {
        this.removeClass(this.focusedClass());
    }
};

Focusable.focus = function() {
    this.focusableDom().focus();
    return this;
};

Focusable.blur = function() {
    this.focusableDom().blur();
    return this;
};

Focusable.hasFocus = function() {
    return this.focusableDom() == env.doc.activeElement;
};

fun.addProp(Focusable, 'focusedClass');


exports.Focusable = Focusable;
