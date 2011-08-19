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

    models    = require("../models"),
    Container = require("../../uki-core/view/container").Container,
    Search    = require("../../lib/searcher").Searcher,
    ResultSet = require("../model/resultSet").ResultSet;

var BasePane = view.newClass('ads.BasePane', Container, {
  campaigns: fun.newProp('campaigns', function(camps, callback) {
    this._campaigns = camps;
    if (camps[0]) {
      this.toggleColumns(camps[0].account());
    }

    this._initDataSetup(callback);
  }),

  // should be implemented by child class
  _initDataSetup: function(callback) {},

  _setupData: function(callback) {
    this._objects.statRange(find('[action=dataRange]', this)[0].range());
    this._dataTable.data(this._objects);
    this._dataTable.sortColumn(this._dataTable.sortIndex(),
      this._dataTable.sortDirection());
    this._dataTable
     .layoutIfVisible()
     .selectedIndex(0)
     .lastClickIndex(0)
     .triggerSelection();
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
        }, this))
        .on('searchFinish', fun.bind(function() {
          this._dataTable
           .layoutIfVisible()
           .selectedIndex(0)
           .lastClickIndex(0)
           .triggerSelection();

           this._searchInput.focus();
           this._searchInput.setSelectionRange(
             this._searchInput.value().length,
             this._searchInput.value().length);

        }, this));
    }
    this._objects.loadRange(0, this._objects.length - 1, fun.bind(function() {
      var table = this._dataTable;
      table.sortColumn(table.sortIndex(), table.sortDirection());
      table.layoutIfVisible().selectedIndex(0).lastClickIndex(0)
       .triggerSelection();
      this._searchModel.updateData(table.data());
      this._lastQuery = '';
      this._searchInput.value('');
      callback && callback.call(this);
    }, this));
  },

  /**
   * Sets up event listeners for the base pane:
   * - adjusts data table to changed stats range
   * - re-arranges data table on user-specified sort
   * Should be called at the end of child class's createDOM
   *
   * @param none
   * @return none
   */
  _setupListeners: function() {
    this._statDates.on('change.range', fun.bind(function(e) {
      var dateRange = this._statDates;
      dateRange.loading(true);
      // load remote stat for all campaigns/ads
      // from ALL accounts, not just the one visible
      models.Account.findAll(fun.bind(function(accounts) {
        // to fetch all accounts
        accounts = accounts.slice();
        models[this._statType].loadFromAccountsAndRange(
          accounts, e.from, e.to,
          fun.bind(function() {
            dateRange.loading(false);
            var table = this._dataTable,
                indexes = table.selectedIndexes(),
                lcIndex = table.lastClickIndex();

            // update the statRanges of all data and load
            // sort updated data and perform search on newly arranged data
            this._objects.statRange(e);
            this._objects.loadRange(0, this._objects.length - 1, fun.bind(
              function() {
                table.data(this._objects);
                table.sortColumn(table.sortIndex(), table.sortDirection());
                this._searchModel.updateData(table.data());
                this._lastQuery = '';
                this._searchHandler();
                table.selectedIndexes(indexes).lastClickIndex(lcIndex);
              }, this));
        }, this));
      }, this));
    }, this));
    this.on('tableSorted', fun.bind(function(e) {
      var table = this._dataTable;
      if (!table) {
        return;
      }
      table.data(this._objects);
      table.sortColumn(e.index, e.direction);
      this._searchModel.updateData(table.data());
      this._lastQuery = '';
      this._searchHandler();
    }, this));
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
      if (this._searchInput.value().length) {
        return;
      } else {
        this._dataTable
          .layoutIfVisible()
          .selectedIndex(0)
          .lastClickIndex(0)
          .triggerSelection();
      }

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
