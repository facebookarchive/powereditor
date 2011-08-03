/**
* Copyright 2004-present Facebook. All Rights Reserved.
*
*/


var fun = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),

    urllib = require("./urllib"),
    storeUtils = require("./utils"),
    FB = require("./connect").FB,

    graphlink = exports;

var LOAD_LIMIT = 500;

/**
 * fetch just one object
 * @callback = object
 */
graphlink.fetchObject = function(path, options, callback) {
  callback = callback || options;
  options = utils.isFunction(options) ? {} : options;
  options.date_format = 'U'; // XXX temporary
  FB.api(path, options, fun.bind(callback, this));
};

/**
 * fetch many objects by id
 * general graph api functionailty
 * @callback = object
 */
graphlink.fetchObjectsById = function(ids, options, callback, _objs) {
  callback = callback || options;
  options = utils.isFunction(options) ? {} : options;
  options.date_format = 'U'; // XXX temporary
  _objs = _objs || [];
  ids = storeUtils.wrapArray(ids);
  var remaining;
  if (ids.length > LOAD_LIMIT) {
    remaining = ids.slice(LOAD_LIMIT);
    ids = ids.slice(0, LOAD_LIMIT);
  }
  options.ids = ids.join(',');
  FB.api('/', options, fun.bind(function(r) {
    utils.forEach(r, function(robj) {
      _objs.push(robj);
    });
    if (remaining && remaining.length) {
      graphlink.fetchObjectsById(remaining, options, callback, _objs);
    } else {
      callback(_objs);
    }
  }, this));
};

/**
 * fetch all objects on edge
 * @callback = array of objects
 */
graphlink.fetchEdge = function(path, options, callback, _objs) {
  callback = callback || options;
  options = utils.isFunction(options) ? {} : options;
  options.date_format = 'U'; // XXX temporary
  _objs = _objs || [];
  FB.api(path, options, fun.bind(function(r) {
    // the edge's key is always 'data'
    Array.prototype.push.apply(_objs, r.data);
    if (r.paging && r.paging.next && (!r.count || _objs.length < r.count)) {
      graphlink.fetchEdge(r.paging.next, options, callback, _objs);
    } else {
      callback.call(this, _objs);
    }
  }, this));
};

/**
 * get number of objects on edge
 * @callback = count
 */
graphlink.fetchEdgeCount = function(path, callback) {
  FB.api(path, { limit: 1 }, function(r) { callback(r.count); });
};

graphlink.batchFetchObjects = function() {};

graphlink.batchFetchEdges = function() {};

graphlink.postObject = function() {};

graphlink.batchPostObjects = function() {};

graphlink.querysearch = function() {};


// --- Utility private functions

/**
 * helper to bundle paths for a batch call
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
