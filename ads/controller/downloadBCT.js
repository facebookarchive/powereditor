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

var fun = require("../../uki-core/function");
var build = require("../../uki-core/builder").build;
var Job = require("../job/downloadBCT").DownloadBCT;
var Mustache = require("../../uki-core/mustache").Mustache;

var DownloadBCT = {
  download: function(callback) {
    var job = new Job();
    var dialog = DownloadBCT.dialog();
    job
      .onprogress(function(e) {
        var status = e.status;
        dialog.visible(true);
      })
      .oncomplete(function() {
        dialog.visible(false);
        callback();
      })
      .start();
  },

  clearLastSync: function() {
    new Job().clearLastSync();
  },

  dialog: function() {
    if (!this._dialog) {
      var col = build({ view: 'Dialog', modal: true, childViews: [
        { view: 'DialogHeader', text: "Downloading BCT" },
        { view: 'DialogContent', childViews: [
          { view: 'DialogBody', childViews: [
            { view: 'Text',
              text: 'Your BCT data is out of date. Updating. ' +
                    'This may take several minutes on a slow connection.' },
            { view: 'Text', as: 'progress' }
          ] }
        ] }
      ]});
      this._dialog = col[0];
      this._dialog.progress = col.view('progress');
    }
    return this._dialog;
  }
};


exports.DownloadBCT = DownloadBCT;
