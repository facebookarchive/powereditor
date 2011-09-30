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
* @providesModule ads-lib-graphlink
*
* @author zahanm
*/


var fun = require("../uki-core/function"),
    utils = require("../uki-core/utils"),
    Observable = require("../uki-core/observable").Observable,

    async = require("./async"),
    urllib = require("./urllib"),
    libUtils = require("./utils"),
    adsConnect = require("./connect"),
    FB = adsConnect.FB;

// --- Module level

var LOAD_LIMIT = 500;

/**
 * Graphlink takes care of your linking to the Graph API needs
 *
 * //===========\\
 * ||       //==||=======\\
 * ||       ||  ||       ||
 * ||       ||  || Link! ||
 * \\===========//       ||
 *          \\===========//
 *
 * As a unified error handling behaviour across Graphlink
 * it filters out error'd responses and executes the callback without it
 * It will *always* call the callback
 *
 */
var Graphlink = fun.newClass(Observable, {

  init: function(initArgs) {
    initArgs = initArgs || {};
  },

  /**
   * fetch just one object
   * @param path = required
   * @param options = required
   * @param callback = required
   * @param context = optional
   * @callback = object
   */
  fetchObject: function(path, options, callback, context) {
    var flow_name = 'gl_fetchobject';
    require("../ads/lib/loggingState").startFlow(flow_name, path, options);
    context = context || this;
    options.date_format = 'U'; // XXX temporary
    FB.api(path, options, fun.bind(function(r) {
      if (!adsConnect.isError(r)) {
        this._progress(1);
        callback.call(context, r);
        require("../ads/lib/loggingState").endFlow(flow_name);
      } else {
        this._error(new Error(adsConnect.getErrorMessage(r).msg));
        callback.call(context);
        require("../ads/lib/loggingState").endFlow(flow_name);
      }
    }, this));
  },

  /**
   * fetch many objects by id (using 'ids' graph param)
   * general graph api functionality
   * params assumption: _objs will only be used when ALL params are specified
   * @param path = required
   * @param options = required
   * @param callback = required
   * @param context = optional
   * @callback = object
   */
  fetchObjectsById: function(ids, options, callback, context, _objs) {
    var flow_name = 'gl_fetchobjectsbyid';
    require("../ads/lib/loggingState").startFlow(flow_name, ids, options);
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
    FB.api('/', options, fun.bind(function(r) {
      if (!adsConnect.isError(r)) {
        var len = 0;
        utils.forEach(r, function(robj) {
          len++;
          _objs.push(robj);
        });
        this._progress(len);
        if (remaining && remaining.length) {
          this.fetchObjectsById(remaining, options, callback, context, _objs);
          return;
        }
      } else {
        this._error(new Error(adsConnect.getErrorMessage(r).msg));
      }
      callback.call(context, _objs);
      require("../ads/lib/loggingState").endFlow(flow_name);
    }, this));
  },

  /**
   * fetch all objects on edge
   * params assumption: _objs will only be used when ALL params are specified
   * @param path = required
   * @param options = required
   * @param callback = required
   * @param context = optional
   * @callback = array of objects
   */
  fetchEdge: function(path, options, callback, context, _objs) {
    var flow_name = 'gl_fetchedge';
    require("../ads/lib/loggingState").startFlow(flow_name, path, options);
    context = context || this;
    options.date_format = 'U'; // XXX temporary
    options.limit = options.limit || LOAD_LIMIT;
    _objs = _objs || [];
    FB.api(path, options, fun.bind(function(r) {
      if (!adsConnect.isError(r)) {
        // the edge's key is always 'data'
        Array.prototype.push.apply(_objs, r.data);
        this._progress(r.data.length);
        if (r.paging && r.paging.next && r.data.length) {
          this.fetchEdge(r.paging.next, options, callback, context, _objs);
          return;
        }
      } else {
        this._error(new Error(adsConnect.getErrorMessage(r).msg));
      }
      callback.call(context, _objs);
      require("../ads/lib/loggingState").endFlow(flow_name);
    }, this));
  },

  /**
   * get number of objects on edge
   * @param path = required
   * @param callback = required
   * @param context = optional
   * @callback = count
   */
  fetchEdgeCount: function(path, callback, context) {
    var flow_name = 'gl_fetchedgecount';
    require("../ads/lib/loggingState").startFlow(flow_name, path);
    context = context || this;
    FB.api(path, { limit: 1 }, function(r) {
      if (!adsConnect.isError(r)) {
        callback.call(context, r.count);
      } else {
        this._error(new Error(adsConnect.getErrorMessage(r).msg));
        callback.call(context);
        require("../ads/lib/loggingState").endFlow(flow_name);
      }
    });
  },

  /**
   * get many objects directly accessed
   * @param paths = required
   * @param options = required
   * @param callback = required
   * @param context = optional context in which to call callback
   * @callback = objects fetched
   */
  serialFetchObjects: function(paths, options, callback, context) {
    var flow_name = 'gl_serialFetchObjects';
    require("../ads/lib/loggingState").startFlow(flow_name);
    context = context || this;
    var objects = [];
    async.forEach(
      libUtils.wrapArray(paths),
      function(path, i, iterCallback) {
        this.fetchObject(path, options,
          function(fetched) {
            objects.push(fetched);
            iterCallback();
          }
        );
      },
      // called after async iterator is finished
      function() {
        callback.call(context, objects);
        require("../ads/lib/loggingState").endFlow(flow_name);
      },
      this);
  },

  /**
   * TODO: Implement
   */
  batchFetchObjects: function() {},

  /**
   * get many objects on many edges
   * @param paths = required
   * @param options = required
   * @param callback = required
   * @param context = optional context in which to call callback
   * @callback = objects fetched
   */
  serialFetchEdges: function(paths, options, callback, context) {
    var flow_name = 'gl_serialFetchEdges';
    require("../ads/lib/loggingState").startFlow(flow_name);
    context = context || this;
    var objects = [];
    async.forEach(
      libUtils.wrapArray(paths),
      function(path, i, iterCallback) {
        this.fetchEdge(path, options,
          function(fetched) {
            Array.prototype.push.apply(objects, fetched);
            iterCallback();
          }
        );
      },
      // called after async iterator is finished
      function() {
        callback.call(context, objects);
        require("../ads/lib/loggingState").endFlow(flow_name);
      },
      this);
  },

  /**
   * TODO: Implement
   */
  batchFetchEdges: function() {},

  /**
   * post Object to path
   * @param path = required
   * @param options = required
   * @param callback = required
   * @param context = optional context in which to call callback
   * @callback = result from server
   */
  postObject: function(path, options, callback, context) {
    var flow_name = 'postObject';
    require("../ads/lib/loggingState").startFlow(flow_name, path, options);
    context = context || this;
    options.date_format = 'U'; // XXX temporary
    FB.api(path, 'post', options, fun.bind(function(r) {
      if (!adsConnect.isError(r)) {
        callback.call(context, r);
        require("../ads/lib/loggingState").startFlow(flow_name);
      } else {
        this._error(new Error(adsConnect.getErrorMessage(r).msg));
        callback.call(context);
        require("../ads/lib/loggingState").startFlow(flow_name);
      }
    }, this));
  },

  /**
   * TODO: Implement
   */
  batchPostObjects: function() {},

  /**
   * Do a query search on the Graph API
   *
   * @param searchType
   * @param options for the search
   * @param callback function to be called after server results are obtained
   * @param (optional) context in which to call the callback function
   */
  querysearch: function(searchType, options, callback, context) {
    options.type = searchType;
    this.fetchObject('search', options, callback, context);
  },

  // --- handlers

  /** progress trigger
   * @param update integer number of objects dl'd
   */
  _progress: function(update) {
    this.trigger({
      type: 'progress',
      update: update
    });
  },

  /** error trigger
   * @param err Error object thrown / passed back during dl
   */
  _error: function(err) {
    this.trigger({
      type: 'error',
      error: err
    });
  }
});


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

exports.gl = new Graphlink();
exports.Graphlink = Graphlink;
