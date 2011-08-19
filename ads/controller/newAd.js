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
    env   = require("../../uki-core/env"),
    evt   = require("../../uki-core/event"),
    SelectDialog = require("../view/selectDialog").SelectDialog;

/**
* Class that handles creating a new Ad (if the user is selecting multiple
* campaigns)
*/
var NewAd = {};

/**
* Initialization
* Set up controller to listen to 'createAd' events
*/
NewAd.init = function() {
  evt.on(env.doc.body, 'createAd', function(e) {
    var callback = e.callback;
    if (!callback) {
      return;
    }

    NewAd.handler(callback);
  });
  this._selectDialog = new SelectDialog('campaign');
  this._selectDialog.text(tx('ads:pe:select-one-campaign-for-create'));
};

/**
* Event handler
*
* @param callback function to be called when campaign obtained
*   callback function should have at least one parameter, which indicates
*   the index of the campaign that is selected
*/
NewAd.handler = function(callback) {
  NewAd.selectCampaign(callback);
};

/**
* Select campaign
* If user tries to create an ad with more than one campaign selected
* (account is selected), ask which particular campaign user wants to use.
* Uses the selected ad as a hint to preselect campaign.
*
* @param callback function to be called when campaign is selected
*   callback function should have at least one parameter, which indicates
*   the index of the campaign that is selected
*/
NewAd.selectCampaign = function(callback) {
  var selectedCampaigns = view.byId('content').campaigns();
  var selectedAd = view.byId('adPane-data').selectedRow();
  var dialog = this._selectDialog;
  dialog.selectOptions(selectedCampaigns.map(function(camp) {
    return { text: camp.name() + ' (' + camp.id() + ')', value: camp.id() };
  }));
  if (selectedAd) {
    dialog.selectValue(selectedAd.campaign_id());
  }
  dialog.on('select.campaign', function handler(e) {
    dialog.removeListener('select.campaign', handler);
    e.stopPropagation();
    dialog.visible(false);
    var id = dialog.selectValue();
    for (var i = 0, l = selectedCampaigns.length; i < l; i++) {
      if (id === selectedCampaigns[i].id()) {
        callback(i);
        return;
      }
    }
  });
  dialog.visible(true);
};

exports.NewAd = NewAd;
