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

  dateRange = require("../../../lib/dateRange"),
  DateUtil = require("../dateUtil").DateUtil,

  TabSeparated = require("./base").TabSeparated,
  StorageTS = require("../../../storage/prop/timestamp").Timestamp;


/**
 * AdjustedTimestamp is a class that converts timestamps between local browser
 * timezone and an account's specified timezone.
 *
 * A model property of type AdjustedTimestamp needs to specify another property
 * of type Timestamp which to adjust its timestamp to display from local to
 * account timezone.
 */
var AdjustedTimestamp = fun.newClass(StorageTS, TabSeparated, {
  originalName: '',

  isEndTime: false, // indicates default behavior for dates without specified
                    // time (11:59PM) as opposed to 12:00AM default

  getValue: function(obj) {
    return obj[this.originalName]() &&
     DateUtil.fromLocalToAccountOffset(obj.account(), obj[this.originalName]());
  },

  setValue: function(obj, value) {
    if (!value) {
      obj[this.originalName](null);
      return;
    }
    if (!this.getValue(obj) ||
        (value.getTime() != this.getValue(obj).getTime())) {
      value = DateUtil.fromAccountToLocalOffset(obj.account(),
        value);
      obj[this.originalName](value);
    }
  },

  getTabSeparated: function(obj) {
    var value = this.getValue(obj);
    if (!value || value.getTime() < 1) { return ''; }
    return dateRange.formatDateAndTime(this.getValue(obj));
  },

  setTabSeparated: function(obj, value, callback) {
    this.setValue(obj, value && dateRange.decodeDateAndTime(value,
      this.isEndTime));
    callback();
  }
});





exports.Timestamp = StorageTS;
exports.AdjustedTimestamp = AdjustedTimestamp;
