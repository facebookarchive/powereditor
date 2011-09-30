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


var DateUtil = {
  /** PRIVATE FUNCTIONS **/


  /**
   * Find the actual offset of a given Unix timestamp for the account's timezone
   *
   * @param account to find timezone offsets for
   * @param Unix timestamp in milliseconds
   * @return offset from UTC in milliseconds for account timezone
   */
  _getActualOffset: function(account, t) {
    if (!account || !account.timezone_offsets()) {
      return new Date(t).getTimezoneOffset() * 1000 * 60 * -1;
    } // if no offsets exist return local offset

    var offsets = account.timezone_offsets();
    t = parseInt(t / 1000, 10); // temporarily convert to seconds

    for (var i = 0; i < offsets.length - 1; i++) {
      if (t >= offsets[i].ts && t < offsets[i + 1].ts) {
        return offsets[i].offset * 1000;
      }
    }

    return offsets.length && offsets[offsets.length - 1].offset * 1000;
  },

  /**
   * Helper function for public DateUtil functions
   *
   * @param account
   * @param date
   * @param true if adjusting local -> account
   *       false if adjusting account -> local
   */
  _convertOffsets: function(account, date, localToAccount) {
    var output = new Date();
    var actualOffset = this._getActualOffset(account, date.getTime());
    var localOffset  = date.getTimezoneOffset() * 60 * 1000 * -1;
    var offset = localOffset - actualOffset;
    if (!localToAccount) { offset *= -1; }
    output.setTime(date.getTime() - offset);

    return output;
  }
};


/** PUBLIC FUNCTIONS **/




/**
 * Should be used to convert a stored Date object to display in the
 * timezone of the given account.
 *
 * @param account with timezone to adjust to
 * @param date object to adjust for correct display
 *
 * @return date object adjusted for correct display
 */
DateUtil.fromLocalToAccountOffset = function(account, time) {
  return this._convertOffsets(account, time, true);
};

/**
 * Should be used to convert a Date object used to display date
 * in correct timezone back to local timezone for proper storage.
 *
 * @param account with timezone to adjust to
 * @param date object to adjust for correct storage
 *
 * @return date object adjusted for correct storage
 */
DateUtil.fromAccountToLocalOffset = function(account, time) {
  return this._convertOffsets(account, time, false);
};

/**
 * Converts the current time to the timezone of the given account.
 *
 * @param account with timezone to adjust to
 *
 * @return date object adjusted for account timezone
 */
DateUtil.fromNowToAccountOffset = function(account) {
  return this._convertOffsets(account, new Date(), true);
};


exports.DateUtil = DateUtil;
