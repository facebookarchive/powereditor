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

var consts = require("./constants");

var Pack = fun.newClass(Base, {
  _formatColumns: function(row, pos, first) {
    var cols = [];
    this.parent().columns().forEach(function(col, i) {
      if (!col.visible) { return; }
      var val = col.key ? utils.prop(row, col.key) : row[i];

      var allocation_status = '';
      if (col.label == 'Allocation') {
        if (val !== 0) {
          allocation_status = (val > 0) ? 'left' : 'over';
          allocation_status = ' ufb-dataTable-col-' + allocation_status;
        }
      }

      var line_status = '';
      if (col.label == '#' && row.is_bonus_line()) {
        line_status = ' ufb-dataTable-col-is_bonus';
      }

      var overdelivered;
      var delivery_status = '';

      if (col.label == 'OverDelivery %') {
        if (val > consts.DELIVER_THRESHHOLD) {
          overdelivered = true;
        } else if (val !== -1 &&
          val < ((-1) * consts.DELIVER_THRESHHOLD)) {
          overdelivered = false;
        }
        if (val && overdelivered !== undefined) {
          delivery_status = overdelivered ?
            'overdelivered' : 'underdelivered';
          delivery_status = ' ufb-dataTable-col-' + delivery_status;
        }
      }

      cols[i] = {
          value: col.formatter(val || '', row, pos),
          className: 'ufb-dataTable-col-' + i +
              (col.className ? ' ' + col.className : '') +
              allocation_status +
              line_status +
              delivery_status,
          style: pos ? '' : 'width:' + col.width + 'px'
      };
    });
    return cols;
  }

});


exports.Pack = Pack;
