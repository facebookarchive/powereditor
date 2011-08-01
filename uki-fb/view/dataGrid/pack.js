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
  _rowAt: function(index) {
    return this.dom().childNodes[index + 1];
  },

  _createDom: function(initArgs) {
    this._dom = dom.createElement('ul', {
      className: 'ufb-dataList-pack ufb-dataGrid-pack'
    });
  },

  setSelected: function(index, state) {
    if (this.dom()) {
      var row = this._rowAt(index);
      if (row) {
        dom.toggleClass(row, 'ufb-dataGrid-cell_selected', state);
      }
    }
    this._selection[index] = state;
  },

  fillerWidth: function(width) {
    var node = this.dom().childNodes[0];
    if (arguments.length) {
      node && (node.style.width = width + 'px');
      return this;
    }
    return node && parseInt(node.style.width, 10);
  }
});



exports.Pack = Pack;
