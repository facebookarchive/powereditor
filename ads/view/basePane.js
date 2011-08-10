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

var fun   = require("../../uki-core/function"),
    dom   = require("../../uki-core/dom"),
    utils = require("../../uki-core/utils"),
    view  = require("../../uki-core/view"),
    find  = require("../../uki-core/selector").find,

    Container = require("../../uki-core/view/container").Container,
    Search    = require("../../lib/searcher").Searcher,
    ResultSet = require("../model/resultSet").ResultSet;

var BasePane = view.newClass('ads.BasePane', Container, {
  campaigns: fun.newProp('campaigns', function(camps, callback) {
    this._campaigns = camps;
    if (camps[0]) {
      this.toggleColumns(camps[0].account());
    }

    this._initSetup(callback);
  }),

  // should be implemented by child class
  _initSetup: function(callback) {},

  _setupData: function(callback) {
    this._objects.statRange(find('[action=dataRange]', this)[0].range());
    this._dataTable.data(this._objects).layoutIfVisible()
      .selectedIndex(0).lastClickIndex(0).triggerSelection();

    this._dataTable.sortColumn(this._dataTable.sortIndex(),
      this._dataTable.sortDirection());
    this._objects = this._dataTable.data();
    if (this._searchModel) {
      this._searchModel.updateData(this._objects);
    } else {
      this._searchModel = new Search(this._objects);
      this._searchModel
        .on('searchFoundInChunk', fun.bind(function(e) {
          var data = this._dataTable.data();
          var result = (data ? data.slice(0) : [])
            .concat(e.foundInChunk);
          this._dataTable
            .data(ResultSet.fromArray(result))
            .layoutIfVisible();
        }, this))
        .on('searchStart', fun.bind(function() {
          var table = this._dataTable;
          table.data(ResultSet.fromArray([]))
            .layoutIfVisible();
        }, this));

    }
    this._objects.loadRange(0, this._objects.length - 1, fun.bind(function() {
      var table = this._dataTable;
      table.sortColumn(table.sortIndex(), table.sortDirection());
      this._searchModel.updateData(table.data());
    }, this));

    this._lastQuery = '';
    this._searchInput.value('');
    callback && callback.call(this);
  },

  refreshAndSelect: function(items) {
    this.campaigns(this.campaigns(), function() {
      var map = {},
        count = 0,
        data = this._dataTable.data(),
        indexes = [];

      data.prefetch();

      items.forEach(function(item) {
       map[item.id()] = true;
       count++;
      });

      for (var i = 0, l = data.length; i < l && count > 0; i++) {
        if (map[data[i].id()]) {
          indexes.push(i);
          count++;
        }
      }
      this._dataTable.selectedIndexes(indexes);
      if (indexes.length) {
        this._dataTable.lastClickIndex(indexes[0]);
        if (indexes[0]) {
          this._dataTable.scrollToIndex(indexes[0]);
        }
      }
      this._dataTable.list().focus().triggerSelection();
    });
  },

  _searchHandler: function() {
    if (this._searchInput.value().toLowerCase() == this._lastQuery) {
      return;
    }

    this._lastQuery = this._searchInput.value().toLowerCase();
    if (this._lastQuery.match(/\S/)) {
      this._searchModel.search(this._lastQuery);
    } else {
      this._dataTable
        .data(this._objects)
        .layoutIfVisible()
        .selectedIndex(0)
        .lastClickIndex(0)
        .triggerSelection();
        this._searchInput.focus();
        this._searchInput.select();

    }
  },

  toggleColumns: function(act) {
    var columns = this._dataTable.columns();
    var v_indexes = this._dataTable.visibleColumnIndexes();

    var corp_columns = columns.filter(function(column) {
      return column.corp;
    });
    var corp_indexes = utils.pluck(corp_columns, 'index');

    if (act.isCorporate()) {
      // have to save the original visible state of the columns
      v_indexes = utils.unique(v_indexes.concat(corp_indexes));
    } else {
      v_indexes = v_indexes.filter(function(i) {
        return corp_indexes.indexOf(i) == -1;
      });
    }

    this._dataTable.visibleColumnIndexes(v_indexes);
  }
});


exports.BasePane = BasePane;
