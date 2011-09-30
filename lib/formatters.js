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
*/

var fun = require("../uki-core/function");
var currencyMap = require("../ads/lib/currencyMap");

function formatNumber(precision, exponent_delimiter,
  float_delimiter, value) {

  value = value || 0;
  precision = precision || 0;
  exponent_delimiter = exponent_delimiter || '';
  float_delimiter = float_delimiter || '.';
  var replaced = '';
  var searchFor = /(\d)(\d\d\d)($|\D)/;
  var replaceWith = '$1' + exponent_delimiter + '$2$3';

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
      // If the money value is not numeric return 'N/A'
      if (!(value + '').match(/^\-?[\d\.,]*$/)) {
        return 'N/A';
      }
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
