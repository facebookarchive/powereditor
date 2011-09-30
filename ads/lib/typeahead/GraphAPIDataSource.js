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

var fun = require("../../../uki-core/function"),
    utils = require("../../../uki-core/utils"),

    DataSource = require("../../../uki-fb/view/typeahead/dataSource").DataSource,

    adsConnect = require("../../../lib/connect"),
    FB = adsConnect.FB;

var GraphAPIDataSource = fun.newClass(DataSource, {

  init: function(initArgs) {
    DataSource.prototype.init.call(this, initArgs);
    this.queryEndpoint('search');
  },

  dirty: function() {
    this._dirty();
  },

  _callFBAPI: function(endpoint, data, callback) {
    FB.api(
      endpoint,
      utils.extend(
        {
          limit: this.maxResults(),
          q: data.query_string
        },
        data),
        callback);
  },

  _makeRequest: function(endpoint, data, handlers) {
    // timeout request in 50 sec
    var complete = false;
    setTimeout(function() {
      if (complete) {
        return;
      }
      complete = true;
      handlers.complete();
    }, 50000);


    this._callFBAPI(endpoint, data, fun.bind(
      function(response) {
        if (complete) {
          return;
        }
        complete = true;

        if (adsConnect.isError(response)) {
          handlers.error();
        } else {
          handlers.success(this._preprocessResponse(response));
        }

        handlers.complete();
      },
    this));
  },

  _getQueryData: function(value, existing) {
    var data = utils.extend({query_string: value}, this._queryData || {});
    return data;
  },

  // default pre-processing
  // can be overridden if data needs its own kind of preprocessing
  _preprocessResponse: function(response) {
    return (response.data || []).map(function(entry) {
      return {
        id: entry.id || entry.key || entry.name,
        text: entry.name,
        subtext: entry.subtext
      };
    });
  }
});


exports.GraphAPIDataSource = GraphAPIDataSource;
