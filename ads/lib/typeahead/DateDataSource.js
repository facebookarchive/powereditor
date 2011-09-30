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

    DataSource = require("../../../uki-fb/view/typeahead/dataSource").DataSource;


var DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

var MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

function add0(x) {
    return (x + 100 + '').substr(1);
}

var DateDataSource = fun.newClass(DataSource, {

    _running: 0,

    query: function(value, local_only) {
        if (local_only) {
            this.trigger({
                type: 'respond',
                value: value,
                results: [],
                isAsync: false
            });
            return;
        }

        this._running++;
        fun.defer(fun.bind(function() {
            var results = this._dateResults(value, this.maxResults());
            this.trigger({
                type: 'respond',
                value: value,
                results: results,
                isAsync: true
            });
            this._running--;
            this.trigger({ type: 'activity' });
        }, this));
    },

    activeQueries: function() {
        return this._running;
    },

    _resultFor: function(date) {
        return {
            id: date.getTime(),
            text: add0(date.getMonth() + 1) + '/' +
                add0(date.getDate()) + '/' + add0(date.getFullYear() % 100),
            subtext: DAY_NAMES[date.getDay()] + ', ' +
                MONTH_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' +
                date.getFullYear()
        };
    },

    _dateResults: function(string, maxResults) {
        string = string.trim();
        var hasEnding = string.match(/\D$/);
        if (hasEnding) {
            string = string.substr(0, string.length - 1);
        }

        var parts = string.split(/\D+/).map(function(p) {
            return parseInt(p, 10);
        });

        if (
            parts.length === 0 || parts.length > 3 || parts.filter(function(x) {
                return isNaN(x);
            }).length
        ) {
            return [];
        }

        parts = parts.filter(function(x) {
            return x;
        });

        var date = dateRange.date(),
            result = [],
            i = 0;

        date.setDate(1);
        parts[0] = parts[0] - 1;
        if (parts.length === 1) {
            date.setMonth(parts[0]);
            for (i = 0; i < maxResults &&
                date.getMonth() == parts[0]; i++) {

                date.setDate(i + 1);
                result.push(this._resultFor(date));
            }
            return result;
        } else if (parts.length === 2) {
            var year = date.getFullYear();

            for (i = 0; i < maxResults; i++) {
                date.setMonth(parts[0]);
                date.setDate(parts[1]);
                date.setFullYear(year - i);
                if (date.getDate() === parts[1]) {
                    result.push(this._resultFor(date));
                }
            }
            return result;
        } else {
            parts[2] = parts[2] % 100;
            date.setMonth(parts[0]);
            date.setDate(parts[1]);
            date.setFullYear(parts[2] + 2000);

            if (date.getDate() == parts[1]) {
                result.push(this._resultFor(date));
            }
            if (parts[2] < 10) {
                date.setFullYear(parts[2] + 2010);
                while (date.getTime() < (new Date()).getTime() &&
                    result.length < this.maxResults()) {

                    if (date.getDate() == parts[1]) {
                        result.push(this._resultFor(date));
                    }
                    date.setFullYear(date.getFullYear() + 10);
                }
            }
            return result;
        }
    }
});


exports.DateDataSource = DateDataSource;
