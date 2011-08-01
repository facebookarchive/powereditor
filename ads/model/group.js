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

var fun = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),

    Observable = require("../../uki-core/observable").Observable,

    muteChanges = require("../../storage/storable").Storable.muteChanges;



var DIFFERENT = { dif: true };

/**
* Base wrapper for multiedit operations
* @class
*/
var Group = fun.newClass(Observable, {
  /**
   * @abstract
   */
  storage: function() { return null; },

  init: function(items) {
    this._items = items;
    this._uncomitted = {};
  },

  errors: function(v) {
    return v === undefined ? [] : this;
  },

  _gatherField: function(name) {
    var d = this._items;
    var prop = this.storage().prop(name);
    var l = d.length;
    var value = prop.getValue(d[0]);

    for (var i = 1; i < l; i++) {
      if (!prop.compare(prop.getValue(d[i]), value)) {
        return DIFFERENT;
      }
    }
    return value;
  },

  revertProp: function(propName) {
    utils.invoke(this._items, 'revertProp', propName);
    return this;
  },

  commitChanges: function(name) {
    if (!this._uncomitted[name]) { return; }

    this._uncomitted[name] = false;
    var value = this[name]();
    if (this['commit_' + name]) {
      this['commit_' + name](value);
    } else {
      this._items.forEach(function(item) {
        item[name](value).commitChanges(name);
      });
    }
  },

  muteChanges: muteChanges
});

Group.DIFFERENT = DIFFERENT;

Group.addProps = function(proto, names) {
  names.forEach(function(name) {
    var propName = '_' + name;
    proto[name] = function(value) {
      if (value === undefined) {
        if (this[propName] === undefined) {
          this[propName] = this._gatherField(name);
        }
        return this[propName] === DIFFERENT ? '' : this[propName];
      }

      var oldValue = this[name](),
      newValue;

      this[propName] = value;
      newValue = this[name]();
      if (oldValue !== newValue && !this.muteChanges()) {
        this._uncomitted[name] = true;
        this.triggerChanges(name);
      }
      return this;
    };
  });
};


exports.Group = Group;
