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
requireCss("./interests/interests.css");

var fun = require("../../../uki-core/function"),
    view = require("../../../uki-core/view"),
    dom   = require("../../../uki-core/dom"),
    controls = require("../controls"),
    Base = require("./base").Base;

var Interests = view.newClass('ads.adEditor.Interests', Base, {

  _template: requireText('interests/interests.html'),
      _ad: null,

  _setupBindings: function(m) {
    this.child('interests').binding({
      model: m,
      modelProp: 'keywords'
    });
    this.child('bct').binding({
      model: m,
      modelProp: 'user_adclusters'
    });

    this._ad = m;
  },

  _createDom: function(initArgs) {
    Base.prototype._createDom.call(this, initArgs);

    this.addClass('adEditor-interests');
    this.content({
      interests: {
        view: controls.pit,
        childName: 'interests'
      },
      interests_link: {
        view: 'Text',
        childName: 'interests_link',
        className: 'interests-link pas mls',
        text: 'Switch to broad category targeting'
      },
      bct : {
        view: controls.bct,
        childName: 'bct',
        className: 'hidden_elem mls'
      },
      bct_link: {
        view: 'Text',
        childName: 'bct_link',
        className: 'interests-link hidden_elem pas mls',
        text: 'Switch to precise interest targeting'
      }
    });

    this._indexChildViews();
    this.child('interests_link').
      addListener('mousedown', fun.bind(function(e) {
      this._showKeywords();
    }, this));

    this.child('bct_link').
      addListener('mousedown', fun.bind(function(e) {
      this._showClusters();
    }, this));
  },

  _showKeywords: function() {

    dom.removeClass(this.child('bct').dom(), 'hidden_elem');
    dom.removeClass(this.child('bct_link').dom(), 'hidden_elem');
    dom.addClass(this.child('interests').dom(), 'hidden_elem');
    dom.addClass(this.child('interests_link').dom(), 'hidden_elem');

    this._ad.interests_toggle(true);
  },

  _showClusters: function() {
    dom.addClass(this.child('bct').dom(), 'hidden_elem');
    dom.addClass(this.child('bct_link').dom(), 'hidden_elem');
    dom.removeClass(this.child('interests').dom(), 'hidden_elem');
    dom.removeClass(this.child('interests_link').dom(), 'hidden_elem');

    this._ad.interests_toggle(false);
  }
});


exports.Interests = Interests;
