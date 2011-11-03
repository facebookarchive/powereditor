/**
* Copyright 2011 Facebook, Inc.
*
* You are hereby granted a non-exclusive, worldwide, royalty-free license to
* use, copy, modify, and distribute this software in source code or binary
* form for use in connection with the web services and APIs provided by
* Facebook.
*
* As with any software that integrates with the Facebook platform, your use
* of this software is subject to the Facebook Developer Principles and
* Policies [http://developers.facebook.com/policy/]. This copyright notice
* shall be included in all copies or substantial portions of the software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
* THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*
*
*/


var fun   = require("../../../uki-core/function");
var utils = require("../../../uki-core/utils");
var dom   = require("../../../uki-core/dom");

var Base = require("../../../uki-fb/view/dataTable/pack").Pack;


var Pack = fun.newClass(Base, {

  _formatColumns: function(row, pos, first) {
    var cols = [];
    this.parent().columns().forEach(function(col, i) {
      if (!col.visible) { return; }
      var val = col.key ? utils.prop(row, col.key) : row[i];

      var changed = row.isChanged(col.key);
      var className = 'ufb-dataTable-col-' + i +
        (col.className ? ' ' + col.className : '');
      if (!changed && col.changeOnKeys) {
        col.changeOnKeys.forEach(function(key) {
          if (row.isChanged(key)) { changed = true; }
        }, this);
      }
      if (changed && !row.isNew()) {
        className += ' ads-dataTable-changed';
      }

      if (col.visCategory) {
        className += ' ads-dataTable-col_' + col.visCategory;
      }

      cols[i] = {
        value: col.formatter(val || '', row, pos),
        className: className,
        style: first && ('width: ' + col.width + 'px')
      };
    });
    return cols;
  }

});


exports.Pack = Pack;
