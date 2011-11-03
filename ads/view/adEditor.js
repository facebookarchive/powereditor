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
requireCss("./adEditor/adEditor.css");
requireCss("./adEditor/uiInfoTable.css");

var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    find  = require("../../uki-core/selector").find,
    build = require("../../uki-core/builder").build,
    view  = require("../../uki-core/view"),
    dom   = require("../../uki-core/dom"),

    Container = require("../../uki-core/view/container").Container,
    formatters = require("./adPane/formatters"),
    estimateTargetingStats = require("../lib/estimateTargetingStats"),
    PersistentState = require("../../uki-fb/persistentState").PersistentState;

var views = utils.extend({},
    require("./adEditor/advDem"),
    require("./adEditor/connections"),
    require("./adEditor/creative"),
    require("./adEditor/eduWork"),
    require("./adEditor/interests"),
    require("./adEditor/locDem"),
    require("./adEditor/pricing"));

var AdEditor = view.newClass('ads.AdEditor', Container, PersistentState, {

    selectEditor: function(type, selectNavItem) {
      var itemForType = find(
        '> SideNavItem[editorType=' + type + ']',
        this._refs.view('side-nav'));

      if (!itemForType.prop('visible')) { return; }

      if (selectNavItem !== false) {
        this._selectedSideNavItem().prop('selected', false);
        itemForType.prop('selected', true);
      }

      var container = this._refs.view('editor-container');

      // manual clean model, but do not destroy editor views
      // we cache them after first render
      utils.invoke(container.childViews(), 'model', null);
      container.childViews([], false);

      this._getChildEditor(type).model(this.model());
      container.appendChild(this._getChildEditor(type));
      container.layoutIfVisible();
    },

    model: fun.newProp('model', function(model) {
      if (this._model !== model) {
        if (this._model) {
          this._model.removeListener(
            'change',
            fun.bindOnce(this._updateReachEstimate, this));
        }
        this._model = model;
        if (this._model) {
          this._model.addListener(
            'change',
            fun.bindOnce(this._updateReachEstimate, this));
        }

        

        if (!model) {
          this._refs.view('editor-container').visible(false);
          this._refs.view('preview').visible(false);
          this._refs.view('reach-estimate').visible(false);
          this._refs.view('adlink').visible(false);
        } else {
          this._refs.view('preview').visible(true);
          this._refs.view('editor-container')
            .visible(model.account_id())
            .firstChild()
            .model(model);

          this._refs.view('preview').model(model);
          this._refs.view('errors').model(model);
          this._refs.view('multy-accs-message').visible(!model.account_id());
          this._refs.view('require-active-message').visible(false);
          this._updateReachEstimate();

          this._refs.view('adlink').html(formatters.adlink(model));
        }
      }
    }),

    _updateReachEstimate: function() {
      var model = this.model();
      var showReach = model && model.targetingSpec;
      this._refs.view('reach-estimate').visible(!!showReach);
      if (showReach) {
        this._refs.view('reach-estimate').loading(true);
        this._scheduleReachEstimate();
      }
    },

    // debounced
    _scheduleReachEstimate: fun.debounce(function() {
      if (!this.model() || !this.model().targetingSpec) {
        return;
      }
      estimateTargetingStats.estimate(
        this.model().account(),
        this.model().targetingSpec(),
        fun.bindOnce(this._reachEstimateCallback, this)
      );
    }, estimateTargetingStats.DEFAULT_DEBOUNCE),

    _reachEstimateCallback: function(data) {
      this._refs.view('reach-estimate').loading(false).reach(data.users);
    },

    _setup: function(initArgs) {
      Container.prototype._setup.call(this, initArgs);
      this._childEditors = {};
    },

    getPersistentState: function() {
      return { editor: this._selectedSideNavItem().prop('editorType') };
    },

    setPersistentState: function(state) {
      if (state.editor) { this.selectEditor(state.editor); }
    },

    destruct: function() {
      // manualy destroy cached editors
      utils.forEach(this._childEditors, function(e) { e.destruct(); });
      this.childViews([], false);

      this._persistentStateDestruct();
      Container.destruct.call(this);
    },

    _createDom: function() {
        this._dom = dom.createElement('div', { className: 'adEditor' });
        this._refs = build([
            { view: 'AdErrors', pos: 'h:27px l:0 r:0 b:315px', as: 'errors',
              on: { resized: fun.bind(this._onerrorsResized, this) } },

            { view: 'SideNav', pos: 'h:305px l:0 w:199px b:0', as: 'side-nav',
              on: { selected: fun.bind(this._onnavClick, this) },
              addClass: "adEditor-nav ptm", childViews: [
                { view: 'SideNavItem', label: 'Creative',
                  editorType: 'Creative' },
                { view: 'SideNavItem', label: 'Location & Demographics',
                  editorType: 'LocDem' },
                { view: 'SideNavItem',
                  label: 'Interests & Broad Categories',
                  editorType: 'Interests' },
                { view: 'SideNavItem', label: 'Connections on Facebook',
                  editorType: 'Connections' },
                { view: 'SideNavItem', label: 'Advanced Demographics',
                  editorType: 'AdvDem' },
                { view: 'SideNavItem', label: 'Education & Work',
                  editorType: 'EduWork' },
                { view: 'SideNavItem', label: 'Pricing & Status',
                  editorType: 'Pricing' }
            ]},

            { view: 'Container', addClass: 'adEditor-container',
              pos: 'l:200px r:0 h:315px b:0', as: 'editor-container' },

            { view: 'Text', addClass: 'addClass-message',
              pos: 'l:200px r:0 h:315px b:0', as: 'multy-accs-message',
              text: 'You cannot edit multiple accounts', visible: false },

            { view: 'Text', addClass: 'addClass-message',
              pos: 'l:200px r:0 h:315px b:0', as: 'require-active-message',
              text: 'You need to download accounts before editing' },

            { view: 'Text', addClass: 'addClass-adlink',
              pos: 'r:10px h:225px b:80px w:244px',
              id: 'adlink', as: 'adlink' },

            { view: 'Text', addClass: 'addClass-adPreviewTitle',
              pos: 'r:10px h:205px b:80px w:244px', as: 'adpreview-title',
              text: 'Creative Preview: '},

            { view: 'AdPreview', pos: 'r:10px h:205px b:60px w:244px',
              id: 'adPreview', as: 'preview' },

            { view: 'ReachEstimate', pos: 'r:10px b:10px h:40px w:244px',
              as: 'reach-estimate' }

        ]).appendTo(this);

        this.selectEditor('Creative');
    },

    _onerrorsResized: function() {
      var height = this._refs.view('errors').visible() ? 340 : 315;
      this.trigger({ type: 'resized', height: height });
    },

    _onnavClick: function(e) {
      this.selectEditor(utils.prop(e.button, 'editorType'), false);
    },

    _selectedSideNavItem: function() {
      return find('> SideNavItem[selected]', this._refs.view('side-nav'));
    },

    _getChildEditor: function(type) {
      if (!this._childEditors[type]) {
        this._childEditors[type] = build({ view: views[type] })[0];
      }
      return this._childEditors[type];
    }
});


exports.AdEditor = AdEditor;
