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

var view  = require("../../uki-core/view"),
    utils = require("../../uki-core/utils"),

    App          = require("./app").App,
    DeferredList = require("../../lib/deferredList").DeferredList;


/**
 * Revert campaign or ad to original state
 * Either delete ad if it's new or revert to the state
 * it was downloaded from the server
 * @namespace
 */
var Revert = {};

function revert(id) {
  var items = view.byId(id + '-data').selectedRows(),
      reverted = 0,
      deferred = new DeferredList();

  items.forEach(function(item) {
    if (item.isChanged()) {
      if (item.isNew()) {
        item.remove(deferred.newWaitHandler());
      } else {
        item
          .revertChanges()
          .validateAll()
          .store(deferred.newWaitHandler());
      }
      reverted++;
    }
  });

  if (!reverted) {
    require("../../uki-fb/view/dialog").Dialog
      .alert(tx('ads:pe:revert-nothing-selected'));
    return;
  } else {
    view.byId(id).refreshAndSelect(items);
  }
}

Revert.revertAdsHandler = function() {
  revert('adPane');
};

Revert.revertCampsHandler = function() {
  require("../lib/loggingState").startFlow('revert');
  revert('campPane');
  App.reload();
  require("../lib/loggingState").endFlow('revert');
};


exports.Revert = Revert;
