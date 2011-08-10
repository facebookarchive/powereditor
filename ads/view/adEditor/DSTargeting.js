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

var fun   = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");
var dom   = require("../../../uki-core/dom");
var view  = require("../../../uki-core/view");
var find  = require("../../../uki-core/selector").find;

var HTMLLayout = require("../../../uki-fb/view/HTMLLayout").HTMLLayout;
var Binding    = require("../../../uki-fb/binding").Binding;

var GraphAPIDataSource =
  require("../../lib/typeahead/GraphAPIDataSource").GraphAPIDataSource;
var Base              = require("./base").Base;
var AdEditorConstants = require("./constants");


var DSTargeting = view.newClass('ads.adEditor.DSTargeting', Base, {

    _template: requireText('DSTargeting/DSTargeting.html'),

    _setupBindings: function(m) {
        ['user_clusters', 'user_clusters2', 'user_clusters3',
            'excluded_user_clusters', 'page_types'].forEach(function(prop) {
            this.child(prop).binding({ model: m, modelProp: prop });
        }, this);
    },

    _createDom: function(initArgs) {
        Base.prototype._createDom.call(this, initArgs);
        this.addClass('adEditor-DSTargeting intern');

        function value2info(v) {
            return { id: v.id, text: v.name };
        }

        function info2value(i) {
            return { id: i.id, name: i.text };
        }

        this.content({
            rows: [
                {
                    label: 'User Clusters',
                    data: {
                        view: 'Tokenizer',
                        inline: true,
                        id: 'DSTargeting-clusters',
                        placeholder: 'Enter user clusters',
                        childName: 'user_clusters',
                        value2info: value2info, info2value: info2value,
                        data: (new GraphAPIDataSource())
                          .queryEndpoint('search')
                          .queryData({ type: 'adusercluster' })
                          .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
                    }
                },
                {
                    label: 'User Clusters 2',
                    data: {
                        view: 'Tokenizer',
                        inline: true,
                        id: 'DSTargeting-clusters2',
                        placeholder: 'Enter user clusters',
                        childName: 'user_clusters2',
                        value2info: value2info, info2value: info2value,
                        data: (new GraphAPIDataSource())
                          .queryEndpoint('search')
                          .queryData({ type: 'adusercluster' })
                          .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
                    }
                },
                {
                    label: 'User Clusters 3',
                    data: {
                        view: 'Tokenizer',
                        inline: true,
                        id: 'DSTargeting-clusters3',
                        placeholder: 'Enter user clusters',
                        childName: 'user_clusters3',
                        value2info: value2info, info2value: info2value,
                        data: (new GraphAPIDataSource())
                          .queryEndpoint('search')
                          .queryData({ type: 'adusercluster' })
                          .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
                    }
                },
                {
                    label: 'Excluded User Clusters',
                    data: {
                        view: 'Tokenizer',
                        inline: true,
                        id: 'DSTargeting-ex_clusters3',
                        placeholder: 'Enter user clusters',
                        childName: 'excluded_user_clusters',
                        value2info: value2info, info2value: info2value,
                        data: (new GraphAPIDataSource())
                          .queryEndpoint('search')
                          .queryData({ type: 'adusercluster' })
                          .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
                    }
                },
                {
                    label: 'Page types',
                    data: { view: PageTypes,
                        childName: 'page_types' }
                }
            ]
        });
        this._indexChildViews();
    }
});


var PageTypes = fun.newClass(HTMLLayout, {

    typeName: 'app.adEditor.PageTypes',

    _template: requireText('DSTargeting/pageTypes.html'),

    _createDom: function(initArgs) {

        HTMLLayout.prototype._createDom.call(this, initArgs);

        this.content({
            rows: [
                { items: [
                    { view: 'Checkbox', text: 'canvas',
                      value: 'canvas' },
                    { view: 'Checkbox', text: 'profile.php',
                      value: 'profile' },
                    { view: 'Checkbox', text: 's.php',
                      value: 'search' },
                    { view: 'Checkbox', text: 'event.php',
                      value: 'event' }
                ]},
                { items: [
                    { view: 'Checkbox', text: 'group.php', value: 'group' },
                    { view: 'Checkbox', text: 'photo.php', value: 'photo' },
                    { view: 'Checkbox', text: 'home.php', value: 'home' },
                    { view: 'Checkbox', text: 'other', value: 'other' }
                ]}
            ]
        });
    },

    value: function(v) {
        if (v === undefined) {
            return utils.pluck(find('[checked]', this), 'value');
        }
        if (v) {
            find('[checked]', this).prop('checked', false);
            v.forEach(function(value) {
                find('[value=' + value + ']', this).prop('checked', true);
            }, this);
        }
        return this;
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
    })
});


exports.DSTargeting = DSTargeting;
