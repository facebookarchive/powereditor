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
requireCss("./eduWork/eduWork.css");

var fun  = require("../../../uki-core/function");
var env  = require("../../../uki-core/env");
var view = require("../../../uki-core/view");
var find = require("../../../uki-core/selector").find;

var controls = require("../controls");
var Binding = require("../../../uki-fb/binding").Binding;

var GraphAPIDataSource =
  require("../../lib/typeahead/GraphAPIDataSource").GraphAPIDataSource;

var Base              = require("./base").Base;
var AdEditorConstants = require("./constants");


var EduWork = view.newClass('ads.adEditor.EduWork', Base, {

  _template: requireText('eduWork/eduWork.html'),

  _setupBindings: function(m) {
    this.child('workplaces').binding({ model: m, modelProp: 'work_networks' });
    this.child('colleges').binding({ model: m, modelProp: 'college_networks' });
    this.child('college_majors')
      .binding({ model: m, modelProp: 'college_majors' });
    this.child('college_years')
      .binding({ model: m, modelProp: 'college_years' });

    if (this._binding) { this._binding.destruct(); }
    this._binding = new Binding({
      view: this,
      model: m,
      viewProp: 'education_status',
      viewEvent: 'change',
      commitChangesViewEvent: 'change',
      modelProp: 'education_status',
      modelEvent: 'change.education_statuses'
    });
  },

  education_status: function(v) {
    if (v === undefined) {
      return find('Radio[checked]', this).prop('value');
    }
    find('Radio[value=' + v + ']', this).prop('checked', true);
    return this;
  },

  _lockedModelChange: function(e) {
    if (!e || e.name === 'education_statuses') {
      var status = this.model().education_status();
      this.child('college_select').visible(status == 2 || status == 3);
      this.child('college_years').visible(status == 2);
    }
  },

  _createDom: function(initArgs) {
    Base.prototype._createDom.call(this, initArgs);
    this.addClass('adEditor-eduWork');
    var name = 'tmp_' + env.guid++;

    this.content({
      education_label: 'Education',
      all:     { view: 'Radio', name: name, text: 'All', value: 0 },
      alumni:  { view: 'Radio', name: name, text: 'College Grad', value: 3 },
      college: { view: 'Radio', name: name, text: 'In College', value: 2 },
      hs:      { view: 'Radio', name: name, text: 'In High School', value: 1 },

      college_select:
        { view: 'List', horizontal: false,
          childName: 'college_select',
          childViews: [
            { view: 'Tokenizer', inline: true, id: 'eduWork-college',
              placeholder: 'Enter a college', childName: 'colleges',
              addClass: 'education-tokenizer',
              value2info: function(v) { return { id: v.id, text: v.name }; },
              info2value: function(i) { return { id: i.id, name: i.text }; },
              data: (new GraphAPIDataSource())
                .queryData({ type: 'adcollege' })
                .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)},
            { view: 'Tokenizer', inline: true, id: 'eduWork-college_major',
              placeholder: 'Enter a major', childName: 'college_majors',
              addClass: 'education-tokenizer',
              value2info: function(v) { return { id: v, text: v }; },
              info2value: function(i) { return i.text; },
              data: (new GraphAPIDataSource())
                .queryData({ type: 'adcollegemajor' })
                .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)},
            { view: controls.GraduationYears, childName: 'college_years' }
      ]},

      workplace_label: 'Workplaces',

      workplace:
        { view: 'Tokenizer', inline: true,
          id: 'eduWork-workplaces', addClass: 'textField',
          placeholder: 'Enter a company, organization or other workplace',
          childName: 'workplaces',
          value2info: function(v) { return { id: v.id, text: v.name }; },
          info2value: function(i) { return { id: i.id, name: i.text }; },
          data: (new GraphAPIDataSource())
            .queryData({ type: 'adworkplace' })
            .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT) }
    });

    this._indexChildViews();
  }
});


exports.EduWork = EduWork;
