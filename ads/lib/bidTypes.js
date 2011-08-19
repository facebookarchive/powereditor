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


var BID_TYPE_CPC      = 1;
var BID_TYPE_CPM      = 2;
var BID_TYPE_FCPM     = 4;
var BID_TYPE_MULTI    = 5;
var BID_TYPE_MULTI_SS = 6;

function options(isCorporate) {
  var result = [
    { text: tx('ads:pe:bid-type:cpc'), value: BID_TYPE_CPC,
      tabSeparated: 'cpc' },
    { text: tx('ads:pe:bid-type:cpm'), value: BID_TYPE_CPM,
      tabSeparated: 'cpm' }
// Uncomment when we're ready to release BBB to self server
//  { text: 'Multi', value: BID_TYPE_MULTI_SS, tabSeparated: 'multi_ss' }
  ];

  if (global.INTERN && isCorporate) {
    // remove multi_ss, DSO has a different multi
    // result = result.slice(0, 2);

    result.push({ text: tx('ads:pe:bid-type:fcpm'), value: BID_TYPE_FCPM,
      tabSeparated: 'cpm_fixed' });
    result.push({ text: tx('ads:pe:bid-type:multi'), value: BID_TYPE_MULTI,
      tabSeparated: 'multi' });
  }

  return result;
}

function getName(id, isCorporate) {
  for (var i = 0, d = options(isCorporate); i < d.length; i++) {
    if (d[i].value == id) { return d[i].text; }
  }
  return '';
}

function getTabSeparatedName(id, isCorporate) {
  for (var i = 0, d = options(isCorporate); i < d.length; i++) {
    if (d[i].value == id) { return d[i].tabSeparated; }
  }
  return '';
}


exports.BID_TYPE_CPC      = BID_TYPE_CPC;
exports.BID_TYPE_CPM      = BID_TYPE_CPM;
exports.BID_TYPE_FCPM     = BID_TYPE_FCPM;
exports.BID_TYPE_MULTI    = BID_TYPE_MULTI;
exports.BID_TYPE_MULTI_SS = BID_TYPE_MULTI_SS;

exports.options = options;
exports.getName = getName;
exports.getTabSeparatedName = getTabSeparatedName;
