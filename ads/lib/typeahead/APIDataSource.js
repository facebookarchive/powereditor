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

var fun   = require("../../../uki-core/function"),
    utils = require("../../../uki-core/utils"),

    DataSource = require("../../../uki-fb/view/typeahead/dataSource").DataSource;


var APIDataSource = fun.newClass(DataSource, {

    _makeRequest: function(endpoint, data, handlers) {
        // timeout request in 10 sec
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

                if (response.error) {
                    handlers.error();
                } else {
                    handlers.success(this._preprocessResponse(response));
                }

                handlers.complete();
            },
        this));
    },

    _callFBAPI: function(endpoint, data, callback) {
        FB.api(utils.extend({
                  method: endpoint,
                  max_results: this.maxResults()
                }, data),
            callback);
    },

    _preprocessResponse: function(response) {
        if (!response || !response.length) {
            response = [];
        }
        if (this._queryData.advanced == 1) {
            //using new Ads API, with advanced flag on
            //tags with new Ads API are prepended with '#'
            return response.map(function(x) {
                return { id: x.name, text: x.name, subtext: x.description };
            });
        }
        else {
            //if advanced flag is off, use old API
            return response.map(function(x) {
                return { id: x, text: x };
            });
        }

    },

    _getQueryData: function(value, existing) {
        var data = utils.extend({query_string: value}, this._queryData || {});
        return data;
    }
});


exports.APIDataSource = APIDataSource;
