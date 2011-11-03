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

var view   = require("../../uki-core/view"),
    utils  = require("../../uki-core/utils"),
    env    = require("../../uki-core/env"),
    evt    = require("../../uki-core/event"),

    DeferredList = require("../../lib/deferredList").DeferredList;



/**
* Handle ad/campaign delete/revert on backspace/delete
* @namespace
*/
var Delete = {};

/**
 * @param id the ID of the pane that contains the items
 * @param update_status The status field. For ads it's 'real_adgroup_status'.
 *  For campaigns it's 'campaign-status'
 */
function delete_items(id, update_status, completeFn) {
  var items = view.byId(id + '-data').selectedRows(),
      deleted = 0,
      deferred = new DeferredList();

  items.forEach(function(item) {
    if (item.isNew && item.isNew()) {
      item.remove(deferred.newWaitHandler());
      deleted++;
    } else if (id === 'accountPane') {
      item.remove(deferred.newWaitHandler());
      deleted++;
    } else {
      // 3 is the magic number for status = DELETED
      item[update_status](3).store(deferred.newWaitHandler());
    }
  });

  deferred.complete(completeFn);
  view.byId(id).refreshAndSelect(items);

  return deleted;
}

Delete.init = function() {
  evt.on(env.doc.body, 'keydown', function(e) {
    // If user pressed backspace or delete
    if (e.keyCode == 8 || e.keyCode == 46) {
      // find the closest view to the active element
      var delView = view.closest(env.doc.activeElement);

      // see which view it is
      if (delView && delView.copySourceId) {
        if (delView.copySourceId() === 'campaigns') {
          Delete.handleCamps();
        } else if (delView.copySourceId() === 'ads') {
          Delete.handleAds();
        } else if (delView.copySourceId() === 'accounts') {
          Delete.handleAccounts();
        } else {
          require("../../uki-fb/view/dialog").Dialog
            .alert('not supported pane type');
        }

        // make sure we don't navigate back
        return evt.preventDefaultHandler(e);
      }
    }
  });
};

Delete.handleAds = function() {
  delete_items('adPane', 'real_adgroup_status');
};

Delete.handleCamps = function() {
  // reload the app if we actually deleted new campaigns to update left pane
  delete_items('campPane',
    'campaign_status',
    require("./app").App.reload);
};

Delete.handleAccounts = function() {
  delete_items('accountPane',
    'account_status',
    require("./app").App.reload);
};

exports.Delete = Delete;
