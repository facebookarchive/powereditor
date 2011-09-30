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
requireCss("./downloadProgress/downloadProgress.css");

var fun = require("../../uki-core/function"),
    view = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,

    Mustache = require("../../uki-core/mustache").Mustache,

    App = require("../controller/app").App,
    Dialog = require("../../uki-fb/view/dialog").Dialog;


var statusTexts = [
  'waiting',
  'loading',
  'done'
];

var DownloadProgress = view.newClass('ads.DownloadProgress', Dialog, {

  _createDom: function(initArgs) {
    Dialog.prototype._createDom.call(this, initArgs);
    this._collection = build([
      { view: 'DialogHeader', text: "Downloading" },
      { view: 'DialogContent', childViews: [
        { view: 'DialogBody', as: 'dbody' },
        { view: 'DialogFooter', childViews: [
          { view: 'Button', label: 'Dismiss', large: true,
            disabled: true, as: 'dismiss', use: 'confirm',
            on: { click: fun.bindOnce(this._ondismiss, this) } }
        ] }
      ] }
      ]).appendTo(this);
    this.modal(true); // makes the background translucent
    this._body = this._collection.view('dbody');
    this._dismiss = this._collection.view('dismiss');
  },

  body: fun.newDelegateProp('_body', 'html'),

  disableDismiss: fun.newDelegateProp('_dismiss', 'disabled'),

  triggerDismiss: fun.newDelegateProp('_dismiss', 'trigger'),

  _template: requireText('downloadProgress/downloadProgress.html'),

  init: function() {
    Dialog.prototype.init.call(this, arguments);
    this.progress = [];
    this.bct = false;
    this.conflicts = 0;
    var hasCorpAct = App.hasCorpAct();
    DownloadProgress.steps.forEach(fun.bind(function(step) {
      this.progress.push({
        name: step.name,
        label: step.label,
        show: !step.corpStep || hasCorpAct,
        loaded: 0,
        iscomplete: false
      });
    }, this));
  },

  setStep: function(stepname) {
    this.progress.forEach(fun.bind(function(step) {
      if (step.name == stepname) {
        this.current = step;
      }
    }, this));
  },

  statusUpdate: function(update) {
    if (typeof update === 'number') {
      this.current.loaded += update;
    }
    this.updateDialog();
  },

  conflictsUpdate: function(conflicts) {
    // number of conflicts found
    if (typeof conflicts === 'number') {
      this.conflicts += conflicts;
    }
    this.updateDialog();
  },

  completeStep: function(stepname) {
    if (stepname) {
      this.progress.forEach(function(step) {
        if (step.name == stepname) {
          step.iscomplete = true;
        }
      });
    } else {
      this.current.iscomplete = true;
    }
    this.updateDialog();
  },

  updateDialog: function() {
    var tcontext = {};
    tcontext.progress = this.progress;
    tcontext.bct = this.bct;
    tcontext.conflicts = this.conflicts;
    this.body(Mustache.to_html(this._template, tcontext));
  },

  _ondismiss: function(e) {
    this.visible(false);
    // from wrapped uki event
    e.stopPropagation();
  }

});

DownloadProgress.steps = [
  { name: 'accounts', label: 'Accounts' },
  { name: 'timezones', label: 'Timezone Offsets' },
  { name: 'objects', label: 'Connection Objects' },
  
  { name: 'campaigns', label: 'Campaigns' },
  { name: 'ads', label: 'Ads' },
  { name: 'adcreatives', label: 'Ad Creatives' },
  { name: 'adimages', label: 'Ad Images' }
];


exports.DownloadProgress = DownloadProgress;
