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

var fun = require("../../../uki-core/function"),

    SingleValueArrayAccessor =
        require("./singleValueArray").SingleValueArrayAccessor,
    SingleValueArray =
        require("./singleValueArray").SingleValueArray;


var Gender = fun.newClass(SingleValueArray, {
  def: [0],

  getRemoteValue: function(obj) {
    var value = this.getValue(obj);
    if (value && value.length === 1 && value[0] == '0') {
      return 0;
    }
    return value;
  }
});


var GenderAccessor = fun.newClass(SingleValueArrayAccessor, {
  def: 0,

  setTabSeparated: function(obj, value, callback) {
    value = (value + '').toLowerCase();
    var number = 0;

    if (value.indexOf('m') === 0 || value === '1') {
      number = 1;
    } else if (value.indexOf('w') === 0 || value.indexOf('f') === 0 ||
    value === '2') {
      number = 2;
    }
    this.setValue(obj, number);
    callback();
  },

  getTabSeparated: function(obj) {
    var value = this.getValue(obj) * 1,
    text  = value + '' === '0' ? 'All' :
    value + '' === '1' ? 'Men' :
    'Women';

    return text;
  }
});


exports.Gender         = Gender;
exports.GenderAccessor = GenderAccessor;
