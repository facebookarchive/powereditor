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
var Observable = require("../../uki-core/observable").Observable;


// This class is used to propagate change events from
// campaigs so DataTree instance can listen to those
// It also mapps data to accounts. This should not be
// done here
var AccountResultWrapper = fun.newClass(Observable, {

  init: function(accounts, campaigns) {
    var idMap = {};
    accounts.forEach(function(a) {
      idMap[a.id()] = a;
    }, this);
    campaigns.forEach(function(c) {
      if (idMap[c.account_id()]) {
        idMap[c.account_id()].children().push(c);
      }
    }, this);
    accounts.forEach(function(acc) {
      acc.children(acc.children().sort(campSorter));
    }, this);

    this.accounts(accounts);
    this.campaigns(campaigns);
    this.length = accounts.length;
  },

  accounts: fun.newProp('accounts'),

  campaigns: fun.newProp('campaigns')
});

function campSorter(a, b) {
  var line_a = parseInt(a.line_number() || 0, 10);
  var line_b = parseInt(b.line_number() || 0, 10);

  if (line_a == line_b) {
    return a.name() > b.name() ? 1 : (a.name() == b.name() ? 0 : -1);
  }

  return (line_a > line_b) ? 1 : -1;
}

fun.delegateCall(
  AccountResultWrapper.prototype,
  ['slice', 'forEach', 'map', 'sort'],
  'accounts');


exports.AccountResultWrapper = AccountResultWrapper;
