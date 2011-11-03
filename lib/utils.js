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


var utils = require("../uki-core/utils");

var libutils = exports;

libutils.wrapArray = function(arrayLike, mapper) {
  return utils.isArray(arrayLike) ? arrayLike : [arrayLike];
};

/**
 * Checks is obj is a string
 * what did you think?
 */
libutils.isString = function(obj) {
  return Object.prototype.toString.call(obj) === "[object String]";
};

/**
 * Checks if an object is empty
 * works on arrays too
 * libutils.isEmpty({}) => true
 * libutils.isEmpty([]) => true
 * libutils.isEmpty() => true
 * libutils.isEmpty({ 'a': b }) => false
 * libutils.isEmpty([1, 2, 3]) => false
 * https://documentcloud.github.com/underscore/#isEmpty
 */
libutils.isEmpty = function(obj) {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
};

libutils.isNotEmpty = function(obj) {
  return !libutils.isEmpty(obj);
};

libutils.contains = function(obj, prop) {
  if (utils.isArray(obj) || libutils.isString(obj)) {
    return obj.indexOf(prop) !== -1;
  }
  return prop in obj;
};

libutils.count = function(obj) {
  if (utils.isArray(obj) || libutils.isString(obj)) {
    return obj.length;
  }
  var count = 0;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      count++;
    }
  }
  return count;
};

libutils.chunkArray = function(arr, chunk_size) {
  var chunks = [];
  var i = 0;
  while (arr.length > i) {
    chunks.push(arr.slice(i, i + chunk_size));
    i += chunk_size;
  }
  return chunks;
};
