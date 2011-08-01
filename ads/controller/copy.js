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

var view  = require("../../uki-core/view");
var utils = require("../../uki-core/utils");
var fun   = require("../../uki-core/function");
var dom   = require("../../uki-core/dom");
var env   = require("../../uki-core/env");


var _copyDummy = null;
function copyDummy() {
  if (!_copyDummy) {
    _copyDummy = dom.createElement('textarea', {
      style: 'position:absolute;left: -1000px'
    });
    env.doc.body.appendChild(_copyDummy);
  }
  return _copyDummy;
}

var Copy = {
  lastCopy: null,

  handleCopy: function(event, text, sourceId) {
    Copy.lastCopy = {
      text: text,
      sourceId: sourceId
    };

    var activeElement, dummy;

    if (env.ua.match(/Chrome/)) {
      activeElement = env.doc.activeElement;
      dummy = copyDummy();
      dummy.value = text;
      dummy.select();

      fun.defer(fun.bind(activeElement.focus, activeElement), 10);
    } else if (!event.clipboardData) {
      activeElement = env.doc.activeElement;
      dummy = copyDummy();
      dummy.innerHTML = text;

      var sel = global.getSelection();
      sel.removeAllRanges();
      var range = env.doc.createRange();
      range.selectNodeContents(dummy);
      sel.addRange(range);

      fun.defer(fun.bind(activeElement.focus, activeElement), 10);
    } else {
      event.clipboardData.setData('text/plain', data);
      event.preventDefault();
    }
  },

  isInternalPaste: function(text, sourceId) {
    return Copy.lastCopy && Copy.lastCopy.text == text &&
      (!sourceId || Copy.lastCopy.sourceId == sourceId);
  }
};


exports.Copy = Copy;
