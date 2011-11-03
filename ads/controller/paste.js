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
    fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    env   = require("../../uki-core/env"),
    evt   = require("../../uki-core/event"),
    dom   = require("../../uki-core/dom"),
    Campaign = require("../model/campaign").Campaign,
    Topline = require("../model/topline").Topline,

    ParserJob = require("../job/tabSeparatedParser").Parser,
    CampImporterJob = require("../job/campImporter").Importer,
    AdImporterJob = require("../job/adImporter").Importer,
    LogDialog = require("../view/logDialog").LogDialog,
    SelectDialog = require("../view/selectDialog").SelectDialog,

    DuplicateUtils =
        require("./duplicate/DuplicateUtils").DuplicateUtils,

    Copy = require("./copy").Copy,
    App  = require("./app").App;

/**
* Handle Ad paste
* @namespace
*/
var Paste = {};

Paste.init = function() {
  // bind high level paste hanlder, so we can
  // support campaign and ad tab separated pastes
  var normalPasteCompletedBefore = false;
  Paste._selectCampaignDialog = new SelectDialog('campaign');
  Paste._selectToplineDialog = new SelectDialog('topline');

  evt.on(env.doc.body, 'paste', function(e) {
    var pasteView = targetView(e);
    if (pasteView) {
      normalPasteCompletedBefore = true;
      // read the data from clipboard
      var text = e.clipboardData.getData('text/plain') ||
          e.clipboardData.getData('text') || '';

      Paste.handler(pasteView, text);
    }
  });

  // FF only allows paste event on editable elements,
  // something that we cannot do here. So manually check
  // keydown event
  if (!env.ua.match(/Gecko\/\d+/)) {
    return;
  }
  evt.on(env.doc.body, 'keydown', function(e) {
    if (e.keyCode == 86 && (e.metaKey || e.ctrlKey)) {
      var pasteView = targetView(e);
      if (pasteView && !normalPasteCompletedBefore) {
        var activeElement = env.doc.activeElement;
        var dummy = copyDummy();
        dummy.value = '';
        dummy.focus();
        setTimeout(function() {
          var text = dummy.value;
          activeElement.focus();
          if (!normalPasteCompletedBefore) {
            Paste.handler(pasteView, text);
          }
        }, 10);
      }
    }
  }, true);
};

function targetView(e) {
  var v = view.closest(env.doc.activeElement);
  if (!v || !v.pasteTarget) {
      return false;
  }
  return v;
}

var _copyDummy = null;
function copyDummy() {
  if (!_copyDummy) {
    _copyDummy = dom.createElement('textarea', {
      style: 'position:absolute;left: -1000px'
    });
    env.doc.body.appendChild(_copyDummy);
  }
  return _copyDummy;
}

Paste.getSelectedAccount = function() {
  var row = view.byId('campaignList-list').selectedRow();
  var account = row.account ? row.account() : row;
  return account;
};

/**
* Event handler
*
* @param v the view that user pasted to
* @param text the text the user pasted
*/
Paste.handler = function(v, text) {
  // Windows tends to replace \n -> \r\n during copy
  text = text.replace(/(\r\n|\r|\n)/g, '\n').replace(/\r/g, '\n');

  var account = Paste.getSelectedAccount();
  var line_number = null;

  Paste.resetDialog();
  require("../lib/completions").dialog = Paste.dialog();

  var selected_pane_name = view.byId('content').curSelectedPane();

  if (selected_pane_name == 'contractPane') {
    var toplines = view.byId('topline-table').selectedRows();
    if (toplines.length > 0) {
      line_number = toplines[0].line_number();
    }
  }

  if (selected_pane_name != 'adPane') {
    if (account.hasContract() && !line_number) {
      Paste.selectTopline(account, function(selected_line_number) {
        Paste.pasteIntoCamps(account, selected_line_number, text);
          });
    } else {
      Paste.pasteIntoCamps(account, line_number, text);
    }
  } else {
    var selected_campaigns = view.byId('content').campaigns();
    if (Copy.isInternalPaste(text, 'ads')) {
      if (selected_campaigns.length == 1) {
        Paste.pasteIntoAds(account, text, selected_campaigns[0]);
      } else {
        Paste.selectCampaign(account, function(campaign) {
          Paste.pasteIntoAds(account, text, campaign);
        });
      }
    } else {
      Paste.pasteIntoAds(account, text, null);
    }
  }
};

// Error logging
// If no errors occurred dialog will remain hidden.
// When error appears during any process this dialog will show up with a line
// for that error. Dialog will grow with more errors being added.
// User can close dialog with 'Close' button
Paste.dialog = function() {
  return Paste._dialog ||
    (Paste._dialog = new LogDialog().title(tx('ads:pe:paste-title')));
};

Paste.resetDialog = function() {
  if (Paste._dialog) { Paste._dialog.clear(); }
};

Paste.logError = function(error) {
  Paste.dialog().visible(true).log(error);
};

// Select campaign
// If user pastes from power editor and more than one campaign is selected
// (account is selected) ask which particular campaign user wants to use.
// Use selected ad as a hint to preselect campaign.
Paste.selectCampaign = function(account, callback) {
  Campaign.findAllBy('account_id', account.id(), function(campaigns) {
    var selectedAd = view.byId('adPane-data').selectedRow();
    var dialog = Paste._selectCampaignDialog;
    dialog.text(tx('ads:pe:select-one-campaign-for-paste',
        {act: account.id()}));
    dialog.selectOptions(campaigns.map(function(camp) {
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
      for (var i = 0, l = campaigns.length; i < l; i++) {
        if (id === campaigns[i].id()) {
          callback(campaigns[i]);
          return;
        }
      }
    });
    dialog.visible(true);
  });
};

Paste.selectTopline = function(account, callback) {
  var selected_pane_name = view.byId('content').curSelectedPane();
  var selected_toplines = [];
  var selected_topline = null;
  if (selected_pane_name == 'contractPane') {
    selected_toplines = view.byId('topline-table').selectedRows();
    if (selected_toplines.length > 0) {
      selected_topline = selected_toplines[0];
    }
  }

  Topline.findAllBy('account_id', account.id(),
      fun.bind(function(toplines) {
    var dialog = Paste._selectToplineDialog;
    Paste._selectToplineDialog.text(
      tx('ads:pe:select-one-topline-for-paste', { act: account.id() }));
    dialog.selectOptions(toplines.map(function(topline) {
      var name = '#' + topline.line_number() +
        ' ' + topline.product_type();
      if (topline.description() && topline.description().length > 0) {
        name += ' - ' + topline.description();
      }
      if (topline.targets() && topline.targets().length > 0) {
        name += ' - ' + topline.targets();
      }
      return { text: name, value: topline.line_number() };
    }));
    if (selected_topline) {
      dialog.selectValue(selected_topline.line_number());
    }
    dialog.on('select.topline', function handler(e) {
      dialog.removeListener('select.topline', handler);
      e.stopPropagation();
      dialog.visible(false);
      var line_number = dialog.selectValue();
      callback(line_number);
    });
    dialog.visible(true);
  }, true));
};

Paste.pasteIntoAds = function(account, text, to_campaign) {
  var parser = new ParserJob(account, text);

  parser.excelPaste(!Copy.isInternalPaste(text, 'ads'));

  parser.oncomplete(function() {
    if (parser.errors().length) {
      require("../../uki-fb/view/dialog").Dialog
        .alert(tx('ads:pe:parse-invalid-header'));
      return;
    }
    if (parser.foundAdProps().length < 2) {
      require("../../uki-fb/view/dialog").Dialog
        .alert(tx('ads:pe:paste-garbage-ads-error'));
      return;
    }
    if (parser.foundCampProps().length > 1) {
      Paste.logError(tx('ads:pe:paste-campaign-into-ads-warning'));
    }

    if (parser.ads().length) {
      var importer = new AdImporterJob(
        account,
        parser.ads(),
        utils.pluck(parser.foundAdProps(), 'name'));

      if (Copy.isInternalPaste(text, 'ads')) {
        // when copying within app, use selected campaign as a target
        // override any campaign_id previously selected
        parser.ads().forEach(function(ad) {
          ad.muteChanges(true)
            .id('');
          if (to_campaign) {
            ad.campaign_id(to_campaign.id());
          }
          ad.muteChanges(false);
        });

        importer.useNameMatching(false);
      }

      importer
        .onerror(function(e) { Paste.logError(e.error.message()); })
        .oncomplete(function() {
          view.byId('adPane').refreshAndSelect(importer.ads());
        })
        .start();
    } else {
      // nothing to paste
    }
  }).start();
};



// Importing campaigns
Paste.pasteIntoCamps = function(account, line_number, text) {
  var parser = new ParserJob(account, text);

  parser.excelPaste(!Copy.isInternalPaste(text, 'campaigns'));

  parser.oncomplete(function() {
    if (parser.errors().length) {
      require("../../uki-fb/view/dialog").Dialog
        .alert(tx('ads:pe:parse-invalid-header'));
      return;
    }
    if (parser.foundCampProps().length < 2) {
      require("../../uki-fb/view/dialog").Dialog
        .alert(tx('ads:pe:paste-garbage-camps-error'));
      return;
    }

    if (parser.camps().length) {
      if (Copy.isInternalPaste(text, 'campaigns')) {
        Paste.pasteFromInternalCopy(account, line_number, parser);
      } else {
        Paste.pasteFromExternal(account, line_number, parser);
      }
    }
  }).start();
};

Paste.pasteFromInternalCopy = function(account, line_number, parser) {
  DuplicateUtils.cloneCampaignsWithAds(parser.camps(),
      function(new_campaigns, new_ads) {
    var importer = new CampImporterJob(
      account, line_number, new_campaigns, []);
    importer
      .useNameMatching(false)
      .useToplineDates(true)
      .ads(new_ads)
      .onerror(function(e) { Paste.logError(e.error.message()); })
      .oncomplete(function() {
        Campaign.prepare(function() {
          var adimporter = new AdImporterJob(account, new_ads, []);
            adimporter
              .useNameMatching(false)
              .onerror(function(e) { Paste.logError(e.error.message()); })
              .oncomplete(function() {
                require("./app").App.reload();
                })
              .start();
        });
      })
      .start();
  });
};

Paste.pasteFromExternal = function(account, line_number, parser) {
  var importer = new CampImporterJob(
    account,
    line_number,
    parser.camps(),
    utils.pluck(parser.foundCampProps(), 'name'));

  if (parser.ads().length && parser.foundAdProps().length > 2) {
    importer
      .ads(parser.ads())
      .adPropsToCopy(utils.pluck(parser.foundAdProps(), 'name'));
  }

  importer
    .onerror(function(e) { Paste.logError(e.error.message()); })
    .oncomplete(function() { App.reload(); }).start();
};


exports.Paste = Paste;
