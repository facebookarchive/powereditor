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

var utils   = require("../../uki-core/utils");
var fun     = require("../../uki-core/function");
var storage = require("../../storage/storage");
var App     = require("./app").App;
var ConnectedObject = require("../model/connectedObject").ConnectedObject;

var DownloadDialog =
  require("../view/connectedObjectDialog").ConnectedObjectDialog;

/**
* Download extra objects from server
* @namespace
*/
var ObjectDownload = {};

ObjectDownload.dialog = function() {
  if (!this._dialog) {
    this._dialog = new DownloadDialog();
    this._dialog.on('download', this._ondownload);
  }

  this._dialog.reset();
  return this._dialog;
};

ObjectDownload.handle = function() {
  this.dialog().visible(true);
};

ObjectDownload._ondownload = function(e) {

  ObjectDownload.loadFromRESTAPI.call(this,
    fun.bind(function() {
      this.notifyComplete();
      App.reload();
    }, this),
    e.options
  );
};

/**
* handler to start downloading
*
* @param callback called on finish
* @param options extra obj ids to donwload to account_id specified
*/

ObjectDownload.loadFromRESTAPI = function(callback, options) {
  callback = callback || fun.FT;

  if (options.account && options.account.isCorporate()) {
    this.updateProgress(options.extra_fbids.length);
    _loadObjects(options, callback);
  } else {
    callback();
  }
};

/**
* ObjectDownload ConnectedObjects
*
* @param option extra obj ids to donwload to account_id specified
* @param callback called on finish
*/

function _loadObjects(options, callback) {
  if (!options || !options.extra_fbids.length) {
    ConnectedObject.prepare(function() {
      callback();
    }, true
    );

    return;
  }

  ConnectedObject.loadFromRESTAPI(
    { account_id: options.account.id(),
      extra_fbids: options.extra_fbids,
      extra_only: true
    },

    function() {
      _syncObjects(null, callback);
    }
  );
}

exports.ObjectDownload = ObjectDownload;
