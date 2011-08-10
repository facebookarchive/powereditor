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
requireCss("./list.css");

var fun = require("../../../uki-core/function"),
    dom = require("../../../uki-core/dom"),
    env = require("../../../uki-core/env"),
    evt = require("../../../uki-core/event"),
    view = require("../../../uki-core/view"),

    Base = require("../../../uki-fb/view/dataTable").DataTableList;

var Pack = require("./pack").Pack;


var DELIMITER_LINE = require("../../lib/model/tabSeparated").DELIMITER_LINE;


var DataTableList = view.newClass('ads.DataTableList', Base, {

  copySourceId: fun.newProp('copySourceId'),

  _setup: function(initArgs) {
    initArgs.packView = initArgs.packView || Pack;
    Base.prototype._setup.call(this, initArgs);
  },

  _createDom: function(initArgs) {
    Base.prototype._createDom.call(this, initArgs);
    this.addClass('ads-dataTable');
    this.textSelectable(true);
    this.on('selectstart', require("../../../uki-core/event").preventDefaultHandler);
    this.on('focus mousedown selection', this._selectAll);
    this.on('copy', this._oncopy);
    this.pasteTarget = true;
  },

  _selectAll: function(e) {
    var sel = global.getSelection();
    sel.removeAllRanges();
    var range = env.doc.createRange();
    range.selectNode(this._selectionDummy());
    sel.addRange(range);
  },

  _selectionDummy: function() {
    if (!this._sDumy) {
      this._sDumy = dom.createElement('div', {
        html: 'x',
        className: 'ads-dataTable-selectionDummy'
      });
      this.dom().appendChild(this._sDumy);
    }
    return this._sDumy;
  },

  _oncopy: function(e) {
    if (!this.hasFocus()) { return; }
    require("../../controller/copy").Copy.handleCopy(
      e,
      this._dataForClipboard(),
      this.copySourceId());
  },

  _dataForClipboard: function() {
    var rows = this.selectedRows();

    // nothing selected
    if (rows.length === 0) {
      return '';
    }

    var options = {isCorpAct: rows[0].isCorporate()};

    return rows[0].tabSeparatedHeader(options) + DELIMITER_LINE +
      rows.map(function(row) {
        return row.toTabSeparated(options);
      }).join(DELIMITER_LINE);
  }
});


exports.DataTableList = DataTableList;
