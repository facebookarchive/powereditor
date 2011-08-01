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

    Mustache = require("../../uki-core/mustache").Mustache,
    Base     = require("../../uki-core/view/base").Base;


var AdPreview = view.newClass('ads.AdPreview', Base, {

    _template: requireText('adPreview/adPreview.html'),


    _createDom: function() {
        this._dom = dom.createElement('div', { className: 'fbEmu' });
    },

    model: fun.newProp('model', function(v) {
        if (this._model) {
            this._model.removeListener('change',
                fun.bindOnce(this._modelChange, this));
        }
        this._model = v;
        if (v) {
            this._model.addListener('change',
                fun.bindOnce(this._modelChange, this));
        }
        this._modelChange();
    }),

    _modelChange: function() {
      var ad = this.model();
      var likeUrl = toDataUri('./adPreview/like_on.gif');
      var object_id = ad.object_id();
      var object = ad.object();

      require("../model/image").Image.imageUrl(
          ad,
          fun.bindOnce(function(url) {

          ad.image_url(url);
          this._dom.innerHTML = Mustache.to_html(this._template, {
              ad: ad,
              like: !!object_id &&
                (!object || object.type() != 2),
              like_img: likeUrl
          });
      }, this));
    }
});


exports.AdPreview = AdPreview;
