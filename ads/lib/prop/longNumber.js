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

    Base = require("./base").Base;

/**
* Excel tends to convert long numbers to 6.0024E+12 which breaks the copy/paste
* To remedy that we convert ids to a:123341231312 which prevents Excel
* from treating them as numbers
*/
var LongNumber = fun.newClass(Base, {

    prefix: 'x:',

    setValue: function(obj, value) {
        obj[this.propName] = value ? value + '' : '';
    },

    getTabSeparated: function(obj) {
        var value = this.getValue(obj);
        return value ? this.prefix + value : '';
    },

    setTabSeparated: function(obj, value, callback) {
        this.setValue(obj, (value + '').replace(/^[^0-9\-]*/, ''));
        callback();
    }
});

var proto = LongNumber.prototype;
proto.getRemoteValue = proto.getDBValue;
proto.setRemoteValue = proto.setDBValue;


exports.LongNumber = LongNumber;
