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
* @providesModule ads-controller-migrateDB-ad-accountIDs
*
* @author zahanm
*/

var fun = require("../../../uki-core/function"),
    utils = require("../../../uki-core/utils"),

    storage = require("../../../storage/storage"),

    Ad = require("../../model/ad").Ad;

/**
 * Recreates the Ad table because
 * account_id has been added as an indexed property
 * naturally need to use raw SQL as Storage methods are %^&*'d
 */
function migrateWebSql(uid, DB, callback) {
  DB.transaction(function(tx1) {
    tx1.executeSql('SELECT data FROM ' + Ad.tableName(), [],
    function(tx2, r) {
      if (r.rows && r.rows.length && !r.rows.item(0).account_id) {
        var ads = [];
        for (var i = 0; i < r.rows.length; i++) {
          var obj = JSON.parse(r.rows.item(i).data);
          var ad = new Ad();
          ad.fromDBObject(obj)
            .id(obj.id);
          ads.push(ad);
        }
        Ad.withTransaction(tx2, function() {
          this.dbDrop(function() {
            DB.transaction(function(tx3) {
              Ad.withTransaction(tx3, function() { this.dbInit(); });
            }, storage.errorCallback, function() {
              Ad.storeMulti(ads, callback || fun.FT);
            });
          });
        });
      } else {
        callback && callback();
      }
    });
  }, storage.errorCallback);
}

function migrateIDB(uid, DB, tx) {
  var adStore = tx.objectStore(Ad.objectStoreName());
  adStore.createIndex(
    'account_id',     // index name
    'account_id',     // keyPath
    { unique: false } // unique index
  );
  // this was hard, wasn't it?
  // God, WebSQL is idiotic.
}

exports.migrateWebSql = migrateWebSql;
exports.migrateIDB = migrateIDB;
