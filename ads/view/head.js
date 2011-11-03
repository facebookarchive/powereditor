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
requireCss("./head/head.css");

var fun   = require("../../uki-core/function");
var dom   = require("../../uki-core/dom");
var evt   = require("../../uki-core/event");
var env   = require("../../uki-core/env");
var view  = require("../../uki-core/view");
var build = require("../../uki-core/builder").build;
var find  = require("../../uki-core/selector").find;

var db = require("../db");

var BulkImport = require("../controller/bulkImport").BulkImport;
var Upload = require("../controller/upload").Upload;
var Settings = require("../controller/settings").Settings;
var Container = require("../../uki-core/view/container").Container;


var Head = view.newClass('ads.Head', Container, {

  _createDom: function() {
    this._dom = dom.createElement('div', { className: 'head' });

    this._collection = build([
      { view: 'Container', init: { tagName: 'a' }, pos: 'b:7px l:20px',
        as: 'logo', addClass: 'head-logo', childViews: [
                    { view: 'Text', size: 'large', text: 'Power Editor' }
        ] },

      { view: 'List', horizontal: true,
        border: 'none', spacing: 'small', pos: 'b:7px r:10px',
        childViews: [
          { view: 'Button', label: 'Settings', addClass: 'mrm',
                        icon: toDataUri('./head/settings.png'),
            use: 'confirm',
            on: { click: Settings.handle } },

          { view: 'Button',
            addClass: 'mrm',
            label: 'Bulk Import', requireActive: true,
            use: 'confirm', on: { click: BulkImport.handleImport } },
          { view: 'Button', as: 'download',
                        icon: toDataUri('./head/arrowdown.png'),
            label: 'Download', use: 'confirm',
            on: { click: fun.bind(this._ondownload, this) } },
          { view: 'Button',
                        icon: toDataUri('./head/arrowup.png'),
            label: 'Upload', requireActive: true,
            title: 'Upload ads from selected campaigns',
            use: 'confirm', on: { click: Upload.handleUpload } }
      ]}

    ]).appendTo(this);

    this._collection.view('logo').dom().href = '/';

    var download = this._collection.view('download');
    download.dom().style.width = '70px';
    evt.on(env.doc, 'keydown keyup focus blur', function(e) {
      download.label(e.baseEvent.altKey ? 'Drop' : 'Download');
    });
  },

  _ondownload: function(e) {
    if (e && e.baseEvent.altKey) {
      db.drop(!e.shiftKey, fun.bind(function() {
        require("../controller/app").App.userStorage().cleanup();
        location.reload();
      }, this));
      return;
    }

    require("../controller/download").Download.handle();
  }
});


exports.Head = Head;
