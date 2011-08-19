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

var formatters = require("../../../lib/formatters");
var dateRange  = require("../../../lib/dateRange");
var dom = require("../../../uki-core/dom");


function changes(c, row) {
  if (row.isNew()) { return '<i class="adPane-col-new"></i>'; }
  if (c) { return '<i class="adPane-col-changes"></i>'; }
  return '';
}

function status(s, row) {
  if (row.end_time() && row.end_time().getTime() &&
      row.end_time().getTime() < Date.now()) {
    return '<i class="campPane-status campPane-status_completed"></i>';
  }

  return '<i class="campPane-status campPane-status_' +
    (s || 1) + '"></i>';
}

function errors(e) {
  return '<i class="adPane-errors adPane-errors_' +
    (e ? 'yes' : 'no') + '"></i>';
}

function startDate(d) {
  if (d) {
    var date = dateRange.formatDate(d),
        time = dateRange.formatTime(d);

    return '<span class="campPane-date" title="' +
      date + ' ' + time + '">' + date + '</span>';
  }
}

function endDate(date) {
  if (!date || date.getTime() < 2) { return 'Ongoing'; }
  return startDate(date);
}

var money = formatters.createMoneyFormatter;

function inflatedBudget(_, obj) {
  if (obj.account()) {
    var curcode = obj.account().currency();
    return money(2, curcode)(obj.budget_100());
  }
}

function budget(_, obj) {
  if (obj.account()) {
    var curcode = obj.account().currency();
    return money(2, curcode)(obj.uninflated_ui_budget_100());
  }
}

function budgetPeriod(_, obj) {
  return obj.daily_budget() ? 'Daily' : 'Lifetime';
}
exports.changes        = changes;
exports.status         = status;
exports.errors         = errors;
exports.startDate      = startDate;
exports.endDate        = endDate;
exports.money          = money;
exports.inflatedBudget = inflatedBudget;
exports.budget         = budget;
exports.budgetPeriod   = budgetPeriod;
