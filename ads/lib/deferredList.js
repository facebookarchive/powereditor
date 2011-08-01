/**
* Copyright 2011 Facebook, Inc.
*
* You are hereby granted a non-exclusive, worldwide, royalty-free license to
* use, copy, modify, and distribute this software in source code or binary
* form for use in connection with the web services and APIs provided by
* Facebook.
*
* As with any software that integrates with the Facebook platform, your use
* of this software is subject to the Facebook Developer Principles and
* Policies [http://developers.facebook.com/policy/]. This copyright notice
* shall be included in all copies or substantial portions of the software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
* THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*
*
* Deferred List for callback-basse world
*
*/

var fun = require("../../uki-core/function"),
    env = require("../../uki-core/env");

var DeferredList = fun.newClass({
    init: function() {
        this._waiting = { count: 0 };
        this._complete  = [];
    },

    complete: function(callback) {
        if (!this._waiting.count) {
            callback();
        } else {
            this._complete.push(callback);
        }
    },

    newWaitHandler: function() {
        var id = env.guid++;
        var handler = fun.bind(this.waitHandler, this, id);
        handler.huid = id;

        this._waiting[id] = handler;
        this._waiting.count++;
        return handler;
    },

    waitHandler: function(id) {
        this._waiting[id] = null;
        this._waiting.count--;

        if (!this._waiting.count) {
            var complete = this._complete;
            this._complete = [];
            complete.forEach(function(c) { c && c(); });
        }
    }
});

exports.DeferredList = DeferredList;
