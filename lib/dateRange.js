/**
* Copyright (c) 2011, Facebook, Inc.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
*   * Redistributions of source code must retain the above copyright notice,
*     this list of conditions and the following disclaimer.
*   * Redistributions in binary form must reproduce the above copyright notice,
*     this list of conditions and the following disclaimer in the documentation
*     and/or other materials provided with the distribution.
*   * Neither the name Facebook nor the names of its contributors may be used to
*     endorse or promote products derived from this software without specific
*     prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
* AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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

/**
 * Supports 2 digit and 4 digit years.
 *
 * @param date string to decode
 * @param optional flag that, if turned on and the string does not indicate
 *  time (only date), will make the date have time of 11:59PM instead of normal
 *  12:00AM.
 */
function decodeDateAndTime(string, default_to_end_of_day) {
  // try various formats until something works
  return _decodeDateAndTimeShort(string, default_to_end_of_day) ||
    _decodeDateAndTimeLong(string, default_to_end_of_day);
}

// parse dates in the "YYYY-MM-DD hh:mm pm?" format
// ignores the timezone (optional) between date and hour, among other alphas
function _decodeDateAndTimeLong(string, default_to_end_of_day) {
  var match = string.match(/(\d+)-(\d+)-(\d+)(?:[\sA-z]+(\d+):(\d+)\s*(\w*))?/);
  if (!match) { return null; }

  var date = cleanDate();
  _setDate(date, match[1], match[2], match[3]);
  _setTime(date, match[4], match[5], match[6], default_to_end_of_day);
  return date;
}

// parse dates in "MM/DD/YY hh:mm pm?" format
function _decodeDateAndTimeShort(string, default_to_end_of_day) {
  var match = string.match(/(\d+)\/(\d+)\/(\d+)(?:\s+(\d+):(\d+)\s*(\w*))?/);
  if (!match) { return null; }

  var date = cleanDate();
  _setDate(date, match[3], match[1], match[2]);
  _setTime(date, match[4], match[5], match[6], default_to_end_of_day);
  return date;
}

function _setDate(date, year, month, date_of_month) {
  year *= 1;

  if (year < 1000) {
    year += 2000;
  }

  date.setFullYear(year, month * 1 - 1, date_of_month * 1);
}

function _setTime(date, hour, minute, ampm, default_to_end_of_day) {
  if (hour) {
    date.setHours(_parseAmPm(hour * 1, ampm));
    date.setMinutes(minute * 1);
  } else {
    if (default_to_end_of_day) {
      date.setHours(23, 59);
    } else {
      date.setHours(0);
    }
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
