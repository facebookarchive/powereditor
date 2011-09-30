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
 * PIT stands for Precise Interest Targeting
 *
 */
requireCss("./pit/pit.css");

var fun   = require("../../../uki-core/function"),
  view  = require("../../../uki-core/view"),
  dom   = require("../../../uki-core/dom"),
  build = require("../../../uki-core/builder").build,
  utils = require("../../../uki-core/utils"),

  KeywordsGraphAPIDataSource =
    require("../../lib/typeahead/graph/KeywordsGraphAPIDataSource")
    .KeywordsGraphAPIDataSource,
  AdEditorConstants = require("../adEditor/constants"),

  Graphlink  = require("../../../lib/graphlink").Graphlink,
  HTMLLayout = require("../../../uki-fb/view/HTMLLayout").HTMLLayout,
  Binding    = require("../../../uki-fb/binding").Binding,
  Tokenizer  = require("../../../uki-fb/view/tokenizer").Tokenizer,
  Token      = require("../../../uki-fb/view/tokenizer/token").Token;

var pit = view.newClass('ads.control.pit', HTMLLayout, {

  _template: requireText('pit/pit.html'),

  /**
   * Inherited function
   */
  binding: fun.newProp('binding', function(val) {
    if (this._binding) {
      this._binding.destruct();
    }

    this._binding =
      val &&
      new Binding(utils.extend({
        view: this,
        model: val.model,
        viewEvent: 'change.pit',
        commitChangesViewEvent: 'change.pit'
      }, val));
  }),

  /**
   * Inherited function
   */
  value: function(v) {
    var out = Tokenizer.prototype.value.call(this.content().textInput, v);
    if (v === undefined) {
      return out;
    } else {
      this._buildSuggestions();
    }
  },

  /**
   * Inherited function
   */
  _createDom: function(initArgs) {
    HTMLLayout.prototype._createDom.call(this, initArgs);

    this.content({
      textInput: { view: 'Tokenizer', inline: true, id: 'interests',
        addClass: 'textField interests-tokenizer', freeform: false,
        placeholder: tx('ads:pe:pit-placeholder'), canPaste: true,
        value2info: function(id) {
          return { id: id, text: id };
        },
        validateTokens: fun.bind(function(tokens) {
          this._validateKeywords(tokens);
          return true; // show a validation dialog while graphlink searches
        }, this),
        data: (new KeywordsGraphAPIDataSource())
          .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
          .queryData({ type: 'adkeyword' })
      },
      suggestionsHeader: { view: 'Text', text: tx('ads:pe:pit-suggestions'),
        visible: false, addClass: 'pit-header' },
      suggestions: { view: 'Container', init: { tagName: 'table' } },
      refresh: { view: 'Button', label: tx('ads:pe:pit-refresh'),
        visible: false, on: { click: fun.bind(function() {
          this._buildSuggestions();
        }, this) } }
    });

    // Event handling
    this.content().textInput.on('change', fun.bindOnce(function() {
      this.trigger({ type: 'change.pit' });
      this._buildSuggestions();
    }, this));

    this.content().suggestions.addListener('click',
      fun.bindOnce(this._onSuggestionClick, this));
  },


  /**
   * Call Graph API method to get list of validated keywords for tokenizer.
   *
   * @param keywords to validate
   * @return none
   */
  _validateKeywords: function(tokens) {
    tokens.forEach(function(token) {
      token = dom.escapeHTML(token);
    });

    var graphlink = new Graphlink();
    graphlink.querysearch('adkeywordvalid', { keyword_list: tokens },
      fun.bind(function(r) {
        var tokensObj = { validated: [], invalidated: [] };
        r.data.forEach(function(token) {
          token.valid ? tokensObj.validated.push(token.name) :
                      tokensObj.invalidated.push(token.name);
        });

        this.content().textInput.trigger({ type: 'tokensValidated',
          tokens: tokensObj });
          // event needs to be fired from tokenizer in order for the event
          // to be properly handled
      }, this)
    );
  },


  /**
   * Click handling for the suggestions checkboxes
   */
  _onSuggestionClick: function(e) {
    if (e.target.tagName !== 'INPUT') { return; }
    var v = e.targetView();
    if (v.checked()) {
      this._addToken(v.value());
      this.content().refresh.visible(true);
    } else {
      var tokens = this.content().textInput.childViews();
      for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].value().localeCompare(v.value()) === 0) {
          this.content().textInput.removeChild(tokens[i]);

          var numChecked = 0;
          // iterate through row containers, and each table element is a
          // container that holds the checkbox element
          this.content().suggestions.childViews().forEach(function(row) {
            row.childViews().forEach(function(rowElem) {
              if (rowElem.firstChild().checked()) { numChecked++; }
            });
          });

          if (!numChecked) {
            this.content().refresh.visible(false);
          }
          break;
        }
      }
    }

    this.trigger({ type: 'change.pit' });
  },


  /**
   * Add a token to the tokenizer with the given text. Does not apply any
   * changes to the model by itself.
   *
   * @param token text
   * @return none
   */
  _addToken: function(tokenText) {
    build({ view: Token, info: {id: tokenText, text: tokenText} }).appendTo(
      this.content().textInput);
  },

  /**
   * Function that handles building the suggestions and its refresh button.
   * Should be called whenever the suggestions needs to be refreshed to match
   * a new set of keywords (new model, keywords changed, etc.)
   */
  _buildSuggestions: function() {
    this.content().refresh.visible(false);
    this.content().suggestionsHeader.visible(false);
    this.content().suggestions.childViews([]);


    var keywords = this.content().textInput.value().map(function(token) {
      return dom.escapeHTML(token);
    });

    if (!keywords.length) {
      return;
    }

    var SUGGESTION_LIMIT = 15; // # of suggestions displayed
    var ROW_LENGTH = 3; // # of suggestions per row

    this.content().suggestionsHeader.visible(true);
    this.content().suggestions.addClass('pit-suggestions-loading');
    var graphlink = new Graphlink();
    graphlink.querysearch('adkeywordsuggestion',
      { keyword_list: keywords, limit: SUGGESTION_LIMIT },
      fun.bind(function(r) {
        // create suggestions checkbox-table with results

        this.content().suggestions.removeClass('pit-suggestions-loading');
        if (!r || !(this.content().textInput.value().length)) {
          this.content().suggestionsHeader.visible(false);
          this.content().suggestions.childViews([]);

          if (!r) {
            require("../../../lib/errorReport").report(
              'Error with getting keyword suggestions: ' + keywords,
              'pit:buildSuggestions', 0);
          }
          return;
        }
        var rows = []; // table rows for suggestions table
        for (var i = 0; i < r.data.length; i += ROW_LENGTH) {
          var rowElems = [];
          for (var j = 0; j < ROW_LENGTH; j++) {
            if ((i + j) === r.data.length) { break; }
            rowElems.push({ view: 'Container', init: { tagName: 'td' },
              childViews: [ { view: 'Checkbox', text: r.data[i + j].name,
              value: r.data[i + j].name } ] });
          }
          rows.push({ view: 'Container', init: { tagName: 'tr' },
            childViews: rowElems });
        }

        this.content().suggestionsHeader.visible(true);
        this.content().suggestions.childViews(rows);
      }, this)
    );
  }
});



exports.pit = pit;
