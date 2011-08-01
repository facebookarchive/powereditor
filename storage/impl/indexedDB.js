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


var names = [
  'IndexedDB',
  'IDBKeyRange',
  'IDBCursor',
  'IDBDatabase',
  'IDBErrorEvent',
  'IDBEvent',
  'IDBFactory',
  'IDBEnvironment',
  'IDBIndex',
  'IDBObjectStore',
  'IDBRequest',
  'IDBSuccessEvent',
  'IDBTransaction',
  'IDBTransactionEvent'
];
['webkit', 'moz'].forEach(function(prefix) {
  if (global[prefix + names[0]]) {
    names.forEach(function(name) {
      if (global[prefix + name]) {
        global[name] = global[prefix + name];
      }
    });
  }
});


var IndexedDB = {
  impl: 'IndexedDB',

  // should be called in setVersion().onsuccess
  dbInit: function() {
    if (utils.toArray(this.db().objectStoreNames)
      .indexOf(this.objectStoreName()) > -1) {
      return;
    }
    var store = this.db().createObjectStore(
      this.objectStoreName(),
      { keyPath: 'id', autoIncrement: !!this.prop('id').autoincrement });

    this.indexedProps().forEach(function(prop) {
      if (prop.name != 'id') {
        store.createIndex(
          prop.name,
          prop.name,
          { unique: !!(prop.indexed || '').match(/unique/i) }
        );
      }
    });
  },

  dbDrop: function() {
    this.db().deleteObjectStore(this.objectStoreName());
  },

  // GET
  find: function(id, callback) {
    this
      .db()
      .transaction([this.objectStoreName()])
      .objectStore(this.objectStoreName())
      .get(id).onsuccess = fun.bind(function(e) {
        var result = e.target.result;
        callback(this._singleResult(result));
      }, this);
  },

  findOneBy: function(propName, value, callback) {
    if (propName === 'id') {
      this.find(value, callback);
      return;
    }
    var bound = IDBKeyRange.only(value);
    this
      .db()
      .transaction([this.objectStoreName()])
      .objectStore(this.objectStoreName())
      .index(prop.name)
      .openCursor(bound).onsuccess = fun.bind(function(e) {
        var cursor = e.target.result;
        callback(this._singleResult(cursor.value));
      }, this);
  },

  findAll: function(callback) {
    this
      .db()
      .transaction([this.objectStoreName()])
      .objectStore(this.objectStoreName())
      .openCursor().onsuccess = fun.bind(
        this._cursorResult,
        this,
        callback,
        []);
  },

  findAllBy: function(prop, values, callback) {
    if (!utils.isArray(values)) { values = [values]; }

    if (prop == 'id') {
      this._findAllById(values, callback);
      return;
    }

    var index = this
      .db()
      .transaction([this.objectStoreName()])
      .objectStore(this.objectStoreName())
      .index(prop);

    var result = [];
    var ResultSet = this.resultSetType();

    var onsuccess = fun.bind(function(e) {
      var cursor = e.target.result;
      if (cursor) {
        result.push(this._singleResult(cursor.value));
        cursor['continue']();
      } else {
        values = values.slice(1);
        fetch();
      }
    }, this);

    function fetch() {
      if (values.length) {
        var bound = IDBKeyRange.only(values[0]);
        index.openCursor(bound).onsuccess = onsuccess;
      } else {
        callback(ResultSet.fromArray(result));
      }
    }

    fetch();
  },

  // UPDATE
  store: function(item, callback) {
    var store = this
      .db()
      .transaction([this.objectStoreName()], IDBTransaction.READ_WRITE)
      .objectStore(this.objectStoreName());

    if (item.id()) {
      store.get(item.id()).onsuccess = function(e) {
        var request;
        if (e.target.result === undefined) {
          request = store.add(item.toDBObject());
        } else {
          request = store.put(item.toDBObject());
        }
        request.onsuccess = callback;
      };
    } else {
      var obj = item.toDBObject();
      delete obj.id;
      store.add(obj).onsuccess = function(e) {
        item.id(e.target.result);
        callback && callback();
      };
    }
  },

  storeMulti: function(items, callback) {
    var transaction = this
      .db()
      .transaction([this.objectStoreName()], IDBTransaction.READ_WRITE);
    var store = transaction
      .objectStore(this.objectStoreName());
    var togo = items.length;

    transaction.oncomplete = function() {
      callback && callback(items);
    };

    items.forEach(function(item) {
      if (item.id()) {
        store.get(item.id()).onsuccess = function(e) {
          var request;
          if (e.target.result === undefined) {
            request = store.add(item.toDBObject());
          } else {
            request = store.put(item.toDBObject());
          }
        };
      } else {
        var obj = item.toDBObject();
        delete obj.id;
        store.add(obj).onsuccess = function(e) {
          item.id(e.target.result);
        };
      }
    });
  },

  // DELETE
  deleteItem: function(item, callback) {
    var store = this
      .db()
      .transaction([this.objectStoreName()], IDBTransaction.READ_WRITE)
      .objectStore(this.objectStoreName());
    store['delete'](item.id()).onsuccess = callback;
  },

  deleteBy: function(prop, values, callback) {
    this.findAllBy(prop, values, fun.bind(function(items) {
      var transaction = this
        .db()
        .transaction([this.objectStoreName()], IDBTransaction.READ_WRITE);

      var store = transaction
        .objectStore(this.objectStoreName());

      items.forEach(function(item) {
        store['delete'](item.id());
      });

      transaction.oncomplete = callback;
    }, this));
  },

  clear: function(callback) {
    var store = this
      .db()
      .transaction([this.objectStoreName()], IDBTransaction.READ_WRITE)
      .objectStore(this.objectStoreName());

    store.clear().onsuccess = function() {
      callback && callback();
    };
  },

  _findAllById: function(values, callback) {
    var index = this
      .db()
      .transaction([this.objectStoreName()])
      .objectStore(this.objectStoreName());

    var result = [];
    var ResultSet = this.resultSetType();

    var onsuccess = fun.bind(function(e) {
      var item = e.target.result;
      if (item) {
        result.push(this._singleResult(item));
      }
      values = values.slice(1);
      fetch();
    }, this);

    function fetch() {
      if (values.length) {
        index.get(values[0]).onsuccess = onsuccess;
      } else {
        callback(ResultSet.fromArray(result));
      }
    }

    fetch();
  },

  _singleResult: function(result) {
    Klass = this;

    var obj = new Klass();
    return obj
      .muteChanges(true)
      .id(result.id)
      .fromDBObject(result)
      .muteChanges(false);
  },

  _cursorResult: function(callback, result, e) {
    var cursor = e.target.result;
    if (cursor) {
      result.push(this._singleResult(cursor.value));
      cursor['continue']();
    } else {
      callback(this.resultSetType().fromArray(result));
    }
  }
};


exports.IndexedDB = IndexedDB;

