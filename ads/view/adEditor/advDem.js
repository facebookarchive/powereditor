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

var controls = require("../controls");

var LocalDataSource =
  require("../../lib/typeahead/LocalDataSource").LocalDataSource;

var Base       = require("./base").Base;
var AdEditorConstants = require("./constants");


var AdvDem = view.newClass('ads.adEditor.AdvDem', Base, {

  _template: requireText('advDem/advDem.html'),

  _setupBindings: function(m) {
    this.child('interested_in').binding({
      model: m,
      modelProp: 'interested_in_sex',
      modelEvent: 'change.interested_in'
    });
    if (!m.relationship_statuses()) { m.relationship_statuses([0]); }
    this.child('langs').binding({
      model: m,
      modelProp: 'locales'
    });
    this.child('relationship').binding({
      model: m,
      modelProp: 'relationship_statuses'
    });
    this.child('target_on_birthday').binding({
      model: m,
      modelProp: 'target_on_birthday',
      modelEvent: 'change.user_event'
    });
  },

  _createDom: function(initArgs) {
    Base.prototype._createDom.call(this, initArgs);
    this.addClass('adEditor-advDem');

    this.content({
      birthday_label: 'Birthday',
      birthday:
        { view: 'Checkbox', text: 'Target people on their birthdays',
          childName: 'target_on_birthday' },

      interested_label: 'Interested In',
      interested:
        { view: controls.Sex, childName: 'interested_in',
          name: 'interested_in' },

      relationship_label: 'Relationship',
      relationship:
        { view: controls.Relationship, childName: 'relationship' },

      langs_label: 'Languages',
      langs:
        { view: 'Tokenizer', inline: true,
          id: 'langs', addClass: 'textField',
          placeholder: 'Enter language',
          childName: 'langs',
          info2value: function(info) { return info.id; },
          value2info: function(id) {
            var text = require("../../lib/locales").locales[id];
            return { id: id, text: text };
          },
          data: (new LocalDataSource())
            .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
            .queryEndpoint({ search: require("../../lib/completions").searchLocales })
      }
    });
    this._indexChildViews();
  }
});


exports.AdvDem = AdvDem;
