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

var Base = require("../dataList/pack").Pack;

var Pack = view.newClass('dataTree.Pack', Base, {
  indentBy: fun.newProp('indentBy'),

  data: fun.newProp('data', function(data) {
    this._cleanup();
    this._data = data;
    data && this.changeEventFilter() && data.forEach(function(row) {
      row.data.addListener &&
        row.data.addListener('change', fun.bindOnce(this._rowChange, this));
    }, this);
  }),

  destruct: function() {
    Base.prototype.destruct.call(this);
    this._cleanup();
  },

  _cleanup: function() {
    var data = this.data();
    data && this.changeEventFilter() && data.forEach(function(row) {
      row.data.removeListener &&
        row.data.removeListener('change', fun.bindOnce(this._rowChange, this));
    }, this);
    this._cache = null;
    this._selection = {};
  },

  _rowChange: function(e) {
    if (this.changeEventFilter().call(this.parent(), e)) {
      var index = this.rowIndex({ data: e.model });
      if (index > -1) {
        this._indexesToUpdate = this._indexesToUpdate || [];
        this._indexesToUpdate.push(index);
        fun.deferOnce(this._updateIndexes, this);
      }
    }
  },

  _rowId: function(row) {
    return utils.prop(row.data, 'id');
  },

  _formatRow: function(row, index) {
    index = index + this._globalIndex;

    var value = this._formatter(
      this.key() ? utils.prop(row.data, this.key()) : row.data,
      row.data,
      index);

    var indent = row.indent * this.indentBy();

    return {
      value: value,
      hasChildren: !!row.children,
      style: indent ? ' style="margin-left:' + indent + 'px"' : '',
      className: row.opened ? ' ufb-dataTree-row_opened' : '',
      row: row.data,
      index: index,
      even: index & 1
    };
  }
});

exports.Pack = Pack;
