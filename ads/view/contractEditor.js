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
requireCss("./contractEditor/contractEditor.css");
requireCss("./adEditor/uiInfoTable.css");


var fun   = require("../../uki-core/function"),
    build = require("../../uki-core/builder").build,
    view  = require("../../uki-core/view"),
    find  = require("../../uki-core/selector").find,
    dom   = require("../../uki-core/dom"),
    env   = require("../../uki-core/env"),
    utils = require("../../uki-core/utils"),
    formatters     = require("../../lib/formatters"),
    List       = require("../../uki-fb/view/list").List,
    HTMLLayout = require("../../uki-fb/view/HTMLLayout").HTMLLayout,
    Binding    = require("../../uki-fb/binding").Binding,
    DemoLinkBuilder = require("../lib/demoLinkBuilder"),
    controls = require("./controls");

var ContractEditor = view.newClass('ads.contractEditor', List, {

    contract: fun.newProp('contract', function(contract) {
      this._contract = contract;

      if (this._contract) {
        find('Text[contract_key]', this).forEach(function(view) {
          if (view.formatter) {
            view.text(view.formatter(this._contract[view.contract_key]()));
          } else {
            view.text(this._contract[view.contract_key]());
          }
        }, this);

        // IO link to OL (will be removed after we deprecated OL)
        var io = this._contract.io_number();
        // io is not from user input, no escaping is needed
        var io_link = '/intern/omegalight/contract.php?io=' + io;
        find('Text[contract_link_io]', this)[0].
          html('<a href=' + io_link + '>' + io + '</a>');

        // account link to ads/manager
        var act = this._contract.id();
        var act_link = '/ads/manage/?act=' + act;
        find('Text[contract_link_act]', this)[0].
          html('<a href=' + act_link + '>' + act + '</a>');

        DemoLinkBuilder.build(act, fun.bind(function(link) {
          find('Text[contract_link_demo]', this)[0].
            html('<a href=' + link + '> Export to CSV </a>');
        }, this));

        // each contract has its own comment widget (based on io-number)
        this._refreshCommentBox(io);
      } else {
        find('Text', this).forEach(function(view) {
          view.text('');
        }, this);

        this._refs.view('comments-container').visible(false);
      }
    }),

    _createDom: function(initArgs) {
        List.prototype._createDom.call(this, initArgs);
        this.horizontal(true).spacing('large');

        this._refs = build([
          { view: 'HTMLLayout',
            template: requireText('contractEditor/contractEditorLeft.html'),
            content: {
            io_name_label: 'Name:',
            io_name: { view: 'Text',  contract_key: 'campaign_name' },
            act_id_label: 'Ad Account:',
            act_id: { view: 'Text',  size: 'large', contract_link_act: 'id' },
            io_number_label: 'IO Number:',
            io_number: { view: 'Text', size: 'large',  contract_link_io:
            'io_number'},
            advertiser_label: 'Advertiser:',
            advertiser: { view: 'Text', size: 'normal',
              contract_key: 'advertiser_name' },
            vertical_label: 'Vertical:',
            vertical: { view: 'Text', size: 'normal',
              contract_key: 'vertical' },
            subvertical_label: 'Subvertical:',
            subvertical: { view: 'Text', size: 'normal',
              contract_key: 'subvertical' },
            mdc_label: 'MDC:',
            mdc: { view: 'Text', size: 'normal',
              contract_key: 'adops_person_name' }
          }},

          { view: 'HTMLLayout',
            template: requireText('contractEditor/contractEditorRight.html'),
            content: {
            agency_label: 'Agency:',
            agency: { view: 'Text',  size: 'normal',
              contract_key: 'agency_name' },

            salesrep_label: 'Sales Rep:',
            salesrep_name: { view: 'Text',  size: 'normal',
              contract_key: 'salesrep_name' },
            actmgr_label: 'Account Manager:',
            actmgr_name: { view: 'Text',  size: 'normal',
              contract_key: 'account_mgr_name' },

            status_label: 'Status:',
            status: { view: 'Text', size: 'normal', contract_key: 'status' },
            currency_label: 'Currency:',
            currency: { view: 'Text',  size: 'normal',
              contract_key: 'currency' },
            timezone_label: 'Timezone:',
            timezone: { view: 'Text',  size: 'normal',
              contract_key: 'timezone_name' },

            demo_link_label: 'Demo Links:',
            demo_link: { view: 'Text',  size: 'normal',
              contract_link_demo: 'Demo Link' },
            third_party_billing_label: 'Third Party Billing:',
            third_party_billing: { view: 'Text',  size: 'normal',
              contract_key: 'thirdparty_billed',
              formatter: formatters.createBooleanFormatter() }
          }},

          { view: 'Container', as: 'comments-container',
            pos: 'l:650px t:-30px h:295px b:0', visible: false
          }

       ]).appendTo(this);

       this._fbcomment =
         build({ view: controls.Comment })[0];

       container = this._refs.view('comments-container');
       container.dom().appendChild(this._fbcomment.dom());
    },

    _refreshCommentBox: function(ioNumber) {

      var comment_url =
        location.origin + location.pathname + 'comment/' + ioNumber;
      var container = this._refs.view('comments-container');
      if (!this._fbcomment) {
        this._fbcomment = build({ view: controls.Comment })[0];
        this._fbcomment.updateHref(comment_url);

        container.dom().appendChild(this._fbcomment.dom());
      } else if (this._fbcomment.href() != comment_url) {
        this._fbcomment.updateHref(comment_url);
      }
      container.visible(true);
    }
});


exports.ContractEditor = ContractEditor;
