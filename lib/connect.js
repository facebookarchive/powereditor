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
    asyncUtils = require("./async"),
    Observable = require("../uki-core/observable").Observable,
    urllib = require("./urllib"),
    RefreshDialog = require("../ads/view/refreshDialog").RefreshDialog;

var FB = {};

FB.api = function() {
  if (!global.FB) {
    throw 'Trying to use connect.js that has not been loaded yet.';
  }
  var args = utils.toArray(arguments);
  var callback = args.pop();
  args.push(fun.bind(handleResponse, this, callback));

  // If graph url is complete, make it just relative graph path
  if (typeof args[0] === 'string' && urllib.isUrl(args[0])) {
    var url = args[0];
    // extract relative path
    var rel_path = urllib.parseRelPath(url);

    if (url.indexOf('?') > -1) {
      var paging_params = urllib.parsePagingParams(url);
      var qs = urllib.stringify(paging_params);
      rel_path += qs ? ('?' + qs) : '';
    }

    args[0] = rel_path;
  }
  return global.FB.api.apply(global.FB, args);
};


// -- public static methods

function isError(r) {
  return !r || r.error || r.error_msg;
}

function getErrorMessage(r) {
  if (!r) { return {}; }
  return {
    msg: r.error_msg || (r.error && r.error.message),
    code: r.error_code || (r.error && r.error.type)
  };
}

// -- private utility functions

function handleResponse(callback, response) {
  // Report errors from REST and Graph API
  if (isError(response)) {
    reportError(response);
  }
  // always callback
  callback(response);
}

function reportError(response) {
  var summary, errmsg;
  if (!response) {
    summary = tx('ads:pe:fbrequestfail');
  } else {
    errmsg = getErrorMessage(response);
    summary = errmsg.code + ': ' + errmsg.msg;
  }
  // handle the common message cases
  if (do_not_report(errmsg.code, errmsg.msg)) {
    return;
  }
  require("./errorReport").report(summary, 'connect');
}

// clowntown: it's populated when this module is req'd
// each of these is a REGEX
// watch out!
// currently checking if user is logged out
var excludePattern = new RegExp(
  [
    'Session has expired at unix time \\d+',
    'The session is invalid because the user logged out'
  ].join('|'));

function do_not_report(code, msg) {
  if (excludePattern.test(msg)) {
    if (code == 'OAuthException' || code == '190') {
      // is this really *more* readable? if not blame @jyan
      new RefreshDialog().visible(true);
    }
    return true;
  }
  return false;
}

var FBBatch = fun.newClass({
  init: function() {
    this.requests = [];
    this.callbacks = [];
    return this;
  },

  add: function(method, path, params, callback) {
    this.requests.push({
      method: method,
      path: path,
      params: params });
    this.callbacks.push(callback);
  },

  _exportRequestsForBatch: function() {
    var requests = [];
    for (var i = 0; i < this.requests.length; i++) {
      requests.push({
        method: this.requests[i].method,
        relative_url: this.requests[i].path,
        body: urllib.stringify(this.requests[i].params)});
    }
    return requests;
  },

  run: function(final_callback) {
    if (this.requests.length === 0) {
      final_callback();
      return;
    }

    if (this.requests.length === 1) {
      var request = this.requests[0];
      if (Env.DEBUG) {
        console.debug('FB.FBBatch(1):');
        console.debug(request);
      }
      // gracefully degrade to the normal request if there's only one.
      FB.api(request.path, request.method, request.params || {},
          fun.bind(function(r) {
        if (Env.DEBUG) {
          console.debug('FB.FBBatch(1 response):');
          console.debug(request);
          console.debug(r);
        }
        var body = JSON.stringify(r);
        var code = 200;
        var resps = [ { body: body, code: code } ];
        asyncUtils.forEach(resps,
            fun.bind(this._handleResponse, this), final_callback);
      }, this));
    } else {
      if (Env.DEBUG) {
        console.debug('FB.FBBatch(many request):');
        console.debug(this.requests);
      }
      FB.api('/', 'post', {batch: this._exportRequestsForBatch()},
          fun.bind(function(resps) {
        if (Env.DEBUG) {
          console.debug('FB.FBBatch(many response):');
          console.debug(this.requests);
          console.debug(resps);
        }
        asyncUtils.forEach(resps,
            fun.bind(this._handleResponse, this), final_callback);
      }, this));
    }
  },

  _handleResponse: function(resp, i, iterator_callback) {
    try {
      this.callbacks[i].call(null, resp, iterator_callback);
    } catch (e) {
      require("./errorReport").handleException(
        e, 'batch:handle_response');
    }
  }

});

exports.isError = isError;
exports.getErrorMessage = getErrorMessage;

exports.FB = FB;
exports.FBBatch = FBBatch;
