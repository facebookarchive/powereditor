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
requireCss("./dataTableList.css");


var fun = require("../../../uki-core/function"),
    dom = require("../../../uki-core/dom"),
    env = require("../../../uki-core/env"),
    utils = require("../../../uki-core/utils"),
    view = require("../../../uki-core/view"),
    consts = require("./constants"),

    Base = require("../../../uki-fb/view/dataTable").DataTableList,
    Pack = require("./pack").Pack;

var DataTableList = view.newClass('app.contractPane.DataTableList', Base, {
    pasteTarget: true,

    _setup: function(initArgs) {
      initArgs.packView = initArgs.packView || Pack;
      Base.prototype._setup.call(this, initArgs);
    },

    redrawOnDeliveryInfo: function(row, pos) {
      var overdelivered;

      od_perc = row.overdelivery_perc();
      if (od_perc > consts.DELIVER_THRESHHOLD) {
        overdelivered = true;
      } else if (od_perc !== -1 &&
        od_perc < ((-1) * consts.DELIVER_THRESHHOLD)) {
        overdelivered = false;
      }

      var pack = this._packFor(pos);
      if (pack) {
        var item = pack._rowAt(pos);
        if (item && overdelivered !== undefined) {
          var className = overdelivered ?
            'ufb-dataTable-row-overdelivered' :
            'ufb-dataTable-row-underdelivered';
          item.className = className;
        }
      }
    }

});


exports.DataTableList = DataTableList;
