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

var fun = require("../../uki-core/function");
var utils = require("../../uki-core/utils");


/**
* Base class for errors. Use a newClass shortcut to
* generate subclasses.
*
* var MissingCampUpdateError = Error.newClass(
*   // code, use + new Date() result to generate a unique error code
*   101,
*   // message function
*   function() { return tx('', this.data()) });
*
* var error = new MissingCampUpdateError({ id: 123123 });
* error.message() // => trying to update campaign (123123) that does not exist
*
*/
var AdError = fun.newClass({
  data: fun.newProp('data'),

  _code: 1,

  init: function(data) {
    this.data(data || {});
  },

  code: function() {
    return this._code;
  },

  message: function() {
    return 'Error';
  }
});

AdError.newClass = function(code, message) {
  return fun.newClass(AdError, {
    _code: code,
    message: message
  });
};


exports.Error = AdError;
