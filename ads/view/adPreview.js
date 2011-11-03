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
requireCss("./adPreview/adPreview.css");

var fun = require("../../uki-core/function"),
    dom = require("../../uki-core/dom"),
    view = require("../../uki-core/view"),

    Base     = require("../../uki-core/view/base").Base,
    creativespec = require("./adEditor/creative/creativeTypeSpecs"),

    // timeout period to request adpreview api
    DEBOUNCE_TIME = 200;

/**
 * update ad preview given ad and calling context.
 * if at time of invocation current ad differs from
 * original ad, then abort.
 */
function updateAdPreview(origAd, context) {
  var ad = context.model();
  // do not make submit request if it's not the current ad
  if (origAd != ad) {
    return;
  }
  var adpreview_api_path = '/act_' + ad.account_id() + '/adpreviews/';
  context.getAdPreviewRequestParam(ad, function(params) {
    FB.api(
      adpreview_api_path,
      params,
      fun.bind(function(response) {
        // if viewer moved on to another ad, do not
        // load preview because it will be the wrong one
        if (context.model() != ad) {
          return;
        }
        // innerHTML is safe here because markup comes from our API
        var ad_markup = response[0];
        context._dom.innerHTML = ad_markup;
        // indicate no longer loading
        context.loading(false);
      }, context)
    );
  });
}

var AdPreview = view.newClass('ads.AdPreview', Base, {

    _createDom: function() {
        this._dom = dom.createElement('div', { className: 'fbEmu' });
    },

    // toggle whether adpreview is loading
    loading: view.newToggleClassProp('adPreview-loading'),

    model: fun.newProp('model', function(v) {
        if (this._model) {
            this._model.removeListener('change',
                fun.bindOnce(this._onModelChange, this));
        }
        this._model = v;
        if (v) {
            this._model.addListener('change',
                fun.bindOnce(this._onModelChange, this));
        }
        this._onModelChange();
    }),

    // returns adpreview api request parameters
    getAdPreviewRequestParam: function(ad, callback) {
      creativespec.getAdPreviewCreativeSpec(ad, function(spec) {
        callback({creative: spec});
      });
    },

    // model changed, trigger ad preview
    _onModelChange: function() {
      // begin loading if single ad is selected
      // in that case .id() should give a valid non-empty
      // numeric string
      var oriAd = this.model();
      this._dom.innerHTML = '';
      if (oriAd.id() === '') {
        return;
      }
      this.loading(true);
      // coalesce subsequent calls within DEBOUNCE_TIME
      // beforce invoke callback function
      var deb = fun.throttle(updateAdPreview, DEBOUNCE_TIME);
      deb(oriAd, this);
    }
});


exports.AdPreview = AdPreview;
