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
    build = require("../../uki-core/builder").build,
    find  = require("../../uki-core/selector").find,

    controls       = require("./controls"),
    formatters     = require("../../lib/formatters"),
    paneFormatters = require("./adPane/formatters"),
    campFormatters = require("./campPane/formatters"),
    compare        = require("../../uki-fb/view/dataTable/compare"),

    BasePane = require("./basePane").BasePane,

    Export = require("../controller/export").Export,

    StatusEditor  = require("./adPane/statusEditor").StatusEditor,
    TypeEditor    = require("./adPane/typeEditor").TypeEditor,
    DataTableList = require("./dataTable/list").DataTableList,
    Ad            = require("../model/ad").Ad,
    AdRS          = require("../model/ad/resultSet").AdResultSet;


var AdPane = view.newClass('ads.AdPane', BasePane, {
  _initSetup: function(callback) {
    ResultSet = AdRS;
    Ad.findAllBy(
      'campaign_id', utils.pluck(this._campaigns, 'id'),
      fun.bind(function(ads) {
        this._objects = ads;
        this._setupData(callback);
      }, this)
    );
  },

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
            sortable: true,
            compareFn: compare.booleans,
            formatter: paneFormatters.changes },

          { desc: 'Errors',
            key: 'hasErrors', width: 20, maxWidth: 20, minWidth: 20,
            changeOnKeys: ['errors'],
            sortable: true,
            compareFn: compare.booleans,
            formatter: paneFormatters.errors },

          { label: 'Campaign Name', key: 'campaign_name',
            width: 80, minWidth: 60,
            sortable: true },

          { label: 'Ad Name', key: 'name', width: 200, minWidth: 60,
            sortable: true,
            editor: {
              view: 'dataList.Editor',
              bindingOptions: { viewEvent: 'keyup change blur paste' }
            } },

          { desc: 'Status',
            sortable: true,
            label: '', key: 'adgroup_status',
            width: 20, maxWidth: 20, minWidth: 20,
            changeOnKeys: ['adgroup_status'],
            className: 'adPane-cell_status',
            formatter: paneFormatters.status,
            editor: { view: StatusEditor } },

          { label: 'Bid', key: 'bid_100',
            width: 70, maxWidth: 150, minWidth: 50,
            changeOnKeys: ['max_bid'],
            sortable: true,
            compareFn: compare.numbers,
            className: 'dataTable-cell_number',
            formatter: paneFormatters.money,
            editor: {
              view: 'dataList.Editor',
              bindingOptions: { viewEvent: 'keyup change blur paste' }
            } },

          { label: 'Type', key: 'bid_type_name',
            width: 50, maxWidth: 50, minWidth: 50,
            className: 'dataTable-cell_number',
            changeOnKeys: ['bid_type'],
            sortable: true,
            editor: {
              view: TypeEditor,
              bindingOptions: { modelProp: 'bid_type' }
            },
            visible: false
          },

          { desc: 'Destination', label: 'Destination',
            key: 'destination',
            width: 80, maxWidth: 150, minWidth: 50,
            sortable: true,
            formatter: paneFormatters.destination },

          { label: 'Title', key: 'title',
            width: 80, minWidth: 50,
            sortable: true,
            editor: {
              view: 'dataList.Editor',
              bindingOptions: { viewEvent: 'keyup change blur paste' }
            } },

          { label: 'Body', key: 'body',
            width: 80, minWidth: 50,
            sortable: true,
            editor: {
              view: 'dataList.Editor',
              bindingOptions: { viewEvent: 'keyup change blur paste' }
          } },

          { label: 'Link', key: 'link_url',
            width: 70, minWidth: 50,
            sortable: true,
            editor: {
              view: 'dataList.Editor',
              bindingOptions: { viewEvent: 'keyup change blur paste' }
            },
            visible: false },

          { label: 'Location', key: 'countries',
            changeOnKeys: ['cities', 'regions'],
            sortable: true,
            formatter: paneFormatters.location,
            width: 70, minWidth: 50 },

          { label: 'Age', key: 'age_min',
            changeOnKeys: ['age_max'],
            sortable: true,
            formatter: paneFormatters.age,
            width: 60, minWidth: 60, maxWidth: 60 },

          { label: 'Sex', key: 'genders',
            formatter: paneFormatters.sex,
            sortable: true,
            width: 40, minWidth: 40, maxWidth: 70 },

          { label: 'Impressions', key: 'impressions',
            width: 80, maxWidth: 150, minWidth: 60,
            className: 'dataTable-cell_number',
            compareFn: compare.numbers,
            sortable: true,
            formatter: formatters.createNumberFormatter(),
            visible: false },

          { label: 'Social %', key: 'social_percent',
            width: 60, maxWidth: 60, minWidth: 60,
            className: 'dataTable-cell_number',
            sortable: true,
            compareFn: compare.numbers,
            formatter: formatters.createPercentFormatter(1),
            visible: false },

          { label: 'Clicks', key: 'clicks',
            width: 60, maxWidth: 150, minWidth: 60,
            className: 'dataTable-cell_number',
            sortable: true,
            compareFn: compare.numbers,
            formatter: formatters.createNumberFormatter() },

          { label: 'CTR %', key: 'ctr',
            width: 60, maxWidth: 60, minWidth: 60,
            className: 'dataTable-cell_number',
            sortable: true,
            compareFn: compare.numbers,
            formatter: formatters.createPercentFormatter(3) },

          { label: 'Avg. CPC', key: 'avg_cpc',
            width: 70, maxWidth: 150, minWidth: 60,
            className: 'dataTable-cell_number',
            sortable: true,
            compareFn: compare.numbers,
            formatter: paneFormatters.money },

          { label: 'Avg. CPM', key: 'avg_cpm',
            width: 70, maxWidth: 150, minWidth: 60,
            className: 'dataTable-cell_number',
            sortable: true,
            compareFn: compare.numbers,
            formatter: paneFormatters.money },

          { label: 'Demo links', key: 'demolinks',
            width: 70, maxWidth: 150, minWidth: 60,
            sortable: true,
            className: 'dataTable-cell_number',
            formatter: paneFormatters.demolinks },

          { label: 'Spent', key: 'spent_100',
            width: 70, maxWidth: 150, minWidth: 60,
            className: 'dataTable-cell_number',
            sortable: true,
            compareFn: compare.numbers,
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
        on: { resized: fun.bind(this._editorResized, this) }
      }
    ]).appendTo(this);

    this._addButton = find('Button[action=add]', this)[0];
    this._dataTable = find('> DataTable', this)[0];
    this._editor = find('> AdEditor', this)[0];
    find('DataTableList', this._dataTable)[0].copySourceId('ads');
    this._searchInput = this._refs.view('search');
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
  }
});


exports.AdPane = AdPane;
