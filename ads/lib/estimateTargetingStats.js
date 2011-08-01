/**
* Copyright 2011 Facebook, Inc.
*
* You are hereby granted a non-exclusive, worldwide, royalty-free license to
* use, copy, modify, and distribute this software in source code or binary
* form for use in connection with the web services and APIs provided by
* Facebook.
*
* As with any software that integrates with the Facebook platform, your use
* of this software is subject to the Facebook Developer Principles and
* Policies [http://developers.facebook.com/policy/]. This copyright notice
* shall be included in all copies or substantial portions of the software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
* THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*
*
*/

var fun = require("../../uki-core/function");

var FB = require("../../storage/lib/connect").FB;


var cache = {};
var CACHE_TTL = 1000 * 60 * 60 * 24; // day

function buildKey(account, targeting_spec) {
  return account.id() + ' ' + JSON.stringify(targeting_spec);
}

function estimate(account, targeting_spec, callback) {
  var key = buildKey(account, targeting_spec);

  // clear stale cache
  if (cache[key] && +new Date() - cache[key].time > CACHE_TTL) {
    delete cache[key];
  }

  if (cache[key]) {
    if (cache[key].waiting) {
      cache[key].waiting.push(callback);
    } else {
      fun.defer(fun.bind(callback, null, cache[key].result));
    }
  } else {
    cache[key] = {
      waiting: [callback],
      time: +new Date()
    };

    FB.api({
      method: 'ads.estimateTargetingStats',
      targeting_spec: targeting_spec,
      account_id: account.id(),
      currency: account.currency()
    }, function(result) {
      cache[key].result = result;
      cache[key].waiting.forEach(function(callback) {
        callback(result);
      });
      delete cache[key].waiting;
    });
  }
}

function fromCache(account, targeting_spec) {
  var key = buildKey(account, targeting_spec);
  return cache[key] && cache[key].result;
}


exports.estimate = estimate;
exports.fromCache = fromCache;
exports.cache = cache;

/**
 * It is a good practice to debounce actual estimate calls.
 * This is the default debounce timeout
 */
exports.DEFAULT_DEBOUNCE = 200;
