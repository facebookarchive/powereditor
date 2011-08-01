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
* @providesModule uki-view-container
* @option preserve-header
*/

var view  = require("../view"),
    utils = require("../utils"),
    fun   = require("../function"),
    dom   = require("../dom"),
    Base  = require("./base").Base;

/**
 * @class
 * @augments Base
 */
var Container = view.newClass('Container', Base, {

    _setup: function(initArgs) {
        // optimize: base's _setup is empty, so do not call it here.
        // Base.prototype._setup.call(this, initArgs);
        this._childViews = [];
    },

    destruct: function() {
        utils.invoke(this.childViews(), 'destruct');
        Base.prototype.destruct.call(this);
    },

    _layout: function() {
        utils.invoke(this.childViews(), 'layout');
        return this;
    },

    /**
     * Sets or retrieves view child view.
     * @param anything build can parse
     *
     * Note: if setting on view with child views, all child view will be removed
     */
    childViews: function(val, destruct/*=true*/) {
        if (val === undefined) return this._childViews;
        utils.forEach(this.childViews(), function(child) {
            this.removeChild(child);
            if (destruct !== false) { child.destruct(); }
        }, this);
        require("../builder").build(val).forEach(function(child) {
            this.appendChild(child);
        }, this);
        return this;
    },

    firstChild: function() {
        return this.childViews()[0];
    },

    lastChild: function() {
        return this.childViews()[this.childViews().length - 1];
    },

    /**
     * Remove particular child
     */
    removeChild: function(child) {
        child.parent(null);

        var index = child._viewIndex,
            i, l;
        for (i = index+1, l = this._childViews.length; i < l; i++) {
            this._childViews[i]._viewIndex--;
        };
        this._childViews = utils.without(this._childViews, child);
        this._removeChildFromDom(child);
        this._childrenChanged();
        return this;
    },

    _removeChildFromDom: function(child) {
        dom.removeElement(child.dom());
    },

    /**
     * Adds a child.
     */
    appendChild: function(child) {
        child._viewIndex = this._childViews.length;
        this._childViews.push(child);
        child.parent(this);
        this._appendChildToDom(child);
        this._childrenChanged();
        return this;
    },

    _appendChildToDom: function(child) {
        this.dom().appendChild(child.dom());
    },

    /**
     * Insert child before target beforeChild
     * @param {Base} child Child to insert
     * @param {Base} beforeChild Existent child before which we should insert
     */
    insertBefore: function(child, beforeChild) {
        var i = beforeChild._viewIndex,
            l = this._childViews.length;

        child._viewIndex = beforeChild._viewIndex;
        for (; i < l; i++) {
            this._childViews[i]._viewIndex++;
        };
        this._childViews.splice(beforeChild._viewIndex-1, 0, child);
        child.parent(this);
        this._insertBeforeInDom(child, beforeChild);
        this._childrenChanged();
        return this;
    },

    _insertBeforeInDom: function(child, beforeChild) {
        this.dom().insertBefore(child.dom(), beforeChild.dom());
    },

    _childrenChanged: function() {
        // nice hook
    },

    /**
     * Should return a dom node for a child.
     * Child should append itself to this dom node
     */
    domForChild: function(child) {
        return this.dom();
    }
});


exports.Container = Container;
