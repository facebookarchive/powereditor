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

var fun = require("../../uki-core/function");
var currencyMap = require("./currencyMap");

function formatNumber(precision, exponent_delimiter,
    float_delimiter, value) {

    value = value || 0;
    precision = precision || 0;
    exponent_delimiter = exponent_delimiter || '';
    float_delimiter = float_delimiter || '.';
    var replaced = '',
        searchFor = /(\d)(\d\d\d)($|\D)/,
        replaceWith = '$1' + exponent_delimiter + '$2$3';

    value = roundNumber(value, precision).replace('.', float_delimiter);

    while ((replaced = value.replace(searchFor, replaceWith)) != value) {
        value = replaced;
    }
    return value;
}

function roundNumber(value, precision) {
    var pow = Math.pow(10, precision);
    value = Math.round(value * pow) / pow + '';
    if (!precision) { return value; }

    var pos = value.indexOf('.');
    var zerros = 0;
    if (pos == -1) {
        value += '.';
        zerros = precision;
    } else {
        zerros = precision - (value.length - pos - 1);
    }
    for (var i = 0, l = zerros; i < l; i++) {
        value += '0';
    }
    return value;
}

function createNumberFormatter(precision) {
    return fun.bind(formatNumber, null, precision, ',', '.');
}

function createPercentFormatter(precision) {
    return function(value) {
        return formatNumber(precision, ',', '.', value * 100) + '%';
    };
}

var cacheMoney = {};
function createMoneyFormatter(precision, curcode) {
    precision = precision || 2;
    curcode = curcode || 'ALL';
    var key = curcode + '-' + precision;
    if (!cacheMoney[key]) {
      var format = currencyMap.getFormat(curcode);
      var symbol = currencyMap.getSymbol(curcode);
      format = format.replace('{symbol}', symbol);

      cacheMoney[key] = function(value) {
        var amount = formatNumber(precision, ',', '.', value);
        return format.replace('{amount}', amount);
      };
    }
    return cacheMoney[key];
}

/**
 * Just remove the currency symbol.
 */
function parseMoney(text) {
  return text.replace(/^[0-9.,]/g, '');
}

function createInflationFormatter() {
  return function(value) {
    return formatNumber(0, ',', '.', value) + '%';
  };
}

function createBooleanFormatter() {
    return function(value) {
        return (value == 1)  ? 'Yes' : 'No';
    };
}

exports.parseMoney = parseMoney;
exports.createNumberFormatter  = createNumberFormatter;
exports.createPercentFormatter = createPercentFormatter;
exports.createMoneyFormatter   = createMoneyFormatter;
exports.createInflationFormatter = createInflationFormatter;
exports.createBooleanFormatter = createBooleanFormatter;
