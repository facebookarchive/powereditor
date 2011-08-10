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

var fun   = require("../uki-core/function"),
    utils = require("../uki-core/utils"),
    Observable = require("../uki-core/observable").Observable;

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
