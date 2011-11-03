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


// directly copied from the ads_account_status class
var STATUS_MAP = {
  1: tx('ads:pe:account-status:active'),
  2: tx('ads:pe:account-status:disabled'),
  3: tx('ads:pe:account-status:unsettled'),
  7: tx('ads:pe:account-status:pending-risk-review'),
  100: tx('ads:pe:account-status:pending-closure'),
  101: tx('ads:pe:account-status:closed'),

  0: tx('ads:pe:account-status:invalid')
};

var ACTIVE = 1;
var DISABLED = 2;
var UNSETTLED = 3;
var PENDING_RISK_REVIEW = 7;
var PENDING_CLOSURE = 100;
var CLOSED = 101;

var INVALID = 0;


exports.ACTIVE = ACTIVE;
exports.DISABLED = DISABLED;
exports.UNSETTLED = UNSETTLED;
exports.PENDING_RISK_REVIEW = PENDING_RISK_REVIEW;
exports.PENDING_CLOSURE = PENDING_CLOSURE;
exports.CLOSED = CLOSED;
exports.INVALID = INVALID;

exports.STATUS_MAP = STATUS_MAP;
