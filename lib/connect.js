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


var fun = require("../uki-core/function");
var utils = require("../uki-core/utils");
var urllib = require("./urllib");

var FB = {};

var FBConnection = fun.newClass({
  handleError: function(response) {
    var message;
    if (!response) {
      message = 'FB request failed';
    } else {
      var msg  = response.error_msg || response.error.message;
      var code = response.error_code || response.error.type;
      message = code + ': ' + msg;
    }
    require("./errorReport").report(message, 'connect', 0);
    if (__DEV__) { throw new Error('[RETHROW] ' + message); }
  },

  handleResponse: function(callback, response) {
    // Handle errors from REST and Graph API
    if (!response || response.error || response.error_msg) {
      this.handleError(response);
    } else {
      callback(response);
    }
  },

  api: function() {
    if (!global.FB) {
      throw 'Trying to use connect.js that has not been loaded yet.';
    }
    var args = utils.toArray(arguments);
    var callback = args.pop();
    args.push(fun.bind(this.handleResponse, this, callback));

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
  }
});

exports.FBConnection = FBConnection;
exports.FB = new FBConnection();
