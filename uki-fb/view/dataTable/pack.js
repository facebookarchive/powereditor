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
var dom   = require("../../../uki-core/dom");

var Base = require("../dataList/pack").Pack;


var Pack = fun.newClass(Base, {

  tbody: function() {
    return this._tbody ||
      (this._tbody = this._dom.getElementsByTagName('tbody')[0]);
  },

  updateRow: function(index) {
    this._globalIndex += index;
    var tmp = dom.createElement('div', {
      html: this._toHTML(this.data().slice(index, index + 1))
    });
    this._globalIndex -= index;
    var item = this._rowAt(index);
    var replaceWith = tmp.getElementsByTagName('tbody')[0].childNodes[0];
    item.parentNode.replaceChild(replaceWith, item);
    this.setSelected(index, this._selection[index]);
  },

  resizeColumn: function(childIndex, width) {
    var tr = this._rowAt(0);
    var td = tr && tr.childNodes[childIndex];
    if (td) { td.style.width = width + 'px'; }
  },

  setSelected: function(index, state) {
    var row = this._rowAt(index);

    state = !!state;
    if (row) {
      dom.toggleClass(row, 'ufb-dataTable-row_selected', state);
      this._selection[index] = state;
    }
  },

  _createDom: function(initArgs) {
    this._dom = dom.createElement('div', {
      className: 'ufb-dataList-pack'
    });
  },

_rowAt: function(pos) {
    return this.tbody() && this.tbody().childNodes[pos];
  },

  _formatRow: function(row, index) {
    var i = index + this._globalIndex;
    return {
      columns: this._formatColumns(row, i, !index),
      row: row,
      index: i,
      even: i & 1
    };
  },

  _formatColumns: function(row, pos, first) {
    var cols = [];
    this.parent().columns().forEach(function(col, i) {
      if (!col.visible) { return; }
      var val = col.key ? utils.prop(row, col.key) : row[i];
      cols[i] = {
        value: col.formatter(val || '', row, pos),
        className: 'ufb-dataTable-col-' + i +
          (col.className ? ' ' + col.className : ''),
        style: first && ('width: ' + col.width + 'px')
      };
    });
    return cols;
  }

});



exports.Pack = Pack;
