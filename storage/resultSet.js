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

var fun = require("../uki-core/function"),

    Observable = require("../uki-core/observable").Observable;


var ResultSet = fun.newClass(Observable, {
  length: 0,

  init: function(rows, klass) {
    this._rows = rows;
    this._klass = klass;
    this._index = {};
    this.length = rows && rows.length;
  },

  destruct: function() {
    for (var i = 0; i < this.length; i++) {
      this[i] && this[i].removeListener('change',
        fun.bindOnce(this._itemChange, this));
    }
  },

  slice: function(from, to) {
    from = this._from(from);
    to = this._to(to);

    this.prefetch(from, to);
    var result = [];
    for (var i = from; i < to; i++) {
      result.push(this[i]);
    }
    return result;
  },

  prefetch: function(from, to) {
    from = this._from(from);
    to = this._to(to);

    for (var i = from; i < to; i++) {
      this.item(i);
    }
    return this;
  },

  item: function(i) {
    if (!this[i]) {
      var row = this._rows.item(i);
      if (!row) {
        return null;
      }
      var obj = new this._klass();
      obj
        .muteChanges(true)
        .id(row.id)
        .fromDBString(row.data)
        .muteChanges(false);

      this._registerItem(i, obj);
    }
    return this[i];
  },

  push: function(item) {
    this._registerItem(this.length, item);
    this.length++;
  },

  byId: function(id) {
    return this._index[id] && this._index[id][0];
  },

  _registerItem: function(index, item) {
    this[index] = item;
    this._index[item.id()] = [item, index];
    item.on('change', fun.bindOnce(this._itemChange, this));
  },

  _itemChange: function(e) {
    var id = e.model.id();
    this.trigger({
      type: 'change.item',
      resultSet: this,
      name: e.name,
      index: this._index[id] && this._index[id][1],
      model: e.model
    });
  },

  _to: function(to) {
    return Math.min(to || this.length, this.length);
  },

  _from: function(from) {
    return Math.max(from || 0, 0);
  }
});

['forEach', 'map', 'filter', 'sort'].forEach(function(name) {
  ResultSet.prototype[name] = function() {
    this.prefetch();
    return Array.prototype[name].apply(this, arguments);
  };
});

ResultSet.fromArray = function(array) {
  var RS = this;
  var obj = new RS(null, null);
  array.forEach(function(a, i) {
    obj._registerItem(i, a);
  });
  obj.length = array.length;
  return obj;
};


exports.ResultSet = ResultSet;
