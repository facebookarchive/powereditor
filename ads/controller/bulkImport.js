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

var utils = require("../../uki-core/utils"),
    env   = require("../../uki-core/env"),
    build = require("../../uki-core/builder").build,
    find  = require("../../uki-core/selector").find,
    view  = require("../../uki-core/view"),

    BulkImportDialog = require("../view/bulkImportDialog").BulkImportDialog,
    LogDialog = require("../view/logDialog").LogDialog,

    imageReader  = require("../../lib/imageReader"),
    models       = require("../models"),

    ParserJob = require("../job/tabSeparatedParser").Parser,
    CampImporterJob = require("../job/campImporter").Importer,

    DeferredList = require("../../lib/deferredList").DeferredList,
    App          = require("./app").App,
    Mutator      = require("./mutator").Mutator;


/**
* Import campaigns and ads together
*/
var BulkImport = {};

var importDialog = null;

BulkImport.handleImport = function() {
  require("../model/account").Account.findAll(function(accounts) {
    createImportDialog();

    var row = view.byId('campaignList-list').selectedRow();
    var selectedAccount = row.account ? row.account() : row;

    importDialog.initWithAccounts(accounts, selectedAccount.id()).visible(true);
  });

};

function createImportDialog() {
  if (importDialog) { return; }
  importDialog = new BulkImportDialog();
  importDialog.on('import', function() {
    importDialog.visible(false);
    startImport();
  });
}

function startImport() {
  initErrors();

  readData(function(data) {
    readImages(function(lookup) {
      BulkImport.importInto(
        models.Account.byId(importDialog.accountId()),
        data,
        lookup);
    });
  });
}

function readData(callback) {
  if (importDialog.importDataFromFile()) {
    var reader = new global.FileReader();
    reader.onloadend = function(e) {
      callback(reader.result);
    };
    if (importDialog.dataFileInput().files().length !== 1) {
      BulkImport.logError(tx('ads:pe:import-nonts-error'));
      return;
    }
    reader.readAsText(importDialog.dataFileInput().files()[0]);
  } else {
    callback(importDialog.dataTextInput().value());
  }
}

function readImages(callback) {
  var lookup = { data: {}, hashes: {} };

  if (importDialog.importImageFromZip()) {
    if (importDialog.imageZipInput().files().length !== 1) {
      BulkImport.logError(tx('ads:pe:import-nozip-error'));
      return;
    }
    BulkImport.log(tx('ads:pe:import-zip-upload-message'));
    var progressBar =
      BulkImport.progressDialog()
      .append({ view: 'ProgressBar', value: 0, visible: false });
    var progressMeter =
      BulkImport.progressDialog()
      .append({ view: 'Text' });

    require("../lib/unzipImages").unzip(
      importDialog.accountId(),
      importDialog.imageZipInput().files()[0],
      function(result) {
        if (result.error) {
          BulkImport.logError(result.error.message);
          return;
        }
        utils.forEach(result.images, function(img, name) {
          var parts = name.split('/');
          var filename = parts[parts.length - 1].toLowerCase();
          lookup.hashes[filename] = img.hash;
        });
        callback(lookup);
      });
  } else {
    var list = new DeferredList();
    var files = utils.reduce(
      importDialog.imageFileInputs(),
      function(arr, view) {
        return arr.concat(utils.toArray(view.files()));
      }, []);

    utils.forEach(files, function(f) {
      var handler = list.newWaitHandler();
      imageReader.read(f, function(dataUri) {
        lookup.data[f.name.toLowerCase()] = dataUri;
        handler();
      });
    });

    list.complete(function() {
      callback(lookup);
    });
  }
}

function initErrors() {
  BulkImport.errors = [];
  BulkImport.progressDialog().clear().visible(true);
}

BulkImport.importInto = function(account, text, imageLookup) {
  require("../lib/completions").dialog = BulkImport.progressDialog();
  var formatter = require("../../lib/formatters").createPercentFormatter(2);

  var message = BulkImport.log(tx(
    'ads:pe:import-parsets-message',
    { percent: formatter(0) }));
  var parser = new ParserJob(account, text, imageLookup);

  parser.oncomplete(function() {
    if (parser.errors().length) {
      BulkImport.logError(parser.errors()[0].message());
      return;
    }
    if (parser.foundCampProps().length < 1) {
      BulkImport.logError(tx('ads:pe:import-nocampaigns-error'));
      return;
    }

    if (parser.camps().length) {
      var line_number = null;
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

      var importMessage = BulkImport.log(
        tx('ads:pe:import-create-camps-message', { percent: formatter(0) }));

      var firstZerro = true;
      var secondMessage = false;
      importer
        .onerror(function(e) { BulkImport.logWarning(e.error.message()); })
        .oncomplete(function() { BulkImport.complete(); })
        .onprogress(function(e) {
          var status = e.status;
          if (status.complete === 0 && !firstZerro) {
            importMessage = BulkImport.log(
              tx(
                'ads:pe:import-create-ads-message',
                { percent: formatter(0) }));
            secondMessage = true;
          }
          firstZerro = false;
          var data = { percent: formatter(status.complete / status.total) };
          importMessage.text(secondMessage ?
            tx('ads:pe:import-create-ads-message', data) :
            tx('ads:pe:import-create-camps-message', data));
        })
        .start();
    } else {
      // import ads only
      BulkImport.importAds(account, parser.ads(), parser);
    }
  })
  .onprogress(function(e) {
    var status = e.status;
    var percent = status.complete / status.total;
    message.text(tx(
      'ads:pe:import-parsets-message',
      { percent: formatter(percent) }));
  })
  .start();
};

BulkImport.complete = function() {
  var row = BulkImport.log(tx('ads:pe:import-finished-message'), 'message');
  App.reload();
  return row;
};

BulkImport.logError = function(msg) {
  return BulkImport.log(msg, 'logDialog-error');
};

BulkImport.logWarning = function(msg) {
  return BulkImport.log(msg, 'logDialog-warning');
};

BulkImport.progressDialog = function() {
  return this._progressDialog || (this._progressDialog =
    new LogDialog().title(tx('ads:pe:import-title')));
};

BulkImport.log = function(msg, type) {
  BulkImport.errors.push({ type: type, msg: msg });
  return this.progressDialog().log(msg, type);
};


exports.BulkImport = BulkImport;
