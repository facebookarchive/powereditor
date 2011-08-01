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
var build = require("../../../uki-core/builder").build;

var Base = require("../dataList/editorController").EditorController;


var EditorController = fun.newClass(Base, {

  onstartEditing: function(e) {
    if (e.type.match(/mouse|touch/)) {
      var hOffset = e.pageX - this._view.clientRect().left;
      var index = -1;
      var colOffset = 0;
      var columns = this._view.columns();

      while (hOffset > 0) {
        index++;
        if (!columns[index]) { return; }
        if (columns[index].visible) {
          hOffset -= columns[index].width;
        }
      }
      this.editSelectedColumn(index);
    } else {
      this.editSelectedColumn();
    }
  },

  editSelectedColumn: function(columnIndex) {
    this.edit(this._view.selectedIndex(), columnIndex);
  },

  edit: function(rowIndex, columnIndex) {
    var data = this._view.data().slice(rowIndex, rowIndex + 1)[0];
    var columns = this._view.columns();
    if (!columnIndex) {
      for (var i = 0; i < columns.length; i++) {
        if (columns[i].editor && columns[i].visible) {
          columnIndex = i;
          break;
        }
      }
    }

    var column = columns[columnIndex];
    if (!data || !column || !column.editor || !column.visible) { return this; }

    this._onclose();

    var colOffset = 0;
    for (var i = 0; i < columnIndex; i++) {
      if (columns[i].visible) {
        colOffset += columns[i].width;
      }
    }

    column.editor = build([column.editor])[0];

    var dimensions = this._view.metrics().rowDimensions(rowIndex);
    this._view.appendEditor(column.editor);

    column.editor
      .addListener('close', fun.bindOnce(this._onclose, this))
      .addListener('move', fun.bindOnce(this._onmove, this))
      .pos({
        top: dimensions.top + 'px',
        left: colOffset + 'px',
        width: column.width + 'px',
        height: dimensions.height + 'px'
      })
      .visible(true)
      .edit({ model: this._view.selectedRow(), modelProp: column.key });

    this._editorColumnIndex = columnIndex;
    this._editorRowIndex = rowIndex;
    this._view.lastClickIndex(rowIndex);
    return this;
  },

  _onclose: function(e) {
    if (this._editorColumnIndex === undefined) { return; }

    var column = this._view.columns()[this._editorColumnIndex];
    this._editorColumnIndex = undefined;
    this._view.removeEditor(column.editor);

    column.editor
      .removeListener('close', fun.bindOnce(this._onclose, this))
      .removeListener('move', fun.bindOnce(this._onmove, this));

    fun.defer(
      fun.bind(this._view.redrawIndex, this._view, this._editorRowIndex));
    if (e && e.remainFocused) {
      fun.defer(
        fun.bind(this._view.focus, this._view));
      // this._view.focus();
    }
  },

  _onmove: function(e) {
    if (e.vertical) {
      if (this._moveSelectedIndex(e.vertical)) {
        this._view.scrollToIndex(this._view.selectedIndex());
        this._view.triggerSelection();
        this.editSelectedColumn(this._editorColumnIndex);
      }
    } else if (e.horizontal) {
      var step = e.horizontal;
      var columns = this._view.columns();
      var length = columns.length;
      var moved = false;
      var i = this._editorColumnIndex + step;

      for (; i > -1 && i < length; i += step) {
        if (columns[i].editor && columns[i].visible) {
          this.editSelectedColumn(i);
          moved = true;
          break;
        }
      }

      if (!moved) {
        if (this._moveSelectedIndex(step)) {
          this._view.scrollToIndex(this._view.selectedIndex());
          this._view.triggerSelection();

          i = step < 0 ? length - 1 : 0;
          for (; i > -1 && i < length; i += step) {
            if (columns[i].editor && columns[i].visible) {
              this.editSelectedColumn(i);
              break;
            }
          }
        }
      }
    }
  }
});


exports.EditorController = EditorController;
