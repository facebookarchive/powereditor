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
var utils = require("../../../uki-core/utils");
var dom = require("../../../uki-core/dom");
var find  = require("../../../uki-core/selector").find;

var LocalDataSource =
  require("../../lib/typeahead/LocalDataSource").LocalDataSource;
var ConnectedObject = require("../../model/connectedObject").ConnectedObject;
var Base            = require("./base").Base;
var AdEditorConstants = require("./constants");

var HTMLLayout = require("../../../uki-fb/view/HTMLLayout").HTMLLayout;
var Binding    = require("../../../uki-fb/binding").Binding;
var GraphAPIDataSource =
  require("../../lib/typeahead/GraphAPIDataSource").GraphAPIDataSource;

var Connections = view.newClass('ads.adEditor.Connections', Base, {

    _template: requireText('connections/connections.html'),

    _prepare: function(callback) {
      ConnectedObject.prepare(callback);
    },

    _setupBindings: function(m) {
      ['user_adclusters', 'excluded_user_adclusters',
        'page_types'].forEach(function(name) {
        dom.toggleClass(
          this._row(this.child(name).dom()),
          'hidden',
          !this.model().isCorporate());
      }, this);

      ['connections', 'excluded_connections',
        'friends_of_connections'].forEach(function(prop) {
        this.child(prop).binding({ model: m, modelProp: prop });
      }, this);

      if (this.model().isCorporate()) {
        ['user_adclusters', 'excluded_user_adclusters',
          'page_types'].forEach(function(prop) {
          this.child(prop).binding({ model: m, modelProp: prop });
        }, this);
      }
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
          },
          {
            className: 'intern',
            label: 'AdClusters',
            data: {
              view: 'Tokenizer',
              inline: true,
              addClass: 'textField',
              id: 'DSTargeting-clusters',
              placeholder: 'Enter a user AdClusters',
              childName: 'user_adclusters',
              value2info: value2info, info2value: info2value,
              data: (new GraphAPIDataSource())
                .queryData({ type: 'adusercluster' })
                .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
            }
          },
          {
            className: 'intern',
            label: 'Excluded AdClusters',
            data: {
                view: 'Tokenizer',
                inline: true,
                addClass: 'textField',
                id: 'DSTargeting-ex_clusters3',
                placeholder: 'Enter an AdClusters to exclude',
                childName: 'excluded_user_adclusters',
                value2info: value2info, info2value: info2value,
                data: (new GraphAPIDataSource())
                  .queryData({ type: 'adusercluster' })
                  .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
            }
          },
          {
            className: 'intern',
            label: 'Page types',
            addClass: 'textField',
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

  _template: requireText('connections/pageTypes.html'),

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
        modelProp: 'page_types',
        modelEvent: 'change.page_types',
        commitChangesViewEvent: 'change'
      }, val));
  })
});

exports.Connections = Connections;

