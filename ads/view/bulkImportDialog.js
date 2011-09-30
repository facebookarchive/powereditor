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
requireCss("./bulkImportDialog/bulkImportDialog.css");

var fun   = require("../../uki-core/function"),
    env   = require("../../uki-core/env"),
    view  = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,
    find  = require("../../uki-core/selector").find,

    Dialog = require("../../uki-fb/view/dialog").Dialog,

    LocalDataSource =
        require("../lib/typeahead/LocalDataSource").LocalDataSource,
    Searcher   = require("../lib/accountSearcher").Searcher;

var BulkImportDialog = view.newClass('ads.BulkImportDialog', Dialog,
  require("../lib/loggingState").getMixinForDialog('bulk_import_dialog'), {

    _createDom: function(initArgs) {
        Dialog.prototype._createDom.call(this, initArgs);

        this.modal(true).wide(true).addClass('bulkImportDialog');
        this.closeOnEsc(true);

        build([
          { view: 'DialogHeader', html: "Bulk Import" },
          { view: 'DialogContent', childViews: [

            { view: 'DialogBody', childViews: [

              { view: 'List', horizontal: true, childViews: [
                { view: 'Text', text: 'Account ID:' },
                { view: 'Select', name: 'account-id' }
                ] },

              { view: 'Text', size: 'large', text: 'Import', addClass: 'mtm' },
              { view: 'List', horizontal: true, childViews: [
                { view: 'Radio', label: 'File', name: 'bulk-import-type',
                  checked: true, value: 'type-file' },
                { view: 'Radio', label: 'Paste into text area',
                  name: 'bulk-import-type', value: 'type-paste' }
                ], on: { change: fun.bind(function() {
                  var checked = find('Radio[value=type-file]', this)[0]
                    .checked();
                  find('Container[name=type-file]', this)[0].visible(checked);
                  find('Container[name=type-paste]', this)[0].visible(!checked);
                }, this) } },
              { view: 'Container', name: 'type-file', childViews: [
                { view: 'Text', addClass: 'mts',
                  text: 'Tab separated text file ' +
                  ' (please export from excel to "Unicode Text"):' },
                { view: 'FileInput', name: 'data-file' }
                ] },
              { view: 'Container', name: 'type-paste', visible: false,
                childViews: [
                { view: 'Text', addClass: 'mts',
                  text: 'Text (just cut and paste here from excel):' },
                { view: 'TextArea', addClass: 'bulkImportDialog-textArea',
                  name: 'data-text' }
                ] },

              { view: 'Text', size: 'large', text: 'Image upload',
                addClass: 'mtm' },
              { view: 'List', horizontal: true, childViews: [
                { view: 'Radio', label: 'Individual files', checked: true,
                  value: 'image-files', name: 'bulk-import-image' },
                { view: 'Radio', label: 'Zip', name: 'bulk-import-image',
                  value: 'image-zip' }
                ], on: { change: fun.bind(function() {
                  var checked = find('Radio[value=image-zip]', this)[0]
                      .checked();
                  find('[name=image-zip]', this)[0].visible(checked);
                  find('[name=image-files]', this)[0]
                      .visible(!checked);
                }, this) } },
              { view: 'Container', name: 'image-files',
                childViews: [
                { view: 'Text', addClass: 'mts',
                  text: 'Image Files (select several files using Shift):' },
                { view: 'List', name: 'image-file-list', childViews: [
                  { view: 'FileInput', multiple: true },
                  { view: 'FileInput', multiple: true },
                  { view: 'FileInput', multiple: true },
                  { view: 'FileInput', multiple: true },
                  { view: 'FileInput', multiple: true }
                  ] }
                ] },
              { view: 'Form', name: 'image-zip', visible: false,
                method: 'post',
                action: '/ads/manage/powereditor/unzipimages.php',
                enctype: 'multipart/form-data',
                childViews: [
                { view: 'Text', addClass: 'mts', text: 'Image Zip File:' },
                { view: 'FileInput', name: 'zip' }
                ] }
              ] },

            { view: 'DialogFooter', childViews: [
              { view: 'Button', label: 'Import', large: true,
                use: 'confirm',
                on: {
                  click: fun.bind(this.trigger, this, { type: 'import' })
                } },
              { view: 'Button', label: 'Cancel', large: true, on: {
                click: fun.bind(function() {
                    this.visible(false);
                }, this)
              } }
            ] }

          ] }
        ]).appendTo(this);
    },

    importDataFromFile: function() {
        return find('Radio[value=type-file]', this)[0].checked();
    },

    dataFileInput: function() {
        return find('[name=data-file]', this)[0];
    },

    dataTextInput: function() {
        return find('[name=data-text]', this)[0];
    },

    importImageFromZip: function() {
        return find('Radio[value=image-zip]', this)[0].checked();
    },

    imageZipInput: function() {
        return find('[name=zip]', this)[0];
    },

    imageZipForm: function() {
        return find('[name=image-zip]', this)[0];
    },

    imageFileInputs: function() {
        return find('[name=image-file-list] FileInput', this);
    },

    accountId: function() {
        return find('[name=account-id]', this)[0].value();
    },

    initWithAccounts: function(accounts, defaultAccountId) {
      find('[name=account-id]', this)[0].options(
        accounts.map(function(account) {
          return {
            value: account.id(),
            text: account.name() || account.id()
          };
        })
      ).value(defaultAccountId);
      find('TextArea', this)[0].focus();
      return this;
    }
});


exports.BulkImportDialog = BulkImportDialog;

