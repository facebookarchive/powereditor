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
* @providesModule uki-observable
* @option preserve-header
*/

var utils = require("./utils"),
    fun = require("./function"),
    evt = require("./event");

var Observable = {
    addListener: function(names, callback) {
        utils.forEach(names.split(' '), function(name) {
            if (!this._listeners) { this._listeners = {}; }
            if (!this._listeners[name]) { this._listeners[name] = []; }
            this._listeners[name].push(callback);
        }, this);
        return this;
    },

    removeListener: function(names, callback) {
        if (!names) {
            delete this._listeners;
        } else {
            var listeners = this._listeners;
            if (listeners) {
                utils.forEach(names.split(' '), function(name) {
                    if (listeners[name]) {
                        listeners[name] = callback ?
                            utils.without(listeners[name], callback) : [];
                    }
                }, this);
            }
        }
        return this;
    },

    trigger: function(e) {
        var type = e.type,
            listeners = this._listeners;
        var wrapped = evt.createEvent(e, {});
        if (listeners && listeners[type]) {
            utils.forEach(listeners[type], function(callback) {
                callback.call(this, wrapped);
            }, this);
        }
        return this;
    },

    destruct: function() {
        delete this._listeners;
    },

    triggerChanges: function(name) {
        this.trigger({
            type: 'change.' + name,
            model: this
        });
        this.trigger({
            type: 'change',
            name: name,
            model: this
        });
        return this;
    },

    muteEvents: function(value) {
        if (value === undefined) {
            return this._originalTrigger &&
                this.trigger !== this._originalTrigger;
        }
        if (!this._originalTrigger) {
            this._originalTrigger = this.trigger;
        }
        this.trigger = value ? fun.FS : this._originalTrigger;
        return this;
    }
};

Observable.on = Observable.addListener;

function newProp(prop, setter) {
    var propName = '_' + prop;
    return function(value) {
        if (value === undefined) { return this[propName]; }

        var oldValue = this[prop](),
            newValue;
        if (setter) {
            setter.call(this, value);
        } else {
            this[propName] = value;
        }
        newValue = this[prop]();
        if (oldValue !== newValue) {
            this.triggerChanges(prop);
        }
        return this;
    };
}

Observable.newProp = newProp;

Observable.addProps = Observable.addProp =
    function(proto, prop, setter) {

    if (utils.isArray(prop)) {
        for (var i = 0, len = prop.length; i < len; i++) {
            proto[prop[i]] = newProp(prop[i], setter && setter[i]);
        }
    } else {
        proto[prop] = newProp(prop, setter);
    }
};

exports.Observable = Observable;
