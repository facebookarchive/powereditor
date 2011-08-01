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
requireCss("./dataGrid/dataGrid.css");

var fun   = require("../../uki-core/function");
var dom   = require("../../uki-core/dom");
var utils = require("../../uki-core/utils");
var view  = require("../../uki-core/view");

var DataList = require("./dataList").DataList;
var Pack = require("./dataGrid/pack").Pack;
var Metrics = require("./dataGrid/metrics").Metrics;
var SelectionController =
  require("./dataGrid/selectionController").SelectionController;


var DataGrid = view.newClass('DataGrid', DataList, {

  _template: requireText('dataGrid/pack.html'),

  _setup: function(initArgs) {
    'metrics' in initArgs || (initArgs.metrics = new Metrics());
    'editorController' in initArgs || (initArgs.editorController = null);
    'packView' in initArgs || (initArgs.packView = Pack);
    'selectionController' in initArgs ||
      (initArgs.selectionController = new SelectionController());
    return DataList.prototype._setup.call(this, initArgs);
  },

  cellsPerRow: fun.newDelegateProp('metrics', 'cellsPerRow'),

  deduceCellDimensions: function() {
    if (!this.data().length) {
      return [0, 0];
    }

    var sample = this.data().slice(0, 1)[0];
    var pack = this._createPack();
    this.appendChild(pack);
    pack.render([sample], [], 0);
    var height = pack.dom().offsetHeight;
    var width = pack.dom().offsetWidth;
    this.removeChild(pack);
    return [width, height];
  },

  clientWidth: function() {
    return this.dom().clientWidth;
  },

  _positionPack: function(pack) {
    var firstRowD = this.metrics().cellDimensions(pack.from);
    var lastRowD = this.metrics().cellDimensions(pack.to - 1);
    pack.top(firstRowD.top);
    pack.fromPX = firstRowD.top;
    pack.offsetPX = firstRowD.offset;
    pack.toPX = lastRowD.top + lastRowD.height;

    pack.top(firstRowD.top);
    pack.fillerWidth(firstRowD.offset);
  },

  _repositionPacks: function() {
    this.childViews().forEach(this._positionPack, this);
  },

  _rowsToRender: function() {
    var rangeInPX = this._rangeWithPrerender();
    return this.metrics().cellsForRange(rangeInPX);
  },

  _update: function() {
    if (this.metrics().updateCellsPerRow()) {
      this._updateHeight();
      this._repositionPacks();
    }
    return DataList.prototype._update.call(this);
  }

});


exports.DataGrid = DataGrid;
