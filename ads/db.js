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
* Database operations
*
*/

var fun = require("../uki-core/function"),

    storage = require("../storage/storage");


var IDB_VERSION = '1.1';
var DB;
var init, drop;

if (storage.impl === 'IndexedDB') {

  init = function(uid, callback) {
    var req = global.IndexedDB.open(
      uid + '_powereditor',
      'PowerEditor main storage');
    req.onsuccess = function(e) {
      DB = e.result || e.target.result;

      var models = require("./models");
      [models.Account, models.Ad, models.Image, models.AdStat,
       models.Campaign, models.CampStat, models.Contract,
       models.Topline, models.ConnectedObject,
       models.BCT].forEach(function(m) {
        m.db(DB);
      });

      if (DB.version != IDB_VERSION) {
        DB.setVersion(IDB_VERSION).onsuccess = function() {
          req.result.oncomplete = callback;
          models.Account.dbInit();
          models.Ad.dbInit();
          models.Image.dbInit();
          models.AdStat.dbInit();
          models.Campaign.dbInit();
          models.CampStat.dbInit();
          models.Contract.dbInit();
          models.Topline.dbInit();
          models.ConnectedObject.dbInit();
          models.BCT.dbInit();
          require("./controller/migrateDB/removeCompletions")
            .migrateIndexDB(uid, DB);
        };
      } else {
        callback();
      }
    };
    req.onerror = storage.errorCallback;
  };

  drop = function(soft, callback) {
    var models = require("./models");
    var req = DB.setVersion('0.0');
    req.onsuccess = function(e) {
      e.target.result.oncomplete = callback;
      models.Account.dbDrop();
      models.Ad.dbDrop();
      models.Image.dbDrop();
      models.AdStat.dbDrop();
      models.Campaign.dbDrop();
      models.CampStat.dbDrop();
      models.ConnectedObject.dbDrop();
      models.Contract.dbDrop();
      models.Topline.dbDrop();
      if (!soft) {
        models.BCT.dbDrop();
      }
    };

    req.onerror = storage.errorCallback;
  };


} else {
  init = function(uid, callback) {
    DB = global.openDatabase(
      uid + '_powereditor',
      // 'bamboo',
      '1.0',
      'PowerEditor main storage',
      100 * 1000 * 1000);

    var models = require("./models");
    [models.Account, models.Ad, models.Image, models.AdStat,
     models.Campaign, models.CampStat, models.Contract,
     models.Topline, models.ConnectedObject,
     models.BCT].forEach(function(m) {
      m.db(DB);
    });

    // init everythign in one transaction
    DB.transaction(function(tx) {
      models.Account.withTransaction(tx, function() { this.dbInit(); });
      models.Ad.withTransaction(tx, function() { this.dbInit(); });
      models.Image.withTransaction(tx, function() { this.dbInit(); });
      models.AdStat.withTransaction(tx, function() { this.dbInit(); });
      models.Campaign.withTransaction(tx, function() { this.dbInit(); });
      models.CampStat.withTransaction(tx, function() { this.dbInit(); });
      models.ConnectedObject.withTransaction(tx, function() { this.dbInit(); });
      models.Contract.withTransaction(tx, function() { this.dbInit(); });
      models.Topline.withTransaction(tx, function() { this.dbInit(); });
      models.BCT.withTransaction(tx, function() { this.dbInit(); });
    }, storage.errorCallback, function() {
      require("./controller/migrateDB/textIDs")
        .migrate(uid, DB, function() {
          require("./controller/migrateDB/removeCompletions")
            .migrate(uid, DB, callback || fun.FT);
        });
    });
  };

  drop = function(soft, callback) {
    var models = require("./models");
    // drop everything in one transaction
    DB.transaction(function(tx) {
      models.Account.withTransaction(tx, function() { this.dbDrop(); });
      models.Ad.withTransaction(tx, function() { this.dbDrop(); });
      models.Image.withTransaction(tx, function() { this.dbDrop(); });
      models.AdStat.withTransaction(tx, function() { this.dbDrop(); });
      models.Campaign.withTransaction(tx, function() { this.dbDrop(); });
      models.CampStat.withTransaction(tx, function() { this.dbDrop(); });
      models.ConnectedObject.withTransaction(tx, function() { this.dbDrop(); });
      models.Contract.withTransaction(tx, function() { this.dbDrop(); });
      models.Topline.withTransaction(tx, function() { this.dbDrop(); });
      if (!soft) {
        models.BCT.withTransaction(tx, function() { this.dbDrop(); });
      }
    }, storage.errorCallback, callback || fun.FT);
  };
}


exports.init = init;
exports.drop = drop;
