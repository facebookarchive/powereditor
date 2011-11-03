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
requireCss("./campEditor/campEditor.css");

var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    view  = require("../../uki-core/view"),

    dateRange = require("../../lib/dateRange"),

    DateDataSource =
        require("../lib/typeahead/DateDataSource").DateDataSource,
    TimeDataSource =
        require("../lib/typeahead/TimeDataSource").TimeDataSource,
    Base = require("./adEditor/base").Base,
    campConst = require("../model/campaign/constants"),

    BaseBinding = require("../../uki-fb/binding").Binding,
    formatters = require("../../lib/formatters"),
    paneFormatters = require("./adPane/formatters"),
    campFormatters = require("./campPane/formatters");

var CampEditor = view.newClass('ads.CampEditor', Base, {

    _template: requireText('campEditor/campEditor.html'),

    _prepare: function(callback) {

      this.content().camp_errors.model(this.model());

      this.content().status.options(
        this.model().allowedStatusTransitions().map(function(s) {
          return {
            text: require("../lib/prop/campaignStatus").STATUS_MAP[s],
            value: s
          };
        })
      );

      var tz_text = this.model().account().timezone_offsets() ?
       this.model().account().timezone_name() :
       "Local time. Please update timezone offsets by re-downloading accounts.";
      this.content().tz_name_from.text(
        tz_text);
      this.content().tz_name_to.text(
        tz_text);


      

      callback();

      // Only show campaign link on non-new campaigns
      // when only one is selected
      if (!this.model().isNew() && this.model().id()) {
        this.content().camp_link.visible(true);
        var camp_link = '/ads/manage/adgroups.php?campaign_id=' +
          this.model().id() + '&act=' + this.model().account_id();
        this.content().camp_link.html(
          '<a class="adPane-link" target="_blank" href="' +
            camp_link + '">' + (this.model().id() * 1) + '</a>');
      } else {
        this.content().camp_link.visible(false);
      }

      var curcode = this.model().account().currency();
      // imp_based or budget based
      this.imps_based = false;

      if (this.model().isFromTopline()) {
        var topline = this.model().topline();
        var num_imps = null;
        var mf = formatters.createMoneyFormatter(2, curcode);
        if (topline.allow_price_override()) {
           // do not use the func_price to auto-compute the imps and budget
           // func_price the 1000 imps price defined for the line
           // for some bonus line, the func_price is set to 0
           // therefore, we will not use it to calculate the imps from
           // budget, instead use whatever users input.
           num_imps = this.model().imps();
           this.content().cpm_price.text('Price: N/A');
        } else {
          this.imps_based = this.model().isImpressionBased();
          var price = topline.func_price();
          num_imps =
            Math.round(1000 * this.content().budget_sum.value() / price);
          this.content().cpm_price.text('Price: ' + mf(price));
        }

        this.content().budget_ui_imps.value(num_imps);
        this.content().imps_label.visible(true);
      } else {
        this.content().budget_ui_imps.value('');
        this.content().cpm_price.text('');
        this.content().imps_label.visible(false);
      }

      // the selector should only be visible for new topline-attached camp
      this.content().campaign_type.toggleClass
        ('campEditor_hide-campType', !(this.model().line_number()));

      // if none of the selected items are new, disable field
      this.content().campaign_type.disabled(!this.model().isNew());
      // if none of the selected items are new, disable field
      this.content().line_number.disabled(!this.model().isNew());

      // the selector should only be visible for new topline-attached camp
      this.content().budget_ui_imps.toggleClass
        ('campEditor_hide-campType', !(this.model().line_number()));

      this.content().budget_label.text('Budget (' + curcode + ')');
    },

    _setupBindings: function(m) {
      this.content().name_input.binding({
        model: m,
        modelProp: 'name',
        viewEvent: 'keyup change blur paste'
      });
      this.content().budget_type.binding({
        model: m,
        modelProp: 'budget_type'
      });
      this.content().campaign_type.binding({
        model: m,
        modelProp: 'campaign_type'
      });
      this.content().budget_sum.binding({
        model: m,
        modelProp: 'uninflated_ui_budget_100',
        modelEvent: 'change.lifetime_budget change.daily_budget',
        viewEvent: 'keyup change blur paste'
      });

      dateBinding(this.content().from_date, {
        model: m,
        modelProp: 'adjusted_start_time',
        viewEvent: 'select blur',
        commitChangesViewEvent: 'select',
        timeView: this.content().from_time
      });
      dateBinding(this.content().to_date, {
        model: m,
        modelProp: 'adjusted_end_time',
        viewEvent: 'select blur',
        commitChangesViewEvent: 'select',
        timeView: this.content().to_time
      });
      this.content().status.binding({
        model: m,
        modelProp: 'campaign_status'
      });
      this._prevTimeStop = null;
      this.content().run_continuously
        .checked(+m.end_time() < 1);

      

      this._budgetChange();
    },

    _createDom: function(initArgs) {
      Base.prototype._createDom.call(this, initArgs);
      this.removeClass('adEditor-editor');
      this.addClass('campEditor');
      this.removeClass('pvs');
      this.content({
        camp_errors: { view: 'CampErrors' },

        name_label: 'Name',
        name_input: { view: 'TextInput', addClass: 'campEditor-name' },
        camp_link: { view: 'Text', addClass: 'campEditor-camplink' },

        budget_label: { view: 'Base',
          initArgs: { tagName: 'span'}, text: 'Budget (USD):'},
        budget_sum: { view: 'TextInput', addClass: 'campEditor-num',
          on: { keyup: fun.bindOnce(this._budgetEdit, this) } },
        budget_type: { view: 'Select', options: [
            { text: 'Daily', value: 'd' },
            { text: 'Lifetime', value: 'l' }
        ], on: { change: fun.bindOnce(this._budgetChange, this) } },

        // dso only field
        campaign_type: { view: 'Select', options: [
            { text: 'Classic', value: campConst.CAMP_CLASSIC_TYPE },
            { text: 'Multi-Objective', value: campConst.CAMP_MOO_TYPE }
        ] },

        // imps_based value
        imps_label: { view: 'Text', text: 'Imps:',
          addClass: 'campEditor-impslabel' },
        budget_ui_imps: { view: 'TextInput', addClass: 'campEditor-imps',
          on: { keyup: fun.bindOnce(this._impsEdit, this) } },

        cpm_price: { view: 'Text', addClass: 'campEditor-price' },

        schedule_label: 'Schedule',
        from_date: { view: 'Typeahead', addClass: 'campEditor-date',
          setValueOnSelect: true,
          data: (new DateDataSource())
            .maxResults(3) },
        from_time: { view: 'Typeahead', addClass: 'campEditor-time',
          setValueOnSelect: true,
          data: (new TimeDataSource())
            .maxResults(6) },
        to_date: { view: 'Typeahead', addClass: 'campEditor-date',
          setValueOnSelect: true,
          data: (new DateDataSource())
            .maxResults(3) },
        to_time: { view: 'Typeahead', addClass: 'campEditor-time',
          setValueOnSelect: true,
          data: (new TimeDataSource())
            .maxResults(6) },
        run_continuously: { view: 'Checkbox',
          text: 'Run my campaign continuously starting today',
          on: { click: fun.bindOnce(this._contClick, this) } },

        status_label: 'Status',
        status: { view: 'Select', options: [] },

        at_txt: 'at',
        tz_name_from: { view: 'Text', addClass: 'campEditor-timezone' },
        tz_name_to: { view: 'Text', addClass: 'campEditor-timezone' },

        
        line_number_label: 'Line Number',
        line_number: { view: 'Select', options: ['No IO', 1, 2, 3] },
        inflation_label: 'Inflation (%)',
        inflation: { view: 'TextInput', addClass: 'campEditor-num'}
      });
    },

    _budgetEdit: function(e) {
      if (this.model().isFromTopline()) {
        var topline = this.model().topline();
        if (topline.allow_price_override()) {
          // if the line is a bouns line with no price
          // we do not need to auto calculate its
          // impressions based on the new budget number
          return;
        }

        var num_imps =
          Math.round(1000 * this.content().budget_sum.value() /
            topline.func_price());
        this.content().budget_ui_imps.value(num_imps);

        // allocation changes for all the campaigns
        topline.getCampaigns().forEach(function(c) {
          c.triggerChanges('unallocatedImps');
        });
      }
    },

    _impsEdit: function(e) {
      if (this.model().isFromTopline()) {
        var topline = this.model().topline();
        if (topline.allow_price_override()) {
          // if the line is a bonus line with no price
          // we do not need to auto calculate its
          // budget based on the new impressions number
          this.model().lifetime_imps(this.content().budget_ui_imps.value());
          return;
        }

        var budget =
          this.content().budget_ui_imps.value() /
            1000 * topline.func_price();
        this.content().budget_sum.value(budget);
        this.model().uninflated_ui_budget_100(budget);

        // allocation changes for all the campaigns
        topline.getCampaigns().forEach(function(c) {
          c.triggerChanges('unallocatedImps');
        });
      }
    },

    _budgetChange: function(e) {
      var lifetime = this.content().budget_type.value() === 'l';
      this.content().run_continuously.disabled(lifetime);
      if (lifetime) {
          this.content().run_continuously.checked(false);
      }
      this._budgetEdit(e);
      this._contClick(e);
    },

    _contClick: function(e) {
      var checked = this.content().run_continuously.checked();
      this.content().to_date.disabled(checked);
      this.content().to_time.disabled(checked);
      if (checked) {
          var d = new Date();
          d.setTime(0);
          this.model().end_time(d);
          if (e) {
              this.model().commitChanges('end_time');
          }
      }
    }
});

function dateBinding(c, options) {
  if (utils.prop(c, 'date_binding')) {
      utils.prop(c, 'date_binding').destruct();
  }
  utils.prop(c, 'date_binding', new DateBinding(
      utils.extend({ view: c }, options)));
}

var DateBinding = fun.newClass(BaseBinding, {
  init: function() {
    BaseBinding.apply(this, arguments);
    if (this.model && this.view) {
      this.timeView.addListener(this.viewEvent,
        fun.bindOnce(this.updateModel, this));
    }
  },

  destruct: function() {
    this.timeView.removeListener(this.viewEvent,
        fun.bindOnce(this.updateModel, this));
    BaseBinding.prototype.destruct.apply(this, arguments);
  },

  updateModel: function(e) {
    if (e.type == 'blur') {
      var value = this.viewValue();
      if (value && value.getTime()) { this.viewValue(value); }
    }
    BaseBinding.prototype.updateModel.call(this, e);
  },

  viewValue: function(value) {
    if (value === undefined) {
      return this.view.value() && dateRange.decodeDateAndTime(
          this.view.value() + ' ' + this.timeView.value());
    } else {
      if (value && value.getTime() < 2) { value = null; }
      this.view.value(value ?
        dateRange.formatDate(value) : '');
      this.timeView.value(value ?
        dateRange.formatTime(value) : '');
      return this;
    }
  }
});


exports.CampEditor = CampEditor;

