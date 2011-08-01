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
* @providesModule uki-attaching
* @option preserve-header
*/

var utils = require("./utils"),
    env   = require("./env"),
    evt   = require("./event"),
    dom   = require("./dom"),
    fun   = require("./function"),

    Container = require("./view/container").Container;


var Attaching = fun.newClass(Container, {
    typeName: 'Attaching',

    _setup: function(initArgs) {
        this._dom = initArgs.dom;
        dom.addClass(this.dom(), 'uki-attaching');
        Container.prototype._setup.call(this, initArgs);
    },

    _createDom: fun.FS,

    parent: function() {
        return null;
    }
});

var instances = null;

Attaching.attach = function(dom, view) {
    dom = dom || env.doc.body;
    var id = dom[env.expando] = dom[env.expando] || env.guid++;
    if (!instances || !instances[id]) {
        register(new Attaching({ dom: dom }));
    }
    return instances[id].appendChild(view);
};

Attaching.instances = function() {
    var atts = [];
    utils.forEach(instances || {}, function(a) {
        atts.push(a);
    });
    return atts;
};

function register(a) {
    if (!instances) {
        instances = {};
        var timeout = false;

        evt.on(env.root, 'resize', function() {
            if (!timeout) {
                timeout = true;
                fun.defer(function(i, len) {
                    timeout = false;
                    utils.forEach(instances, function(a) {
                       a.layout();
                    });
                });
            }
        });
    }
    var el = a.dom(),
        id = el[env.expando] = el[env.expando] || env.guid++;

    return (instances[id] = a);
}


exports.Attaching = Attaching;
