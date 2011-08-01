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
requireCss("./campaignList/campaignList.css");

var fun = require("../../uki-core/function"),
    dom = require("../../uki-core/dom"),
    view = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,

    Container = require("../../uki-core/view/container").Container;

var CampaignList = view.newClass('ads.CampaignList', Container, {

  _createDom: function() {
    this._dom = dom.createElement('div', { className: 'campaignList' });
    build([

      { view: 'Container', pos: 't:0 l:0 r:0 b:0px',
        addClass: 'campaignList-container', childViews: [
          { view: 'DataTree', id: 'campaignList-list',
            addClass: 'campaignList-list', key: 'name',
            multiselect: true, redrawOnModelChange: true,
            formatter: formatter, changeOnKeys: ['errors', 'changes'],
            indentBy: 10, pasteTarget: true }
        ]}

    ]).appendTo(this);
  }
});

function formatter(value, row) {
  if (row.children) {
    var text = row.displayName();
    if (row.isCorporate()) {
      text = '<span class="campaignList-corp">' + ' C ' + '</span>' + text;
    }
    return text;
  }
  var text = dom.escapeHTML(value || 'untitled');

  // prepend line_number to camp-name if available
  var line = row.line_number();
  if (line) {
    line = dom.escapeHTML(line);
    text = '<strong class="line-prefix">' + line +
      '</strong>' + ' - ' + text;
  }

  if (row.hasErrors()) {
    text = '<i class="campaignList-errors"></i>' + text;
  }

  if (row.isChanged()) {
    text = '<strong>' + text + '</strong>';
  }

  return text;
}


exports.CampaignList = CampaignList;
