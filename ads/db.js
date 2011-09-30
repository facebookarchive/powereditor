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
    utils = require("../uki-core/utils"),

    storage = require("../storage/storage"),

    models = require("./models");

/**
 * YOU HAVE TO CHANGE THE DB_VERSION IF YOU CHANGE THE SCHEMA
 * AND WANT TO RUN A MIGRATION
 *
 *  ,   A           {}
 * / \, | ,        .--.
 *|    =|= >      /.--.\
 * \ /` | `       |====|
 *  `   |         |`::`|
 *      |     .-;`\..../`;-.
 *     /\\/  /  |...::...|  \
 *     |:'\ |   /'''::'''\   |
 *      \ /\;-,/\   ::   /\--;
 *      |\ <` >  >._::_.<,<__>
 *      | `""`  /   ^^   \|  |
 *      |       |        |\::/
 *      |       |        |/|||
 *      |       |___/\___| '''
 *      |        \_ || _/
 *      |        <_ >< _>
 *      |        |  ||  |
 *      |        |  ||  |
 *      |       _\.:||:./_
 *      |      /____/\____\
 *
 * STUFF WILL BREAK IF YOU DON'T. IRREPARABLY. I'M NOT JOKING
 *
 */

var DB_VERSION = '1.2';
var DB;
var init, drop;

if (storage.impl === 'IndexedDB') {

// IndexedDB docs: https://developer.mozilla.org/en/IndexedDB
// w3c spec: http://www.w3.org/TR/IndexedDB/

  init = function(uid, callback) {
    var req = global.IndexedDB.open(
      uid + '_powereditor',
      'PowerEditor main storage');
    req.onsuccess = function(e) {
      DB = e.result || e.target.result;

      utils.forEach(models, function(model) {
        model.db(DB);
      });

      if (DB.version != DB_VERSION) {
        var oldVersion = DB.version,
            changeReq = DB.setVersion(DB_VERSION);
        changeReq.onerror = storage.errorCallback;
        changeReq.onsuccess = function() {
          // tx is a non-blocking transaction to the DB with VERSION_CHANGE
          // priviledges to change objectStores and indices
          var tx = changeReq.result;
          switch (oldVersion) {
            case '':
            case '0.0':
              // if it's a new or dropped db
              utils.forEach(models, function(model) {
                model.dbInit();
              });
              break;
            case '1.0':
              // TODO remove
              require("./controller/migrateDB/removeCompletions")
                .migrateIndexDB(uid, DB);
              // break intentionally left out
            case '1.1':
              require("./controller/migrateDB/adAccountIDs")
                .migrateIDB(uid, DB, tx);
              break;
            default:
              // Not exactly sure how it would get here
              utils.forEach(models, function(model) {
                model.dbInit();
              });
          }
          tx.oncomplete = callback || fun.FT;
        };
      } else {
        callback && callback();
      }
    };
    req.onerror = storage.errorCallback;
  };

  drop = function(soft, callback) {
    var req = DB.setVersion('0.0');
    req.onsuccess = function(e) {
      e.target.result.oncomplete = callback;
      utils.forEach(models, function(model) {
        if (model.softDrop() || !soft) {
          model.dbDrop();
        }
      });
    };

    req.onerror = storage.errorCallback;
  };


} else {

// WebSQL docs: http://www.w3.org/TR/webdatabase/#dom-opendatabase

  init = function(uid, callback) {

    DB = global.openDatabase(
      uid + '_powereditor',
      '', // open with whatever version there is
      'PowerEditor main storage',
      100 * 1000 * 1000  // esimated size in bytes
      );

    utils.forEach(models, function(model) {
      model.db(DB);
    });

    if (DB.version === '' || DB.version === '0.0') {
      // control comes here if the db is brand, spanking new
      // well then, create the models, and run no migrations
      // OR, should create tables using dbInit if it was explicit drop
      DB.changeVersion(DB.version, DB_VERSION, function(tx) {
        utils.forEach(models, function(model) {
          model.withTransaction(tx, function() { this.dbInit(); });
        });
      }, storage.errorCallback, callback || fun.FT);
      return;
    }

    if (DB.version !== DB_VERSION) {
      // if we've reached here, the db existed before
      // and user did not hit 'drop'
      DB.changeVersion(DB.version, DB_VERSION, function(tx) {
        // nothing to do
        // migration should take into account assumptions of old schema
        // ironically dbInit itself makes assumption about schema

        // TODO use transaction (tx) for migration
        // this is where migration should take place, *synchronously* in 1 tx
        // success callback is the XXX wrong place for migration
      }, storage.errorCallback, function() {
        // now, we're guaranteed that it's an old valid db
        require("./controller/migrateDB/adAccountIDs")
          .migrateWebSql(uid, DB, function() {
          require("./controller/migrateDB/textIDs")
            .migrate(uid, DB, function() {
            require("./controller/migrateDB/removeCompletions")
              .migrate(uid, DB, callback || fun.FT);
          });
        });
      });
    } else {
      callback && callback();
    }
  };

  drop = function(soft, callback) {
    // drop everything in one transaction
    DB.changeVersion(DB.version, '0.0', function(tx) {
      utils.forEach(models, function(model) {
        if (model.softDrop() || !soft) {
          model.withTransaction(tx, function() { this.dbDrop(); });
        }
      }); // utils.forEach
    }, storage.errorCallback, callback || fun.FT);
  };
}


exports.init = init;
exports.drop = drop;
