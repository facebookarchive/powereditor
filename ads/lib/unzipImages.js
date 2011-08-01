/**
*/

var dom = require("../../uki-core/dom");
var fun = require("../../uki-core/function");
var env = require("../../uki-core/env");
var Observable = require("../../uki-core/observable").Observable;


var UnzipImagesRequest = fun.newClass(Observable, {
  file: fun.newProp('file'),
  req: fun.newProp('req'),

  send: function() {
    var formData = new FormData();
    formData.append('zip', this.file());
    // csrf token
    formData.append('fb_dtsg', global.Env && global.Env.fb_dtsg);

    var req = new XMLHttpRequest();
    this.req(req);
    req.addEventListener('progress', fun.bind(this._onprogress, this), false);
    req.addEventListener('load', fun.bind(this._onload, this), false);
    req.addEventListener('error', fun.bind(this._onfail, this), false);
    req.addEventListener('abort', fun.bind(this._onfail, this), false);

    req.open("POST", "/ads/manage/powereditor/unzipimages.php");
    req.send(formData);
  },

  abort: fun.newDelegateCall('req', 'abort'),

  _onfail: function() {
    this.trigger({ type: 'fail' });
  },

  _onload: function(e) {
    this.trigger({
      type: 'load',
      data: JSON.parse(this.req().responseText)
    });
  },

  _onprogress: function(e) {
    this.trigger(e);
  }
});


exports.UnzipImagesRequest = UnzipImagesRequest;
