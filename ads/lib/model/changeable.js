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


/**
* Support change tracking by saving original state
* @mixin
*/
var Changeable = {
  initChangeable: function() {
    var orig = {};
    this.storage().props().forEach(function(p) {
      if (p.trackChanges) {
        orig[p.name] = p.getDBValue(this);
      }
    }, this);
    this.original(orig);
    return this;
  },

  revertProp: function(propName) {
    var orig = this.original();
    var p = this.storage().prop(propName);
    if (p.trackChanges) {
      p.setDBValue(this, orig[p.name]);
      this.triggerChanges(p.name);
    }
    return this;
  },

  revertChanges: function() {
    var orig = this.original();
    this.storage().props().forEach(function(p) {
      if (p.trackChanges) {
        p.setDBValue(this, orig[p.name]);
        this.triggerChanges(p.name);
      }
    }, this);
    return this;
  },

  isChangeable: function(name) {
    return this.storage().prop(name).trackChanges;
  },

  isChanged: function(name) {
    if (!this.original()) {
      return false;
    }

    // check specific prop
    if (name) {
      if (this.original()[name] === undefined) {
        return false;
      }
      var prop = this.storage().prop(name);
      var a = prop.getDBValue(this);
      var b = this.original()[name];

      return prop.compareDB ? !prop.compareDB(a, b) : a != b;
    }

    // check any prop
    var props = this.storage().props();
    var l = props.length;
    for (var i = 0, p; i < l; i++) {
      p = props[i];
      if (p.trackChanges && this.isChanged(p.name)) {
        global.console && console.log(p.name);
        return p.name;
      }
    }
    return false;
  }
};

var tmp = {};


exports.Changeable = Changeable;
