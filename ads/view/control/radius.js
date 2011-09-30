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
    env   = require("../../../uki-core/env"),
    view  = require("../../../uki-core/view"),
    build = require("../../../uki-core/builder").build,

    Checkbox = require("../../../uki-fb/view/checkbox").Checkbox;


var Radius = view.newClass('ads.control.Radius', Checkbox, {

    _createDom: function(initArgs) {
        Checkbox.prototype._createDom.call(this, { tagName: 'span' });

        this._label.appendChild(
            env.doc.createTextNode('Include cities within '));

        this._select = build({ view: 'Select', parent: this, options: [
            { text: 10, value: 10 },
            { text: 25, value: 25 },
            { text: 50, value: 50 }
        ] })[0];

        this._label.appendChild(this._select.dom());
        this._label.appendChild(env.doc.createTextNode(' miles.'));
    },

    selectBinding: fun.newDelegateProp('_select', 'binding')
});


exports.Radius = Radius;
