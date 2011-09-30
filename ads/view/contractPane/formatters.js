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

var formatters = require("../../../lib/formatters"),
    dateRange  = require("../../../lib/dateRange");

function date(d) {
  if (d) {
    var date1 = dateRange.formatDate(d),
        time = dateRange.formatTime(d);

    return '<span class="contractPane-date" title="' +
        date1 + ' ' + time + '">' + date1 + '</span>';
  }
}

var number = formatters.createNumberFormatter();


function money(v, obj) {
    if (obj.account()) {
      var curcode = obj.account().currency();
      return formatters.createMoneyFormatter(
        2, curcode)(v);
    }
}

function allocation(v, obj) {
  if (v === 0 || v === '0') {
    return '0';
  }
  var positive = v > 0;
  var className = positive ? 'positive' : 'negative';

  v = number(Math.abs(v));
  return '<span class="contractPane-' +
      className + '">' + v + '</span>';
}

exports.allocation = allocation;
exports.date   = date;
exports.money  = money;
exports.number = number;
