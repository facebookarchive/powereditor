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


var Dialog = require("../../uki-fb/view/dialog").Dialog;
var activeFlows = {};
var flowStartTimes = {};

function startFlow(name /*, other args to print */) {
  var args = [];
  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
  }
  lastFlow = name;
  activeFlows[name] = args;
  flowStartTimes[name] = +new Date();
}

function endFlow(name) {
  if (activeFlows[name]) {
    delete activeFlows[name];
  }
  if (flowStartTimes[name]) {
    delete flowStartTimes[name];
  }
}

function getMostRecentFlowName() {
  var max = 0;
  var flow = null;
  for (var name in flowStartTimes) {
    if (flowStartTimes[name] > max) {
      max = flowStartTimes[name];
      flow = name;
    }
  }
  return flow;
}

function getActiveFlowsWithArgs() {
  return activeFlows;
}

function getActiveFlows() {
  var as_array = [];
  for (var k in activeFlows) {
    as_array.push(k);
  }
  return as_array;
}

function getLastFlow() {
  return lastFlow;
}

function getMixinForDialog(flow_name) {
  return {visible: function(state) {
      if (state !== undefined && state) {
        startFlow(flow_name);
      } else if (state !== undefined && !state) {
        endFlow(flow_name);
      }
      return Dialog.prototype.visible.call(this, state);
    }};
}

function getMixinForJob(flow_name) {
  return {init: function() {
    startFlow(flow_name);
    this.oncomplete(function() {
      endFlow(flow_name);
      });
      }};
}

exports.getMixinForDialog = getMixinForDialog;
exports.getMixinForJob = getMixinForJob;
exports.getMostRecentFlowName = getMostRecentFlowName;
exports.getActiveFlows = getActiveFlows;
exports.getActiveFlowsWithArgs = getActiveFlowsWithArgs;
exports.startFlow = startFlow;
exports.endFlow = endFlow;
