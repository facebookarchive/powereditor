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
var Observable = require("../../uki-core/observable").Observable;


/**
* An async process that might take some time to execute.
* Examples are: downloading, uploading, pasting, importing
*
* var ImportJob = fun.newClass(Job, {
*   start: function() {
*     // Do stuff here. When done call this._complete()
*   }
* })
*
* var job = new ImportJob();
* job
*   .oncomplete(function() { job finished, can move on })
*   .onerror(function() { log error here })
*   .start();
*/
var Job = fun.newClass(Observable, {
  errors: fun.newProp('errors'),
  result: fun.newProp('result'),

  init: function() {
    this.errors([]);
    this.result(false);
  },

  /**
  * @abstract
  */
  start: function() {},

  oncomplete: function(callback) {
    return this.on('complete', callback);
  },

  onerror: function(callback) {
    return this.on('error', callback);
  },

  onprogress: function(callback) {
    return this.on('progress', callback);
  },

  destruct: function() {
    Observable.destruct.call(this);
  },

  _complete: function(result) {
    if (result === undefined) { result = true; }
    this.result(result);
    this.trigger({ type: 'complete', result: result });
  },

  _fail: function(error) {
    error && this._error(error);
    this._complete(false);
  },

  _progress: function(status) {
    this.trigger({ type: 'progress', status: status });
  },

  _error: function(error) {
    this.errors().push(error);
    this.trigger({ type: 'error', error: error });
  },

  _startChild: function(job, callback) {
    var retrigger = fun.bind(this.trigger, this);
    job
      .onerror(retrigger)
      .onprogress(retrigger)
      .oncomplete(callback || fun.bind(this._complete, this))
      .start();
  }
});


exports.Job = Job;
