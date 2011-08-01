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
requireCss("./dataTree/dataTree.css");

var fun   = require("../../uki-core/function");
var utils = require("../../uki-core/utils");
var view  = require("../../uki-core/view");

var Base = require("./dataList").DataList;
var Pack = require("./dataTree/pack").Pack;
var SelectionController =
  require("./dataTree/selectionController").SelectionController;


var DataTree = view.newClass('DataTree', Base, {

  childrenKey: fun.newProp('childrenKey'),
  _childrenKey: 'children',

  indentBy: fun.newProp('indentBy'),
  _indentBy: 20,

  _template: requireText('dataTree/pack.html'),

  _setup: function(initArgs) {
    initArgs.packView = 'packView' in initArgs ? initArgs.packView : Pack;

    initArgs.selectionController = 'selectionController' in initArgs ?
      initArgs.selectionController : new SelectionController();

    Base.prototype._setup.call(this, initArgs);
  },

  treeData: fun.newProp('treeData', function(data) {
    this._treeData = data;
    this.data(data.map(function(row) {
      return this._wrapRow(row);
    }, this));
  }),

  selectedRow: function() {
    var row = Base.prototype.selectedRow.call(this);
    return row && row.data;
  },

  selectedRows: function() {
    var rows = Base.prototype.selectedRows.call(this);
    return utils.pluck(rows, 'data');
  },

  open: function(index) {
    var data = this.data();
    var item = data[index];

    if (item && !item.opened && item.children) {
      item.opened = true;

      var indent = item.indent + 1;
      var children = item.children;
      var insertion = [index + 1, 0];

      children.forEach(function(child) {
        insertion.push(this._wrapRow(child, indent));
      }, this);

      Array.prototype.splice.apply(data, insertion);

      this.data(data)
        .layoutIfVisible()
        .selectedIndexes([index])
        .lastClickIndex(index)
        .triggerSelection();
    }
  },

  close: function(index) {
    var data = this.data();
    var item = data[index];

    if (item && item.opened) {
      item.opened = false;
      var children = item.children;

      data.splice(index + 1, children.length);

      this.data(data)
        .layoutIfVisible()
        .selectedIndexes([index])
        .lastClickIndex(index)
        .triggerSelection();
    }
  },

  redrawRow: function(item) {
    var packs = this.childViews();
    for (var i = 0; i < packs.length; i++) {
      var pack = packs[i];
      var index = pack.rowIndex({data: item});
      if (index > -1) {
        var globalIndex = pack.from + index;
        pack.updateRow(index, this.isSelected(globalIndex), globalIndex);
        break;
      }
    }
  },

  _createPack: function() {
    var pack = new this._packView();
    return pack
      .changeEventFilter(this.redrawOnModelChange() && this.changeEventFilter())
      .template(this.template())
      .formatter(this.formatter())
      .indentBy(this.indentBy())
      .key(this.key());
  },

  _wrapRow: function(row, indent) {
    var children = utils.prop(row, this.childrenKey());
    indent = indent || 0;

    return {
      opened: false,
      data: row,
      children: children && children.length && children || null,
      indent: indent
    };
  }

});


exports.DataTree = DataTree;
