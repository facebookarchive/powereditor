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

// The map of us regions to their abrs. I know this is
// terrible. I wish we had a better solution for this.

var mapping = [
['alabama', 'al'],
['alaska', 'ak'],
['american samoa', 'as'],
['arizona', 'az'],
['arkansas', 'ar'],
['california', 'ca'],
['colorado', 'co'],
['connecticut', 'ct'],
['delaware', 'de'],
['district of columbia', 'dc'],
['federated states of micronesia', 'fm'],
['florida', 'fl'],
['georgia', 'ga'],
['guam', 'gu'],
['hawaii', 'hi'],
['idaho', 'id'],
['illinois', 'il'],
['indiana', 'in'],
['iowa', 'ia'],
['kansas', 'ks'],
['kentucky', 'ky'],
['louisiana', 'la'],
['maine', 'me'],
['marshall islands', 'mh'],
['maryland', 'md'],
['massachusetts', 'ma'],
['michigan', 'mi'],
['minnesota', 'mn'],
['mississippi', 'ms'],
['missouri', 'mo'],
['montana', 'mt'],
['nebraska', 'ne'],
['nevada', 'nv'],
['new hampshire', 'nh'],
['new jersey', 'nj'],
['new mexico', 'nm'],
['new york', 'ny'],
['north carolina', 'nc'],
['north dakota', 'nd'],
['northern mariana islands', 'mp'],
['ohio', 'oh'],
['oklahoma', 'ok'],
['oregon', 'or'],
['palau', 'pw'],
['pennsylvania', 'pa'],
['puerto rico', 'pr'],
['rhode island', 'ri'],
['south carolina', 'sc'],
['south dakota', 'sd'],
['tennessee', 'tn'],
['texas', 'tx'],
['utah', 'ut'],
['vermont', 'vt'],
['virgin islands', 'vi'],
['virginia', 'va'],
['washington', 'wa'],
['west virginia', 'wv'],
['wisconsin', 'wi'],
['wyoming', 'wy']];

var short_to_long = {};
var long_to_short = {};

mapping.forEach(function(pair) {
  short_to_long[pair[1]] = pair[0];
  long_to_short[pair[0]] = pair[1];
});


exports.shortToLong = function(region) {
  return short_to_long[region.toLowerCase()];
};

exports.longToShort = function(region) {
  return long_to_short[region.toLowerCase()];
};
