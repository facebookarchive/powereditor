/**
* Copyright (c) 2011, Facebook, Inc.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
*   * Redistributions of source code must retain the above copyright notice,
*     this list of conditions and the following disclaimer.
*   * Redistributions in binary form must reproduce the above copyright notice,
*     this list of conditions and the following disclaimer in the documentation
*     and/or other materials provided with the distribution.
*   * Neither the name Facebook nor the names of its contributors may be used to
*     endorse or promote products derived from this software without specific
*     prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
* AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*
*/
requireCss("./dataTable/dataTable.css");


// force gesture load/registration
require("../../uki-core/gesture");
var fun   = require("../../uki-core/function");
var utils = require("../../uki-core/utils");
var dom   = require("../../uki-core/dom");
var view  = require("../../uki-core/view");

var compare   = require("./dataTable/compare");
var Builder   = require("../../uki-core/builder").Builder;
var DataList  = require("./dataList").DataList;
var Mustache  = require("../../uki-core/mustache").Mustache;
var Base      = require("../../uki-core/view/base").Base;
var Container = require("../../uki-core/view/container").Container;
var Focusable = require("./focusable").Focusable;
var PersistentState = require("../persistentState").PersistentState;

var Pack      = require("./dataTable/pack").Pack;
var EditorController =
  require("./dataTable/editorController").EditorController;


var DataTable = view.newClass('DataTable', Container, PersistentState, {
  columns: function(cols) {
    if (cols === undefined) {
      return this._list.columns();
    }
    cols = table.addColumnDefaults(cols);
    this._list.columns(cols);
    this._header.columns(cols);
    return this;
  },

  columnWidths: function(v) {
    if (v === undefined) {
      return utils.pluck(this.columns(), 'width');
    }
    utils.forEach(this.columns(), function(col, i) {
      if (v[i]) { col.width = v[i]; }
    }, this);
    this._header.columns(this.columns());
    return this;
  },

  columnWidthsByKey: function(v) {
    if (v === undefined) {
      var result = {};
      utils.forEach(this.columns(), function(c, i) {
        result[c.key || i] = c.width;
      });
      return result;
    }
    utils.forEach(this.columns(), function(c, i) {
      var w = v[c.key || i];
      if (w) { c.width = w; }
    });
    this._header.columns(this.columns());
    return this;
  },

  canHideColumns: fun.newProp('canHideColumns'),

  visibleColumnIndexes: function(v) {
    if (v === undefined) {
      var result = [];
      utils.forEach(this.columns(), function(c, i) {
        if (c.visible) { result.push(i); }
      });
      return result;
    }
    utils.forEach(this.columns(), function(c) {
      c.visible = false;
    });
    utils.forEach(v, function(index) {
      this.columns()[index].visible = true;
    }, this);

    table.calculateVisibleIndexes(this.columns());
    this._header.columns(this.columns());
    this._list.reset();
    return this;
  },

  visibleColumnKeys: function(v) {
    if (v === undefined) {
      var result = [];
      utils.forEach(this.columns(), function(c, i) {
        if (c.visible) { result.push(c.key || i); }
      });
      return result;
    }
    var map = {};
    utils.forEach(v, function(key) {
      map[key] = true;
    });

    utils.forEach(this.columns(), function(c) {
      c.visible = !!map[c.key || i];
    });

    table.calculateVisibleIndexes(this.columns());
    this._header.columns(this.columns());
    this._list.reset();
    return this;
  },

  list: function() {
    return this._list;
  },

  getPersistentState: function() {
    return {
      columnWidthsByKey: this.columnWidthsByKey(),
      visibleColumnKeys: this.visibleColumnKeys()
    };
  },

  setPersistentState: function(state) {
    if (state.columnWidthsByKey) {
      this.columnWidthsByKey(state.columnWidthsByKey);
    }
    if (state.visibleColumnKeys && this.canHideColumns()) {
      this.visibleColumnKeys(state.visibleColumnKeys);
    }
  },

  destruct: function() {
    PersistentState.destruct.call(this);
    Container.prototype.destruct.call(this);
  },


  _createDom: function(initArgs) {
    this._dom = dom.createElement('div', {className: 'ufb-dataTable'});

    // Temporary solution. TODO(voloko) Fix builder namespacing
    var c = new Builder().build([
      { view: initArgs.headerView || DataTableHeader, as: 'header',
        addClass: 'ufb-dataTable-header-container',
        on: { resizeColumn: fun.bind(this._resizeColumn, this) } },

      { view: Container, pos: 't:0 l:0 r:0 b:0',
        addClass: 'ufb-dataTable-container', as: 'container',
        on: { scroll: fun.bind(this._scrollHeader, this) },
        childViews: [
          { view: initArgs.listView || DataTableList, as: 'list',
            on: { selection: fun.bind(this.trigger, this) } }
        ] }
    ]).appendTo(this);

    this._header = c.view('header');
    this._header.on('render', fun.bindOnce(this._updateHeaderHeight, this));
    this.on('sortColumn', fun.bind(this._sortColumn, this));
    this._container = c.view('container');
    this._list = c.view('list');
    this._container.on('mousedown', function(e) {
      if (e.targetView() == this) {
        c.view('list').focus();
        e.preventDefault();
      }
    });
  },

  _updateHeaderHeight: function() {
    var pos = this._container.pos();
    pos.t = this._header.clientRect().height + 'px';
    this._container.pos(pos);
  },

  _initLayout: function() {
    this._updateHeaderHeight();
  },

  _scrollHeader: function(e) {
    this._header.scrollTo(this._container.scrollLeft());
  },

  _resizeColumn: function(e) {
    this._list._updateColumnSize(e.column.index);
  },

  sortColumn: function(index, direction) {
    var i = index;
    if (index == -1) {
      return;
    }
    if (!this.data().length) {
      return;
    }

    var dataKey = this.columns()[index].key;

    // the sort function depends on whether the column data is numerical or not
    var compFn = this.columns()[index].compareFn;
    var sortFn;
    if (direction) {
      sortFn = function(a, b) {
        var obj1 = a[dataKey]();
        var obj2 = b[dataKey]();
        return compFn(obj1, obj2);
      };
    } else {
      sortFn = function(a, b) {
        var obj1 = a[dataKey]();
        var obj2 = b[dataKey]();
        return compFn(obj2, obj1);
      };
    }
    this.data().sort(sortFn);
    this.list().reset();

    this._header._setSortedColumn(index, direction);

  },

  sortIndex: function() {
    return this._header._sortInfo.sortIndex;
  },

  visibleSortIndex: function() {
    return this.columns()[this.sortIndex()].visibleIndex;
  },

  sortDirection: function() {
    return this._header._sortInfo.asc;
  }
});

fun.delegateProp(DataTable.prototype, [
  'data', 'throttle', 'debounce', 'template', 'formatter', 'key',
  'selection', 'selectedRows', 'selectedRow',
  'selectedIndexes', 'selectedIndex', 'lastClickIndex',
  'multiselect', 'editorController', 'selectionController', 'metrics',
  'binding', 'bindings', 'editing', 'redrawOnModelChange', 'changeEventFilter'
], 'list');

fun.delegateCall(DataTable.prototype, [
  'scrollToIndex', 'triggerSelection', 'redrawIndex', 'redrawRow'
], 'list');






var DataTableHeader = view.newClass('DataTableHeader', Base, {
  template: fun.newProp('template'),
  _template: requireText('dataTable/header.html'),

  _createDom: function(initArgs) {
    Base.prototype._createDom.call(this, initArgs);
    this.on('draggesturestart', this._ondragStart);
    this.on('draggesture', this._ondrag);
    this.on('draggestureend', this._ondrag);
    this.on('click', this._onClick);

    this._prevCell = this._sortedCell = null;
    this._sortInfo = { sortIndex: -1, asc: true };
  },

  scrollTo: function(offset) {
    this._dom.firstChild.style.marginLeft = -offset + 'px';
  },

  _ondragStart: function(e) {
    if (dom.hasClass(e.target, 'ufb-dataTable-resizer')) {
      e.draggable = e.target;
      e.cursor = dom.computedStyle(e.target, null).cursor;
      var headerCell = e.target;
      headerCell = this._getHeaderCell(headerCell);
      var index = parseInt(headerCell.getAttribute('data-index'), 10);
      this._draggableColumn = index;
      this._initialWidth = this.columns()[index].width;
    } else {
      e.preventDefault();
    }
  },

  _ondrag: function(e) {
    var width = this._initialWidth + e.dragOffset.x;
    this._resizeColumn(this._draggableColumn, width);
    this.trigger({
      type: 'resizeColumn',
      column: this.columns()[this._draggableColumn]
    });
  },

  // traces back element to the header cell element (if it exists)
  _getHeaderCell: function(elem) {
    while (elem) {
      if (dom.hasClass(elem, 'ufb-dataTable-header-cell')) {
        return elem;
      }
      elem = elem.parentNode;
    }
    return null;
  },

  _onClick: function(e) {
    // This if statement prevents clicks at column boundaries, which indicate
    // adjusting column width, from also triggering a sort
    if (dom.hasClass(e.target, 'ufb-dataTable-resizer')) {
      return;
    }
    var headerCell = e.target;
    headerCell = this._getHeaderCell(headerCell);
    if (!headerCell) { return; }

    var index = parseInt(headerCell.getAttribute('data-index'), 10);
    if (!this.columns()[index].sortable) { return; }

    var direction = (index == this._sortInfo.sortIndex) ?
                          !(this._sortInfo.asc) : true;
    this._prevCell = this._sortedCell;
    this._sortedCell = headerCell;

    if (this._parent) {
      this._parent.sortColumn(index, direction);
      this.trigger({ type: 'tableSorted',
                     index: index,
                     direction: direction,
                     visibleIndex: this.columns()[index].visibleIndex,
                     simulatePropagation: true });
    } else {
        this._setSortedColumn(index, direction);
    }
  },

  _setSortedColumn: function(index, direction) {
    var prevAsc = this._sortInfo.asc;
    this._sortInfo.asc = direction;
    this._sortInfo.sortIndex = index;

    if (this._prevCell) {
      dom.toggleClass(this._prevCell,
        'ufb-dataTable-header-sort-' +
        (prevAsc ? 'asc' : 'desc'), false);
    }
    dom.toggleClass(this._sortedCell,
      'ufb-dataTable-header-sort-' + (this._sortInfo.asc ? 'asc' : 'desc'),
      true);
  },

  _resizeColumn: function(index, width) {
    var column = this.columns()[index];
    if (column.maxWidth > 0) { width = Math.min(width, column.maxWidth); }
    if (column.minWidth > 0) { width = Math.max(width, column.minWidth); }
    column.width = width;
    var tr = this.dom().firstChild.firstChild.firstChild;
    var td = tr.childNodes[column.visibleIndex];
    td.style.width = width + 'px';

    this.dom().firstChild.style.width =
    table.totalWidth(this.columns()) + 'px';
  },

  _formatColumn: function(col) {
    return {
      index: col.index,
      label: col.label,
      style: 'width:' + col.width + 'px',
      className: col.className +
        (col.width != col.maxWidth || col.width != col.minWidth ?
        ' ufb-dataTable-header-cell_resizable' : '') +
        (col.sortable ? ' ufb-dataTable-header-cell_sortable' : '')
    };
  },

  columns: fun.newProp('columns', function(cols) {
    this._columns = cols;
    fun.deferOnce(fun.bindOnce(this._render, this));
  }),


  _render: function() {
    this._dom.innerHTML = Mustache.to_html(
      this._template,
      {
        columns: this.columns().filter(function(c) {
          return c.visible;
        }).map(this._formatColumn, this),
        style: 'width:' + table.totalWidth(this.columns()) + 'px'
      });

    if (this._sortedCell) {
      this._sortedCell = this._getHeaderRow().children
        [this.columns()[this._sortInfo.sortIndex].visibleIndex];
      this._prevCell = null;
      this._setSortedColumn(this._sortInfo.sortIndex, this._sortInfo.asc);
    }

    this.trigger({ type: 'render' });
  },

  _getHeaderRow: function() {
    var hdrRow = this._dom;

    while (hdrRow) {
      if (dom.hasClass(hdrRow, 'ufb-dataTable-header-row')) {
        return hdrRow;
      }
      hdrRow = hdrRow.children[0];
    }

    return null;
  }
});



var DataTableList = view.newClass('DataTableList', DataList, {

  _setup: function(initArgs) {
    'packView' in initArgs || (initArgs.packView = Pack);

    'editorController' in initArgs ||
      (initArgs.editorController = new EditorController());

    DataList.prototype._setup.call(this, initArgs);
  },

  /**
  * {
  *   key: 'propName',         // optional=index, propName to read from object
  *   className: 'mycls',      // optional='', className to add to a cell
  *   sortable: false,         // optional=false, determines if cell is sortable
  *   compareFn: function(){}, // optional, determines how the data gets sorted
  *   width: 200,              // optional=200, default width in px
  *   minWidth: 100,           // optional=100, minWidth in px
  *   maxWidth: 300,           // optional=-1, maxWidth in px, -1 for now
  *                               maxWidth
  *   visible: true,           // optional=true, should you show the column or
  *                               not
  *   label: 'My Label',       // optional='', used by header
  *   formatter: function(){}  // optional, formats value before rendering
  *                            // (ex: numberFormatter, dateFormatter)
  * }
  */
  columns: fun.newProp('columns'),
  _columns: [],

  _template: requireText('dataTable/pack.html'),

  _createDom: function(initArgs) {
    DataList.prototype._createDom.call(this, initArgs);
    this.addClass('ufb-dataTable-list');
  },

  _updateColumnSize: function(index) {
    var column = this.columns()[index];
    utils.forEach(this.childViews(), function(pack) {
      pack.resizeColumn(column.visibleIndex, column.width);
    }, this);
  }
});



var table = {
  totalWidth: function(columns) {
    return utils.reduce(columns, function(s, col) {
      return s + (col.visible ? (col.width || 200) : 0);
    }, 0);
  },

  addColumnDefaults: function(columns) {
    columns = utils.map(columns, function(col, index) {
      col = utils.extend({
        index: index,
        sortable: false,
        compareFn: compare.objects,
        width: 200,
        name: '',
        className: '',
        visible: true,
        formatter: dom.escapeHTML
      }, col);
      col.minWidth = Math.min(col.minWidth || 20, col.width);
      if (col.maxWidth > 0) {
        col.maxWidth = Math.max(col.maxWidth, col.width);
      }
      return col;
    });
    table.calculateVisibleIndexes(columns);
    return columns;
  },

  calculateVisibleIndexes: function(columns) {
    var index = 0;
    utils.forEach(columns, function(c) {
      c.visibleIndex = index;
      if (c.visible) { index++; }
    });
  }
};


exports.DataTable       = DataTable;
exports.DataTableList   = DataTableList;
exports.DataTableHeader = DataTableHeader;
exports.table           = table;
