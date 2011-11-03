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
    view  = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,
    find  = require("../../uki-core/selector").find,

    formatters     = require("../../lib/formatters"),
    campFormatters = require("./campPane/formatters"),
    paneFormatters = require("./adPane/formatters"),
    compare        = require("../../uki-fb/view/dataTable/compare"),

    controls      = require("./controls"),
    Export        = require("../controller/export").Export,
    DataTableList = require("./dataTable/list").DataTableList,
    CampRS        = require("../model/campaign/campResultSet").CampResultSet,
    StatusEditor  = require("./campPane/statusEditor").StatusEditor,
    PeriodEditor  = require("./campPane/periodEditor").PeriodEditor,

    BasePane = require("./basePane").BasePane;

var CAMP_TOGGLE_SHOW = 'campPane:toggleshow';

var CampPane = view.newClass('ads.CampPane', BasePane, {
  _initDataSetup: function(callback) {
    ResultSet = CampRS;
    this._objects = this._campaigns;
    this._setupData(callback);
    find('Button', this).prop(
      'disabled',
      !require("../controller/app").App.isActive()
    );
  },

  _createDom: function() {
    this.toggleKey('campPane:toggleshow');
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

            { view: controls.DateRange, as: 'statDates',
              requireActive: true,
              action: 'dataRange', addClass: 'mlm',
              persistent: {
                storage: require("../controller/app")
                  .App.userStorage(),
                key: 'campPane:dateRange'
              } },
            { view: 'Button',
              requireActive: true, action: 'toggle',
              visible: false,
              on: { click: fun.bindOnce(this._toggleHandler, this) } }
        ] },

        { view: 'SearchInput', placeholder: "Search",
          pos: 'r:10px t:0px', buttonless: true,
          visible: true, as: 'search',
          on: { keyup: fun.bindOnce(this._searchHandler, this) }
        }
      ] },

      { view: 'DataTable',
        init: { listView: DataTableList },
        editOnEnter: true, redrawOnModelChange: true,
        addClass: 'campPane-data', id: 'campPane-data',
        pos: 'l:0 r:0 t:32px b:261px',
        multiselect: true, debounce: 42,
        columns: [
          { desc: 'Changed',
            key: 'isChanged', width: 20, maxWidth: 20, minWidth: 20,
            changeOnKeys: [],
            sortable: true,
            compareFn: compare.booleans,
            formatter: campFormatters.changes },

          { desc: 'Errors',
            key: 'hasErrors', width: 20, maxWidth: 20, minWidth: 20,
            changeOnKeys: ['errors'],
            sortable: true,
            compareFn: compare.booleans,
            formatter: campFormatters.errors }
          ].concat([
            { label: 'Campaign', key: 'name', minWidth: 40, width: 200,
              changeOnKeys: ['name'],
              sortable: true,
              editor: {
                view: 'dataList.Editor',
                bindingOptions: { viewEvent: 'keyup change blur paste' }
              } },

            { desc: 'Status',
              label: '', key: 'campaign_status',
              width: 20, maxWidth: 20, minWidth: 20,
              changeOnKeys: ['campaign_status'],
              className: 'campPane-cell_status',
              sortable: true,
              formatter: campFormatters.status,
              editor: { view: StatusEditor }
            },

            { label: 'Start Date', key: 'adjusted_start_time',
              minWidth: 40, width: 80,
              compareFn: compare.dates,
              sortable: true,
              formatter: campFormatters.startDate },

            { label: 'End Date', key: 'adjusted_end_time',
              width: 80, minWidth: 40,
              compareFn: compare.dates,
              sortable: true,
              formatter: campFormatters.endDate },

            { label: 'Budget', key: 'uninflated_ui_budget_100',
              width: 80, minWidth: 40,
              changeOnKeys: ['daily_budget',
                'lifetime_budget', 'inflation'],
              className: 'ufb-dataTable-cell_number',
              formatter: campFormatters.budget,
              compareFn: compare.numbers,
              sortable: true,
              editor: {
                view: 'dataList.Editor',
                bindingOptions: {viewEvent: 'keyup change blur paste'}
            }},

            { label: 'Period', key: 'budget_type',
              width: 60, minWidth: 40,
              changeOnKeys: ['daily_budget', 'lifetime_budget'],
              compareFn: compare.dates,
              sortable: true,
              formatter: campFormatters.budgetPeriod,
              editor: { view: PeriodEditor }},

            { label: 'Remaining', key: 'budget_remaining_100',
              width: 70, maxWidth: 150, minWidth: 60,
              className: 'ufb-dataTable-cell_number',
              compareFn: compare.numbers,
              sortable: true,
              formatter: paneFormatters.money }
           ]),
         canHideColumns: true,
         persistent: {
           storage: require("../controller/app").App.userStorage(),
           key: 'campPane:dataTable'
         }
      },

      { view: 'CampEditor', pos: 'h:260px l:0 r:0 b:0',
        id: 'campEditor',
        persistent: {
          storage: require("../controller/app").App.userStorage(),
          key: 'campPane:campEditor'
        }
      }

    ]).appendTo(this);

    this._dataTable = find('> DataTable', this)[0];
    this._toggleButton = find('Button[action=toggle]', this)[0];
    find('DataTableList', this._dataTable)[0].copySourceId('campaigns');
    this._searchInput = this._refs.view('search');
    this._statDates = this._refs.view('statDates');

    this._statType = 'CampStat';
    this._setupListeners();
  }
});


exports.CampPane = CampPane;
