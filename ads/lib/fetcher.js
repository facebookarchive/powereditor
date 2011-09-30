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

var GL = require("../../lib/graphlink").Graphlink;

// so as not to mess with progress handlers on static version
var graphlink = new GL();

var Fetcher = fun.newClass(
{
  cache: {},
  cacheTTL: 1000 * 60 * 60 * 24, // day

  buildKey: function(input_data) {
    return input_data;
  },

  fromCache: function(input_data) {
    var key = this.buildKey(input_data);
    return this.cache[key] && this.cache[key].result;
  },

  getGraphLinkPath: function(input_data) {
    return '';
  },

  getGraphLinkOptions: function(input_data) {
    return {};
  },

  processResponse: function(r) {
    return r;
  },

  fetch: function(input_data, callback) {
    var key = this.buildKey(input_data);
    if (!key) {
      callback({});
      return;
    }

    // clear stale cache
    if (this.cache[key] && +new Date() - this.cache[key].time > this.cacheTTL) {
      delete this.cache[key];
    }

    if (this.cache[key]) {
      if (this.cache[key].waiting) {
        this.cache[key].waiting.push(callback);
      } else {
        callback(this.cache[key].result);
      }
    } else {
      this.cache[key] = {
        waiting: [callback],
        time: +new Date()
      };
      graphlink.fetchObject(
        this.getGraphLinkPath(input_data),
        this.getGraphLinkOptions(input_data),
        function(r) {
          var result = this.processResponse(r);
          this.cache[key].result = result;
          this.cache[key].waiting.forEach(function(cb) {
            cb(result);
          });
          delete this.cache[key].waiting;
        },
        this);
    }
  }
});

var UrlToObjectIDSearcher = fun.newClass(Fetcher, {
  cacheTTL: 1000 * 60 * 60, // hour

  getGraphLinkPath: function(input_data) {
    return '/search';
  },

  getGraphLinkOptions: function(input_data) {
    var url = input_data;
    return { type: 'adobjectbyurl', q: url };
  },

  processResponse: function(r) {
    return (r && r.data && r.data[0]) || {};
  }
});

var ObjectFetcher = fun.newClass(Fetcher, {
  getGraphLinkPath: function(input_data) {
    var object_id = input_data;
    return '/' + object_id;
  },

  processResponse: function(r) {
    return r || {};
  }
});

var urlToObjectIDSearcher = new UrlToObjectIDSearcher();
var objectFetcher = new ObjectFetcher();

exports.urlToObjectIDSearcher = urlToObjectIDSearcher;
exports.objectFetcher = objectFetcher;
