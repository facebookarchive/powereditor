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


var fun   = require("../uki-core/function"),
    utils = require("../uki-core/utils"),

    adsConnect = require("../lib/connect"),
    FB = adsConnect.FB,
    libutils = require("../lib/utils"),
    graphlink = require("../lib/graphlink").gl,
    conflicter = require("../lib/conflicter").cc,

    Storable = require("./storable").Storable,
    ResultSet = require("./resultSet").ResultSet,
    WebSqlImpl = require("./impl/webSql").WebSql,
    IndexedDBImpl = require("./impl/indexedDB").IndexedDB;


// Storage
//______________________________________________________|
//__________________[oo_H_oo]___________________________|
//                      |                               |
//                      |                               |
//                   +++++++                            |
//                 //       \\                          |
//                || _-----_ ||                         |
//                 \|-_____-|/                          |
//   _-----_        |-_____-|   _-----_  _-----_        |
//  |-__ _-----_    |-_____-|  |-__ _-----_  _-----_    |
//  |-__|-_____-|    -_____-   |-__|-_____-||-_____-|   |
//_ |-__|-_____-|_____________ |-__|-_____-||-_____-| __|
//   -__|-_____-|               -__|-_____-||-_____-|    \
//       -_____-                    -_____-  -_____-      \
//
/**
 * @example
 *
 * var storage = require(".");
 *
 * var Ad = storage.newStorage(Changeable, Validatable, {
 *   ucName: function() {
 *     return this.name().toUpperCase();
 *   }
 * });
 *
 * Ad
 *   .db(openDatabase(...))
 *   .tableName('ad');
 * // or
 * IndexedDB.open("MyTestDatabase").onsuccess = function() {
 *   Ad
 *     .db(this.result)
 *     .objectStoreName('ad');
 * };
 *
 * Ad.addProp({
 *   type: require("./prop/timestamp").Timestamp,
 *   name: 'created_date',
 *   db:   true
 * });
 *
 * Ad.addProp({
 *   type: require("./prop/base").Base,
 *   name: 'name',
 *   def:  '',
 *   db:   true
 * });
 */

// --- Utils ----

function newStorage() {
  var args = Array.prototype.slice.call(arguments),
      base;

  if (args.length && isStorable(args[0])) {
    base = args.shift();
  } else {
    // technically Storable is a mixin
    base = Storable;
  }
  args.unshift(base);
  // args => ( [base | Storable], ... , childClass )
  var klass = fun.newClass.apply(fun, args);

  utils.extend(klass, Storage);
  klass._props = [];
  klass._propMap = {};
  klass._indexedProps = [];
  klass.prototype.storage = function() {
    return klass;
  };

  Array.prototype.push.apply(klass._props, base._props || []);
  utils.extend(klass._propMap, base._propMap || {});
  Array.prototype.push.apply(klass._indexedProps, base._indexedProps || []);

  return klass;
}

function isStorable(classSpec) {
  return classSpec.prototype && utils.isFunction(classSpec.prototype.storage);
}

// --- END Utils ---

var Storage = {

  // property management
  props: function() {
    return this._props;
  },

  prop: function(name) {
    return this._propMap[name];
  },

  indexedProps: function() {
    return this._indexedProps;
  },

  defaultPropType: fun.newProp('defaultPropType'),

  resultSetType: fun.newProp('resultSetType'),

  addProp: function(args) {
    var Type = this.defaultPropType();
    var prop = args.type ? new args.type(args) : new Type(args);

    this._propMap[prop.name] = prop;
    this._props.push(prop);
    if (prop.indexed) {
      this._indexedProps.push(prop);
    }

    this.prototype[prop.name] = function(value) {
      if (value === undefined) {
        return prop.getValue(this);
      } else {
        var oldValue = prop.getValue(this);
        prop.setValue(this, value);
        if (!prop.compare(oldValue, prop.getValue(this))) {
            this.triggerChanges(prop.name);
        }
        return this;
      }
    };
  },

  // ---- REST API ----

  remoteMethodName: fun.newProp('remoteMethodName'),

  loadFromRESTAPI: function(options, callback) {
    this.loadRESTRemote(options, fun.bind(function(items) {
      this.storeMulti(items, callback);
    }, this));
  },

  loadRESTRemote: function(options, callback) {
    if (!callback) { callback = options; }

    FB.api(
        utils.extend({ method: this.remoteMethodName() }, options),
      fun.bind(function(data) {
        this.remoteRESTCallback(data, callback);
      }, this)
    );
  },

  remoteRESTCallback: function(data, callback) {
    if (adsConnect.isError(data)) {
      callback([]);
      return;
    }
    var items = libutils.wrapArray(data).map(this.createFromRemote, this);
    callback(items);
  },

  errorCallback: function(e) {
    if (!e) {
      throw new Error('Unknown error in storage from DB');
    }
    var msg = e.message,
        name = e.name;
    throw new Error(name + ': ' + msg);
  },

  // ---- END REST API ----

  // ---- ++++ Graph API ++++ -----

  fetchAndStoreObjects: function(paths, options, callback) {
    callback = callback || options;
    options = utils.isFunction(options) ? {} : options;
    graphlink.serialFetchObjects(paths, options, function(fetched) {
      var created = this.createMultipleFromRemote(fetched);
      // this.checkAllForConflicts(created, function() {
      //   this.storeMulti(created, callback);
      // }, this);
      this.storeMulti(created, callback);
    }, this);
  },

  fetchAndStoreEdges: function(paths, options, callback) {
    callback = callback || options;
    options = utils.isFunction(options) ? {} : options;
    graphlink.serialFetchEdges(paths, options, function(fetched) {
      var created = this.createMultipleFromRemote(fetched);
      // this.checkAllForConflicts(created, function() {
      //   this.storeMulti(created, callback);
      // }, this);
      this.storeMulti(created, callback);
    }, this);
  },

  createFromRemote: function(data) {
    var Self = this;
    var item = new Self();
    item
      .muteChanges(true)
      .fromRemoteObject(data)
      .muteChanges(false);
    return item;
  },

  /*
   * @param data = remotely loaded data
   */
  createMultipleFromRemote: function(data) {
    data = data || [];
    var items = libutils.wrapArray(data).map(this.createFromRemote, this);
    return items;
  },

  // ---- ++++ End Graph API ++++ -----

  // --- conflicts

  checkAllForConflicts: function(remoteObjs, callback, context) {
    context = context || this;
    // executed in context of Storage model class, NOT instance
    if (libutils.contains(utils.pluck(this.props(), 'name'), 'conflicts')) {
      this.findAll(function(localObjs) {
        localObjs.prefetch && localObjs.prefetch();
        conflicter.checkAll(localObjs, remoteObjs);
        callback.call(context);
      });
    } else {
      callback.call(context);
    }
  },

  // db
  db: fun.newProp('db'),

  objectStoreName: fun.newProp('objectStoreName'),

  // 'shift + opt + drop' to remove this model data if false
  softDrop: fun.newProp('softDrop')
};

Storage.tableName = Storage.objectStoreName;

Storage
  .defaultPropType(require("./prop/base").Base)
  .resultSetType(ResultSet)
  .softDrop(true);


// prefer WebSql since Chrome's IndexedDB is terribly slow
var Impl = IndexedDBImpl;
if (global.openDatabase) {
  Impl = WebSqlImpl;
}
utils.extend(Storage, Impl);



exports.impl       = Impl.impl;
exports.ResultSet  = ResultSet;
exports.Storable   = Storable;
exports.Storage    = Storage;
exports.newStorage = newStorage;
exports.isStorable = isStorable;
exports.errorCallback = Storage.errorCallback;
