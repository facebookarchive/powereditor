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

var fun   = require("../../../uki-core/function"),
    utils = require("../../../uki-core/utils"),

    Campaign = require("../campaign").Campaign,
    Base     = require("../group").Group;

/**
* Wraps several campaigns
* @class
*/
var Group = fun.newClass(Base, {
  storage: function() {
    return Campaign;
  },

  commit_campaign_status: function(value) {
    this._items.forEach(function(item) {
      if (item.allowedStatusTransitions().indexOf(value * 1) !== -1) {
        item.campaign_status(value).commitChanges('campaign_status');
      }
    });
  },

  commit_campaign_type: function(value) {
    this._items.forEach(function(item) {
      if (item.isNew()) {
        item.campaign_type(value).commitChanges('campaign_type');
      }
    });
  },

  // true if at least one item is new
  isNew: function() {
    for (var i = 0; i < this._items.length; ++i) {
      if (this._items[i].isNew()) {
        return true;
      }
    }
    return false;
  },

  allowedStatusTransitions: function() {
    if (!this._allowedStatusTransitions) {
      this._allowedStatusTransitions =
      mergeUnique.call(this, 'allowedStatusTransitions');
    }
    return this._allowedStatusTransitions;
  },

  commit_line_number: function(value) {
    this._items.forEach(function(item) {
      if (item.line_numbers().indexOf(value * 1) !== -1) {
        item.line_number(value).commitChanges('line_number');
      }
    });
  },

  line_numbers: function() {
    if (!this._line_numbers) {
      this._line_numbers = mergeUnique.call(this, 'line_numbers');
    }
    return this._line_numbers;
  },

  isFromTopline: function() {
    return false;
  }
});

Base.addProps(Group.prototype, utils.pluck(Campaign.props(), 'name'));

function mergeUnique(prop) {
  var result = [],
  map = {};

  for (var i = 0, d = this._items, l = d.length; i < l; i++) {
    d[i][prop]().forEach(function(value) {
      if (!map[value]) {
        map[value] = true;
        result.push(value);
      }
    });
  }
  return result;
}

exports.Group = Group;
