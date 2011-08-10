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

var fun = require("../../../uki-core/function");
var view = require("../../../uki-core/view");

var LocalDataSource =
  require("../../lib/typeahead/LocalDataSource").LocalDataSource;
var ConnectedObject = require("../../model/connectedObject").ConnectedObject;
var Base            = require("./base").Base;
var AdEditorConstants = require("./constants");

var Connections = view.newClass('ads.adEditor.Connections', Base, {

    _template: requireText('connections/connections.html'),

    _prepare: function(callback) {
        ConnectedObject.prepare(callback);
    },

    _setupBindings: function(m) {
        ['connections', 'excluded_connections',
            'friends_of_connections'].forEach(function(prop) {
            this.child(prop).binding({ model: m, modelProp: prop });
        }, this);
    },

    _createDom: function(initArgs) {
        Base.prototype._createDom.call(this, initArgs);
        this.addClass('adEditor-connections');

        function value2info(v) {
            return { id: v.id, text: v.name };
        }
        function info2value(i) {
            return { id: i.id, name: i.text };
        }

        var placeholder = 'Enter your Page, Event, Group, App, or Reviews';

        this.content({
            rows: [
                {
                    label: 'Connections',
                    data: {
                        view: 'Tokenizer',
                        inline: true,
                        id: 'connections',
                        addClass: 'textField',
                        placeholder: placeholder,
                        childName: 'connections',
                        value2info: value2info, info2value: info2value,
                        data: (new LocalDataSource())
                            .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
                            .queryEndpoint(ConnectedObject)
                    },
                    extra: 'Target users who are connected to:'
                },
                {
                    data: {
                        view: 'Tokenizer',
                        inline: true,
                        id: 'excluded_connections',
                        addClass: 'textField',
                        placeholder: placeholder,
                        childName: 'excluded_connections',
                        value2info: value2info, info2value: info2value,
                        data: (new LocalDataSource())
                            .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
                            .queryEndpoint(ConnectedObject)
                    },
                    extra: 'Target users who are not already connected to:'
                },
                {
                    label: 'Friends of connections',
                    data: {
                        view: 'Tokenizer',
                        inline: true,
                        id: 'friends_of_connections',
                        addClass: 'textField',
                        placeholder: placeholder,
                        childName: 'friends_of_connections',
                        value2info: value2info, info2value: info2value,
                        data: (new LocalDataSource())
                            .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
                            .queryEndpoint(ConnectedObject)
                    },
                    extra: 'Target users whose friends are connected to:'
                }
            ]
        });
        this._indexChildViews();
    }
});


exports.Connections = Connections;

