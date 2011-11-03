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
requireCss("./contractPane/contractPane.css");

var fun   = require("../../uki-core/function"),
    dom   = require("../../uki-core/dom"),
    utils = require("../../uki-core/utils"),
    build = require("../../uki-core/builder").build,
    find  = require("../../uki-core/selector").find,
    view = require("../../uki-core/view"),

    formatters = require("../../lib/formatters"),
    compare = require("../../uki-fb/view/dataTable/compare"),
    contractFormatters = require("./contractPane/formatters"),
    paneFormatters = require("./adPane/formatters"),

    CampStat = require("../model/campStat").CampStat,
    Account = require("../model/account").Account,
    DataTableList =
      require("./contractPane/dataTableList").DataTableList,

    Container = require("../../uki-core/view/container").Container;

var ContractPane = view.newClass('ads.ContractPane', Container, {

    campaigns: fun.newProp('campaigns', function(camps) {
        this._campaigns = camps;
    }),

    contract: fun.newProp('contract', function(contract, callback) {
      this._contract = contract;
      view.byId('contractPane-data').contract(contract);
      callback && callback.call(this);
    }),

    toplines: fun.newProp('toplines', function(toplines, callback) {
      this._toplines = toplines;

      this._dataTable
          .data(this._toplines || [])
          .layoutIfVisible()
          .selectedIndex(0)
          .lastClickIndex(0)
          .triggerSelection();

      this._dataTable.sortColumnByKey('line_number',
             this._dataTable.sortDirection());

      this.refreshOnDeliveryInfo();
      callback && callback.call(this);
    }),

    cleanup: function() {
      this.contract(undefined);
      this.toplines(undefined);
    },

    refreshAndSelect: function(index) {
        this._dataTable
          .selectedIndex(index)
          .lastClickIndex(index)
          .focus()
          .triggerSelection()
          .layoutIfVisible();
    },

    refreshOnDeliveryInfo: function() {
      var length = this._dataTable.data().length;
      for (i = 0; i < length; i++) {
        this._dataTable.list()
          .redrawOnDeliveryInfo(this._dataTable.data()[i], i);
      }
    },

    loading: function(v) {
        if (v === undefined) {
            return this._refs.view('loadingImage').visible();
        }
        this._refs.view('loadingImage').visible(v);
        return this;
    },

    _createDom: function() {
        this._dom = dom.createElement('div', { className: 'contractPane' });

        var iconUrl =
          toDataUri('./contractPane/indicator_blue_small.gif'); 

        this._refs = build([
            { view: 'Container', addClass: 'contractPane-toolbar',
              childViews: [
              { view: 'List', horizontal: true,
                addClass: 'contractPane-toolbar-list pvs phl', childViews: [
                { view: 'Button', label: 'Check Updates',
                  requireActive: true,
                  on: { click: fun.bindOnce(this._checkUpdates, this) } },
                { view: 'Image', addClass: 'syncLoader mhs', visible: false,
                    src: iconUrl,
                  as: 'loadingImage' }
              ] }
            ] },

            { view: 'ContractEditor',
              pos: 'l:20px r:0 t:32px', id: 'contractPane-data'
            },

            { view: 'Container', pos: 'l:0 t:215px b:300px r:0',
              childViews: [
              { view: 'List', horizontal: true, border: 'dark',
                addClass: 'divider pvs phl', childViews: [
                { view: 'Base', initArgs: { tagName: 'span'},
                  addClass: 'legend mhm pts pbs', text: 'Legend:'},
                { view: 'Base', initArgs: { tagName: 'span'},
                  addClass: 'overDelivered mhm pts pbs', text: 'OverDelivered'},
                { view: 'Base', initArgs: { tagName: 'span'},
                  addClass: 'underDelivered mhm pts pbs',
                  text: 'UnderDelivered'},
                { view: 'Base', initArgs: { tagName: 'span'},
                  addClass: 'legend mhm pts pbs', text: 'Allocation:'},
                { view: 'Base', initArgs: { tagName: 'span'},
                  addClass: 'left mhm pts pbs', text: 'Left'},
                { view: 'Base', initArgs: { tagName: 'span'},
                  addClass: 'over mhm pts pbs', text: 'Over'}
              ] }
            ] },

            { view: 'DataTable', init: { listView: DataTableList },
              addClass: 'contractPane-data', id: 'topline-table',
              pos: 'l:0 t:250px b:0 r:0', debounce: 42,
              multiselect: false, columns: [
                { label: '#', key: 'line_number', width: 28,
                  maxWidth: 28, minWidth: 28,
                  compareFn: compare.numbers,
                  sortable: true },
                { label: 'Line ID', key: 'line_id', width: 60,
                  maxWidth: 100, minWidth: 40,
                  compareFn: compare.numbers,
                  sortable: true },
                { label: 'Line Start', key: 'adjusted_flight_start_date',
                  width: 100, maxWidth: 120, minWidth: 80,
                  compareFn: compare.dates,
                  sortable: true,
                  formatter: contractFormatters.date },
                { label: 'Line End', key: 'adjusted_flight_end_date',
                  width: 100, maxWidth: 120, minWidth: 80,
                  compareFn: compare.dates,
                  sortable: true,
                  formatter: contractFormatters.date },
                { label: 'Description', key: 'description',
                  width: 150, maxWidth: 200, minWidth: 60},
                { label: 'UOM', key: 'uom',
                  width: 40, maxWidth: 60, minWidth: 30},

                { label: 'Line Impressions', key: 'impressions',
                  width: 80, maxWidth: 150, minWidth: 60,
                  formatter: contractFormatters.number,
                  compareFn: compare.numbers,
                  sortable: true },
                { label: 'Price', key: 'func_price',
                  width: 60, maxWidth: 100, minWidth: 40,
                  formatter: contractFormatters.money,
                  compareFn: compare.numbers,
                  sortable: true },
                { label: 'Line Amount', key: 'func_line_amount',
                  width: 100, maxWidth: 150, minWidth: 60,
                  formatter: contractFormatters.money,
                  compareFn: compare.numbers,
                  sortable: true },
                { label: 'Impressions', key: 'stat_impressions',
                  width: 80, maxWidth: 150, minWidth: 60,
                  className: 'ufb-dataTable-cell_number',
                  formatter: contractFormatters.number,
                  compareFn: compare.numbers,
                  sortable: true },
                { label: 'Clicks', key: 'stat_clicks',
                  width: 60, maxWidth: 150, minWidth: 60,
                  className: 'ufb-dataTable-cell_number',
                  formatter: contractFormatters.number,
                  compareFn: compare.numbers,
                  sortable: true },
                { label: 'Spent', key: 'stat_spent_100',
                  width: 70, maxWidth: 150, minWidth: 60,
                  className: 'ufb-dataTable-cell_number',
                  formatter: contractFormatters.money,
                  compareFn: compare.numbers,
                  sortable: true },
                { label: 'Last Update', key: 'stat_last_update_time',
                  width: 70, maxWidth: 150, minWidth: 60,
                  className: 'ufb-dataTable-cell_number',
                  formatter: contractFormatters.date },
                { label: 'OverDelivery %', key: 'overdelivery_perc',
                  width: 60, maxWidth: 150, minWidth: 60,
                  className: 'ufb-dataTable-cell_number',
                  formatter: formatters.createPercentFormatter(2),
                  compareFn: compare.numbers,
                  sortable: true },
                { label: 'Spent %', key: 'spent_perc',
                  width: 60, maxWidth: 150, minWidth: 60,
                  className: 'ufb-dataTable-cell_number',
                  formatter: formatters.createPercentFormatter(2),
                  compareFn: compare.numbers,
                  sortable: true },
                { label: 'Complete %', key: 'complete_perc',
                  width: 60, maxWidth: 150, minWidth: 60,
                  className: 'ufb-dataTable-cell_number',
                  formatter: formatters.createPercentFormatter(2),
                  compareFn: compare.numbers,
                  sortable: true },
                { label: 'Allocation', key: 'unallocatedImps',
                  width: 80, maxWidth: 120, minWidth: 60,
                  className: 'ufb-dataTable-cell_number',
                  formatter: contractFormatters.allocation,
                  compareFn: compare.numbers,
                  sortable: true },

                { label: 'Product Type', key: 'product_type', width: 80,
                  maxWidth: 120, minWidth: 60 },
                { label: 'Targets', key: 'targets',
                  width: 220, minWidth: 150, maxWidth: 300,
                  formatter: paneFormatters.targets },
                { label: 'ID', key: 'ID', width: 20, maxWidth: 20, minWidth: 20,
                  visible: false}
            ]}

        ]).appendTo(this);

        this._dataTable = find('> DataTable', this)[0];
        this._dataTable.setDefaultSortingKey('line_number');
    },

    _syncToplineStats: function() {
      // sync all the topline stats up-to-date
      if (this._contract) {

        this.loading(true);

        Account.findAllBy('id', this.contract().id(),
          fun.bind(function(accounts) {
            accounts && accounts.prefetch && accounts.prefetch();
            CampStat.loadFromAccountsAndRange(accounts[0], 0, 0,
              fun.bind(function() {
                // recalculate the stats and refresh the table
                require("../model/topline").Topline.findAllBy(
                  'account_id', this.contract().id(),
                  fun.bind(function(toplines) {
                    toplines && toplines.prefetch();
                    require("../model/topline").Topline.loadToplinesStats(
                      toplines,
                      fun.bind(function() {
                        this.loading(false);
                        this.toplines(toplines);
                        require("../controller/app").App.reload();
                      }, this)
                    );
                  }, this)
                );
              }, this)
            );
          }, this)
        );
      }
    },

    _checkUpdates: function() {
      var list_type = 'campaignList-list';
      var parent = view.byId(list_type).selectedRow();

      var act_id = null;
      var is_corp_act = false;
      if (parent instanceof Account) {
        act_id = parent.id();
        is_corp_act = parent.isCorporate();
      } else {
        act_id = parent.account().id();
        is_corp_act = parent.account().isCorporate();
      }

      var account_options = {};
      if (act_id && is_corp_act) {
        account_options.account_ids = [act_id];

        this.loading(true);
        // clean up all previous contracts and toplines
        require("../model/contract").Contract.findAllBy(
          'id', act_id,
          function(contracts) {
            require("../model/topline").Topline.deleteBy('account_id', act_id,
              function() {
                require("../model/contract").Contract.deleteBy('id', act_id, function() {}
              );
          });
        });

        require("../model/contract").Contract.loadFromRESTAPI(
          account_options, fun.bind(function(contracts) {
          if (contracts.length === 0) {
            this.loading(false);
            return;
          }
          require("../model/topline").Topline.loadFromRESTAPI(
            { account_id: contracts[0].id() },
            fun.bind(function(toplines) {
              var context = this;
              require("../model/topline").Topline.prepare(function() {
                require("../model/campaign").Campaign.findAllBy(
                  'account_id', contracts[0].id(),
                  function(camps) {
                    camps.forEach(function(c) {
                      c.contract(require("../model/contract").Contract.byId(
                        contracts[0].id())
                      );
                      c.topline(require("../model/topline").Topline.byId(
                        c.idx_line_id())
                      );
                    });
                    context._syncToplineStats();
                  }
                );
              }, true);
              this.loading(false);
            }, this)
          );
        }, this));
      } else {
        require("../../uki-fb/view/dialog").Dialog
          .alert(tx('ads:pe:dragon:contract-na'));
      }
    }


});


exports.ContractPane = ContractPane;
