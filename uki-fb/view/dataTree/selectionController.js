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
  _onkeyrepeat: function(e) {
    if (!this._view.hasFocus()) { return; }

    if (e.which == 37 || e.keyCode == 37) { // LEFT
      var data = this._view.data();
      var lastClickIndex = this._view.lastClickIndex();
      var item = data[lastClickIndex];

      if (item.opened) {
        this._view.close(lastClickIndex);
      } else {
        var indent = item.indent - 1;

        for (var i = lastClickIndex - 1; i > -1; i--) {
          if (data[i].indent == indent) {
            this._view.selectedIndex(i)
              .lastClickIndex(i)
              .scrollToIndex(i);
            break;
          }
        }
        }
    } else if (e.which == 39 || e.keyCode == 39) { // RIGHT
      this._view.open(this._view.lastClickIndex());
    } else {
      Base.prototype._onkeyrepeat.call(this, e);
    }
  },

  _onmousedown: function(e) {
    if (dom.hasClass(e.target, 'ufb-dataTree-toggle')) {
      var index = this._eventToIndex(e);
      var item = this._view.data()[index];
      var tree = this._view;

      fun.defer(function() {
        item.opened ? tree.close(index) : tree.open(index);
      });

      return this;
    }
    return Base.prototype._onmousedown.call(this, e);
  }
});


exports.SelectionController = SelectionController;
