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
requireCss("./imageSelector/imageSelector.css");
requireCss("./imageSelector/imageSelectorDialog.css");

var fun   = require("../../uki-core/function"),
    dom   = require("../../uki-core/dom"),
    env   = require("../../uki-core/env"),
    utils = require("../../uki-core/utils"),
    view  = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,
    find  = require("../../uki-core/selector").find,

    imageReader = require("../../lib/imageReader"),

    Mustache = require("../../uki-core/mustache").Mustache,

    Dialog      = require("../../uki-fb/view/dialog").Dialog,
    List        = require("../../uki-fb/view/list").List,
    BaseBinding = require("../../uki-fb/binding").Binding,

    Img = require("../model/image").Image;


var ImageSelector = view.newClass('ads.ImageSelector', List,
  require("../lib/loggingState").getMixinForDialog('image_selector_dialog'), {

  binding: fun.newProp('binding', function(val) {
    if (this._binding) { this._binding.destruct(); }
    this._binding = val && new Binding(utils.extend({
      view: this,
      model: val.model,
      viewEvent: 'image_selected',
      modelProp: 'change_hash'
    }, val));
  }),

  tabIndex: fun.newDelegateProp('_button', 'tabIndex'),

  _createDom: function(initArgs) {
    List.prototype._createDom.call(this, initArgs);
    this.horizontal(true).addClass('imageSelector');
    build([
      { view: 'Image', addClass: 'imageSelector-image' },
      { view: 'Button', addClass: 'imageSelector-button', label: 'Choose' }
    ]).appendTo(this);

    this._preview = this.childViews()[0];
    this._button = this.childViews()[1];

    this._button.on('click', fun.bind(this._click, this));
  },

  _click: function() {
    if (!this._dialog) {
      this._dialog = build({ view: ImageSelectorDialog })[0];
      this._dialog.addListener('image_selected', fun.bind(this.trigger, this));
    }
    this._dialog.visible(true).selectModel(this.binding().model);
  }
});

var template = requireText('imageSelector/imageSelector.html');

function formatter(object) {
  return Mustache.to_html(template, object);
}

var ImageSelectorDialog = fun.newClass(Dialog, {

  template: template,

  selectModel: function(model) {
    if (!model) { return; }
    this._model = model;

    this._updateDataGrid(model.account_id(), model.image_hash());
  },

  _updateDataGrid: function(account_id, image_hash) {
    Img.imagesForAccount(account_id, fun.bind(function(images) {
      this._dataGrid.data(images)
        .selectedIndex(0).lastClickIndex(0)
        .layoutIfVisible();

      if (image_hash) {
        for (var i = 0, l = images.length; i < l; i++) {
          if (images[i].id() == image_hash) {
            this._dataGrid
              .lastClickIndex(i).selectedIndex(i)
              .scrollToIndex(i);
            break;
          }
        }
      }

      this._dataGrid.triggerSelection();
    }, this));
  },

  _createDom: function(initArgs) {
      Dialog.prototype._createDom.call(this, initArgs);

      this
        .wide(true)
        .modal(true)
        .closeOnEsc(true)
        .addClass('imageSelectorDialog');

      build([
        { view: 'DialogHeader', html: "Select Image&hellip;" },
        { view: 'DialogContent', childViews: [
          { view: 'DialogBody', addClass: 'imageSelectorDialog-body',
            childViews: [
              { view: 'Container', addClass: 'imageSelectorDialog-images',
                childViews: [
                  { view: 'DataGrid',
                    addClass: 'imageSelectorDialog-grid',
                    formatter: formatter }
                ] },
              { view: 'Container', addClass: 'imageSelectorDialog-upload',
                visible: !!global.FileReader,
                childViews: [
                  { view: 'Text', html: '&hellip; or add a new one:',
                    size: 'large' },
                  { view: 'FileInput', accept: 'image/*' }
                ] }
          ] },
          { view: 'DialogFooter', childViews: [
            { view: 'Button', label: 'OK',
              use: 'confirm', large: true,
              action: 'ok', disabled: true },
            { view: 'Button', label: 'Cancel',
              large: true, action: 'cancel' }
          ] }
        ] }
      ]).appendTo(this);

      this._dataGrid = find('DataGrid', this)[0];
      this._fileInput = find('FileInput', this)
        .addListener('change', fun.bind(this._fileChange, this))[0];

      this._ok = find('[action=ok]', this)[0];
      this._cancel = find('[action=cancel]', this)[0];

      this._dataGrid
        .addListener('selection', fun.bind(function() {
          this._ok.disabled(false);
        }, this))
        .addListener('dblclick', fun.bind(this._selectIfExists, this))
        .addListener('keyup', fun.bind(this._gridKeyup, this));

      this._cancel.addListener('click', fun.bind(function() {
        this.visible(false);
      }, this));

      this._ok.addListener('click', fun.bind(this._selectIfExists, this));
  },

  _gridKeyup: function(e) {
    if (e.which == 13) { this._selectIfExists(); }
  },

  _selectIfExists: function() {
    if (this._dataGrid.selectedRow()) {
      this.trigger({
        type: 'image_selected',
        selected: this._dataGrid.selectedRow()
      });
      this.visible(false);
    }
  },

  _fileChange: function(e) {
    var file = this._fileInput.files()[0];
    if (!file || file.type.indexOf('image/') !== 0) {
      require("../../uki-fb/view/dialog").Dialog
        .alert(tx('ads:pe:no-image-selected'));
      this._fileInput.value('');
      return;
    }
    imageReader.read(file, fun.bind(function(dataUri) {
      var image = new Img();
      image.id(Img.generateLocalHash())
        .url(dataUri)
        .account_id(this._model.account_id())
        .store(fun.bind(function() {
          this._fileInput.value('');
          this._updateDataGrid(this._model.account_id(), image.id());
        }, this));
    }, this));
  }

});


var Binding = fun.newClass(BaseBinding, {
  updateModel: function(e) {
    this.model
      .image_hash(e.selected.id())
      .commitChanges('image_hash');
    this.updateView();
  },

  updateView: function(e) {
    var view = this.view;
    Img.imageUrl(this.model, function(url) {
      view._preview.src(url).visible(!!url);
    });
  }
});


exports.ImageSelector = ImageSelector;
