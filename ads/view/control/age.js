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
*/

var fun   = require("../../../uki-core/function"),
    utils = require("../../../uki-core/utils"),
    dom   = require("../../../uki-core/dom"),
    view  = require("../../../uki-core/view"),
    build = require("../../../uki-core/builder").build,

    Container = require("../../../uki-core/view/container").Container;


var Age = view.newClass('ads.control.Age', Container, {

    _createDom: function(initArgs) {
        var options = [{ text: 'Any', value: 0 }];
        for (var i = 13; i < 65; i++) {
            options.push({ text: i, value: i });
        }
        Container.prototype._createDom.call(this, initArgs);
        this._minView =
            build({ view: 'Select', options: options }).appendTo(this)[0];
        this.dom().appendChild(
            dom.createElement('span', { html: ' &mdash; ' }));
        this._maxView =
            build({ view: 'Select', options: options }).appendTo(this)[0];

        this._minView.on('change', fun.bindOnce(this._updateMax, this));
        this._maxView.on('change', fun.bindOnce(this._updateMin, this));
    },

    min: fun.newDelegateProp('_minView', 'value'),

    max: fun.newDelegateProp('_maxView', 'value'),

    binding: function(val) {
        if (val === undefined) { return this._minView.binding(); }

        var bindingMin = utils.extend({}, val || {}),
            bindingMax = utils.extend({}, val || {});

        bindingMin.modelProp = val.modelPrefix + 'min';
        bindingMax.modelProp = val.modelPrefix + 'max';

        this._minView.binding(bindingMin);
        this._maxView.binding(bindingMax);
        return this;
    },

    _updateMin: function() {
        if (this.min() * 1 && this.max() * 1 &&
            this.max() * 1 < this.min() * 1) {
            this.min(this.max());
            if (this._minView.binding()) {
                this._minView.binding().updateModel();
            }
        }
    },

    _updateMax: function() {
        if (this.min() * 1 && this.max() * 1 &&
            this.max() * 1 < this.min() * 1) {
            this.max(this.min());
            if (this._maxView.binding()) {
                this._maxView.binding().updateModel();
            }
        }
    }

});


exports.Age = Age;
