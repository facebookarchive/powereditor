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
var build = require("../../../uki-core/builder").build;
var view  = require("../../../uki-core/view");

var Editor = require("./editor").Editor;
var Select = require("../select").Select;


var SelectEditor = view.newClass('fb.dataList.SelectEditor', Editor, {
  edit: function(binding) {
    this._editing = true;
    this._input.binding(utils.extend(binding, this.bindingOptions()));
    this._originalValue = this._input.binding().viewValue();
    this._input.focus();
  },

  options: fun.newDelegateProp('_input', 'options'),

  _createInput: function() {
    this.addClass('ufb-dataList-selectEditor');
    this._input = build({
      view: Select,
      addClass: 'ufb-dataList-editor-input'
    }).appendTo(this)[0];
  },

  _keydown: function(e) {
    if (e.which == 40 || e.which == 38) {
      e.stopPropagation();
    } else {
      Editor.prototype._keydown.call(this, e);
    }
  }
});


exports.SelectEditor = SelectEditor;
