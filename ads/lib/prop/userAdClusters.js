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

var fun = require("../../../uki-core/function");
var Base = require("./flatArray").FlatArray;

var UserAdClusters = fun.newClass(Base, {
  def: [],

  tsFindByName: function(name, obj, callback) {
    var splits = name.split(":");
    callback({id: splits[0], name: splits[1]});
  },

  getTabSeparated: function(obj) {
    return this._objectToCommaSeparatedString(this.getValue(obj), false);
  },

  _objectToCommaSeparatedString: function(obj, sort) {
    if (obj === undefined || !obj.length) { return; }
    var list = obj.map(
      function(cluster) {
        return cluster.id + ":" + cluster.name;
      }
    );
    if (sort) {
      list = list.sort();
    }
    return list.join(', ');
  },

  compare: function(a, b) {
    return this._objectToCommaSeparatedString(a, true) ===
           this._objectToCommaSeparatedString(b, true);
  }
});

UserAdClusters.prototype.compareDB = UserAdClusters.prototype.compare;

exports.UserAdClusters = UserAdClusters;
