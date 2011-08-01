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
requireCss("./relationship/relationship.css");

var fun   = require("../../../uki-core/function"),
    view  = require("../../../uki-core/view"),
    build = require("../../../uki-core/builder").build,
    find  = require("../../../uki-core/selector").find,
    utils = require("../../../uki-core/utils"),

    HTMLLayout = require("../../../uki-fb/view/HTMLLayout").HTMLLayout,
    Binding    = require("../../../uki-fb/binding").Binding;


var ALL = 0,
    SINGLE = 1,
    IN_RELATIONSHIP = 2,
    MARRIED = 3,
    ENGAGED = 4;

var Relationship = view.newClass('ads.control.Relationship', HTMLLayout, {

    _template: requireText('relationship/relationship.html'),

    binding: fun.newProp('binding', function(val) {
        if (this._binding) {
            this._binding.destruct();
        }
        this._binding = val && new Binding(
            utils.extend({
                view: this,
                model: val.model,
                viewEvent: 'change.relationship',
                commitChangesViewEvent: 'change.relationship'
            }, val));
    }),

    value: function(v) {
        if (v === undefined) {
            return find('[checked]', this).map(function(item) {
                return item.value();
            });
        }
        this.childViews().forEach(function(item) {
            item.checked(v.indexOf(item.value() * 1) > -1);
        }, this);
        return this;
    },

    _createDom: function(initArgs) {
        HTMLLayout.prototype._createDom.call(this, initArgs);
        this.content({
            all: { view: 'Checkbox', text: 'All', value: ALL },
            single: { view: 'Checkbox', text: 'Single', value: SINGLE },
            engaged: { view: 'Checkbox', text: 'Engaged', value: ENGAGED },
            in_relationship: { view: 'Checkbox', text: 'In a Relationship',
                value: IN_RELATIONSHIP },
            married: { view: 'Checkbox', text: 'Married', value: MARRIED }
        });

        this.addListener('click', this._click);
    },

    _click: function(e) {
        if (e.target.tagName !== 'INPUT') { return; }
        var view = e.targetView();
        if (!view) { return; }
        if (view.value() == ALL) {
            if (!view.checked()) {
                e.preventDefault();
            } else {
                find('*:gt(0)', this).prop('checked', false);
                this.trigger({ type: 'change.relationship' });
            }
        } else {
            this.content().all.checked(false);
            this.trigger({ type: 'change.relationship' });
        }
    }
});



exports.Relationship = Relationship;
