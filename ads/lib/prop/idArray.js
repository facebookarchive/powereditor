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

var fun   = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");

var Base = require("./flatArray").FlatArray;


var IdArray = fun.newClass(Base, {
  def: [],

  tsFindByName: function(name, obj, callback) {
    callback(false);
  },

  getTabSeparated: function(obj) {
    return utils.pluck(this.getValue(obj), 'name').map(function(string) {
      return string.replace(/\s*,.*/, '');
    }).join(this.delimiter + ' ');
  },

  compare: function(a, b) {
    return utils.pluck(a || [], 'id').join(',') ===
      utils.pluck(b || [], 'id').join(',');
  }
});

IdArray.prototype.compareDB = IdArray.prototype.compare;


exports.IdArray = IdArray;
