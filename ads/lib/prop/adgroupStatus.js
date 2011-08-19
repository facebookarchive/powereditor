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

    rs    = require("../runStatus"),

    Base = require("./base").Base,
    Num  = require("./number").Number;

var STATUS_MAP = {
    1: 'Active',
    3: 'Deleted',
    4: 'Pending',
    5: 'Disapproved',
    8: 'Campaign Paused', // campaign
    9: 'Paused',
    10: 'Draft'
};

var AdgroupStatus = fun.newClass(Num, {
    setTabSeparated: function(obj, value, callback) {
        value = (value + '').toLowerCase();
        var number = 1;

        utils.forEach(STATUS_MAP, function(status, id) {
            if (status.toLowerCase() == value.trim()) {
                number = id;
            }
        });

        this.setValue(obj, number);
        callback();
    },

    getTabSeparated: function(obj) {
        var value = this.getValue(obj);
        return STATUS_MAP[value] || STATUS_MAP[1];
    }
});


var AdgroupStatusAccessor = fun.newClass(Base, {

    originalName: '',

    getValue: function(obj) {
        return STATUS_MAP[obj[this.originalName]()];
    }
});

var RealAdgroupStatus = fun.newClass(Base, {
  originalName: '',

  getValue: function(obj) {
    return obj.realStatus(obj[this.originalName]());
  },

  setValue: function(obj, value) {
    // status needs to be an int in order for realStatus to work
    value *= 1;
    if (value != this.getValue(obj)) {
      // store into adgroup_status in the format of campaign.original_status
      obj.adgroup_status(obj.realStatus(value,
        obj.campaign() && obj.campaign().original_status()));
    }
  }
});

exports.STATUS_MAP = STATUS_MAP;
exports.AdgroupStatus = AdgroupStatus;
exports.AdgroupStatusAccessor = AdgroupStatusAccessor;
exports.RealAdgroupStatus = RealAdgroupStatus;
