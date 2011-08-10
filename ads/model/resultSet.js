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

    BaseStat = require("./baseStat").BaseStat,
    Base   = require("../../storage/resultSet").ResultSet;
var CHUNK_SIZE = 100;

/**
* ResultSet, support stat lazy loading
* @class
*/
var ResultSet = fun.newClass(Base, {

  init: function() {
    this._stat = [];
    this._statType = BaseStat;
    Base.apply(this, arguments);
    this._numLoadedChunks = 0;
  },

  /**
   * Load stats for a given index range
   * @param from index
   * @param to index
   * @param callback to be called after load
   */
  loadRange: function(from, to, callback) {
    if (!this.statRange()) {
      callback(this.slice(from, to));
      return;
    }

    // search for missing stat rows
    var missing = [];
    var i;
    for (i = from; i < to && i < this.length; i++) {
      if (!this._stat[i]) {
        missing.push(this.item(i).id());
      }
      this._stat[i] = true;
    }

    if (missing.length) {
      // get stats in chunks
      this._numLoadedChunks = 0;
      var numChunks = (missing.length / CHUNK_SIZE) | 0;
      numChunks += (missing.length % CHUNK_SIZE > 0) ? 1 : 0;
      for (i = 0; i < numChunks; i++) {
        var cutoff = (i + 1) * CHUNK_SIZE;
        if (cutoff > this.length) {
          cutoff = this.length;
        }
        this._statType.findAllBy(
          'object_id',
          missing.slice(i * CHUNK_SIZE, cutoff),
          fun.bind(function(items) {

            var map = {};
            var j;
            items.forEach(function(item) {
              map[item.object_id()] = item;
            });

            for (j = from; j < to && j < this.length; j++) {
              this.item(j).stat(map[this.item(j).id()]);
              if (this.item(j).calculateDeliveryInfo) {
                this.item(j).calculateDeliveryInfo();
              }
              this._stat[j] = map[this.item(j).id()] || true;
            }

            this._numLoadedChunks++;
            this._completeCallback(callback, from, to, numChunks);
          }, this));
      }
    } else {
      callback(this.slice(from, to));
    }
  },

  _completeCallback: function(callback, from, to, numChunks) {
    if (this._numLoadedChunks == numChunks) {
      callback(this.slice(from, to));
      this._numLoadedChunks = 0;
    }
  },


  statRange: fun.newProp('statRange', function(v) {
    this._statRange = v;
    this._stat = [];
  })
});


exports.ResultSet = ResultSet;

