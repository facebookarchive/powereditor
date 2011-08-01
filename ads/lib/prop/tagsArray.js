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

var fun = require("../../../uki-core/function"),
    utils = require("../../../uki-core/utils"),

    Base = require("./base").Base;

var TagsArray = fun.newClass(Base, {
  def: [],

  setValue: function(obj, value) {
    if (!utils.isArray(value)) {
      if (value && value.trim()) {
        obj[this.propName] = value.trim().split('\n');
      } else {
        obj[this.propName] = [];
      }
    } else {
      obj[this.propName] = value;
    }
  },

  compare: function(a, b) {
    if (!utils.isArray(a)) {
      if (value && value.trim()) {
        a = value.trim().split('\n');
      }
    }

    if (!utils.isArray(b)) {
      if (value && value.trim()) {
        b = value.trim().split('\n');
      }
    }

    return (a || []).join(',') === (b || []).join(',');
  }
});

TagsArray.prototype.compareDB = TagsArray.prototype.compare;

exports.TagsArray = TagsArray;
