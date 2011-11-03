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


var utils = require("../uki-core/utils"),
    urllib = exports;

urllib.parseParams = function(url, sep) {
  sep = sep || '&';
  var result = {};
  (url.match(/\?(.*)$/) || ['', ''])[1].split(sep).forEach(function(pair) {
    var match = pair.split('=');
    result[decodeURIComponent(match[0])] = decodeURIComponent(match[1]);
  });
  return result;
};

urllib.parseRelPath = function(url) {
  var partsAfterDomain = url.split('/').slice(3).join('/');
  if (partsAfterDomain.indexOf('?') > -1) {
    partsAfterDomain = partsAfterDomain.slice(0, partsAfterDomain.indexOf('?'));
  }
  return partsAfterDomain;
};

var urllibToJSON = function(obj) {
  if (window.Prototype && Object.toJSON) {
    return Object.toJSON(obj);
  } else if (window.JSON) {
    return JSON.stringify(obj);
  } else {
    throw 'JSON not loaded';
  }
};

urllib.stringify = function(params, sep) {
  sep = sep || '&';
  var components = [];
  utils.forEach(params, function(val, key) {
    if (val instanceof Object) {
      val = urllibToJSON(val);
    }
    components.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
  });
  return components.join(sep);
};

// :D
urllib.isUrl = function(candidate) {
  return (/^http/).test(candidate);
};

/**
 * For paging in the Graph API specifically
 * it really should be a part of connect-js
 */
urllib.parsePagingParams = function(url) {
  var old_params = urllib.parseParams(url);
  var paging_params = {};
  // append relevant params
  ['offset', 'limit', 'since', 'until'].forEach(function(name) {
    paging_params[name] = old_params[name];
  });
  return paging_params;
};
