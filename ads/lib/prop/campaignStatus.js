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

    Base = require("./base").Base,
    Num = require("./number").Number;


var STATUS_MAP = {
    1: 'Active',
    2: 'Paused',
    3: 'Deleted',
    10: 'Draft'
};

var CampaignStatus = fun.newClass(Num, {
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
        return STATUS_MAP[value] || STATUS_MAP[98];
    }
});


var CampaignStatusAccessor = fun.newClass(Base, {

    originalName: '',

    getValue: function(obj) {
        return STATUS_MAP[obj[this.originalName]()];
    }
});


exports.STATUS_MAP             = STATUS_MAP;
exports.CampaignStatus         = CampaignStatus;
exports.CampaignStatusAccessor = CampaignStatusAccessor;
