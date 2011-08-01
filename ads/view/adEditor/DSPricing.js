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
requireCss("./DSPricing/DSPricing.css");

var fun   = require("../../../uki-core/function"),
    utils = require("../../../uki-core/utils"),
    dom   = require("../../../uki-core/dom"),
    view  = require("../../../uki-core/view"),

    impressionLocation = require("../../lib/impressionLocation"),
    controls = require("../controls"),

    Base = require("./base").Base;


var DSPricing = view.newClass('ads.adEditor.DSPricing', Base, {

    _template: requireText('DSPricing/DSPricing.html'),

    _setupBindings: function(m) {
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

        this.child('url_override').binding({
            model: m,
            modelProp: 'url_override'
        });

        this.child('view_tags').binding({
            model: m,
            modelProp: 'view_tags',
            modelEvent: 'change.view_tags',
            commitChangesViewEvent: 'change'
        });
    },

    _lockedModelChange: function(e) {
      if (!e ||
        e.name == 'impression_control_map' ||
        e.name == 'priority' ||
        e.name == 'impression_control_type') {

        if (this.model().impression_control_type() + '' == '3') {
          this.model().priority(10000, this);
        } else if (this.model().impression_control_type() + '' == '1') {
          this.model().priority(10001, this);
        } else {
          this.model().priority(this.model().priority() < 10000 ?
              this.model().priority() : 0, this);
        }
      }
    },

    _createDom: function(initArgs) {
        Base.prototype._createDom.call(this, initArgs);
        this.addClass('adEditor-DSPricing intern');

        var options = [];
        for (var i = 0; i <= 100; i++) {
            options.push({ view: i + '', text: i + '' });
        }

        this.content({
            rows: [
                {
                    label: 'Location',
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
                    label: 'Impression Control Type',
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
                            { view: 'Text', html: ' impressions ' },
                            { view: 'Select',
                              childName: 'user_impression_limit_period_unit',
                              options: [
                                { value: 0, text: 'daily' },
                                { value: 1, text: 'monthly' }
                            ] },
                            { view: 'Text', html: ' per-user frequency cap ' }
                        ]}
                    ]}
                },
                {
                    label: 'Held-Out Set Percentage',
                    data: { view: 'TextInput', childName: 'no_show_percentage',
                      addClass: 'DSPricing-input' }
                },
                {
                    label: 'Held-Out Set Offset',
                    data: { view: 'TextInput', childName: 'no_show_offset',
                      addClass: 'DSPricing-input' },
                    optional: '(0-100)'
                },
                {
                    label: 'Ad Priority',
                    data: { view: 'TextInput', childName: 'priority',
                      addClass: 'DSPricing-input' },
                    optional: '[0-9999] 0: self-serve, 10000: reach block'
                },
                {
                    label: 'URL Override',
                    data: {
                      view: 'TextInput',
                      addClass: 'DSPricing-long-input',
                      childName: 'url_override'
                    }
                },
                {
                    label: 'View Tags',
                    data: {
                      view: 'TextArea',
                      addClass: 'DSPricing-textarea',
                      rows: 2,
                      childName: 'view_tags'
                    }
                }
            ]
        });
        this._indexChildViews();
    }
});


exports.DSPricing = DSPricing;
