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
 * Date Range manipulation functions
 *
 */

function encode(from, to) {
  if (!from || !to) { return '0-0'; }
  return [from.getMonth() + 1, from.getDate(), from.getFullYear()]
    .join('/') + '-' +
    [to.getMonth() + 1, to.getDate(), to.getFullYear()].join('/');
}

function decode(string) {
  if (!string) { return ''; }
  var parts = string.split('-');
  if (parts[0] == '0' || parts[1] == '0') { return ''; }
  return { from: decodeDateAndTime(parts[0]), to: decodeDateAndTime(parts[1]) };
}

function cleanDate() {
  var date = new Date();
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

function add0(x) {
  return (x + 100 + '').substr(1);
}

function formatDate(date) {
  return add0(date.getMonth() + 1) + '/' +
    add0(date.getDate()) + '/' +
    add0(date.getFullYear() % 100);
}

function formatTime(date) {
  var hString = (date.getHours() === 0 || date.getHours() == 12) ?
    '12' : date.getHours() % 12;

  return hString + ':' + add0(date.getMinutes()) + ' ' +
    (date.getHours() >= 12 ? 'pm' : 'am');
}

function formatDateAndTime(date) {
  return formatDate(date) + ' ' + formatTime(date);
}

// supports 2 digit and 4 digit years
function decodeDateAndTime(string) {
  // try various formats until something works
  return _decodeDateAndTimeShort(string) || _decodeDateAndTimeLong(string);
}

// parse dates in the "YYYY-MM-DD hh:mm pm?" format
// ignores the timezone (optional) between date and hour, among other alphas
function _decodeDateAndTimeLong(string) {
  var match = string.match(/(\d+)-(\d+)-(\d+)(?:[\sA-z]+(\d+):(\d+)\s*(\w*))?/);
  if (!match) { return null; }

  var date = cleanDate();
  _setDate(date, match[1], match[2], match[3]);
  _setTime(date, match[4], match[5], match[6]);
  return date;
}

// parse dates in "MM/DD/YY hh:mm pm?" format
function _decodeDateAndTimeShort(string) {
  var match = string.match(/(\d+)\/(\d+)\/(\d+)(?:\s+(\d+):(\d+)\s*(\w*))?/);
  if (!match) { return null; }

  var date = cleanDate();
  _setDate(date, match[3], match[1], match[2]);
  _setTime(date, match[4], match[5], match[6]);
  return date;
}

function _setDate(date, year, month, date_of_month) {
  year *= 1;

  if (year < 1000) {
    year += 2000;
  }

  date.setFullYear(year, month * 1 - 1, date_of_month * 1);
}

function _setTime(date, hour, minute, ampm) {
  if (hour) {
    date.setHours(_parseAmPm(hour * 1, ampm));
    date.setMinutes(minute * 1);
  } else {
    date.setHours(12);
  }
}

/**
 * Computes the military hour equivalent. If ampm is neither am nor pm,
 * military time is assumed.
 *
 * 12 am =>  0
 * 12 pm => 12
 *
 * @param hour int
 * @param ampm string
 */
function _parseAmPm(hour, ampm) {
  ampm = ampm.toLowerCase();

  if (ampm == 'am' && hour == 12) { return 0; }
  if (ampm == 'pm' && hour != 12) { return hour + 12; }

  return hour;
}

function cloneDate(date) {
  var d = new Date();
  d.setTime(date && date.getTime && date.getTime() || 0);
  return d;
}

module.exports = {
  encode: encode,
  decode: decode,
  date: cleanDate,
  formatDate: formatDate,
  formatTime: formatTime,
  formatDateAndTime: formatDateAndTime,
  decodeDateAndTime: decodeDateAndTime,
  cloneDate: cloneDate
};
