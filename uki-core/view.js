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
* @providesModule uki-view
* @option preserve-header
*/

var utils = require("./utils"),
    fun   = require("./function"),
    env   = require("./env");

var registry = {},
    ids = {};

/** @namespace */
module.exports = {
    register: function(view) {
        registry[view.dom()[env.expando]] = view;
    },

    unregister: function(view) {
        delete registry[view.dom()[env.expando]];
    },

    registerId: function(view) {
        ids[utils.prop(view, 'id')] = view;
    },
    
    unregisterId: function(view) {
        delete ids[utils.prop(view, 'id')];
    },
    
    byId: function(id) {
        return ids[id];
    },

    closest: function(element) {
        while (element) {
            var e = element[env.expando];
            if (registry[e]) { return registry[e]; }
            element = element.parentNode;
        }
        return null;
    },

    contains: function(parent, child) {
        while (child) {
            if (child == parent) { return true; }
            child = child.parent();
        }
        return false;
    },
    
    /**
    * Shortcut for X = fun.newClass()
    * X.prototype.typeName = typeName
    */
    newClass: function(typeName) {
        var View = fun.newClass.apply(fun, utils.toArray(arguments).slice(1));
        View.prototype.typeName = typeName;
        return View;
    },

    newToggleClassProp: function(className) {
        return function(state) {
            if (state === undefined) { return this.hasClass(className); }
            return this.toggleClass(className, state);
        };
    },


    /**
     * @example
     *   newClass({...
     *      this.border = view.newClassMapProp({
     *          wide: 'my-border-wide'
     *          none: 'my-border-none'
     *          thin: 'my-border-thin'
     *      })
     *   ...})
     *
     *  x = new X()
     *  x.border('wide') // className = 'my-border-wide'
     *  x.border() // => wide
     *  x.border('none') // className = 'my-border-none'
     *  x.border() // => none
     */
    newClassMapProp: function(classMap) {
        return function(state) {
            if (state === undefined) {
                var res = '';
                utils.forEach(classMap, function(clasName, enumName) {
                    if (this.hasClass(clasName)) {
                        res = enumName;
                        return false;
                    }
                }, this);
                return res;
            }

            utils.forEach(classMap, function(className, enumName) {
                this.toggleClass(className, state === enumName);
            }, this);
            return this;
        };
    }
};
