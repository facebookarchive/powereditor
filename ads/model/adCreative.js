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


var storage = require("../../storage/storage"),
    pathUtils = require("../../storage/lib/pathUtils"),

    storeUtils = require("../../storage/lib/utils");

var AdCreative = storage.newStorage({
});

AdCreative
  .graphEdgeName('data');

/**
 * @param account_ids = array of account_ids
 */
AdCreative.loadFromAccountIds = function(account_ids, callback) {
  var creativesPaths = storeUtils.wrapArray(account_ids).map(
    function(account_id) {
      return pathUtils.join('act_' + account_id, '/adcreatives');
  });
  if (creativesPaths.length == 1) {
    creativesPaths = creativesPaths[0];
  }
  var creativesEdgeName = 'creatives';
  var edgeCall = true;

  storage.Storage.loadGRemote.call(
    AdCreative, creativesPaths, {}, edgeCall, callback);
};

AdCreative.loadCallback = function(items, isDone, callback) {
  callback(storeUtils.wrapArray(items), isDone);
};

exports.AdCreative = AdCreative;
