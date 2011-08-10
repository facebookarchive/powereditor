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


var fun = require("../uki-core/function"),
    utils = require("../uki-core/utils"),

    urllib = require("./urllib"),
    libUtils = require("./utils"),
    FB = require("./connect").FB,

    graphlink = exports;

/**
 * fetch just one object
 * @param path = required
 * @param options = required
 * @param callback = required
 * @param context = optional
 * @callback = object
 */
graphlink.fetchObject = function(path, options, callback, context) {
  context = context || this;
  options.date_format = 'U'; // XXX temporary
  FB.api(path, options, function(r) {
    graphlink.progress && graphlink.progress.statusUpdate(1);
    callback.call(context, r);
  });
};

/**
 * fetch many objects by id
 * general graph api functionality
 * params assumption: _objs will only be used when ALL params are specified
 * @param path = required
 * @param options = required
 * @param callback = required
 * @param context = optional
 * @callback = object
 */
graphlink.fetchObjectsById = function(ids, options, callback, context, _objs) {
  context = context || this;
  options.date_format = 'U'; // XXX temporary
  _objs = _objs || [];
  ids = libUtils.wrapArray(ids);
  var remaining;
  if (ids.length > LOAD_LIMIT) {
    remaining = ids.slice(LOAD_LIMIT);
    ids = ids.slice(0, LOAD_LIMIT);
  }
  options.ids = ids.join(',');
  FB.api('/', options, function(r) {
    var len = 0;
    utils.forEach(r, function(robj) {
      len++;
      _objs.push(robj);
    });
    graphlink.progress && graphlink.progress.statusUpdate(len);
    if (remaining && remaining.length) {
      graphlink.fetchObjectsById(remaining, options, callback, context, _objs);
    } else {
      callback.call(context, _objs);
    }
  });
};

/**
 * fetch all objects on edge
 * params assumption: _objs will only be used when ALL params are specified
 * @param path = required
 * @param options = required
 * @param callback = required
 * @param context = optional
 * @callback = array of objects
 */
graphlink.fetchEdge = function(path, options, callback, context, _objs) {
  context = context || this;
  options.date_format = 'U'; // XXX temporary
  _objs = _objs || [];
  FB.api(path, options, function(r) {
    // the edge's key is always 'data'
    Array.prototype.push.apply(_objs, r.data);
    graphlink.progress && graphlink.progress.statusUpdate(r.data.length);
    if (r.paging && r.paging.next && (!r.count || _objs.length < r.count)) {
      graphlink.fetchEdge(r.paging.next, options, callback, context, _objs);
    } else {
      callback.call(context, _objs);
    }
  });
};

/**
 * get number of objects on edge
 * @param path = required
 * @param callback = required
 * @param context = optional
 * @callback = count
 */
graphlink.fetchEdgeCount = function(path, callback, context) {
  context = context || this;
  FB.api(path, { limit: 1 }, function(r) { callback.call(context, r.count); });
};

graphlink.batchFetchObjects = function() {};

graphlink.batchFetchEdges = function() {};

graphlink.postObject = function(path, options, callback, context) {
  context = context || this;
  options.date_format = 'U'; // XXX temporary
  FB.api(path, 'post', options, fun.bind(callback, context));
};

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

// -- Module level

var LOAD_LIMIT = 500;
graphlink.progress = null;    // progress callback handler
