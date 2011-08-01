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
    view  = require("../../../uki-core/view"),
    utils = require("../../../uki-core/utils"),
    dom   = require("../../../uki-core/dom"),
    build = require("../../../uki-core/builder").build,

    Container = require("../../../uki-core/view/container").Container,

    Binding = require("../../../uki-fb/binding").Binding;


var YEAR_RANGE = 4;

var GraduationYears = view.newClass('ads.control.GraduationYears', Container, {

    _createDom: function(initArgs) {
        var options = [{ text: 'Any', value: 0 }],
            d = new Date();
        for (var i = 0; i < YEAR_RANGE; i++) {
            var y = d.getFullYear() + i;
            options.push({ text: y, value: y });
        }
        Container.prototype._createDom.call(this, initArgs);
        this.dom().appendChild(
            dom.createElement('div', { html: 'Graduation years:' }));
        this._min = build({ view: 'Select', options: options })
            .appendTo(this)[0];
        this.dom().appendChild(
            dom.createElement('span', { html: ' &mdash; ' }));
        this._max = build({ view: 'Select', options: options })
            .appendTo(this)[0];

        this._min.on('change', fun.bindOnce(this._updateMax, this));
        this._max.on('change', fun.bindOnce(this._updateMin, this));
    },

    min: fun.newDelegateProp('_min', 'value'),

    max: fun.newDelegateProp('_max', 'value'),

    binding: fun.newProp('binding', function(val) {
        if (this._binding) { this._binding.destruct(); }
        this._binding = new Binding(utils.extend({
            view: this,
            model: val.model,
            viewEvent: 'change',
            commitChangesViewEvent: 'change'
        }, val));
    }),

    value: function(v) {
        if (v === undefined) {
            var max = this.max() * 1;
            if (!max) { return ''; }
            for (var i = this.min() * 1, res = []; i <= this.max() * 1; i++) {
                res.push(i);
            }
            return res;
        }
        this.min(v[0] || 0);
        this.max(v[v.length - 1] || 0);
        return this;
    },

    _updateMin: function() {
        var max = this.max() * 1,
            min = this.min() * 1;
        if (!max || !min || max < min) {
            this.min(this.max());
        }
    },

    _updateMax: function() {
        var max = this.max() * 1,
            min = this.min() * 1;
        if (!min || max < min) {
            this.max(this.min());
        }
    }
});


exports.GraduationYears = GraduationYears;

