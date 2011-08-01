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

var Base =
  require("../dataList/selectionController").SelectionController;


var SelectionController = fun.newClass(Base, {
  _eventToIndex: function(e) {
    var o = this._view.clientRect();
    var y = e.pageY - o.top;
    var x = e.pageX - o.left;

    return Math.min(
      this._view.metrics().cellForPosition(x, y),
      this._view.data().length - 1);
  },

  _onkeyrepeat: function(e) {
    if (!this._view.hasFocus()) { return; }

    var selection = this._view.selection();
    var indexes = selection.indexes();
    var nextIndex = -1;

    if (e.which == 37 || e.keyCode == 37) { // LEFT
      nextIndex = Math.max(0, this._view.lastClickIndex() - 1);
      e.preventDefault();
    } else if (e.which == 39 || e.keyCode == 39) { // DOWN
      nextIndex = Math.min(
        this._view.data().length - 1,
        this._view.lastClickIndex() + 1);
      e.preventDefault();
    } else if (e.which == 38 || e.keyCode == 38) { // UP
      nextIndex = Math.max(
        0,
        this._view.lastClickIndex() - this._view.cellsPerRow());
      e.preventDefault();
    } else if (e.which == 40 || e.keyCode == 40) { // DOWN
      nextIndex = Math.min(
        this._view.data().length - 1,
        this._view.lastClickIndex() + this._view.cellsPerRow());
      if (nextIndex > this._view.data().length - 1) {
        nextIndex = -1;
      }
      e.preventDefault();
    }

    if (nextIndex > -1 && nextIndex != this._view._lastClickIndex) {
      if (e.shiftKey && this._view.multiselect()) {
        if (selection.isSelected(nextIndex)) {
          selection.removeRange(
            Math.min(nextIndex + 1, this._view.lastClickIndex()),
            Math.max(nextIndex - 1, this._view.lastClickIndex())
          );
        } else {
          selection.clear().addRange(
            Math.min(nextIndex, this._view.lastClickIndex()),
            Math.max(nextIndex, this._view.lastClickIndex())
          );
        }
      } else {
        selection.indexes([nextIndex]);
      }
      this._triggerSelection();
      this._view.scrollToIndex(nextIndex);
      this._view.lastClickIndex(nextIndex);
    }
  }
});


exports.SelectionController = SelectionController;
