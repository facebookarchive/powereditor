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

var campConst = require("../../model/campaign/constants");
var Base = require("./base").Base;
var Num = require("./number").Number;

var inflationConverter = require("../budgetImpsConverter").Converter;



var TYPE_MAP = {
    1: 'Classic',
    2: 'Moo'
};

var MULTI_REX = /multi/gi;

var CampaignType = fun.newClass(Num, {
  setTabSeparated: function(obj, value, callback) {
    value = (value + '').toLowerCase();
    value = value.replace(MULTI_REX, 'moo');
    var number = 1;

    utils.forEach(TYPE_MAP, function(status, id) {
      if (status.toLowerCase() == value.trim()) {
        number = id;
      }
    });

    this.setValue(obj, number);
    callback();
  },

  getTabSeparated: function(obj) {
    var value = this.getValue(obj);
    return TYPE_MAP[value];
  },

  setValue: function(obj, value) {
    Num.prototype.setValue.call(this, obj, value);
    if (value == campConst.CAMP_CLASSIC_TYPE) {
      obj.lifetime_imps(0);
      obj.daily_imps(0);
    } else {
      if (obj.daily_budget()) {
        obj.daily_imps(inflationConverter.convertToImps(
          obj.daily_budget(), obj.func_price()));
      }

      if (obj.lifetime_budget()) {
        obj.lifetime_imps(inflationConverter.convertToImps(
          obj.lifetime_budget(), obj.func_price()));
      }
    }
  }
});

exports.TYPE_MAP   = TYPE_MAP;
exports.CampaignType   = CampaignType;
