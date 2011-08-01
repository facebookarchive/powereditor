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
    find  = require("../../../uki-core/selector").find,

    List = require("../../../uki-fb/view/list").List,

    Binding = require("../../../uki-fb/binding").Binding;


var RadioGroup = view.newClass('ads.control.RadioGroup', List, {

    _createDom: function(initArgs) {
        List.prototype._createDom.call(this, initArgs);
    },

    binding: fun.newProp('binding', function(val) {
        if (this._binding) {
            this._binding.destruct();
        }
        this._binding = val && new Binding(
            utils.extend({
                view: this,
                model: val.model,
                viewEvent: 'change',
                commitChangesViewEvent: 'change'
            }, val));
    }),

    name: function(v) {
        if (v === undefined) {
            return this._childViews[0].name();
        }

        // wrap views in collection
        build(this.childViews()).prop('name', v);
        return this;
    },

    value: function(v) {
        if (v === undefined) {
            return find('[checked]', this).prop('value');
        }
        find('[value=' + v + ']', this).prop('checked', true);
        return this;
    }
});


exports.RadioGroup = RadioGroup;
