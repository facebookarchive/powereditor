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


var fun   = require("../uki-core/function"),
    utils = require("../uki-core/utils"),

    Observable = require("../uki-core/observable").Observable;


/**
 * Support load and store to WebDatabase
 * @extend Observable
 * @mixin
 */
var Storable = utils.extend({}, Observable, {

  muteChanges: function(value) {
    if (value === undefined) {
      return this._originalTriggerChanges &&
      this.triggerChanges !== this._originalTriggerChanges;
    }
    if (!this._originalTriggerChanges) {
      this._originalTriggerChanges = this.triggerChanges;
    }
    this.triggerChanges = value ? fun.FS : this._originalTriggerChanges;
    return this;
  },

  // FB.api result parsing
  fromRemoteObject: function(raw) {
    this.storage().props().forEach(function(prop) {
      if (prop.remote && prop.remote in raw) {
        prop.setRemoteValue(this, raw[prop.remote]);
      }
    }, this);
    return this;
  },

  toRemoteObject: function() {
    var result = {};
    this.storage().props().forEach(function(prop) {
      if (prop.remote) {
        result[prop.remote] = prop.getRemoteValue(this);
      }
    }, this);
    return result;
  },

  // db
  fromDBObject: function(raw) {
    this.storage().props().forEach(function(prop) {
      if (prop.db && prop.db != 'id') {
        prop.setDBValue(this, raw[prop.db]);
      }
    }, this);
    return this;
  },

  toDBObject: function() {
    var result = {};
    this.storage().props().forEach(function(prop) {
      if (prop.db) {
        result[prop.db] = prop.getDBValue(this);
      }
    }, this);
    return result;
  },

  toDBString: function() {
      return JSON.stringify(this.toDBObject());
  },

  fromDBString: function(string) {
      return this.fromDBObject(JSON.parse(string));
  },

  store: function(callback) {
    this.storage().store(this, callback);
    return this;
  },

  remove: function(callback) {
    this.storage().deleteItem(this, callback);
    return this;
  }

});


exports.Storable = Storable;
