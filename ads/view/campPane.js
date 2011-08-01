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
requireCss("./campPane/campPane.css");

var fun   = require("../../uki-core/function"),
    dom   = require("../../uki-core/dom"),
    utils = require("../../uki-core/utils"),
    view  = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,
    find  = require("../../uki-core/selector").find,

    formatters     = require("../lib/formatters"),
    campFormatters = require("./campPane/formatters"),
    paneFormatters = require("./adPane/formatters"),

    controls      = require("./controls"),
    Export        = require("../controller/export").Export,
    DataTableList = require("./dataTable/list").DataTableList,
    CampRS        = require("../model/campaign/campResultSet").CampResultSet,

    Campaign = require("../model/campaign").Campaign,
    Container = require("../../uki-core/view/container").Container,
    CampSearch = require("../lib/searcher").Searcher;


var CampPane = view.newClass('ads.CampPane', Container, {

    campaigns: fun.newProp('campaigns', function(camps, callback) {

      this._campaigns = camps;
      camps.statRange(find('[action=dataRange]', this)[0].range());

      if (camps[0]) {
        this.toggleColumns(camps[0].account());
      }

      this._dataTable.data(camps).layoutIfVisible()
          .selectedIndex(0).lastClickIndex(0).triggerSelection();

      if (this._searchModel) {
        this._searchModel.updateData(camps);
      } else {
        this._searchModel = new CampSearch(camps);
        this._searchModel
          .on('searchFoundInChunk', fun.bind(function(e) {
            var data = this._dataTable.data();
            var result = (data ? data.slice(0) : [])
              .concat(e.foundInChunk);
            this._dataTable
              .data(CampRS.fromArray(result))
              .layoutIfVisible();
          }, this))
          .on('searchStart', fun.bind(function(e) {
            this._dataTable.data([]).layoutIfVisible();
          }, this));
      }

      this._lastQuery = '';
      this._searchInput.value('');

      callback && callback.call(this);

      find('Button', this).prop(
        'disabled',
        !require("../controller/app").App.isActive()
      );
    }),

    _createDom: function() {
        this._dom = dom.createElement('div', { className: 'campPane' });
        var Mutator = require("../controller/mutator").Mutator,
            Revert = require("../controller/revert").Revert,
            Duplicate = require("../controller/duplicate").Duplicate;

        this._refs = build([
            { view: 'Container', addClass: 'campPane-toolbar', childViews: [
                { view: 'List', horizontal: true,
                  addClass: 'campPane-toolbar-list phm', childViews: [
                    { view: 'Button', label: 'Create Campaign',
                      requireActive: true,
                      on: { click: Mutator.createCampaignHandler }},

                    { view: 'Button', label: 'Revert Changes',
                      requireActive: true,
                      on: { click: Revert.revertCampsHandler }},

                    { view: 'Button', label: 'Duplicate',
                      on: { click: Duplicate.duplicateCampsHandler } },

                    { view: 'Button', label: 'Export',
                      on: { click: Export.handleCampaigns } },

                    { view: controls.DateRange, id: 'campStatDates',
                      requireActive: true,
                      action: 'dataRange', addClass: 'mlm',
                      persistent: {
                        storage: require("../controller/app")
                          .App.userStorage(),
                        key: 'campPane:dateRange'
                      } }
                  ] },

                  { view: 'SearchInput', placeholder: "search campaigns",
                    pos: 'r:10px t:5px', buttonless: true,
                    visible: true, as: 'search',
                    on: { keyup: fun.bindOnce(this._searchHandler, this) }
                  }
              ] },

              { view: 'DataTable',
                init: { listView: DataTableList },
                editOnEnter: true, redrawOnModelChange: true,
                addClass: 'campPane-data', id: 'campPane-data',
                pos: 'l:0 r:0 t:32px b:246px',
                multiselect: true, debounce: 42, columns: [
                  { desc: 'Changed',
                    key: 'isChanged', width: 20, maxWidth: 20, minWidth: 20,
                    changeOnKeys: [],
                    formatter: campFormatters.changes },

                  { desc: 'Errors',
                    key: 'hasErrors', width: 20, maxWidth: 20, minWidth: 20,
                    changeOnKeys: ['errors'],
                    formatter: campFormatters.errors },

                  { label: 'Campaign', key: 'name', width: 200,
                    changeOnKeys: ['name'],
                    editor: {
                      view: 'dataList.Editor',
                      bindingOptions: { viewEvent: 'keyup change blur paste' }
                    } },

                  { desc: 'Status',
                    label: '', key: 'campaign_status', width: 20, maxWidth: 20,
                    minWidth: 20,
                    changeOnKeys: ['campaign_status'],
                    className: 'campPane-cell_status',
                    formatter: campFormatters.status },

                  { label: 'Start Date', key: 'start_time', width: 80,
                    formatter: campFormatters.startDate },

                  { label: 'End Date', key: 'end_time', width: 80,
                    formatter: campFormatters.endDate },

                  { label: 'Budget', key: 'daily_budget', width: 80,
                    changeOnKeys: ['daily_budget',
                      'lifetime_budget', 'inflation'],
                    className: 'dataTable-cell_number',
                    formatter: campFormatters.budget },

                  { label: 'Period', key: 'daily_budget', width: 60,
                    changeOnKeys: ['daily_budget', 'lifetime_budget'],
                    formatter: campFormatters.budgetPeriod },

                  { label: 'Remaining', key: 'budget_remaining_100',
                    width: 70, maxWidth: 150, minWidth: 60,
                    className: 'dataTable-cell_number',
                    formatter: paneFormatters.money }

                 ],
                 canHideColumns: true,
                 persistent: {
                   storage: require("../controller/app").App.userStorage(),
                   key: 'campPane:dataTable'
                 } },

              { view: 'CampEditor', pos: 'h:245px l:0 r:0 b:0',
                id: 'campEditor',
                persistent: {
                  storage: require("../controller/app").App.userStorage(),
                  key: 'campPane:campEditor'
                } }

        ]).appendTo(this);

        this._dataTable = find('> DataTable', this)[0];
        find('DataTableList', this._dataTable)[0].copySourceId('campaigns');
        this._searchInput = this._refs.view('search');
    },

    refreshAndSelect: function(items) {
        this.campaigns(this.campaigns());

        var map = {},
            count = 0,
            data = this._dataTable.data(),
            indexes = [];

        data.prefetch();

        items.forEach(function(c) {
           map[c.id()] = true;
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
        }
        this._dataTable.list().focus().triggerSelection().layoutIfVisible();
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
            .data(this._campaigns)
            .layoutIfVisible()
            .selectedIndex(0)
            .lastClickIndex(0)
            .triggerSelection();
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


exports.CampPane = CampPane;
