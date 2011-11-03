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

// this variable stores the last exception thrown
// by "handleException" so that it isn't double-reported.
var lastThrownExceptionMessage = null;

/**
 * filename not used, but required to be an error handler
 */
function handleError(message, filename, lineno) {
  // don't double-log, if this is thrown from "handleException"
  if (lastThrownExceptionMessage &&
      message.indexOf(lastThrownExceptionMessage) !== -1) {
    lastThrownExceptionMessage = null;
    return;
  }

  // default category...
  var category = 'ads_power_editor_uncaught_exception';

  var message_from_flow = getMessageFromFlow();
  var category_from_flow = getCategoryFromFlow();
  if (message_from_flow) {
    message = message_from_flow + message;
  }
  if (category_from_flow) {
    category = category_from_flow;
  }

  report(message, category, lineno);
  if (oldHandler) { return oldHandler(); }
}

function getCategoryFromFlow() {
  var most_recent_flow_name =
    require("../ads/lib/loggingState").getMostRecentFlowName();
  if (most_recent_flow_name) {
    return 'pe:' + most_recent_flow_name.replace(/[^a-zA-Z0-9]/g, '_');
  }
  return null;
}

function getMessageFromFlow() {
  // get global flow information...
  var active_flows = require("../ads/lib/loggingState").getActiveFlows();
  var active_flows_with_args =
    require("../ads/lib/loggingState").getActiveFlowsWithArgs();
  var message = null;
  if (active_flows.length > 0) {
    message = '[' + active_flows.join(', ') + '] - ' +
      JSON.stringify(active_flows_with_args).substring(0, 500);
  }
  return message;
}

function report(message, category) {
  var data = {
    message: message,
    category: category,
    error_type: 'mustfix'
  };

  console && console.debug(data); 
}

function startListening() {
  oldHandler = global.onerror;
  global.onerror = handleError;
}

/**
 * translate the exception into a string, and then report it.
 */
function handleException(e, category /*, other args to print */) {
  var msg = 'Exception: ';
  if (e.message) {
    msg += e.message + '\n';
  }
  var message_from_flow = getMessageFromFlow();
  var most_recent_flow_name =
    require("../ads/lib/loggingState").getMostRecentFlowName();
  if (most_recent_flow_name) {
    msg += 'Flow - ' + most_recent_flow_name + '\n';
  }
  if (message_from_flow) {
    msg = msg +  message_from_flow + '\n';
  }

  if (e.stack) {
    msg += e.stack + '\n';
  }

  var category_from_flow = getCategoryFromFlow();
  if (category_from_flow) {
    category = category + '_' + category_from_flow;
  }

  report(msg, category);
  if (__DEV__) {
    lastThrownExceptionMessage = e.message;
    throw e;
  }
}

exports.handleException = handleException;
exports.report = report;
exports.startListening = startListening;
