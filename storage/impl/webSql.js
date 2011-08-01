/**
* Copyright (c) 2011, Facebook, Inc.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
*   * Redistributions of source code must retain the above copyright notice,
*     this list of conditions and the following disclaimer.
*   * Redistributions in binary form must reproduce the above copyright notice,
*     this list of conditions and the following disclaimer in the documentation
*     and/or other materials provided with the distribution.
*   * Neither the name Facebook nor the names of its contributors may be used to
*     endorse or promote products derived from this software without specific
*     prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
* AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*
*/

var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils");


var WebSql = {
  impl: 'WebSql',

  withTransaction: function(tx, callback) {
    this._transaction = tx;
    callback.call(this, this);
    this._transaction = null;
    return this;
  },

  transaction: function(callback) {
    if (this._transaction) {
      callback.call(this, this._transaction);
    } else {
      this.db().transaction(fun.bind(callback, this), this.errorCallback);
    }
  },

  dbInit: function() {
    this.transaction(function(tx) {
      var columns = [];
      var indexes = [];

      this.indexedProps().forEach(function(prop) {
        if (prop.name != 'id') {
          indexes.push(prop.db);
        }
        columns.push(prop.db + ' ' + prop.indexed);
      });
      columns.push('data TEXT');

      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS ' + this.tableName() +
        '  (' + columns.join(',') + ')'
      );
      indexes.forEach(function(index) {
        tx.executeSql(
          'CREATE INDEX IF NOT EXISTS idx_' + this.tableName() +
          '_' + index + ' ON ' + this.tableName() + ' (' + index + ')');
      }, this);
    });
  },

  dbDrop: function(callback) {
    this.transaction(function(tx) {
      tx.executeSql('DROP TABLE IF EXISTS ' + this.tableName(), null,
        callback || fun.FT);
    });
  },

  dbClear: function(callback) {
    this.transaction(function(tx) {
      tx.executeSql('DELETE FROM ' + this.tableName(), null, callback);
    }, this);
  },


  // GET
  find: function(id, callback) {
    return this.findOneBy('id', id, callback);
  },

  findOneBy: function(prop, value, callback) {
    return this.findAllBy(prop, value, callback, true);
  },

  findAll: function(callback) {
    return this.findAllBy(null, null, callback);
  },

  findAllBy: function(prop, value, callback, single) {
    this.transaction(function(tx) {
      sql = 'SELECT id, data FROM ' + this.tableName();

      if (prop) {
        sql += ' WHERE ' + this.prop(prop).db;
        if (utils.isArray(value)) {
          sql += ' IN (' +
          value.map(function() { return '?'; }).join(',') + ')';
        } else {
          sql += ' = ?';
          value = [value];
        }
      }

      tx.executeSql(sql, prop ? value : null,
        fun.bind(function(tx, results) {
          callback(this._rows2obj(results, single));
        }, this));
    }, this);
  },

  // UPDATE
  store: function(item, callback) {
    var columns = ['data'];
    var values  = [item.toDBString()];
    var placeholders = ['?'];

    this.indexedProps().forEach(function(prop) {
      var value = prop.getDBValue(item);
      if (!prop.autoincrement || value) {
        placeholders.push('?');
        columns.push(prop.db);
        values.push(value);
      }
    }, this);

    this.transaction(function(tx) {
      tx.executeSql(
        'INSERT OR REPLACE INTO ' + this.tableName() +
        ' (' + columns.join(',') + ') ' +
        'VALUES(' + placeholders.join(',') + ')',
        values,
        fun.bind(function(tx, resultSet) {
          if (this.prop('id').autoincrement &&
            !this.prop('id').getDBValue(item)) {
            this.prop('id').setDBValue(item, resultSet.insertId);
          }
          callback && callback();
        }, this));
    }, this);
  },

  storeMulti: function(items, callback) {
    this.db().transaction(
      fun.bind(function(tx) {
        this.withTransaction(tx, function() {
          items.forEach(function(item) {
            item.store();
          });
        });
      }, this),
      this.errorCallback,
      function() { callback && callback(items); }
    );
  },

  // DELETE
  deleteItem: function(item, callback) {
    this.deleteBy('id', this.prop('id').getDBValue(item), callback);
  },

  deleteBy: function(prop, value, callback) {
    this.transaction(function(tx) {
      sql = 'DELETE FROM ' + this.tableName();

      if (prop) {
        sql += ' WHERE ' + this.prop(prop).db;
        if (utils.isArray(value)) {
          sql += ' IN (' +
          value.map(function() { return '?'; }).join(',') + ')';
        } else {
          sql += ' = ?';
          value = [value];
        }
      }

      tx.executeSql(sql, prop ? value : null, callback);
    }, this);
  },

  clear: function(callback) {
    this.deleteBy(null, null, callback);
  },

  _rows2obj: function(results, single) {
    var rows = results.rows || [],
    Klass = this;

    if (single) {
      var obj = new Klass();
      obj
        .muteChanges(true)
        .id(rows.item(0).id)
        .fromDBString(rows.item(0).data)
        .muteChanges(false);
      return obj;
    }
    var ResultSet = this.resultSetType();
    var res = new ResultSet(rows, this);
    return res;
  }
};


exports.WebSql = WebSql;

