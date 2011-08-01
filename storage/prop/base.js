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

var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils");


var Base = fun.newClass({
  name: 'name',
  humanName: false,
  db: false,
  def: '',

  init: function(args) {
    utils.extend(this, args);
    this.propName = '_' + this.name;
    if (this.db === true) {
      this.db = this.name;
    }
    if (this.indexed && !this.db) {
      this.db = this.name;
    }
    if (this.remote === true) {
      this.remote = this.name;
    }
  },

  getValue: function(obj) {
    return obj[this.propName] === undefined ?
    this.def : obj[this.propName];
  },

  setValue: function(obj, value) {
    obj[this.propName] = value;
  },

  // remote
  getRemoteValue: function(obj) {
    return this.getValue(obj);
  },

  setRemoteValue: function(obj, value) {
    return this.setValue(obj, value);
  },

  // db storage
  getDBValue: function(obj) {
    return this.getValue(obj);
  },

  setDBValue: function(obj, value) {
    return this.setValue(obj, value);
  },

  // comparations
  compare: function(a, b) {
    return a == b;
  }
});


exports.Base = Base;
