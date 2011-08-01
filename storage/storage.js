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

    FB = require("./lib/connect").FB,
    storeUtils = require("./lib/utils"),
    urllib = require("./lib/urllib"),

    pathUtils = require("./lib/pathUtils"),
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
//        _-----_  \|-_____-|/                          |
//   _-----_  _-|   |-_____-|   _-----_  _-----_        |
//  |-_____-| _-|   |-_____-|  |-__ _-----_  _-----_    |
//  |-_____-| _-|    -_____-   |-__|-_____-||-_____-|   |
//_ |-_____-| ________________ |-__|-_____-||-_____-| __|
//   -_____-                    -__|-_____-||-_____-|    \
//                                  -_____-  -_____-      \
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
    var Self = this;
    // Error handling callback directly in FB.api
    // look at ads-connect
    if (!data) {
      callback([]);
      return;
    }
    var items = storeUtils.wrapArray(data).map(function(c) {
      var item = new Self();
      item
        .muteChanges(true)
        .fromRemoteObject(c)
        .muteChanges(false);
      return item;
    });
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

  graphEdgeName: fun.newProp('graphEdgeName'),

  /**
  * @param paths: 1 path if batchCall is false. array of paths if not
  */
  loadAndStore: function(paths, options, edgeCall, callback) {
    this.loadGRemote(paths, options, edgeCall, fun.bind(function(data, isDone) {
      this.storeMulti(data, function(data) {
          callback(data, isDone);
        });
      }, this)
    );
  },

  loadGRemote: function(graphPaths, options, edgeCall, callback) {
    var isDone;
    if (utils.isArray(options)) {
      options.forEach(function(opt) {
        opt.date_format = 'U';
      });
    } else {
      options.date_format = 'U';
    }
    if (utils.isArray(graphPaths)) {
      var remaining = graphPaths.slice(20);
      graphPaths = graphPaths.slice(0, 20);
      isDone = !remaining.length;
      var batching = {};
      batching.batch = graphBatcher(graphPaths, options);
      FB.api(
        '/',
        'POST',
        batching,
        fun.bind(function(data) {
          if (!isDone) {
            this.loadGRemote(remaining, options, edgeCall, callback);
          }
          this.batchCallback(data, isDone, edgeCall, callback);
        }, this)
      );
    } else {
      isDone = true;
      FB.api(
        graphPaths,
        options,
        fun.bind(function(data) {
          if (edgeCall) {
            // Aggregate data from paging calls
            var _result = [];
            var edgeTraversal = function(edgeData) {
              _result.push.apply(_result, edgeData[this.graphEdgeName()]);
              if (edgeData && edgeData.paging && edgeData.paging.next &&
                edgeData.count && _result.length < edgeData.count) {
                FB.api(edgeData.paging.next, fun.bind(edgeTraversal, this));
              } else {
                this.loadCallback(_result, isDone, callback);
              }
            };
            edgeTraversal.call(this, data);
          } else {
            this.loadCallback(data, isDone, callback);
          }
        }, this)
      );
    }
  },

  batchCallback: function(data, isDone, edgeCall, callback, _respItems) {
    var edgeName = edgeCall && this.graphEdgeName();
    _respItems = _respItems || [];
    var pagers = [];
    data.map(function(response, i) {
      if (response.body && response.body.error) {
        var msg = response.body.error.message,
            type = response.body.error.type,
            code = response.code;
        throw new Error(code + ': ' + type + ' => ' + msg);
      }
      var responseBody = JSON.parse(response.body);
      _respItems[i] = _respItems[i] || [];
      if (edgeCall) {
        // aggregate data from paging calls
        if (responseBody && responseBody.paging && responseBody.paging.next &&
          responseBody.count && _respItems[i].length < responseBody.count) {
          pagers.push(responseBody.paging.next);
        }
        _respItems[i].push.apply(_respItems[i], responseBody[edgeName]);
      } else {
        _respItems[i].push(responseBody);
      }
    });
    if (!!pagers.length) {
      // pagers cannot have more than 20 paths
      var options = {};
      options.batch = graphBatcher(pagers, { date_format: 'U' });
      FB.api('/', 'POST', options, fun.bind(function(data) {
        this.batchCallback(data, isDone, edgeCall, callback, _respItems);
      }, this));
    } else {
      // set isDone appropriately based on state of batch calls
      var allItems = [];
      _respItems.map(function(items) {
        allItems.push.apply(allItems, items);
      });
      this.loadCallback(allItems, isDone, callback);
    }
  },

  /*
   * @param data = remotely loaded data
   * @param isDone = is it the last call in a sequence of batch calls?
   * @param callback
   */
  loadCallback: function(data, isDone, callback) {
    var Self = this;
    data = data || [];
    var items = storeUtils.wrapArray(data).map(function(c) {
      var item = new Self();
      item
        .muteChanges(true)
        .fromRemoteObject(c)
        .muteChanges(false);
      return item;
    });
    callback(items, isDone);
  },

  // ---- ++++ End Graph API ++++ -----

  // db
  db: fun.newProp('db'),

  objectStoreName: fun.newProp('objectStoreName')
};

Storage.tableName = Storage.objectStoreName;

Storage
  .defaultPropType(require("./prop/base").Base)
  .resultSetType(ResultSet);


// --- Utility private functions
/**
 * @param paths = array of paths to batch together
 * currently assumes that each path is clear of any querystring
 * @param optionsArr = could be jsut one object with options
 * or array with same length as paths with distinct options for each path
 */
function graphBatcher(paths, optionsArr) {
  return paths.map(function(path, i) {
    var options = utils.isArray(optionsArr) ? optionsArr[i] : optionsArr;
    if (urllib.isUrl(path)) {
      var url = path;
      utils.extend(options, urllib.parsePagingParams(url));
      path = urllib.parseRelPath(url);
    }
    if (options) {
      path += (path.indexOf('?') > -1) ? '&' : '?';
      path += urllib.stringify(options);
    }
    var batches = {
      method: 'GET',
      relative_url: path
    };
    return batches;
  });
}

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
