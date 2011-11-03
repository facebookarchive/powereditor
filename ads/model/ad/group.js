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

    Ad   = require("../ad").Ad,
    Base = require("../group").Group;

/**
* Wrapps sevaral Ads. Proxies property access to individual Ads
* @class
*/
var Group = fun.newClass(Base, {
  storage: function() {
    return Ad;
  },

  /**
  * Handle adgroup_status specially since we want to change status
  * only to one of the allowes statuses
  */
  commit_real_adgroup_status: function(value) {
    this._items.forEach(function(item) {
      if (item.allowedStatusTransitions().indexOf(value * 1) !== -1) {
        item.real_adgroup_status(value).commitChanges('adgroup_status');
      }
    });
  },

  /**
  * Get the superset of all allowed statuses
  */
  allowedStatusTransitions: function() {
    if (!this._allowedStatusTransitions) {
      var result = [],
      map = {};

      for (var i = 0, d = this._items, l = d.length; i < l; i++) {
        d[i].allowedStatusTransitions().forEach(function(status) {
          if (!map[status]) {
            map[status] = true;
            result.push(status);
          }
        });
      }
      this._allowedStatusTransitions = result;
    }
    return this._allowedStatusTransitions;
  },

  isRelatedFanPageSupported: function() {
    for (var i = 0; i < this._items.length; i++) {
      if (!this._items[i].isRelatedFanPageSupported()) {
        return false;
      }
    }
    return true;
  }

});

// proxy all props
Base.addProps(Group.prototype, utils.pluck(Ad.props(), 'name'));

['related_fan_page_wanted', 'related_fan_page_id'].forEach(
  fun.bind(function(name) {
    this['_untracked_' + name] = this[name];
    this[name] = function(value) {
      var ret = this['_untracked_' + name](value);
      if (value !== undefined) {
        this.commitChanges(name);
      }
      return ret;
    };
  }, Group.prototype));


exports.Group = Group;
