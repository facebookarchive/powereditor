/**
* Copyright (c) 2011, Vladimir Kolesnikov, Facebook, Inc.
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
* This file was automatically generated from uki source by Facebook.
* @providesModule uki-binding
* @option preserve-header
*/

var fun   = require("./function"),
    utils = require("./utils");


var Binding = fun.newClass({
    view: null,
    model: null,
    modelProp: 'value',
    viewProp: 'value',
    modelEvent: '',
    viewEvent: 'blur',

    init: function(options) {
        utils.extend(this, options);
        if (!this.modelEvent) {
            this.modelEvent = 'change.' + this.modelProp;
        }

        if (this.model && this.view) {
            this.view.on(this.viewEvent,
                fun.bindOnce(this.updateModel, this));
            this.model.on(this.modelEvent,
                fun.bindOnce(this.updateView, this));
            if (this.sync !== false) {
                this.updateView();
            }
        }
    },

    destruct: function() {
        if (this.model && this.view) {
            this.view.removeListener(this.viewEvent,
                fun.bindOnce(this.updateModel, this));
            this.model.removeListener(this.modelEvent,
                fun.bindOnce(this.updateView, this));
        }
    },

    viewValue: function(value) {
        return utils.prop(this.view, this.viewProp, value);
    },

    modelValue: function(value) {
        return utils.prop(this.model, this.modelProp, value, this);
    },

    updateModel: function(e) {
        this._lockUpdate(function() {
            this.modelValue(this.viewValue());
        });
    },

    updateView: function(e) {
        this._lockUpdate(function() {
            this.viewValue(this.modelValue());
        });
    },

    _lockUpdate: function(callback) {
        if (!this._updating && this.viewValue() != this.modelValue()) {
            this._updating = true;
            try {
                callback.call(this);
            } catch (e) {
                this._updating = false;
                throw e;
            }
            this._updating = false;
        }
    }
});


exports.Binding = Binding;
