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
requireCss("./uploadDialog/uploadDialog.css");

var fun   = require("../../uki-core/function"),
    view  = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,
    find  = require("../../uki-core/selector").find,

    Dialog = require("../../uki-fb/view/dialog").Dialog;


var MESSAGE_ADS = '{uploaded} of {ads} ads',
    MESSAGE_CAMPS = '{uploaded} of {campaigns} campaigns',
    MESSAGE_BOTH = '{uploaded} of {ads} ads and {campaigns} campaigns';

var UploadDialog = view.newClass('ads.UploadDialog', Dialog,
  require("../lib/loggingState").getMixinForDialog('Upload Dialog'), {

  _createDom: function(initArgs) {
    Dialog.prototype._createDom.call(this, initArgs);

    this.modal(true).addClass('uploadDialog');

    build([
      { view: 'DialogHeader', html: "Uploading&hellip;" },
      { view: 'DialogContent', childViews: [
        { view: 'DialogBody', childViews: [

          { view: 'Text', addClass: "uploadDialog-errors",
            visible: false, childName: 'errors',
            html: 'You have errors in selected ads. ' +
                  'Do you want to continue?' },

          { view: 'Text', addClass: "uploadDialog-notice",
            visible: false, childName: 'notice',
            html: 'You have nothing to upload. Change something.' },

          { view: 'ProgressBar', value: 0, visible: false },

          { view: 'Text', addClass: "mts", visible: false,
            childName: 'progress', html: '' },

          { view: 'Text', addClass: 'uploadDialog-errorLog mtm',
            visible: false, childName: 'errorLog', html: '' }
        ] },

        { view: 'DialogFooter', childViews: [
          { view: 'Text', addClass: 'uploadDialog-progressMessage',
            childName: 'progressMessage', html: ''},
          { view: 'Button', label: 'Yes', large: true, use: 'confirm',
            childName: 'yes', action: 'continueErrors',
            on: { click: fun.bindOnce(this._clickYes, this) } },
          { view: 'Button', label: 'No', large: true,
            childName: 'no', action: 'continueErrors',
            on: { click: fun.bindOnce(this._clickNo, this) } },
          { view: 'Button', label: 'Stop', large: true,
            childName: 'stop',
            on: { click: fun.bind(function() {
              this.trigger({ type: 'stop' });
              this.visible(false);
            }, this) } }
        ] }

      ] }
    ]).appendTo(this);
  },

  visible: function(state) {
    return Dialog.prototype.visible.call(this, state);
  },

  _clickNo: function() {
    this.trigger({ type: 'stop' });
    this.visible(false);
  },

  _clickYes: function() {
    find('[childName=errors]', this)[0].visible(false);
    find('DialogFooter > [action=continueErrors]', this)
        .prop('visible', false);
    find('[childName=stop]', this)[0].visible(true);
    this.trigger({ type: 'continueWithErrors' });
  },

  updateProgressMessage: function(msg) {
    find('[childName=progressMessage]', this)[0].visible(true).text(msg);
  },

  updateProgress: function(uploaded, ads, campaigns) {
    var message = ads && campaigns ? MESSAGE_BOTH :
                  campaigns        ? MESSAGE_CAMPS :
                  MESSAGE_ADS;

    message = message
      .replace('{uploaded}', uploaded)
      .replace('{ads}', ads)
      .replace('{campaigns}', campaigns);

    find('[childName=progress]', this)[0].visible(true).text(message);
    find('ProgressBar', this)[0]
      .visible(true)
      .value(uploaded / (ads + campaigns) * 100);
  },

  logError: function(message) {
    var log = find('[childName=errorLog]', this)[0];
    log.visible(true).html(log.html() + message + '<br />');
  },

  notifyComplete: function() {
    find('DialogHeader', this)[0].html('Upload Completed');
    find('[childName=stop]', this)[0].label('Close');
  },

  confirmContinueWithErrors: function() {
    find('[childName=errors]', this)[0].visible(true);
    find('DialogFooter > [action=continueErrors]', this).prop('visible', true);
    find('[childName=stop]', this)[0].visible(false);
  },

  notifyNoChanges: function() {
    find('[childName=notice]', this)[0].visible(true);
    find('[childName=stop]', this)[0].label('Close');
  },

  reset: function() {
    find('DialogHeader', this)[0].html('Uploading&hellip;');
    find('DialogBody > *', this).prop('visible', false);
    find('[childName=stop]', this)[0].label('Stop');
    find('ProgressBar', this)[0].value(0);
    find('[childName=errorLog]', this)[0].html('');
    find('DialogFooter > [action=continueErrors]', this)
      .prop('visible', false);
    return this;
  }
});


exports.UploadDialog = UploadDialog;

