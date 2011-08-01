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

var fun   = require("../../../uki-core/function"),
    utils = require("../../../uki-core/utils"),

    bidTypes = require("../bidTypes"),

    Base = require("./base").Base;


var BidTypeName = fun.newClass(Base, {
  originalName: '',

  getValue: function(obj) {
    return bidTypes.getName(
      obj[this.originalName](),
      obj.isCorporate()
    );
  },

  getTabSeparated: function(obj) {
    return bidTypes.getTabSeparatedName(
      obj[this.originalName](),
      obj.isCorporate()
    );
  },

  setTabSeparated: function(obj, value, callback) {
    this.setValue(obj, value);
    callback();
  },

  setValue: function(obj, value) {
    var number = 1;

    value = value.trim().toLowerCase();
    utils.forEach(bidTypes.options(obj.isCorporate()), function(type) {
      if (type.tabSeparated == value) {
        number = type.value;
      }
    });
    obj[this.originalName](number);
  }
});

exports.BidTypeName = BidTypeName;
