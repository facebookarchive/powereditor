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
requireCss("./pricing/pricing.css");

var fun = require("../../../uki-core/function");
var dom = require("../../../uki-core/dom");
var view = require("../../../uki-core/view");
var utils = require("../../../uki-core/utils");

var estimateTargetingStats = require("../../lib/estimateTargetingStats");
var Base = require("./base").Base;
var bidTypes = require("../../lib/bidTypes");

var impressionLocation = require("../../lib/impressionLocation");
var controls = require("../controls");

var Pricing = view.newClass('ads.adEditor.Pricing', Base, {

    _template: requireText('pricing/pricing.html'),

    _setupBindings: function(m) {
        this.child('type').binding({
          model: m,
          modelProp: 'bid_type'
        });
        this.child('bid').binding({
          model: m,
          modelProp: 'bid_100',
          modelEvent: 'change.max_bid',
          viewEvent: 'keyup change blur paste'
        });

        this.child('status').binding({ model: m,
          modelProp: 'real_adgroup_status' });
        this.child('moo_clicks').binding({ model: m, modelProp: 'moo_clicks' });
        this.child('moo_reach').binding({ model: m, modelProp: 'moo_reach' });
        this.child('moo_social').binding({ model: m, modelProp: 'moo_social' });

        if (m.isCorporate()) {
          this.child('impression_location').binding({
              model: m,
              modelProp: 'impression_location',
              modelEvent: 'change.impression_control_map',
              commitChangesViewEvent: 'change'
          });

          this.child('impression_control_type').binding({
              model: m,
              modelProp: 'impression_control_type',
              modelEvent: 'change.impression_control_map',
              commitChangesViewEvent: 'change'
          });

          this.child('reach_block_length').binding({
              model: m,
              modelProp: 'reach_block_length',
              modelEvent: 'change.impression_control_map',
              commitChangesViewEvent: 'change'
          });

          this.child('user_impression_limit').binding({
              model: m,
              modelProp: 'user_impression_limit',
              modelEvent: 'change.impression_control_map',
              commitChangesViewEvent: 'change'
          });

          this.child('user_impression_limit_period_unit').binding({
              model: m,
              modelProp: 'user_impression_limit_period_unit',
              modelEvent: 'change.impression_control_map',
              commitChangesViewEvent: 'change'
          });

          this.child('priority').binding({
              model: m,
              modelProp: 'priority'
          });

          this.child('no_show_percentage').binding({
              model: m,
              modelProp: 'no_show_percentage'
          });

          this.child('no_show_offset').binding({
              model: m,
              modelProp: 'no_show_offset'
          });
        }

        ['impression_location', 'priority',
          'impression_control_type',
          'no_show_percentage', 'no_show_offset']
          .forEach(function(name) {
          dom.toggleClass(
            this._row(this.child(name).dom()),
            'hidden',
            !this.model().isCorporate());
        }, this);
    },

    _updateImpressionControl: function(type) {

      // road block - hide the impression limit.
      // reach block - use the reach_block_length field.
      this.child('user_impression_limit').visible(type == '2');
      this.child('user_impression_limit_period_unit').visible(type == '2');
      this.child('user_impression_unit_text').visible(type == '2');
      this.child('reach_block_length').visible(type == '3');
      this.child('impression_text').visible(type == '2' || type == '3');
      if (type == '2' || type == '3') {
        var msg = type == '2' ? 'impressions' : 'impression reach block';
        this.child('impression_text').text(msg);
      }
    },

    _lockedModelChange: function(e) {
      if (!e ||
        e.name == 'impression_control_map' ||
        e.name == 'priority' ||
        e.name == 'impression_control_type' ||
        e.name == 'reach_block_length') {
        if (this.model().impression_control_type &&
            this.model().priority) {
          var type = this.model().impression_control_type() + '';
          if (type == '3') {
            this.model().priority(10000, this);
          } else if (type == '1') {
            this.model().priority(10001, this);
          } else {
            this.model().priority(this.model().priority() < 10000 ?
                this.model().priority() : 0, this);
          }
          this._updateImpressionControl(type);
        }
      }

      if (!this.model() || !this.model().targetingSpec) {
        return;
      }
      var data = estimateTargetingStats.fromCache(
        this.model().account(),
        this.model().targetingSpec());
      if (data) {
        this._estimateCallback(data);
      } else {
        this.child('suggested-price').visible(false);
        this._scheduleReachEstimate();
      }

      var bid_type = this.model().bid_type();

      dom.toggleClass(
        this._row(this.child('bid').dom()),
        'hidden',
        bid_type == bidTypes.BID_TYPE_MULTI_PREMIUM ||
          bid_type == bidTypes.BID_TYPE_MULTI_RELATIVE);

      ['moo_title', 'moo_clicks', 'moo_reach', 'moo_social']
        .forEach(function(name) {
        dom.toggleClass(
          this._row(this.child(name).dom()),
          'hidden',
          bid_type == bidTypes.BID_TYPE_CPC ||
            bid_type == bidTypes.BID_TYPE_CPM ||
            bid_type == bidTypes.BID_TYPE_FCPM ||
            bid_type == bidTypes.BID_TYPE_MULTI_RELATIVE);
      }, this);
    },

    _scheduleReachEstimate: fun.debounce(function() {
      if (!this.model() || !this.model().targetingSpec) {
        return;
      }
      estimateTargetingStats.estimate(
        this.model().account(),
        this.model().targetingSpec(),
        fun.bindOnce(this._estimateCallback, this)
      );
    }, estimateTargetingStats.DEFAULT_DEBOUNCE),

    _estimateCallback: function(data) {
      if (!this.model()) { return; }
      var estimates = data && data.bid_estimations && data.bid_estimations[0];
      var type = this.model().bid_type();
      var prefix = type == bidTypes.BID_TYPE_CPC ? 'cpc' :
                   type == bidTypes.BID_TYPE_CPM ? 'cpm' : '';
      if (estimates && type) {
        var min = estimates[prefix + '_min'];
        var max = estimates[prefix + '_max'];
        if (min && max) {
          var text = 'Suggested Bid: ' + this._formatter(min / 100) +
            ' - ' + this._formatter(max / 100);
          this.child('suggested-price').visible(true).text(text);
        }
      }
    },

    _prepare: function(callback) {
        var transitions = this.model().allowedStatusTransitions();

        this.child('status').options(transitions.map(function(status) {
            return {
                value: status,
                text: require("../../lib/prop/adgroupStatus").STATUS_MAP[status]
            };
        }));
        this.child('type').options(require("../../lib/bidTypes").options(
            
        ));
        callback();

        var curcode = this.model().account().currency();
        this.content().rows[0].label.text('Max Bid (' + curcode + ')');
    },

    _createDom: function(initArgs) {
      Base.prototype._createDom.call(this, initArgs);
      this.addClass('adEditor-pricing');

      var options = [];
      for (var i = 0; i <= 100; i++) {
          options.push({ view: i + '', text: i + '' });
      }

      this.content({ rows: [
        { label: {
            view: 'Base',
            initArgs: { tagName: 'span'},
            text: 'Max Bid (USD):',
            addClass: 'max-bid'
          },
          data: {
            view: 'Container',
            childViews: [
              { view: 'TextInput',
                childName: 'bid',
                addClass: 'pricing-bid' },
              { view: 'Text',
                addClass: 'suggested-price',
                childName: 'suggested-price' }
            ]
          } },
        { label: 'Bid Type',
          data: {
            view: 'Select',
            childName: 'type'
          } },
        { label: 'Status',
          data: {
            view: 'Select',
            options: [],
            childName: 'status'
          } },

        { className: 'intern',
          data: {
          view: 'Text',
          text: 'Objectives',
          addClass: 'mts adEditor-pricing-title',
          childName: 'moo_title' } },

        { label: 'Clicks', className: 'intern',
           data: {
             view: 'TextInput',
             childName: 'moo_clicks',
             addClass: 'adEditor-pricing-objective'
          } },

        { label: 'Reach', className: 'intern',
          data: {
            view: 'TextInput',
            childName: 'moo_reach',
            addClass: 'adEditor-pricing-objective'
          } },

        { label: 'Social Imps', className: 'intern',
          data: {
            view: 'TextInput',
            childName: 'moo_social',
            addClass: 'adEditor-pricing-objective'
          } },
        {
          label: 'Location', className: 'intern',
          labelClassName: 'labelText',
          data: {
            view: controls.RadioGroup,
            horizontal: true,
            childViews: [
              { view: 'Radio', name: 'DSPricing-PlacementType',
                text: 'Ad Space',
                value: impressionLocation.AD_SPACE },
              { view: 'Radio', name: 'DSPricing-PlacementType',
                text: 'Home Page',
                value: impressionLocation.HOME }
            ],
            childName: 'impression_location'
          }
        },
        {
          label: 'Impression Control Type', className: 'intern',
          labelClassName: 'labelText',
          data: { view: 'Container', childViews: [
            { view: controls.RadioGroup, horizontal: true,
              childViews: [
                { view: 'Radio', name: 'DSPricing-ImpControlType',
                  text: 'Per-User Frequency Cap', value: '2' },
                { view: 'Radio', name: 'DSPricing-ImpControlType',
                  text: 'Reach Block', value: '3' },
                { view: 'Radio', name: 'DSPricing-ImpControlType',
                  text: 'Road Block', value: '1' }
              ],
              childName: 'impression_control_type' },

            { view: 'Container',
              addClass: 'DSPricing-impression mts',
              childViews: [
                { view: 'Select', options: options,
                  childName: 'user_impression_limit' },
                { view: 'Select', options: options,
                  childName: 'reach_block_length' },
                 { view: 'Text', html: ' impressions ',
                   childName: 'impression_text' },
                { view: 'Select',
                  childName: 'user_impression_limit_period_unit',
                  options: [
                    { value: 0, text: 'daily' },
                    { value: 1, text: 'monthly' }
                ] },
                { view: 'Text', childName: 'user_impression_unit_text',
                  html: ' per-user frequency cap ' }
            ]}
          ]}
        },
        {
          label: 'Held-Out Set Percentage', className: 'intern',
          data: { view: 'TextInput', childName: 'no_show_percentage',
            addClass: 'DSPricing-input' }
        },
        {
          label: 'Held-Out Set Offset', className: 'intern',
          data: { view: 'TextInput', childName: 'no_show_offset',
            addClass: 'DSPricing-input' },
          optional: '(0-100)'
        },
        {
          label: 'Ad Priority', className: 'intern',
          data: { view: 'TextInput', childName: 'priority',
            addClass: 'DSPricing-input' },
          optional: '[0-9999] 0: self-serve, 10000: reach block'
        }
      ]});
      this._indexChildViews();

      this._formatter = require("../../../lib/formatters").createNumberFormatter(2);
    }
});


exports.Pricing = Pricing;

