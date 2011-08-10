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

var fun   = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");
var view  = require("../../../uki-core/view");
var dom   = require("../../../uki-core/dom");

var Mustache = require("../../../uki-core/mustache").Mustache;
var Base     = require("../../../uki-core/view/base").Base;


var Pack = view.newClass('dataList.Pack', Base, {

  _setup: function(initArgs) {
    this._data = [];
    this._selection = {};
    return Base.prototype._setup.call(initArgs);
  },

  template: fun.newProp('template'),

  formatter: fun.newProp('formatter'),

  key: fun.newProp('key'),

  changeEventFilter: fun.newProp('changeEventFilter'),

  data: fun.newProp('data', function(data) {
    this._cleanup();
    this._data = data;
    data && this.changeEventFilter() && data.forEach(function(row) {
      row.addListener &&
        row.addListener('change', fun.bindOnce(this._rowChange, this));
    }, this);
  }),

  destruct: function() {
    Base.prototype.destruct.call(this);
    this._cleanup();
  },

  _cleanup: function() {
    var data = this.data();
    data && this.changeEventFilter() && data.forEach(function(row) {
      row.removeListener &&
        row.removeListener('change', fun.bindOnce(this._rowChange, this));
    }, this);
    this._cache = null;
    this._selection = {};
  },

  _rowChange: function(e) {
    if (this.changeEventFilter().call(this.parent(), e)) {
      var index = this.rowIndex(e.model);
      if (index > -1) {
        this._indexesToUpdate = this._indexesToUpdate || [];
        this._indexesToUpdate.push(index);
        fun.deferOnce(this._updateIndexes, this);
      }
    }
  },

  _updateIndexes: function() {
    this.parent() && this._indexesToUpdate.forEach(function(index) {
      this.updateRow(index);
    }, this);
    this._indexesToUpdate = [];
  },

  top: function(v) {
    if (arguments.length) {
      this.dom().style.top = v + 'px';
      return this;
    }
    return parseInt(this.dom().style.top, 10);
  },

  cache: function() {
    if (!this._cache) {
      this._cache = {};
      utils.forEach(this.data(), function(row, i) {
        this._cache[this._rowId(row)] = i;
      }, this);
    }
    return this._cache;
  },

  rowIndex: function(row) {
    var id = this._rowId(row);
    var cache = this.cache();
    return (id in cache) ? cache[id] : -1;
  },

  render: function(data, selectedInPack, globalIndex) {
    this.data(data);
    this._globalIndex = globalIndex;
    this._dom.innerHTML = this._toHTML(data);
    this._restorePackSelection(selectedInPack || []);
  },

  updateRow: function(index) {
    this._globalIndex += index;
    var tmp = dom.createElement('div', {
      html: this._toHTML(this.data().slice(index, index + 1))
    });
    this._globalIndex -= index;

    var item = this._rowAt(index);
    item.parentNode.replaceChild(tmp.childNodes[0], item);
    this.setSelected(index, !!this._selection[index]);
  },

  setSelected: function(index, state) {
    var row = this._rowAt(index);

    state = !!state;
    if (row) {
      dom.toggleClass(row, 'ufb-dataList-row_selected', state);
      this._selection[index] = state;
    }
  },

  _rowId: function(row) {
    return utils.prop(row, 'id');
  },

  _toHTML: function(data) {
    var formated = utils.map(data, this._formatRow, this);

    return Mustache.to_html(
      this.template(), { rows: formated }
    );
  },

  _formatRow: function(row, index) {
    index = index + this._globalIndex;
    var value = this.formatter()(
      this.key() ? utils.prop(row, this.key()) : row,
      row,
      index);

    return {
      value: value,
      row: row,
      index: index,
      even: index & 1
    };
  },

  _createDom: function(initArgs) {
    this._dom = dom.createElement('ul', {
      className: 'ufb-dataList-pack'
    });
  },

  _restorePackSelection: function(selectedInPack) {
    for (var i = selectedInPack.length - 1; i >= 0; i--) {
      this.setSelected(selectedInPack[i] - this._globalIndex, true);
    }
  },

  _rowAt: function(index) {
    return this.dom().childNodes[index];
  }

});


exports.Pack = Pack;
