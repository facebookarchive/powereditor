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
requireCss("./adPane/adPane.css");

var fun   = require("../../uki-core/function"),
    dom   = require("../../uki-core/dom"),
    utils = require("../../uki-core/utils"),
    view  = require("../../uki-core/view"),
    find  = require("../../uki-core/selector").find,
    build = require("../../uki-core/builder").build,

    controls       = require("./controls"),
    formatters     = require("../lib/formatters"),
    paneFormatters = require("./adPane/formatters"),
    campFormatters = require("./campPane/formatters"),

    Container = require("../../uki-core/view/container").Container,

    Export = require("../controller/export").Export,

    StatusEditor  = require("./adPane/statusEditor").StatusEditor,
    TypeEditor    = require("./adPane/typeEditor").TypeEditor,
    DataTableList = require("./dataTable/list").DataTableList,
    Ad            = require("../model/ad").Ad,
    AdSearch      = require("../lib/searcher").Searcher,
    AdRS          = require("../model/ad/resultSet").ResultSet;


var AdPane = view.newClass('ads.AdPane', Container, {

    campaigns: fun.newProp('campaigns', function(camps, callback) {
        this._campaigns = camps;

        if (camps[0]) {
          this.toggleColumns(camps[0].account());
        }

        Ad.findAllBy(
            'campaign_id', utils.pluck(camps, 'id'),
            fun.bind(function(ads) {

                ads.statRange(find('[action=dataRange]', this)[0].range());
                this._dataTable.data(ads).layoutIfVisible()
                    .selectedIndex(0).lastClickIndex(0).triggerSelection();

                this._ads = ads;
                if (this._searchModel) {
                  this._searchModel.updateData(ads);
                } else {
                  this._searchModel = new AdSearch(ads);
                  this._searchModel
                    .on('searchFoundInChunk', fun.bind(function(e) {
                      var data = this._dataTable.data();
                      var result = (data ? data.slice(0) : [])
                        .concat(e.foundInChunk);
                      this._dataTable
                        .data(AdRS.fromArray(result))
                        .layoutIfVisible();
                    }, this))
                    .on('searchStart', fun.bind(function() {
                      this._dataTable.data(AdRS.fromArray([]))
                        .layoutIfVisible();
                    }, this));
                }

                this._lastQuery = '';
                this._searchInput.value('');
                callback && callback.call(this);

            }, this)
        );
    }),

    _createDom: function() {
        this._dom = dom.createElement('div', { className: 'adPane' });
        var Revert = require("../controller/revert").Revert,
            Duplicate = require("../controller/duplicate").Duplicate;

        this._refs = build([
            { view: 'Container', addClass: 'adPane-toolbar', childViews: [
                { view: 'List', horizontal: true,
                  addClass: 'adPane-toolbar-list phm', childViews: [
                    { view: 'Button', label: 'Create Ad', requireActive: true,
                      on: { click: fun.bindOnce(this._addAd, this) } },
                    { view: 'Button', label: 'Revert Changes',
                      requireActive: true,
                      on: { click: Revert.revertAdsHandler } },
                    { view: 'Button', label: 'Duplicate', requireActive: true,
                      on: { click: Duplicate.duplicateAdsHandler } },
                    { view: 'Button', label: 'Export', requireActive: true,
                      on: { click: Export.handleAds } },
                    { view: controls.DateRange, id: 'statDates',
                      requireActive: true,
                      action: 'dataRange', addClass: 'mlm',
                      persistent: {
                        storage: require("../controller/app")
                          .App.userStorage(),
                        key: 'adPane:dateRange'
                      } }
                  ] },

                { view: 'SearchInput', placeholder: "search ads",
                  pos: 'r:10px t:5px', buttonless: true,
                  visible: true, as: 'search',
                  on: { keyup: fun.bindOnce(this._searchHandler, this) }
                }
              ] },

              { view: 'DataTable', init: { listView: DataTableList },
                editOnEnter: true, redrawOnModelChange: true,
                copySourceId: 'ads',
                addClass: 'adPane-data', id: 'adPane-data',
                pos: 'l:0 r:0 t:32px b:281px', multiselect: true, throttle: 42,
                columns: [
                  { desc: 'Changed',
                    key: 'isChanged', width: 20, maxWidth: 20, minWidth: 20,
                    changeOnKeys: [],
                    formatter: paneFormatters.changes },

                  { desc: 'Errors',
                    key: 'hasErrors', width: 20, maxWidth: 20, minWidth: 20,
                    changeOnKeys: ['errors'],
                    formatter: paneFormatters.errors },

                  { label: 'Campaign Name', key: 'campaign_name', width: 80,
                    minWidth: 60 },

                  { label: 'Ad Name', key: 'name', width: 200,
                    editor: {
                      view: 'dataList.Editor',
                      bindingOptions: { viewEvent: 'keyup change blur paste' }
                    } },

                  { desc: 'Status',
                    label: '', key: 'adgroup_status',
                    width: 20, maxWidth: 20, minWidth: 20,
                    changeOnKeys: ['adgroup_status'],
                    className: 'adPane-cell_status',
                    formatter: paneFormatters.status,
                    editor: { view: StatusEditor } },

                  { label: 'Bid', key: 'bid_100',
                    width: 70, maxWidth: 150, minWidth: 50,
                    changeOnKeys: ['max_bid'],
                    className: 'dataTable-cell_number',
                    formatter: paneFormatters.money,
                    editor: {
                      view: 'dataList.Editor',
                      addClass: 'adPane-number-editor',
                      bindingOptions: { viewEvent: 'keyup change blur paste' }
                    } },

                  { label: 'Type', key: 'bid_type_name',
                    width: 45, maxWidth: 45, minWidth: 45,
                    className: 'dataTable-cell_number',
                    changeOnKeys: ['bid_type'],
                    editor: {
                      view: TypeEditor,
                      bindingOptions: { modelProp: 'bid_type' }
                    },
                    visible: false
                  },

                  { desc: 'Destination', label: 'Destination',
                    key: 'destination',
                    width: 80, maxWidth: 150, minWidth: 50,
                    formatter: paneFormatters.destination },

                  { label: 'Title', key: 'title',
                    width: 80, minWidth: 50,
                    editor: {
                      view: 'dataList.Editor',
                      bindingOptions: { viewEvent: 'keyup change blur paste' }
                    } },

                  { label: 'Body', key: 'body',
                    width: 80, minWidth: 50,
                    editor: {
                      view: 'dataList.Editor',
                      bindingOptions: { viewEvent: 'keyup change blur paste' }
                  } },

                  { label: 'Link', key: 'link_url',
                    width: 70, minWidth: 50,
                    editor: {
                      view: 'dataList.Editor',
                      bindingOptions: { viewEvent: 'keyup change blur paste' }
                    },
                    visible: false },

                  { label: 'Location', key: 'countries',
                    changeOnKeys: ['cities', 'regions'],
                    formatter: paneFormatters.location,
                    width: 70, minWidth: 50 },

                  { label: 'Age', key: 'age_min',
                    changeOnKeys: ['age_max'],
                    formatter: paneFormatters.age,
                    width: 60, minWidth: 60, maxWidth: 60 },

                  { label: 'Sex', key: 'genders',
                    formatter: paneFormatters.sex,
                    width: 40, minWidth: 40, maxWidth: 70 },

                  { label: 'Impressions', key: 'impressions',
                    width: 80, maxWidth: 150, minWidth: 60,
                    className: 'dataTable-cell_number',
                    formatter: formatters.createNumberFormatter(),
                    visible: false },

                  { label: 'Social %', key: 'social_percent',
                    width: 60, maxWidth: 60, minWidth: 60,
                    className: 'dataTable-cell_number',
                    formatter: formatters.createPercentFormatter(1),
                    visible: false },

                  { label: 'Clicks', key: 'clicks',
                    width: 60, maxWidth: 150, minWidth: 60,
                    className: 'dataTable-cell_number',
                    formatter: formatters.createNumberFormatter() },

                  { label: 'CTR %', key: 'ctr',
                    width: 60, maxWidth: 60, minWidth: 60,
                    className: 'dataTable-cell_number',
                    formatter: formatters.createPercentFormatter(3) },

                  { label: 'Avg. CPC', key: 'avg_cpc',
                    width: 70, maxWidth: 150, minWidth: 60,
                    className: 'dataTable-cell_number',
                    formatter: paneFormatters.money },

                  { label: 'Avg. CPM', key: 'avg_cpm',
                    width: 70, maxWidth: 150, minWidth: 60,
                    className: 'dataTable-cell_number',
                    formatter: paneFormatters.money },

                  { label: 'Demo links', key: 'demolinks',
                    width: 70, maxWidth: 150, minWidth: 60,
                    className: 'dataTable-cell_number',
                    formatter: paneFormatters.demolinks },

                  { label: 'Spent', key: 'spent_100',
                    width: 70, maxWidth: 150, minWidth: 60,
                    className: 'dataTable-cell_number',
                    formatter: paneFormatters.money,
                    visible: false }

              ],
              canHideColumns: true,
              persistent: {
                storage: require("../controller/app").App.userStorage(),
                key: 'adPane:dataTable'
              } },

              { view: 'AdEditor', pos: 'h:295px l:0 r:0 b:0',
                id: 'adEditor',
                persistent: {
                  storage: require("../controller/app").App.userStorage(),
                  key: 'adPane:adEditor'
                },
                on: { resized: fun.bind(this._editorResized, this) } }

        ]).appendTo(this);

        this._addButton = find('Button[action=add]', this)[0];
        this._dataTable = find('> DataTable', this)[0];
        this._editor = find('> AdEditor', this)[0];
        find('DataTableList', this._dataTable)[0].copySourceId('ads');
        this._searchInput = this._refs.view('search');
    },

    refreshAndSelect: function(ads) {
        this.campaigns(this.campaigns(), function() {
            var map = {},
                count = 0,
                data = this._dataTable.data(),
                indexes = [];

            data.prefetch();

            ads.forEach(function(ad) {
               map[ad.id()] = true;
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
                this._dataTable
                  .lastClickIndex(indexes[0])
                  .scrollToIndex(indexes[0]);
            }
            this._dataTable.list().focus().triggerSelection();
        });
    },

    _editorResized: function(e) {
        this._editor.dom().style.height = e.height + 'px';
        this._dataTable.dom().style.bottom = e.height + 1 + 'px';
    },

    _addAd: function(e) {
        var ad = new Ad();
        if (!this.campaigns().length) {
          alert('Cannot create an ad without a campaign. ' +
            'Create campaign first.');
            return;
        }
        require("../controller/mutator").Mutator
            .initAdInCampaign(this.campaigns()[0], ad);

        var table = this._dataTable;

        table.data().push(ad);
        ad.validateAll().store();
        table.data(this._dataTable.data());
        table.layoutIfVisible();
        table.selectedIndex(this._dataTable.data().length - 1)
             .triggerSelection();

        // defer, so we toggle error pane first and then scroll
        fun.defer(function() {
            table.scrollToIndex(table.selectedIndex());
            table.list().editorController().editSelectedColumn(2);
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
          .data(this._ads)
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


exports.AdPane = AdPane;
