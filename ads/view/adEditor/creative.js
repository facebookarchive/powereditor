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

    creativeSpecs = require("./creative/creativeTypeSpecs"),
    creativeMap = require("../../lib/creativeMap"),
    connectObj = require("../../model/connectedObject"),
    creativeType = require("../../lib/adCreativeType"),
    urlToObjectIDSearcher = require("../../lib/fetcher").urlToObjectIDSearcher,
    objectFetcher = require("../../lib/fetcher").objectFetcher,
    controls = require("../controls"),
    ConnectedObjectDialog =
      require("../connectedObjectDialog").ConnectedObjectDialog,
    Base = require("./base").Base;

var MAX_TITLE_LENGTH = require("../../model/ad/constants").MAX_TITLE_LENGTH;
var MAX_BODY_LENGTH = require("../../model/ad/constants").MAX_BODY_LENGTH;

var ANCHOR_TYPE_OTHERS = 'Others';

var LAYOUT = {
  WEBSITE: 0,
  FBADS: 1,
  FBADS_NO_OBJECT: 2,
  BASS: 3,
  BASS_NO_OBJECT: 4
};

var Creative = view.newClass('ads.adEditor.Creative', Base, {

  _template: requireText('creative/creative.html'),

  category: fun.newProp('category'),

  _setupBindings: function(m) {
    this.child('link_url').binding({ model: m, modelProp: 'link_url' });
    this.child('tab').binding({ model: m, modelProp: 'link_url' });
    this.child('facebook').binding({ model: m, modelProp: 'object_id' });

    this.child('name').binding({
      model: m,
      modelProp: 'name',
      viewEvent: 'keyup change blur paste'
    });
    this.child('title').binding({
      model: m,
      modelProp: 'title',
      viewEvent: 'keyup change blur paste'
    });
    this.child('body').binding({
      model: m,
      modelProp: 'body',
      viewEvent: 'keyup change blur paste'
    });
    this.child('related_fan_page_wanted').binding({
      model: m,
      modelProp: 'related_fan_page_wanted',
      modelEvent: 'change.related_fan_page_wanted',
      viewEvent: 'change'
    });
    this.child('image').binding({ model: m });
    this.child('story_type').binding({
      model: m,
      modelProp: 'type'
    });
    if (this.child('url_tags')) {
      this.child('url_tags')
        .binding({ model: m, modelProp: 'url_tags' });
    }


    
  },

  _prepare: function(callback) {
    var ConnectedObject = connectObj.ConnectedObject;
    ConnectedObject.prepare(fun.bind(function(objects) {

      var groups = {}, options = [];
      ConnectedObject.cachedObjects().forEach(function(o) {
        if (!groups[o.type()]) {
          groups[o.type()] = { text: o.typeName(), options: [] };
        }
        groups[o.type()].options.push({
          value: o.id(),
          text: o.name()
        });
      });
      utils.forEach(groups, function(o) {
        options.push(o);
      });

      if (this.model().object_id() && !this.model().object()) {
        if (this.model().object_id() != ANCHOR_TYPE_OTHERS) {
          options.unshift({ text: 'Unknown', options: [{
            value: this.model().object_id(),
            text: this.model().object_id()
          }] });
        }
      }

      // this is for DSO to get the extra_fbids.
      if (this.model().isCorporate()) {
        options.push({ text: 'More', options: [{
          value: ANCHOR_TYPE_OTHERS,
          text: 'Other destinations'
        }] });
      }

      var category =
        creativeType.getCategoryByCreativeType(this.model().type());
      this.category(category);

      this.child('facebook').options(options);
      if (this.model().object()) {
        // build the creative selector
        var anchorType = this.model().object().type();
        this._updateCreativeOption(anchorType);
        this._onCreativeTypeChange();
      } else if (this.model().object_id() && this.model().type()) {
        this._displayByCreativeType(this.model().type());
      } else {
        this._displayByCreativeType(null);
      }

      

      callback();
    }, this));
  },

  

  _createDom: function(initArgs) {
    Base.prototype._createDom.call(this, initArgs);
    this.addClass('adEditor-creative');

    this.content({
      rows: [
        {
          className: 'creative-name',
          label: 'Ad Name',
          data: {
            view: 'TextInput',
            id: 'creative-name',
            addClass: 'select_wide',
            tabIndex: '1',
            childName: 'name'
          }
        },
        {
          className: 'creative-toggle',
          label: '',
          data: {
            view: 'Base',
            init: { tagName: 'a' },
            addClass: 'mts creative-toggle-a',
            id: 'creative-toggle',
            text: '', childName: 'toggle'
          }
        },
        {
          className: 'creative-facebook',
          data: {
              view: controls.RadioGroup,
              horizontal: true,
              childViews: [
                  { view: 'Radio', name: 'category',
                    text: 'Facebook Ads',
                    value: creativeType.AD_CREATIVE_CATEGORY.FACEBOOK_ADS },
                  { view: 'Radio', name: 'category',
                    text: 'Sponsored Stories',
                    value:
                      creativeType.AD_CREATIVE_CATEGORY.SPONSORED_STORIES,
                    disabled: false }
              ],
              childName: 'category'
          }
        },
        {
          className: 'creative-facebook hidden_elem',
          label: 'Destination',
          data: {
            view: 'Select',
            id: 'creative-facebook',
            addClass: 'select_wide',
            options: [{ text: 'Loading\u2026' }],
            tabIndex: '1',
            childName: 'facebook'
          }
        },
        {
          className: 'creative-facebook hidden_elem',
          label: 'Story Type',
          data: {
            view: 'Select',
            id: 'creative-story_type',
            addClass: 'select_wide',
            options: [{ text: 'Loading\u2026' }],
            tabIndex: '1',
            childName: 'story_type'
          }
        },
        {
          className: 'creative-external',
          label: 'Destination URL',
          data: {
            view: 'TextInput',
            id: 'creative-link_url',
            tabIndex: '1',
            addClass: 'textField',
            childName: 'link_url'
          },
          optional: 'Example: http://www.yourwebsite.com/'
        },
        {
          className: 'creative-tab',
          label: 'Destination Tab',
          data: {
            view: 'Select',
            id: 'creative-tab',
            addClass: 'select_wide',
            options: [{ text: 'Default' }],
            tabIndex: 1,
            childName: 'tab'
          }
        },
        {
          label: 'Title',
          data: {
            view: 'TextInput',
            id: 'creative-title',
            tabIndex: '1',
            addClass: 'textField',
            childName: 'title'
          },
          optional: { view: 'Text', childName: 'title_count' }
        },
        {
          label: 'Body',
          data: {
            view: 'TextArea',
            id: 'creative-body',
            tabIndex: '1',
            addClass: 'textField',
            childName: 'body',
            rows: 3
          },
          optional: { view: 'Text', childName: 'body_count' }
        },
        {
          label: 'Image',
          data: {
            view: 'ImageSelector',
            tabIndex: '1',
            childName: 'image'
          },
          data__view: { id: 'creative-image' }
        },
        {
          label: 'Related Page',
          data: {
            view: 'Container',
            id: 'creative-related_fan_page',
            childViews: [
              { view: 'Checkbox',
                text: 'Show stories about people interacting with this Page ' +
                  'with my ad: ',
                value: '1',
                tabIndex: '1',
                childName: 'related_fan_page_wanted' },
              { view: 'Base',
                init: { tagName: 'a' },
                text: '',
                childName: 'related_fan_page_info' }
            ],
            childName: 'related_fan_page'
          }
        }
      ]
    });

    this._indexChildViews();
    this.child('toggle').addListener('click', fun.bindOnce(function() {
      if (this.model().object_id()) {
        this.model().object_id('');
      } else {
        this.model().object_id(
          this.child('facebook').options()[0].options[0].value);
      }

      dom.toggleClass(
        this._row(this.child('category').dom()),
        'hidden_elem',
        !this.model().object_id());

      this.model().commitChanges('object_id');
    }, this));


    
    this.child('category').addListener('change',
      fun.bindOnce(this._onCategoryTypeChange, this));

    // change the anchor type
    this.child('facebook').addListener('change',
      fun.bindOnce(function(e) {
        var obj_id = this.child('facebook').value();
        if (obj_id === 'Others') {
          // reset object_id to first valid while download happpens
          var download_obj_id =
            this.child('facebook').options()[0].options[0].value;
          this.child('facebook').value(download_obj_id);
          var dialog = new ConnectedObjectDialog();
          dialog.preset(download_obj_id);
          dialog.visible(true);
        } else {
          this._onAnchorTypeChange();
        }
      }, this));

    // change the creative type
    this.child('story_type').addListener('change',
      fun.bindOnce(this._onCreativeTypeChange, this));

    this.child('link_url').addListener('change',
      fun.bindOnce(this._updateRelatedFanPage, this));
  },

  _onCategoryTypeChange: function() {
    var category = this.child('category').value();

    this.category(category);
    var obj_id = this.child('facebook').value();

    var obj = connectObj.ConnectedObject.byId(obj_id);

    // build the creative selector
    var anchorType = obj && obj.type();
    this._updateCreativeOption(anchorType);

    
    this._onCreativeTypeChange();

    this.model().type(this.child('story_type').value());
    this.model().commitChanges('type');
  },

  _onAnchorTypeChange: function() {
    var obj_id = this.child('facebook').value();
    var obj = connectObj.ConnectedObject.byId(obj_id);
    if (obj) {
      // build the creative selector
      var anchorType = obj.type();
      this._updateCreativeOption(anchorType);
    }
  },

  _onCreativeTypeChange: function() {
    var type = this.child('story_type').value();
    this._displayByCreativeType(type);
  },

  _lockedModelChange: function(e) {
    this._updateOnClickToggle(e);
    this._validateInput(e);
  },

  _updateCreativeOption: function(anchor) {
    anchor = anchor || connectObj.OBJECT_TYPE.PAGE;
    var is_premium = this.model().is_from_premium_line();
    var is_corp = this.model().isCorporate();

    var is_bass =
      this.category() == creativeType.AD_CREATIVE_CATEGORY.SPONSORED_STORIES;

    var types = anchor &&
      creativeMap.getTypesByAnchor(anchor, is_bass, is_premium);

    // get the premium/standard default type.
    var default_type = anchor &&
      creativeType.getDefaultCreativeTypeByAnchor(
        anchor, is_bass, is_premium);

    var groups = {}, options = [];
    if (!types && !default_type) {
      // we do not know anything about this creative type
      var INVALID_TYPE = creativeType.AD_CREATIVE_TYPE.EXOTIC_OR_INVALID;
      options.push({
        value: INVALID_TYPE,
        text: creativeType.AD_CREATIVE_TYPE_MAP[INVALID_TYPE]
      });

      this.child('story_type').options(options);
      return;
    }

    if (!types) {
      var txt =
        creativeType.AD_CREATIVE_TYPE_MAP[default_type];

      options.push({
        value: default_type,
        text: txt
      });
    } else {
      types.forEach(function(type) {
        options.push({
          value: type,
          text: creativeType.AD_CREATIVE_TYPE_MAP[type]
        });
      });
    }

    this.child('story_type').options(options);
    this.child('story_type').value(this.model().type());
  },

  _updateRelatedFanPage: function() {
    var model = this.model();
    if (!model || !model.isRelatedFanPageSupported()) {
      return;
    }
    fun.defer(fun.bind(function() {
      if ((!model.isNew || !model.isNew()) &&
          model.isChanged && !model.isChanged('link_url') &&
          !model.isChanged('related_fan_page') &&
          model.related_fan_page()) {
        // skip search, update display
        this._updateRelatedFanPageInfo();
      } else {
        urlToObjectIDSearcher.fetch(
          this.model().link_url(),
          fun.bind(this._relatedFanPageCallback, this)
        );
      }
    }, this));
  },

  _relatedFanPageCallback: function(data) {
    if (!this.model()) { return; }
    // not use passed-in data but get result by fromCache, in case model changed
    var link_url = this.model().link_url();
    var result = urlToObjectIDSearcher.fromCache(link_url);
    var object_id = (result && result.id) || 0;
    // note: Not write back to related_fan_page_id when link_url is empty and
    // it is in group mode. It typically happens when one select multiple ads
    // of different link_url. Undefined isChanged is an indicator of group mode.
    if (link_url || this.model().isChanged !== undefined) {
      this.model().related_fan_page_id(object_id);
    }
    this._updateRelatedFanPageInfo();
  },

  _updateRelatedFanPageInfo: function(data) {
    if (!this.model()) { return; }
    var object_id = this.model().related_fan_page_id();
    if (!object_id) {
      this.child('related_fan_page_info').text('(No Page)');
      this.child('related_fan_page_info').dom().href = '#';
      return;
    }
    var object = objectFetcher.fromCache(object_id);
    var name = object_id;
    var link = 'http://www.facebook.com/profile.php?id=' + object_id;
    if (object) {
      name = object.name || name;
      link = object.link || link;
    }
    this.child('related_fan_page_info').text(name);
    this.child('related_fan_page_info').dom().href = link;
    if (!object) {
      objectFetcher.fetch(
        object_id, this._updateRelatedFanPageInfo.bind(this));
    }
  },

  _displayByCreativeType: function(type) {
    var displayMap = null;

    if (!type) {
      displayMap =
        creativeSpecs.getDefaultCreativeDisplayMap(
          this.model().is_from_premium_line()
        );
    } else {
      displayMap =
        creativeSpecs.getCreativeDisplayMapByType(
            type, this.model().is_from_premium_line()
        );
    }

    // show/hide the fields based on the map
    for (var key in displayMap) {
      this._toggleRow(key, !displayMap[key]);
    };

    // SPECIAL-case hide title, link_url and image deliberately when
    // we are dealing with objects.
    this._toggleRow('title', this.model().object_id());
    this._toggleRow('link_url', type != creativeType.AD_CREATIVE_TYPE.STANARD);
    this._toggleRow('image',
      type == creativeType.AD_CREATIVE_TYPE.PAGE_POSTS_V2 ||
      this.category() == creativeType.AD_CREATIVE_CATEGORY.SPONSORED_STORIES);
    // Special case the template queries, because they're handled
    // differently.
    if (this.model().query_type) {
      this._syncQueryRows(displayMap.query_type);
    }
  },

  _updateLayout: function(type) {
    var OBJECT_TYPE = connectObj.OBJECT_TYPE;
    // default to website creative layout
    var obj = this.model().object();
    var object_type = obj && obj.type();

    type = type || LAYOUT.WEBSITE;

    // build the creative (premium/bass) selector
    if (type != LAYOUT.WEBSITE) {
      this._updateCreativeOption(object_type);
    } else if (!object_type) {
      var options = [];
      options.push({
        value: creativeType.AD_CREATIVE_TYPE.STANDARD,
        text: ''
      });

      this.child('story_type').options(options);
      this.child('story_type').value(this.model().type());
    }

    this._onCreativeTypeChange();

    

    // toggle destination selector
    this._toggleRow('facebook',
      type == LAYOUT.WEBSITE);

    this._toggleRow('story_type',
      (type == LAYOUT.BASS_NO_OBJECT ||
       type == LAYOUT.FBADS_NO_OBJECT ||
       type == LAYOUT.WEBSITE)
    );

    this._toggleRow('category',
      type == LAYOUT.WEBSITE);

    this._updateRelatedFanPage();

    if (type != LAYOUT.WEBSITE) {
      this.child('category').value(this.category());
    }

    this.child('toggle').text(
      (type != LAYOUT.WEBSITE) ?
      'I want to advertise a web page.' :
      'I want to advertise something I have on Facebook.'
    );

    var enableTitle = false;
    var enableURL = false;
    var enableTab = false;

    var is_pinned_post = (this.model().type() ==
      creativeType.AD_CREATIVE_TYPE.PAGE_POSTS_V2);

    enableTitle = (type == LAYOUT.WEBSITE);
    // Apps and Pinnedpost are special on PE: Advertisers can supply custom URL
    enableURL = !is_pinned_post &&
                (type == LAYOUT.FBADS_NO_OBJECT ||
                 type == LAYOUT.WEBSITE ||
                 object_type == OBJECT_TYPE.APP);

    enableTab = !is_pinned_post &&
                (type != LAYOUT.BASS_NO_OBJECT &&
                 type != LAYOUT.BASS &&
                 obj && (utils.keys(obj.tabs()).length > 0));

    this._toggleRow('title', !enableTitle);
    this._toggleRow('link_url', !enableURL);
    this._toggleRow('tab', !enableTab);

    // prefill tab select with given tabs
    if (enableTab) {
      var value = this.model().link_url();
      this.child('tab').options(obj.tabList()).value(value);
    }

    return {
      'enableTitle' : enableTitle,
      'enableURL'   : enableURL,
      'enableTab'   : enableTab
    };
  },

  _updateOnClickToggle: function(e) {
    // update ui depending on object_id
    if (!e || e.name === 'object_id') {
      var model = this.model();
      var object_id = model.object_id();
      var obj = model.object();

      var flags =
        this._updateLayout(this._getLayoutType(obj, object_id));

      // Deduce object type and url based on selected options.
      // TODO: voloko Changing type and title from here seems wrong.
      // It was here historicaly. However it's definetely causing troubles
      // with group operations
      if (e) { // skip init, change only on events
        var ori_type = model.original().type;
        var ori_obj_id = model.original().object_id;

        if (obj) {
          if (ori_type != 1 &&
            ori_obj_id == model.object_id()) {

            // reset type to where it was
            model.revertProp('title');
            model.revertProp('type');
            model.revertProp('link_url');
            model.related_fan_page_wanted(0);
            return;
          }

          var is_premium = model.is_from_premium_line();
          var is_bass = (this.category() ==
            creativeType.AD_CREATIVE_CATEGORY.SPONSORED_STORIES);

          model.type(this.child('story_type').value() ||
            obj.defaultCreativeType(is_bass, is_premium));
          model.title(obj.name() || '');

          // Set default URL if the prefix is invalid (object URL not substring
          // of the model URL) or if we're not exposing the field
          if (!flags.enableURL || model.link_url().indexOf(obj.url()) !== 0) {
            model.link_url(obj.url());
          }

          model.related_fan_page_wanted(0);
        } else {
          if (!model.object_id()) {
            model.type(creativeType.AD_CREATIVE_TYPE.STANDARD);
          }
          // reset type to where it was
          model.revertProp('title');
          model.revertProp('link_url');
          model.revertProp('related_fan_page');
          this._updateRelatedFanPage();
        }
      }
    }
  },


/******     UTILITY Functions    *******/

  _toggleRow: function(name, state) {
    var child = this.child(name);
    if (child) {
      dom.toggleClass(
        this._row(child.dom()),
        'hidden_elem',
        state);
    }
  },

  _getLayoutType: function(obj, object_id) {
    // in essence, the creative fields are decided by the
    // creative type and category (intern & premium)
    // 1. stanard web page ads
    // 2. Facebook ads
    // 3. Bass ads

    var AD_CREATIVE_TYPE = creativeType.AD_CREATIVE_TYPE;
    // default layout type
    var layout_type = LAYOUT.WEBSITE;

    if (object_id) {
      var is_bass = (this.category() ==
        creativeType.AD_CREATIVE_CATEGORY.SPONSORED_STORIES);

      if (obj) {
        layout_type = is_bass ? LAYOUT.BASS : LAYOUT.FBADS;
      } else {
        layout_type = is_bass ? LAYOUT.BASS_NO_OBJECT : LAYOUT.FBADS_NO_OBJECT;
      }
    }

    return layout_type;
  },

  _validateInput: function(e) {
    // counters
    if (!e || e.name === 'title' || e.name === 'object_id') {
      var title_count = MAX_TITLE_LENGTH - this.child('title').value().length;
      this
        .child('title_count')
        .text(title_count + ' characters left')
        .toggleClass('adEditor-counter_error', title_count < 0);
    }
    if (!e || e.name === 'body') {
      var body_count = MAX_BODY_LENGTH - this.child('body').value().length;
      this
        .child('body_count')
        .text(body_count + ' characters left')
        .toggleClass('adEditor-counter_error', body_count < 0);
    }
  }
});

exports.Creative = Creative;
