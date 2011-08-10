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
* Deferred List for callback-based world
*
*/

var fun = require("../uki-core/function"),
    env = require("../uki-core/env");

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
