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

var fun = require("../../../uki-core/function");
var storage = require("../../../storage/storage");

function migrate(uid, DB, callback) {
  DB.transaction(function(tx) {
    tx.executeSql('SELECT id FROM account LIMIT 1', [],
    function(tx, r) {
      if (r.rows && r.rows.length && (typeof r.rows.item(0).id == 'number')) {
        var Account = require("../../model/account").Account;

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

exports.migrate = migrate;
