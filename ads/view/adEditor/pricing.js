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

        this.child('status').binding({ model: m, modelProp: 'adgroup_status' });
        this.child('moo_clicks').binding({ model: m, modelProp: 'moo_clicks' });
        this.child('moo_reach').binding({ model: m, modelProp: 'moo_reach' });
        this.child('moo_social').binding({ model: m, modelProp: 'moo_social' });
    },

    _lockedModelChange: function(e) {
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
        bid_type == bidTypes.BID_TYPE_MULTI ||
          bid_type == bidTypes.BID_TYPE_MULTI_SS);

      ['moo_title', 'moo_clicks', 'moo_reach', 'moo_social']
        .forEach(function(name) {
        dom.toggleClass(
          this._row(this.child(name).dom()),
          'hidden',
          bid_type == bidTypes.BID_TYPE_CPC ||
            bid_type == bidTypes.BID_TYPE_CPM ||
            bid_type == bidTypes.BID_TYPE_FCPM ||
            bid_type == bidTypes.BID_TYPE_MULTI_SS);
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
          } }

        ]});
      this._indexChildViews();

      this._formatter = require("../../lib/formatters").createNumberFormatter(2);
    }
});


exports.Pricing = Pricing;

