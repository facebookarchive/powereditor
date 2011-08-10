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
requireCss("./dateRange/dateRange.css");

var fun   = require("../../../uki-core/function"),
    view  = require("../../../uki-core/view"),
    find  = require("../../../uki-core/selector").find,
    build = require("../../../uki-core/builder").build,

    dateRange = require("../../../lib/dateRange"),

    PersistentState = require("../../../uki-fb/persistentState").PersistentState,

    DateDataSource =
        require("../../lib/typeahead/DateDataSource").DateDataSource,
    Container = require("../../../uki-core/view/container").Container;


var DateRange = view.newClass('ads.control.DateRange',
  Container,
  PersistentState,
  {

    loading: function(v) {
        if (v === undefined) {
            return find('> Image', this)[0].visible();
        }
        find('> Image', this)[0].visible(v);
        find('> Selector', this)[0].disabled(v);
        return this;
    },

    setPersistentState: function(state) {
      if (state.range) {
        var range = dateRange.decode(state.range);
        this._selectRange(range);
      }
    },

    getPersistentState: function() {
      var v = this.range();
      return { range: v && dateRange.encode(v.from, v.to) };
    },

    range: fun.newProp('range', function(v) {
      this._range = v;
    }),

    disabled: fun.newDelegateProp('_selector', 'disabled'),

    _createDom: function(initArgs) {
        Container.prototype._createDom.call(this, initArgs);
        this.addClass('dateRange');
        var iconUrl =
          toDataUri('./dateRange/indicator_blue_small.gif');
        build([
            { view: 'Selector', label: 'Stats: None', childViews: [
                { view: 'MenuItem', text: 'Lifetime', lifetime: true,
                    from: 0, to: 0 },
                { view: 'MenuItem', text: 'Last 7 Days',
                    from: getDate(-7), to: getDate(0) },
                { view: 'MenuItem', text: 'Yesterday',
                    from: getDate(-1), to: getDate(0) },
                { view: 'MenuItem', text: 'Today',
                    from: getDate(0), to: getDate(1) },
                { view: 'MenuSeparator' },
                { view: 'MenuItem', text: 'Custom', custom: true,
                    from: getDate(-7), to: getDate(0) }
              ] },

          { view: 'Text', text: 'from', addClass: 'mhs',
            visible: false, custom: true },
          { view: 'Typeahead', setValueOnSelect: true,
            visible: false, addClass: 'dateRange-typeahead', custom: true,
            data: (new DateDataSource()).maxResults(6) },
          { view: 'Text', text: 'to', addClass: 'mhs',
            visible: false, custom: true },
          { view: 'Typeahead', setValueOnSelect: true,
            value: dateRange.formatDate(getDate(0)), visible: false,
            addClass: 'dateRange-typeahead', custom: true,
            data: (new DateDataSource()).maxResults(6) },
          { view: 'Button', addClass: 'dateRange-apply mhs', visible: false,
            label: 'Apply', custom: true },
          { view: 'Image', addClass: 'dateRange-loader mhs', visible: false,
            src: iconUrl }
        ]).appendTo(this);

        this._selector = find('> Selector', this)[0];

        this._selector.addListener('click',
            fun.bind(this._selectorClick, this));
        find('> Button', this).addListener('click',
            fun.bind(this._customSelect, this));
    },

    _selectRange: function(range) {
        var items = find('> MenuItem', this._selector);
        for (var i = 0; i < items.length; i++) {
          if (!items[i].custom) {
            if ((items[i].lifetime && range === '') ||
              (!items[i].lifetime && (
                items[i].from.getTime() == range.from.getTime() &&
                  items[i].to.getTime() == range.to.getTime())
              ))
            {
              this._selectOption(items[i]);
              return;
            }
          }
        }

        var item = build({ view: 'MenuItem',
            text: dateRange.formatDate(range.from) +
                ' - ' + dateRange.formatDate(range.to),
            from: range.from, to: range.to })[0];
        this._selector.insertBefore(item,
            find('MenuSeparator', this._selector)[0]);
        this._selectOption(item);
    },

    _customSelect: function() {
        var th = find('> Typeahead', this),
            from = th[0].selectedResult() ||
                { id: find('> Selector > [custom]', this)[0].from },
            to = th[1].selectedResult() ||
                { id: find('> Selector > [custom]', this)[0].to },
            dateFrom = new Date(),
            dateTo = new Date();

        dateFrom.setTime(from.id);
        dateTo.setTime(to.id);
        this._selectRange({ from: dateFrom, to: dateTo });
        this._triggerRange();
    },

    _selectOption: function(view) {
        this._selector.label('Stats: ' + view.text());
        this._selector.opened(false);

        find('> [custom]', this).prop('visible', !!view.custom);
        if (view.custom) {
            var th = find('> Typeahead', this);
            th[0].value(dateRange.formatDate(view.from));
            th[1].value(dateRange.formatDate(view.to));
        } else {
            this.range({ from: view.from, to: view.to });
        }
    },

    _selectorClick: function(e) {
        var view = e.targetView();
        if (view && (view.from || view.lifetime)) {
            this._selectOption(view);
            if (!view.custom) { this._triggerRange(); }
        }
    },

    _triggerRange: function() {
        this.trigger({
            type: 'change.range',
            from: this.range().from,
            to: this.range().to
        });
    }
});

function getDate(offset) {
    var date = dateRange.date();
    if (offset) {
        date.setDate(date.getDate() + offset);
    }
    return date;
}


exports.DateRange = DateRange;
