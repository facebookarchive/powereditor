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

var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    Observable = require("../../uki-core/observable").Observable;

/**
 * Search with chunks
 *
 * Campaign/Ad class need to implements match
 */

var CHUNK_SIZE = 100;
var CHUNK_TIMEOUT = 20;
Searcher = fun.newClass(Observable, {
  init : function(data) {
    this.items = data;
  },

  updateData: function(data) {
    this.items = data;
  },

  search: function(query, callback) {
    this._stopSearch();

    this._query = query;
    var iterator = this._createIterator(query, callback);

    this.trigger({
      type: 'searchStart',
      iterator: iterator
    });

    this._filterChunk(iterator);
  },

  _createIterator: function(query, callback) {
    return {
      query: query,
      iteration: 0,
      found: 0,
      callback: callback
    };
  },

  _filterChunk: function(iterator) {
    var filtered = 0,
        foundInChunk = [],
        item;

    while (iterator.iteration < this.items.length) {
      if (filtered == CHUNK_SIZE) {
        if (foundInChunk.length) {
          this.trigger({
            type: 'searchFoundInChunk',
            foundInChunk: foundInChunk
          });
        }

        this._searchTimer = setTimeout(fun.bind(function() {
          this._filterChunk(iterator);
          }, this), CHUNK_TIMEOUT
        );
        return;
      }
      item = this.items[iterator.iteration];

      // we expect the item's class (ad, campaign etc)
      // to have the match implemented
      if (item && item.match(iterator.query)) {
        iterator.found++;
        foundInChunk.push(item);

        if (iterator.callback) {
          iterator.callback(item, iterator);
        }
      }

      iterator.iteration++;
      filtered++;
    }

    this.trigger({
      type: 'searchFoundInChunk',
      foundInChunk: foundInChunk
    });

    this._stopSearch();
    this.trigger({
      type: 'searchFinish',
      iterator: iterator
    });
  },

  _stopSearch: function() {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer);
      this._searchTimer = false;
    }
  }
});

exports.Searcher = Searcher;
