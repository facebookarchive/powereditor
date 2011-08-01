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

    props   = require("../../lib/props"),
    addProp = props.add,

    AdStat = require("../adStat").AdStat,
    Base   = require("../../../storage/resultSet").ResultSet;

/**
* Ad ResultSet, support stat lazy loading
* @class
*/
var ResultSet = fun.newClass(Base, {

  init: function() {
    this._stat = [];
    Base.apply(this, arguments);
  },

  /**
  * Load stat for a given a given index range
  *
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
    for (var i = from; i < to && i < this.length; i++) {
      if (!this._stat[i]) {
        missing.push(this.item(i).id());
      }
      this._stat[i] = true;
    }

    if (missing.length) {
      AdStat.findAllBy(
        'object_id',
        missing,
        fun.bind(function(items) {

          var map = {};
          items.forEach(function(item) {
            map[item.object_id()] = item;
          });

          for (i = from; i < to && i < this.length; i++) {
            this.item(i).stat(map[this.item(i).id()]);
            this._stat[i] = map[this.item(i).id()] || true;
          }
          callback(this.slice(from, to));

        }, this));

    } else {
      callback(this.slice(from, to));
    }

  },

  statRange: fun.newProp('statRange', function(v) {
    this._statRange = v;
    this._stat = [];
  })
});


exports.ResultSet = ResultSet;

