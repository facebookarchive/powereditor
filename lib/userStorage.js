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

var fun = require("../uki-core/function");

var UserStorage = fun.newClass({
  init: function(uid, project) {
    this.uid = uid || '';
    this.project = project || '';
    this.storage = global.localStorage;
  },

  // local storage API
  setItem: function(key, value) {
    this.setString(key, JSON.stringify(value));
  },

  getItem: function(key) {
    var value = this.getString(key);
    return value && JSON.parse(value);
  },

  deleteItem: function(key) {
    delete this.storage[this._buildKey(key)];
  },

  // raw string API
  setString: function(key, value) {
    this.storage[this._buildKey(key)] = value;
  },

  getString: function(key) {
    return this.storage[this._buildKey(key)];
  },

  _buildKey: function(key) {
    return [this.uid, this.project, key].join(':');
  },

  // clean up the current user storage for this project
  // hard_drop will delete all the keys
  cleanup: function(hard_drop) {
    hard_drop = hard_drop || false;
    var prefix = [this.uid, this.project].join(':');
    for (key in this.storage) {
      if (!key || this.storage[key] === undefined ||
        !this.storage.hasOwnProperty(key)) {
        continue;
      }
      if (!hard_drop && !key.match(prefix)) {
        continue;
      }
      delete this.storage[key];
    }
  }
});


exports.UserStorage = UserStorage;
