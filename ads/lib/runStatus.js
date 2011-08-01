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


// directly copied from the ads_run_status class
// (note delivery status should not be used in the api environment)
var ACTIVE = 1;
var PAUSED = 2;
var DELETED = 3;
var PENDING_REVIEW = 4;
var DISAPPROVED = 5;
var PREAPPROVED = 6;
var PENDING_BILLING_INFO = 7;
var CAMPAIGN_PAUSED = 8;
var ADGROUP_PAUSED = 9;
var DRAFT = 10;

var INVALID = 0;

exports.INVALID = INVALID;
exports.ACTIVE = ACTIVE;
exports.PAUSED = PAUSED;
exports.DELETED = DELETED;
exports.PENDING_REVIEW = PENDING_REVIEW;
exports.PREAPPROVED = PREAPPROVED;
exports.PENDING_REVIEW = PENDING_REVIEW;
exports.CAMPAIGN_PAUSED = CAMPAIGN_PAUSED;
exports.ADGROUP_PAUSED = ADGROUP_PAUSED;
exports.DRAFT = DRAFT;
