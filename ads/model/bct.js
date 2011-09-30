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
 * @providesModule ads-bct
 * @author nsenaratna
 */

var fun   = require("../../uki-core/function"),
  utils = require("../../uki-core/utils"),
  storage = require("../../storage/storage"),
  props = require("../lib/props"),
  ResultSet  = require("../../storage/resultSet").ResultSet,
  Util = require("../../uki-fb/view/typeahead/util").Util,
  adsConnect = require("../../lib/connect"),
  FB = adsConnect.FB;

/**
 * BCT
 * @class
 */
var BCT = storage.newStorage({
  dbDrop: function() {
    require("../job/downloadBCT").DownloadBCT.clearLastSync();
    storage.Storage.dbDrop(arguments);
  }
});

BCT.newInstance = function(id) {
  var bct = new BCT();
  bct.id(id);
  return bct;
};

BCT
  .defaultPropType(props.Base)
  .tableName('bct')
  .remoteMethodName('ads.getBroadCategories')
  .softDrop(false);

BCT.addProp({
  name: 'id',
  remote: true,
  indexed: 'TEXT NOT NULL PRIMARY KEY'
});

BCT.addProp({
  name: 'name',
  remote: true,
  indexed: 'TEXT NOT NULL'
});

BCT.addProp({
  name: 'parent_category',
  remote: true,
  indexed: 'TEXT NOT NULL'
});

BCT.loadFromRESTAPI = function(options, callback) {
  FB.api(
    utils.extend({ method: this.remoteMethodName() }, options),
    fun.bind(function(data) {
      if (adsConnect.isError(data)) {
        callback();
        return;
      }
      var items = [];
      utils.forEach(data, function(raw, key) {
        var item = BCT.newInstance(raw.id);
        items.push(item.fromRemoteObject(raw));
      });
      this.storeMulti(items, callback);
    }, this)
  );
};

exports.BCT = BCT;
