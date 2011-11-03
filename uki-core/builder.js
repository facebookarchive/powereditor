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
* @providesModule uki-builder
* @option preserve-header
*/

var utils = require("./utils"),
    fun   = require("./function"),
    Collection = require("./collection").Collection;


var Builder = fun.newClass({
    /**
    * @constructor
    */
    init: function(ns) {
        this.namespaces = ns || [global];
        this.build = fun.bind(this.build, this);
        this._stack = 0;
    },

    build: function(markup) {
        if (!this._stack++) {
            this._references = {};
        }
        var collection = withBuilder(this, function() {
            if (markup.length === undefined) {
                markup = [markup];
            }
            return new Collection(utils.map(markup, function(mRow) {
                return this.buildOne(mRow);
            }, this), this._references);
        }, this);
        if (!this._stack--) {
            this._references = null;
        }
        return collection;
    },
    
    buildOne: function(mRow) {
        // return prebuilt rows right away
        if (mRow.typeName) { return mRow; }

        var klass = mRow.view,
            initArgs = mRow.init || {},
            result;

        if (typeof klass === 'string') {
            klass = this.resolvePath(klass);
        }
        if (!klass) {
            throw "builder: Can't find view with type '" + mRow.view + "'";
        } else {
            result = new klass(initArgs);
        }
        if (mRow.as) {
            this._references[mRow.as] = result;
        }
        copyAttrs(result, mRow);
        return result;
    },
    
    resolvePath: function(path) {
        for (var i = 0, ns = this.namespaces, length = ns.length, res; 
            i < length; i++) {
            res = utils.path2obj(path, ns[i]);
            if (res) { return res; }
        }
        return false;
    }
});

function copyAttrs(view, mRow) {
    utils.forEach(mRow, function(value, name) {
        if (name === 'view' || name === 'init' || name === 'as') { return; }
        utils.prop(view, name, value);
    });
    return view;
}

var defaultBuilder;

function setDefault(builder) {
    exports.build = builder.build;
    exports.namespaces = builder.namespaces;
    defaultBuilder = builder;
}

function withBuilder(builder, callback, context) {
    var oldBuilder = defaultBuilder;
    setDefault(builder);
    var result = callback.call(context || global);
    setDefault(oldBuilder);
    return result;
}

/**
 * We have the ability to work with views that were created with Api's that
 * deviate from the uki standards. Set the default builder to one that overrides
 * the buildOne method.
 */
exports.setDefault = setDefault;
exports.Builder = Builder;
exports.withBuilder = withBuilder;
setDefault(new Builder());
