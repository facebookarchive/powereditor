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
var utils = require("../../uki-core/utils");
var storage = require("../../storage/storage");


function migrateToUIDStorage(uid, newDb, callback) {
  var models = require("../models");
  var tables = [];
  utils.forEach(models, function(m, key) {
    m.tableName && tables.push(m.tableName());
  });
  var oldDb = global.openDatabase(
    'bamboo',
    "",
    'bamboo main storage',
    100 * 1000 * 1000);

  function copyTable(table, index, createCallback) {
    oldDb.readTransaction(function(tx) {

      tx.executeSql(
        'SELECT * FROM ' + table,
        [],
        function(tx, rows) {
          rows = rows.rows;
          newDb.transaction(function(tx) {

            for (var i = 0; i < rows.length; i++) {
              var row = rows.item(i);
              var values = [];
              var placeholders = [];
              var names = [];
              utils.forEach(row, function(value, key) {
                placeholders.push('?');
                values.push(value);
                names.push(key);
              });
              tx.executeSql(
                'INSERT INTO ' + table + ' (' + names.join(',') + ')' +
                ' VALUES (' + placeholders.join(',') + ')', values);
            }

          }, createCallback, createCallback); // newDb.tx
        }); // oldDb.tx.executeSql
      }); // oldDb.tx
  }

  oldDb.readTransaction(function(tx) {
    tx.executeSql('SELECT * FROM ad LIMIT 1',
    [], function(tx, result) {
      if (result && result.rows && result.rows.length) {
        // database exists, go on change everything
        require("../../storage/lib/async").forEach(tables, copyTable, function() {
          callback();
          oldDb.transaction(function(tx) {
            utils.forEach(tables, function(table) {
              tx.executeSql('DROP TABLE ' + table);
            });
            callback();
          });
        });
      } else {
        callback();
      }
    }, function() { callback(); });
  });
}

function migrateToTEXTIds(uid, DB, callback) {
  DB.transaction(function(tx) {
    tx.executeSql('SELECT id FROM account LIMIT 1', [],
    function(tx, r) {
      if (r.rows && r.rows.length && (typeof r.rows.item(0).id == 'number')) {
        var Account = require("../model/account").Account;

        // findAll will try to fetch id from an indexed column,
        // and it is broken. So load data manually
        tx.executeSql('SELECT data FROM account LIMIT 1', [],
        function(tx, r) {
          var accounts = [];
          for (var i = 0; i < r.rows.length; i++) {
            var obj = JSON.parse(r.rows.item(i).data);
            accounts.push(new Account().fromDBObject(obj).id(obj.id));
          }

          // recreate table
          Account.dbDrop(function() {
            // there's no easy way to get a callback from dbInit
            // so create a separate transation and use it's callback instead
            DB.transaction(function(tx) {
              Account.withTransaction(tx, function() { this.dbInit(); });
            }, storage.errorCallback, function() {
              Account.storeMulti(accounts, callback || fun.FT);
            });
          });
        });
      } else {
        callback();
      }
    });
  });
}

exports.migrateToUIDStorage = migrateToUIDStorage;
exports.migrateToTEXTIds = migrateToTEXTIds;
