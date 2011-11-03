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
    view  = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,
    find  = require("../../uki-core/selector").find,

    formatters     = require("../../lib/formatters"),
    accountformatters = require("./accountList/formatters"),
    compare        = require("../../uki-fb/view/dataTable/compare"),
    paneFormatters = require("./adPane/formatters"),
    controls      = require("./controls"),
    Export        = require("../controller/export").Export,
    DataTableList = require("./dataTable/list").DataTableList,
    Container = require("../../uki-core/view/container").Container;


var AccountPane = view.newClass('ads.AccountPane', Container, {
  campaigns: fun.newProp('campaigns', function(camps) {
    this._campaigns = camps;
  }),

  accounts: fun.newProp('accounts', function(accounts, callback) {
    this._accounts = accounts;
    this._dataTable.data(this._accounts);
    callback && callback.call(this);
  }),

  cleanup: function() {
    this.accounts(undefined);
  },

  refreshAndSelect: function(items) {
    this.accounts(this.accounts(), function() {
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
        if (!map[data[i].id()]) {
          indexes.push(data[i]);
          count++;
        }
      }
      this._dataTable.data(indexes);
      this._dataTable.list().focus().triggerSelection();
    });
  },

  _createDom: function() {
    this._dom = dom.createElement('div', { className: 'accountPane' });

    this._refs = build([
      { view: 'DataTable',
        init: { listView: DataTableList },
        addClass: 'accountPane-data', id: 'accountPane-data',
        redrawOnModelChange: true,
        pos: 'l:0 r:0 t:32px b:0',
        multiselect: true, debounce: 42, columns: [
          { desc: 'Changed',
            key: 'isChanged', width: 20, maxWidth: 20, minWidth: 20,
            changeOnKeys: [],
            sortable: true,
            compareFn: compare.booleans,
            formatter: paneFormatters.changes },
          { label: 'ID', key: 'id', width: 150,
            maxWidth: 200, minWidth: 100,
            sortable: true, compareFn: compare.numbers,
            editor: { view: 'dataList.Editor'}
          },
          { label: 'Status', key: 'status', width: 70,
            maxWidth: 100, minWidth: 50,
            formatter: accountformatters.status,
            sortable: true, compareFn: compare.numbers
          },
          { label: 'Name', key: 'name', width: 150,
            maxWidth: 200, minWidth: 100,
            sortable: true
          },
          { label: 'Currency', key: 'currency', width: 100,
            maxWidth: 150, minWidth: 50,
            sortable: true
          },
          { label: 'Daily Spend Limit', key: 'daily_spend_limit',
            width: 150, sortable: true,
            compareFn: compare.numbers
          },
          { label: 'Time Zone', key: 'timezone_name',
            width: 150, sortable: true
          }]
        }
    ]).appendTo(this);

    this._dataTable = find('> DataTable', this)[0];
    find('DataTableList', this._dataTable)[0].copySourceId('accounts');
  }
});


exports.AccountPane = AccountPane;
