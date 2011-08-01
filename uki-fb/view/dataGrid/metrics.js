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

var fun = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");

var Observable = require("../../../uki-core/observable").Observable;

var Metrics = fun.newClass(Observable, {

  initWithView: function(view) {
    this._view = view;
  },

  _cellHeight: 0,

  _cellWidth: 0,

  _cellsPerRow: 0,

  initLayout: function() {
    var d = this._view.deduceCellDimensions();
    this._cellWidth = d[0];
    this._cellHeight = d[1];
    this._cellsPerRow = 0;
  },

  cellsPerRow: function(force) {
    if (!this._cellsPerRow || force) {
      this._cellsPerRow = Math.max(
        this._view.clientWidth() / this._cellWidth << 0, 1);
    }
    return this._cellsPerRow;
  },

  updateCellsPerRow: function() {
    var old = this._cellsPerRow;
    this._cellsPerRow = this.cellsPerRow(true);
    return old != this._cellsPerRow;
  },

  cellsForRange: function(range) {
    return {
      from: (range.from / this._cellHeight << 0) * this.cellsPerRow(),
      to:   Math.ceil(range.to / this._cellHeight) * this.cellsPerRow()
    };
  },

  // dataList-pack API
  rowsForRange: function(range) {
    return this.cellsForRange(range);
  },

  cellForPosition: function(x, y) {
    return (y / this._cellHeight << 0) * this.cellsPerRow() +
      Math.ceil(x / this._cellWidth << 0);
  },

  rowForPosition: function(px) {
    return this.cellForPosition(0, px);
  },

  cellDimensions: function(index) {
    return {
      top: this._cellHeight * (index / this.cellsPerRow() << 0),
      height: this._cellHeight,
      width: this._cellWidth,
      offset: (index % this.cellsPerRow()) * this._cellWidth
    };
  },

  // dataList-pack API
  rowDimensions: function(index) {
    return this.cellDimensions(index);
  },

  totalHeight: function() {
    return this._cellHeight * Math.ceil(
      this._view.data().length / this.cellsPerRow());
  }

});


exports.Metrics = Metrics;
