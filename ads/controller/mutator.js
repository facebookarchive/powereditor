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

var view = require("../../uki-core/view"),
    env  = require("../../uki-core/env"),
    build   = require("../../uki-core/builder").build,
    models = require("../models"),
    App = require("./app").App;


/**
* Create campaigns and ads
* @namespace
*/
var Mutator = {};


/**
* Init new ad for a campaign with default fields
*
* @param camp Campaign to be used
* @param ad Ad beingin inited
*/
Mutator.initAdInCampaign = function(camp, ad) {
  ad.muteChanges(true);

  // init both campaign_id and account_id
  ad.campaign_id(camp.id())
    .account_id(camp.account_id())
    // pending
    .adgroup_status(ad.adgroup_status() || 4)
    // negative id => ad is new
    .id(ad.id() || - new Date() - (env.guid++));

  

  ad.muteChanges(false);
};

Mutator.createCampaignHandler = function() {
  Mutator.createCampaign(function(campCreated) {
    if (campCreated) {
      campCreated.validateAll().store(function() {
      // force full app refresh, since we change the list of campaigns
      App.reload();
      });
    }
  });
};

/**
* Creates a new campaign
*/
Mutator.createCampaign = function(callback) {
  var listType = 'campaignList-list';
  var parent = view.byId(listType).selectedRow();

  

  callback(models.Campaign.create(parent));
};

Mutator.selectTopline = function(accountId, lineNumbers, callback) {
  var dialog = Mutator.selectToplineDialog();

  dialog.view('select').options(
    [{ text: 'Select line number', value: '' }].concat(
      lineNumbers.map(function(s) {
        var line_id =
          models.Topline.getIdbyLineNumber(accountId, s);
        var topline = models.Topline.byId(line_id);
        return {
          text: topline && topline.description() ?
            (s + ': ' + topline.description() +
            '-' + topline.targets()) : s,
          value: s
        };
      })
    )
  );

  dialog.view('select').value(lineNumbers[0]);
  dialog.view('ok').removeListener('click').on('click', function() {
    dialog.visible(false);
    var line_number = dialog.view('select').value();
    callback(line_number);
    return;
  });

  dialog.visible(true);
};


// Select line_number from the account
// Give the user's ability to choose the line_number
// before we create the campaign
// not assign the campaign to the first topline.
Mutator.selectToplineDialog = function() {
  if (!this._selectToplineDialog) {
    this._selectToplineDialog =
      build({ view: 'Dialog', childViews: [
        { view: 'DialogHeader', html: "Select target line number" },
        { view: 'DialogContent', childViews: [
          { view: 'DialogBody', childViews: [
            { view: 'Text', text:
              'Please select the line for the campaign.' },
            { view: 'Select', options: [], as: 'select' }
          ] },
          { view: 'DialogFooter', childViews: [
            { view: 'Button', label: 'OK', large: true, as: 'ok',
              use: 'confirm' },
            { view: 'Button', label: 'Close', large: true,
              on: { click: function() {
                Mutator.selectToplineDialog().visible(false);
            } } }
          ] }
        ] }
      ] });
  }
  return this._selectToplineDialog;
};

exports.Mutator = Mutator;
