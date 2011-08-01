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

    imageReader  = require("../lib/imageReader"),
    models       = require("../models"),

    ParserJob = require("../job/tabSeparatedParser").Parser,
    CampImporterJob = require("../job/campImporter").Importer,

    DeferredList = require("../lib/deferredList").DeferredList,
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
        { data: lookup, hashes: {} });
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
      BulkImport.logError('Please select file with tab separated data');
      return;
    }
    reader.readAsText(importDialog.dataFileInput().files()[0]);
  } else {
    callback(importDialog.dataTextInput().value());
  }
}

function readImages(callback) {
  if (importDialog.importImageFromZip()) {
    if (importDialog.imageZipInput().files().length !== 1) {
      BulkImport.logError('Please select zip file with images');
      return;
    }
    BulkImport.log('Sending zip file to the server to unpack.');
    var progressBar =
      BulkImport.progressDialog()
      .append({ view: 'ProgressBar', value: 0, visible: false });
    var progressMeter =
      BulkImport.progressDialog()
      .append({ view: 'Text' });

    var UnzipImagesRequest = require("../lib/unzipImages").UnzipImagesRequest;
    var req = new UnzipImagesRequest();

    req.file(importDialog.imageZipInput().files()[0]);
    req.on('progress', function(e) {
      progressMeter.text((e.loaded / 1024 << 0) + ' KB');
      progressBar
        .visible(!!e.lengthComputable)
        .value(e.loaded / e.total * 100);
    });
    req.on('fail', function() {
      BulkImport.log('Failed to upload zip file to the server. ' +
                     'Check your connection and try again');
    });
    req.on('load', function(e) {
      if (e.data.error) {
        BulkImport.logError(e.data.error);
        return;
      }
      var result = {};
      var list = new DeferredList();

      utils.forEach(e.data.files, function(dataUri, name) {
        var handler = list.newWaitHandler();
        imageReader.resizeIfNeeded(dataUri, function(resizedData) {
          result[name] = resizedData;
          handler();
        });
      });

      list.complete(function() {
        progressBar.parent().removeChild(progressBar);
        progressMeter.parent().removeChild(progressMeter);

        BulkImport.log('Unpacking complete.');
        callback(result);
      });
    });
    req.send();
  } else {
    var list = new DeferredList();

    var files = utils.reduce(
      importDialog.imageFileInputs(),
      function(arr, view) {
        return arr.concat(utils.toArray(view.files()));
      }, []);

    var result = {};
    utils.forEach(files, function(f) {
      var handler = list.newWaitHandler();
      imageReader.read(f, function(dataUri) {
        result[f.name] = dataUri;
        handler();
      });
    });

    list.complete(function() {
      callback(result);
    });
  }
}

function initErrors() {
  BulkImport.errors = [];
  BulkImport.progressDialog().clear().visible(true);
}

BulkImport.importInto = function(account, text, imageLookup) {
  var parser = new ParserJob(account, text, imageLookup);

  parser.oncomplete(function() {
    if (parser.errors().length) {
      BulkImport.logError(parser.errors()[0].message());
      return;
    }
    if (parser.foundCampProps().length < 1) {
      BulkImport.logError('Data does not campaign info.');
      return;
    }

    if (parser.camps().length) {
      var importer = new CampImporterJob(
        account,
        parser.camps(),
        utils.pluck(parser.foundCampProps(), 'name'));

      if (parser.ads().length && parser.foundAdProps().length > 2) {
        importer
          .ads(parser.ads())
          .adPropsToCopy(utils.pluck(parser.foundAdProps(), 'name'));
      }

      importer
        .onerror(function(e) { BulkImport.logWarning(e.error.message()); })
        .oncomplete(function() { BulkImport.complete(); }).start();
    } else {
      // import ads only
      BulkImport.importAds(account, parser.ads(), parser);
    }
  }).start();
};

BulkImport.complete = function() {
  BulkImport.log('Finished importing', 'message');
  App.reload();
};

BulkImport.logError = function(msg) {
  BulkImport.log(msg, 'error');
};

BulkImport.logWarning = function(msg) {
  BulkImport.log(msg, 'warning');
};

BulkImport.progressDialog = function() {
  return this._progressDialog || (this._progressDialog =
    new LogDialog().title('Importing'));
};

BulkImport.log = function(msg, type) {
  BulkImport.errors.push({ type: type, msg: msg });
  this.progressDialog().log(msg, 'bulkImport-' + type);
};


exports.BulkImport = BulkImport;
