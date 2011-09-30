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

var fun = require("../../uki-core/function"),

    Base = require("./base").Base;


/**
 * Store dates as timestamps. Convert them to date objects on
 * read.
 */
var Timestamp = fun.newClass(Base, {

  getDBValue: Base.prototype.getValue,

  setDBValue: Base.prototype.setValue,

  getRemoteValue: Base.prototype.getValue,

  setRemoteValue: Base.prototype.setValue,

  /**
   * @return Date
   */
  getValue: function(obj) {
    var value = Base.prototype.getValue.call(this, obj) * 1;
    if (!value) {
      return '';
    }
    var d = new Date();
    d.setTime(value * 1000);
    return d;
  },

  /**
   * @param {Storable} obj
   * @param {Date} value
   */
  setValue: function(obj, value) {
    value = value ? Math.floor(value.getTime() / 1000) + '' : '';
    if (!value * 1) { value = ''; }
    return Base.prototype.setValue.call(this, obj, value * 1);
  },

  compare: function(a, b) {
    a = a && a.getTime() || 0;
    b = b && b.getTime() || 0;
    return Math.abs(a - b) <= 1000;
  },

  compareDB: function(a, b) {
    return Math.abs(a*1 - b*1) <= 1;
  }
});


exports.Timestamp = Timestamp;
