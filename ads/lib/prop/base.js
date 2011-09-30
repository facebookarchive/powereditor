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

    StorageBase = require("../../../storage/prop/base").Base;


var TabSeparated = {
  /**
  * Setting is asyncronous. Some fields might need async data fetching
  * for parsing tab separated values. A good example is images.
  * Completions might also eventually become asyncronous
  */
  setTabSeparated: function(obj, value, callback) {
    this.setDBValue(obj, value);
    callback();
  },

  /**
  * Getting is syncronous because we need to be able to syncronously copy
  * rows. Unfortunately there's no async copy in browser so we have to prepare
  * all the data before reading tab separated values. Luckily this is usualy
  * easy to do.
  */
  getTabSeparated: function(obj) {
    return this.getDBValue(obj);
  },

  matchTSHeader: function(header) {
    if (!this.tabSeparated) {
      return false;
    }

    if (!this.tsHeaderIndex) {
      if (!utils.isArray(this.tabSeparated)) {
        this.tabSeparated = [this.tabSeparated];
      }
      this.tsHeaderIndex = this.tabSeparated.map(function(name) {
        return nameHash(name);
      });
    }

    var headerHash = nameHash(header);
    return this.tsHeaderIndex.some(function(tsHash) {
      return tsHash === headerHash;
    });
  }
};

var Base = fun.newClass(StorageBase, TabSeparated, {});

function nameHash(name) {
  return (name + '').toLowerCase().replace(/[^a-z0-9]/g, '');
}


exports.TabSeparated = TabSeparated;
exports.Base = Base;
