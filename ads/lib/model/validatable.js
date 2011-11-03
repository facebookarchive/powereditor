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

var utils = require("../../../uki-core/utils");

/**
* Support for per prop and full model validations
* @mixin
*/
var Validatable = {
  validate: function(name) {
    var prop = this.storage().prop(name);

    var error = false;
    var humanName = prop.humanName || prop.tabSeparated || prop.name;
    if (prop.validate) {
      error = prop.validate(this);
    } else if (prop.required) {
      error = !prop.getValue(this);
      this.toggleError(error, prop.name, humanName + ' required');
    }
    return error;
  },

  validateAll: function() {
    this._suppressErrorEvents = true;
    this._errorsChanged = false;
    this.storage().props().forEach(function(p) {
      this.validate(p.name, false);
    }, this);
    this._suppressErrorEvents = false;
    if (this._errorsChanged) {
      this.errors(utils.extend({}, this.errors())).commitChanges('errors');
    }
    return this;
  },

  toggleError: function(state, key, message) {
    var e = this._errors = this._errors || { count: 0 },
    changed = true;

    if (state && !e[key]) {
      e[key] = message;
      e.count++;
    } else if (!state && e[key]) {
      delete e[key];
      e.count--;
      e.count = Math.max(0, e.count); // sanity check
    } else if (state && e[key] && e[key] !== message) {
      e[key] = message;
    } else {
      changed = false;
    }
    if (changed) {
      if (this._suppressErrorEvents) {
        this._errorsChanged = true;
        this._errors = e;
      } else {
        // force trigger
        this.errors(utils.extend({}, e)).commitChanges('errors');
      }
    }
  },

  isValid: function() {
    return !this.errors() || !this.errors().count;
  },

  errorsFor: function(name) {
    return this.errors() && this.errors()[name];
  },

  hasErrors: function() {
    return !this.isValid();
  }

};


exports.Validatable = Validatable;
