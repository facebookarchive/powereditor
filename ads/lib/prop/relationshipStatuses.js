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

    FlatArray = require("./flatArray").FlatArray;


var STATUSES = {
    0: 'All',
    1: 'Single',
    2: 'In a Relationship',
    3: 'Married',
    4: 'Engaged'
};

var REGEXPS = {
    0: /all|any/,
    1: /single/,
    2: /relationship/,
    3: /married/,
    4: /engaged/
};

function toString(item) {
    return STATUSES[item] || STATUSES[0];
}

function fromString(item) {
    var number = 0;
    item = item.trim().toLowerCase();

    utils.forEach(REGEXPS, function(regexp, id) {
        if (item.match(regexp)) {
            number = id * 1;
        }
    });
    return number;
}

var RelationshipStatuses = fun.newClass(FlatArray, {
    def: [0],

    setValue: function(obj, value) {
        if (value) {
            value = value.map(function(x) { return x * 1; });
        }
        FlatArray.prototype.setValue.call(this, obj, value);
    },

    getTabSeparated: function(obj) {
        return this.getValue(obj).map(toString);
    },

    setTabSeparated: function(obj, value, callback) {
        this.setValue(obj, value.split(',').map(fromString));
        callback();
    }
});

RelationshipStatuses.STATUSES = STATUSES;
RelationshipStatuses.REGEXPS  = REGEXPS;


exports.RelationshipStatuses = RelationshipStatuses;
