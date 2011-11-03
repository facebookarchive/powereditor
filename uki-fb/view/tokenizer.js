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
requireCss("./tokenizer/tokenizer.css");
requireCss("./tokenizer/inline_tokenizer.css");

var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    evt   = require("../../uki-core/event"),
    view  = require("../../uki-core/view"),
    dom   = require("../../uki-core/dom"),
    build = require("../../uki-core/builder").build,

    Container = require("../../uki-core/view/container").Container,

    Button = require("./button").Button,
    Binding   = require("../binding").Binding,
    Dialog    = require("./dialog").Dialog,
    DialogHeader  = require("./dialog").DialogHeader,
    DialogContent = require("./dialog").DialogContent,
    DialogBody    = require("./dialog").DialogBody,
    DialogFooter  = require("./dialog").DialogFooter,
    Typeahead = require("./typeahead").Typeahead,
    Token     = require("./tokenizer/token").Token,
    Text = require("./text").Text;


/**
* @class Tokenizer
*/
var Tokenizer = view.newClass('fb.Tokenizer', Container, {}),
    proto = Tokenizer.prototype;

fun.addProps(proto, ['freeform', 'canPaste', 'maxTokens',
  'value2info', 'info2value', 'validateTokens']);

fun.delegateProp(proto, [
  'data', 'disabled', 'selectedText',
  'queryThrottle', 'renderer', 'autoSelect',
  'selectedResult', 'selectedIndex', 'id',
  'focus', 'blur', 'hasFocus'
], '_typeahead');

fun.addProp(proto, 'placeholder', function(v) {
  this._placeholder = v;
  this._updatePlaceholder();
});

fun.addProp(proto, 'inline', function(v) {
  this._inline = v;
  this.toggleClass('ufb-tokenizer_inline', v);
  if (v) {
    this.dom().insertBefore(this._tokenArea, this.dom().firstChild);
  } else {
    this.dom().appendChild(this._tokenArea);
  }
});

fun.addProp(proto, 'binding', function(val) {
  if (this._binding) {
    this._binding.destruct();
  }
  this._binding = val && new Binding(
    utils.extend({
      view: this,
      model: val.model,
      viewEvent: 'blur change'
    }, val));
});

proto.value = function(v) {
  if (v === undefined) {
    return utils.pluck(this.childViews(), 'info').map(this.info2value());
  }
  var views = [];
  (v || []).forEach(function(id) {
    var info = this.value2info()(id);
    if (info) {
      views.push({ view: Token, info: info });
    }
  }, this);
  this.childViews(views);
  return this;
};

proto.domForEvent = function(name) {
  if (' blur focus copy paste keydown keyup keypress'.indexOf(name) > -1) {
    return this._typeahead.domForEvent(name);
  }
  return this.dom();
};


/* Protected */
proto._inline = false;
proto._maxTokens = false;
proto._freeform = false;
proto._canPaste = false;

proto._value2info = function(v) {
  return { id: v, text: v };
};

proto._info2value = function(i) {
  return i.id;
};

/**
 * Triggers an event with type 'tokensValidated' and field tokens that holds
 * two arrays: 'validated' (defaults to all tokens) and 'invalidated'
 * (defaults to empty).
 *
 * @param tokens to validate
 * @return true to show a validation dialog
 *        false to not show a validation dialog
 */
proto._validateTokens = function(tokensToValidate) {
  var tokens = { validated: tokensToValidate, invalidated: [] };
  this.trigger({ type: 'tokensValidated', tokens: tokens });
  return false;
};

proto._createDom = function() {
  this._tokenArea =
  dom.createElement('div', { className: "ufb-tokenizer-tokenarea" });

  this._typeahead = build({
    view: Typeahead, setValueOnSelect: false,
    resetOnSelect: true, parent: this })[0];

  this._dom = dom.createElement(
    'div',
    { className: 'clearfix ufb-tokenizer ufb-tokenizer_empty' },
  [this._typeahead.dom(), this._tokenArea]);

  // validation dialog for inputting multiple tokens via paste
  this._validateDialog = build({ view: Dialog, childViews: [
    { view: DialogHeader, html: tx('ads:pe:validate-tokenizer-header') },
    { view: DialogContent, childViews: [
      { view: DialogBody, childViews: [
        { view: Text, text: tx('ads:pe:validate-tokenizer') }
      ]},
      { view: DialogFooter, childViews: [
        { view: Button, label: tx('ads:pe:validate-dismiss'),
          use: 'confirm', disabled: true, as: 'dismiss',
          on: { click: fun.bindOnce(function() {
            this._validateDialog.visible(false);
          }, this) } }
      ]}
    ]}
  ]});

  this._initEvents();
};

proto._initEvents = function() {
  this._typeahead.on('select', fun.bind(this._select, this));
  evt.on(this._tokenArea, 'click', fun.bind(this._areaClick, this));

  this.on('blur', this._blur, this);
  this.on('keydown', this._keydown, this);
  this.on('paste', this._paste, this);
  this.on('click', this.focus);
  this.on('tokensValidated', this._commitTokens, this);
};

proto._blur = function(e) {
  if (this._typeahead.selecting()) { return; }
  if (this.freeform()) {
    this._commitFreeform();
  } else {
    this._typeahead.reset();
  }
};

proto._select = function() {
  var selected = this.selectedResult();
  if (selected && 'id' in selected) {
    this._updateInput();
    build({ view: Token, info: selected }).appendTo(this);
    this.trigger({type: 'change'});
  }
};

proto._areaClick = function(e) {
  var view = e.targetView();
  if (view && view.parent() == this && view.isClickOnRemove(e)) {
    this.removeChild(view);
    this.trigger({type: 'change'});
    this._updateInput();
  }
};

proto._keydown = function(e) {
  var code = e.which;
  if (this.freeform() && (code == 188 /*,*/ || code == 13 /*return*/)) {
    if (this.selectedResult()) {
      this._typeahead.select();
    } else {
      if (this.freeform()) {
        this._commitFreeform();
      }
    }
    e.stopPropagation();
    e.preventDefault();
  }

  if (this.inline() && code == 8 /* backspace */ &&
  !this._typeahead.value()) {
    if (this.lastChild()) {
      this.removeChild(this.lastChild());
    }
    this.trigger({type: 'change'});
  }

  this._updateInput();
};

proto._paste = function(e) {
  if (this.freeform() || this.canPaste()) {
    fun.deferOnce(this._commitFreeform, this);
  }
  this._updateInput();
};


proto._commitFreeform = function() {
  if (this._checkFreeform()) {
    var val = this._typeahead.value().trim();
    var regexp = this.freeform().split;
    if (!regexp) { regexp = /\s*[,;]\s*/; }
    var tokens = val.split(regexp);
    if (this._validateTokens(tokens)) { // triggers commitTokens
      var VALIDATE_TIME = 5000; // time to wait before allowing dismiss
      this._validateDialog.view('dismiss').disabled(true);
      this._validateDialog.visible(true);
      setTimeout(fun.bind(function() {
        this._validateDialog.view('dismiss').disabled(false);
      }, this), VALIDATE_TIME);
    }
    return true;
  }
};

proto._commitTokens = function(e) {
  this._validateDialog.visible(false);
  tokens = e.tokens.validated;
  tokens.forEach(function(token) {
    if (!token) { return; }
    build({ view: Token, info: {id: token, text: token} }).appendTo(this);
  }, this);
  this._typeahead.reset();
  this.trigger({ type: 'change' });
};

proto._checkFreeform = function() {
  var val = this._typeahead.value().trim();
  return val && (!this.freeform().test || this.freeform().test(val));
};

proto._hasMaxTokens = function() {
  return this.maxTokens() && this.maxTokens() <= this.childViews().length;
};

proto.appendChild = function(child) {
  if (this._hasMaxTokens()) { return this; }
  if (this.data().exclusions().indexOf(child.value()) !== -1) {
    return this;
  }
  Container.prototype.appendChild.call(this, child);
  fun.deferOnce(fun.bindOnce(this._updateTokenarea, this));
  return this;
};

proto._appendChildToDom = function(child) {
  this._tokenArea.appendChild(child.dom());
};

proto.removeChild = function(child) {
  Container.prototype.removeChild.call(this, child);
  fun.deferOnce(fun.bindOnce(this._updateTokenarea, this));
  return this;
};

proto.childViews = function(v) {
  if (v !== undefined) {
    Container.prototype.childViews.call(this, []);
    // force exclusions clean
    this.data().exclusions([]);
  }
  return Container.prototype.childViews.call(this, v);
};

proto._updatePlaceholder = function() {
  this._typeahead.placeholder(
    !this.inline() || this.childViews().length === 0 ? this._placeholder : '');
};

proto._updateInput = function(redraw) {
  var ta = this._typeahead,
      l = this.childViews().length;
  fun.defer(function() {
    ta.size(ta.value().length || (l === 0 ? 10 : 1));
  }, 20);
};

proto._updateTokenarea = function() {
  this._typeahead
    .visible(!this._hasMaxTokens())
    .disabled(this._hasMaxTokens());
  dom.toggleClass(
    this._tokenArea,
    'hidden_elem',
    this.childViews().length === 0);
  this.toggleClass(
    'ufb-tokenizer_empty',
    this.childViews().length === 0);
  this.data()
    .exclusions(utils.unique(utils.pluck(this.childViews(), 'value')));
  this._updatePlaceholder();
  this._updateInput();
};


exports.Tokenizer = Tokenizer;
