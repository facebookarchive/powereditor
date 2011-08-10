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


var oldHandler;

function handleError(message, filename, lineno) {
  report(message, filename, lineno);
  if (oldHandler) { return oldHandler(); }
}

function report(message, filename, lineno, type) {
  var data = {
    type: type || 'javascript_error',
    message: 'Msg: ' + message + ' | File: ' + filename + ' | Lno:' + lineno,
    js_error_type: 'error',
    fb_dtsg: global.Env && global.Env.fb_dtsg,
    lsd: require("./cookieGetter").getCookie('lsd')
  };
  if (__DEV__) {
    if ((message + '').indexOf('[RETHROW]') === -1) {
      return;
    }
  }
  var req = new XMLHttpRequest();
  req.open('POST', './logger/', true);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.send(require("./urllib").stringify(data));
}

function startListening() {
  oldHandler = global.onerror;
  global.onerror = handleError;
}

function handleException(e, filename) {
  // JSON.stringify extracts most info from Exception
  report(JSON.stringify(e), filename || '', 0, 'javascript_exception');
  if (__DEV__) { throw e; }
}

exports.handleException = handleException;
exports.report = report;
exports.startListening = startListening;
