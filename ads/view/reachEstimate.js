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
requireCss("./reachEstimate/reachEstimate.css");

var fun  = require("../../uki-core/function");
var view = require("../../uki-core/view");
var build = require("../../uki-core/builder").build;

var Container = require("../../uki-core/view/container").Container;


var ReachEstimate = view.newClass('ads.ReachEstimate', Container, {
  _createDom: function(initArgs) {
    Container.prototype._createDom.call(this, initArgs);
    this.addClass('reachEstimate');
    this._children = build([
      { view: 'Text', text: 'Estimated reach' },
      { view: 'Text', size: 'huge', text: 0, as: 'reach',
        addClass: 'reachEstimate-number' }
    ]).appendTo(this);

    this._formatter = require("../../lib/formatters").createNumberFormatter(0);
  },

  loading: view.newToggleClassProp('reachEstimate-loading'),

  reach: function(value) {
    var text;
    if (!value || value < 20) {
      text = 'fewer than 20';
    } else {
      text = this._formatter(value);
    }
    this._children.view('reach').text(text);
    return this;
  }
});


exports.ReachEstimate = ReachEstimate;
