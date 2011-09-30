/**
*/


var fun = require("../../uki-core/function");
var view = require("../../uki-core/view");
var utils = require("../../uki-core/utils");
var dom = require("../../uki-core/dom");
var Ad = require("../model/ad").Ad;
var Campaign = require("../model/campaign").Campaign;
var tabSeparated = require("../lib/model/tabSeparated");
var Mustache = require("../../uki-core/mustache").Mustache;

var TRY_USING_DATA_OBJECTS = true;
var CLEANUP_TIMEOUT = 5000;
var MIME_TYPE = require("../../uki-core/env").ua.match(/Windows/) ?
  'application/vnd.ms-excel' : 'text/csv';

// Excel CSV: should be UTF-16LE with BOM. Should use tabs instead of commas.
var DELIMITER = '\t';
var DELIMITER_LINE = tabSeparated.DELIMITER_LINE;
var ITEMS_PER_CHUNK = 100;

var CAMP_EXPORT_OPTIONS = {
  DELIMITER: DELIMITER
};

var AD_EXPORT_OPTIONS = {
  DELIMITER: DELIMITER,
  exclude: ['campaign_id']
};

var Export = {};


Export.handleCampaigns = function() {
  require("../lib/loggingState").startFlow('export_campaigns');
  var campaigns = view.byId('campPane-data').selectedRows();
  var text = [Export.exportHeader(isCorpActSelected())];
  function processChunk() {
    if (campaigns.length > 0) {
      var chunk = campaigns.slice(0, ITEMS_PER_CHUNK);
      campaigns = campaigns.slice(ITEMS_PER_CHUNK);

      Ad.findAllBy('campaign_id', utils.pluck(chunk, 'id'), function(ads) {
        var map = {};
        ads.forEach(function(ad) {
          map[ad.campaign_id()] || (map[ad.campaign_id()] = []);
          map[ad.campaign_id()].push(ad);
        });
        chunk.forEach(function(camp) {
          if (map[camp.id()]) {
            map[camp.id()].forEach(function(ad) {
              text.push(Export.exportRow(ad, camp));
            });
          } else {
            text.push(camp.toTabSeparated(CAMP_EXPORT_OPTIONS));
          }
        });
        processChunk();
      });
    } else {
      require("../lib/loggingState").startFlow('export_send_file_campaigns');
      Export.sendFile(text);
      require("../lib/loggingState").endFlow('export_send_file_campaigns');
      require("../lib/loggingState").endFlow('export_campaigns');
    }
  }
  processChunk();
};

Export.handleAds = function() {
  require("../lib/loggingState").startFlow('export_ads');
  var ads = view.byId('adPane-data').selectedRows();
  var adIds = utils.pluck(ads, 'id');
  var text = [Export.exportHeader(isCorpActSelected())];
  var map = {};

  function processChunk() {
    if (adIds.length > 0) {
      var chunk = adIds.slice(0, ITEMS_PER_CHUNK);
      adIds = adIds.slice(ITEMS_PER_CHUNK);

      Ad.findAllBy('id', chunk, function(ads) {
        var ids = utils.unique(utils.pluck(ads, 'campaign_id'))
          .filter(function(id) {
            return !map[id];
          });
        Campaign.findAllBy('id', ids, function(camps) {
          camps.forEach(function(camp) {
            map[camp.id()] = camp;
          });
          ads.forEach(function(ad) {
            var camp = map[ad.campaign_id()];
            text.push(Export.exportRow(ad, camp));
          });
          processChunk();
        });
      });
    } else {
      require("../lib/loggingState").startFlow('export_send_file_ads');
      Export.sendFile(text);
      require("../lib/loggingState").endFlow('export_send_file_ads');
      require("../lib/loggingState").endFlow('export_ads');
    }
  }
  processChunk();
};

Export.exportHeader = function(isCorpAct) {
  var ad = new Ad().stat(null);
  var camp = new Campaign();
  CAMP_EXPORT_OPTIONS.isCorpAct = isCorpAct;
  AD_EXPORT_OPTIONS.isCorpAct = isCorpAct;

  return camp.tabSeparatedHeader(CAMP_EXPORT_OPTIONS) +
    DELIMITER + ad.tabSeparatedHeader(AD_EXPORT_OPTIONS) +
    DELIMITER + Ad.prop('image').humanName;
};

Export.exportRow = function(ad, camp) {
  ad.stat(null);
  return camp.toTabSeparated(CAMP_EXPORT_OPTIONS) + DELIMITER +
    ad.toTabSeparated(AD_EXPORT_OPTIONS) + DELIMITER;
};

Export.sendFile = function(data) {
  var text = data.join(DELIMITER_LINE);
  createObjectURL(text) || createBase64URL(text);
};

function startDownload(url) {
  var iframe = dom.createElement(
    'iframe',
    { style: 'display: none', src: url });
  document.body.appendChild(iframe);

  setTimeout(function() { dom.removeElement(iframe); }, CLEANUP_TIMEOUT);
}

function createObjectURL(text) {
  var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
  var requestFileSystem = window.webkitRequestFileSystem ||
    window.requestFileSystem;

  if (!TRY_USING_DATA_OBJECTS || !BlobBuilder || !requestFileSystem) {
    return false;
  }

  var ui8a = new Uint8Array(text.length * 2 + 2);

  // BOM
  ui8a[0] = 0xFF;
  ui8a[1] = 0xFE;
  // Manualy convert to UTF-16LE
  for (var i = 0, k = 2; i < text.length; i++) {
    ui8a[k++] = text.charCodeAt(i) & 0xFF;
    ui8a[k++] = text.charCodeAt(i) >> 8 & 0xFF;
  }
  var builder = new BlobBuilder();

  builder.append(ui8a.buffer);
  var blob = builder.getBlob(MIME_TYPE);

  requestFileSystem(window.PERSISTENT, 5 * 1024 * 1024, function(fs) {
    fs.root.getFile('export.csv', {create: true}, function(fileEntry) {
       fileEntry.createWriter(function(fileWriter) {
         fileWriter.onwriteend = function() {
           var uri = fileEntry.toURI ? fileEntry.toURI(MIME_TYPE) :
             fileEntry.toURL(MIME_TYPE);
           startDownload(uri);

           setTimeout(function() {
             fileEntry.remove(fun.FT);
           }, CLEANUP_TIMEOUT);
         };
         fileWriter.write(blob);
       });
    });
  });

  return true;
}

function createBase64URL(text) {
  var binary = String.fromCharCode(0xFF) + String.fromCharCode(0xFE);
  for (var j = 0; j < text.length; j++) {
    binary += String.fromCharCode(text.charCodeAt(j) & 0xFF);
    binary += String.fromCharCode(text.charCodeAt(j) >> 8 & 0xFF);
  }
  startDownload('data:' + MIME_TYPE + ';base64,' + btoa(binary));
}

function isCorpActSelected() {
  var list_selected = view.byId('campaignList-list').selectedRows();
  var isCorpAct = false;

  if (list_selected.length) {
    if (list_selected[0] instanceof Campaign) {
      isCorpAct = list_selected[0].account().isCorporate();
    } else {
      isCorpAct = require("../model/account").Account.hasCorpAct(list_selected);
    }
  }

  return isCorpAct;
}


exports.Export = Export;
