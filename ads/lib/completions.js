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

var Graphlink = require("../../lib/graphlink").Graphlink;

/**
* Search in countires and locales
* @param Object   items       objects to search in
* @param String   query       search query
* @param Integer  limit       max number of results
* @param Array    exclusions  ids to exclude
* @return Array Found items
*/
function searchIn(items, query, limit, exclusions) {
  if (!query) { return []; }

  exclusions = exclusions || [];
  var Util = require("../../uki-fb/view/typeahead/util").Util;
  var query_regexps = Util.tokenize(query).map(function(token) {
    return new RegExp('^' + Util.escape(token));
  });

  var result = [];
  try {
    require("../../uki-core/utils").forEach(items, function(text, key) {
      if (exclusions.indexOf(key) != -1) { return; }
      var object_tokens = Util.tokenize(text);

      var count = 0;
      for (var i = 0; i < query_regexps.length; i++) {
        for (var j = 0; j < object_tokens.length; j++) {
          if (query_regexps[i].test(object_tokens[j])) {
            count++;
            break;
          }
        }
      }
      if (count === query_regexps.length) {
        result.push({ id: key, text: text });
        if (result.length >= limit) { throw 'break'; }
      }
    });
  } catch (e) {}
  return result;
}

var cache = {};

function bestMatch(query, items) {
  var Util = require("../../uki-fb/view/typeahead/util").Util;
  query = Util.tokenize(query).join(' ');
  for (var i = 0; i < items.length; i++) {
    if (Util.tokenize(items[i].text || items[i].name).join(' ') == query) {
      return items[i];
    }
  }
  return items[0];
}

var BEST_MATCH_LIMIT = 7;

exports.findBest = function(type, query, callback) {
  var key = type + ':' + query;
  var options = { q: query, limit: BEST_MATCH_LIMIT };
  if (type == 'country') {
    callback(
      bestMatch(query, this.searchCountries(query, BEST_MATCH_LIMIT)));
      return;
  } else if (type == 'locale') {
    callback(
      bestMatch(query, this.searchLocales(query, BEST_MATCH_LIMIT)));
      return;
  } else if (type == 'city' || type == 'region') {
    key = type + ':' + query.country + ':' + query.query;
    options.q = query.query;
    options.country_list = query.country.toLowerCase();
  }
  key = key.toLowerCase();

  if (cache[key] !== undefined) {
    callback(cache[key]);
  } else {
    if (exports.dialog) {
      var log = exports.dialog.visible(true).append(
        { view: 'Text', text: 'Looking for ' + type + ' "' + options.q + '"' });
    }
    var graphlink = new Graphlink();
    graphlink.querysearch('ad' + type, options,
      function(r) {
        cache[key] = bestMatch(options.q, r.data || []);
        if (log) {
          log.text(log.text() + ' - done');
        }
        callback(cache[key]);
      });
  }
};

/**
* Search in countires
* @param String   query       search query
* @param Integer  limit       max number of results
* @param Array    exclusions  ids to exclude
* @return Array Found countries
*/
exports.searchCountries = function(query, limit, exclusions) {
  return searchIn(require("./countries").countries, query, limit, exclusions);
};

/**
* Search in countires
* @param String   query       search query
* @param Integer  limit       max number of results
* @param Array    exclusions  ids to exclude
* @return Array Found locales
*/
exports.searchLocales = function(query, limit, exclusions) {
  return searchIn(require("./locales").locales, query, limit, exclusions);
};

exports.dialog = null;
exports.cache = cache;

