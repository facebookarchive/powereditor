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
var SingleValueArray =
  require("./singleValueArray").SingleValueArray;
var SingleValueArrayAccessor =
  require("./singleValueArray").SingleValueArrayAccessor;


var EducationStatus = fun.newClass(SingleValueArray, {
  def: [0]
});

var EducationStatusAccessor = fun.newClass(SingleValueArrayAccessor, {
  def: 0,

  setTabSeparated: function(obj, value, callback) {
    value = (value + '').toLowerCase();

    var number = 0;

    if (value === 1 || value.match(/high/)) {
      number = 1;
    } else if (value === 3 || value.match(/(^|\s)grad/)) {
      number = 3;
    } else if (value === 2 || value.match(/college|undergrad/)) {
      number = 2;
    }
    this.setValue(obj, number);
    callback();
  },

  getTabSeparated: function(obj) {
    var value = this.getValue(obj);
    var text = value + '' === '0' ? 'All' :
               value + '' === '1' ? 'High School' :
               value + '' === '2' ? 'College'     :
               'College Grad';

    return text;
  }
});


exports.EducationStatus = EducationStatus;
exports.EducationStatusAccessor = EducationStatusAccessor;
