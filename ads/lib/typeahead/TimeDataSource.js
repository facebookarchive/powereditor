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


function add0(x) {
    return (x + 100 + '').substr(1);
}

var MINS_FOR_HOUR = ['00', '15', '30', '45'];
var MINS = [
  '00', '01', '02', '03', '04', '05', '06', '07', '08', '09',
  '15', '10', '11', '12', '13', '14', '16', '17', '18', '19',
  '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
  '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
  '45', '40', '41', '42', '43', '44', '46', '47', '48', '49',
  '50', '51', '52', '53', '54', '55', '56', '57', '58', '59'
];

var TimeDataSource = fun.newClass(DataSource, {

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

    _resultFor: function(h, m) {
        var d = dateRange.date();
        d.setHours(h);
        d.setMinutes(m);

        return {
            id: d.getTime(),
            text: dateRange.formatTime(d)
        };
    },

    _dateResults: function(string, maxResults) {
      string = string.trim();
      var parts = string.split(/\D+/).map(function(p) { return p.trim(); });
      var result = [], i, min;

      if (parts.length == 1 || parts[1] === '') {
        if (parts[0]*1 <= 12) {
          for (i = 0; i < MINS_FOR_HOUR.length * 2 && i < maxResults; i++) {
            min = MINS_FOR_HOUR[(i/2 << 0) % MINS.length];
            result.push(this._resultFor(parts[0]*1 + ((i & 1) ? 12 : 0), min));
          }
        } else {
          for (i = 0; i < MINS_FOR_HOUR.length && i < maxResults; i++) {
            result.push(this._resultFor(parts[0]*1, MINS_FOR_HOUR[i]));
          }
        }
      } else {
        if (parts[0]*1 <= 12) {
          for (i = 0; i < MINS.length * 2 && result.length < maxResults; i++) {
            min = MINS[(i/2 << 0) % MINS.length];
            if (min.indexOf(parts[1]) === 0) {
              result.push(this._resultFor(parts[0]*1 + (i & 1 ? 12 : 0), min));
            }
          }
        } else {
          for (i = 0; i < MINS.length && result.length < maxResults; i++) {
            if ((MINS[i] + '').indexOf(parts[1]) === 0) {
              result.push(this._resultFor(parts[0]*1, MINS[i]));
            }
          }
        }
      }
      return result;
    }

});


exports.TimeDataSource = TimeDataSource;
