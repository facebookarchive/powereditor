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

    Base = require("./base").Base;


var Connections = fun.newClass(Base, {
  def: [],

  getTabSeparated: function(obj) {
    return utils.pluck(this.getValue(obj), 'id').map(function(id) {
      return 'c:' + id;
    }).join(', ');
  },

  setTabSeparated: function(obj, value, callback) {
    var result = [];
    value.split(',').forEach(function(id) {
      id = id.trim().replace(/\D/g, '');
      if (!id) { return; }
      var item = this.tsFindById(id, obj);
      if (item) {
        result.push(item);
      }
    }, this);
    this.setValue(obj, result);
    callback();
  },

  compare: function(a, b) {
    return utils.pluck(a || [], 'id').join(',') ===
    utils.pluck(b || [], 'id').join(',');
  },

  tsFindById: function(id, obj) {
    var item = require("../../model/connectedObject").ConnectedObject.byId(id);
    return item ?
    { id: item.id(), name: item.name() } :
    { id: id, name: id };
  }
});

Connections.prototype.compareDB = Connections.prototype.compare;



exports.Connections = Connections;
