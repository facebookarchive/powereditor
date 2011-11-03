/**
* Copyright (c) 2011, Facebook, Inc.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
*   * Redistributions of source code must retain the above copyright notice,
*     this list of conditions and the following disclaimer.
*   * Redistributions in binary form must reproduce the above copyright notice,
*     this list of conditions and the following disclaimer in the documentation
*     and/or other materials provided with the distribution.
*   * Neither the name Facebook nor the names of its contributors may be used to
*     endorse or promote products derived from this software without specific
*     prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
* AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*
*/


var fun = require("../../uki-core/function");


var ParallelForEach = fun.newClass({
  init: function(items, iterator_callback, final_callback) {
    this._items = items;
    this._nConcurrency = 1;
    this._iteratorCallback = iterator_callback;
    this._finalCallback = final_callback;
    this._nStarted = 0;
    this._nFinished = 0;
    this._nItems = items.length;
    this._timeoutLimit = 60000; // default limit - 60 seconds
    this._timeoutHandler = null;
  },

  setTimeoutLimit: function(ms) {
    this._timeoutLimit = ms;
    return this;
  },

  setTimeoutHandler: function(f) {
    this._timeoutHandler = f;
    return this;
  },

  setContext: function(context) {
    this._context = context;
    return this;
  },

  setExceptionHandler: function(handle_exception) {
    this._handleException = handle_exception;
    return this;
  },

  setConcurrency: function(n_concurrency) {
    this._nConcurrency = n_concurrency;
    return this;
  },

  run: function() {
    // if the number of items is zero, finish immediately.
    if (this._nItems === 0) {
      this._finalCallback.call(this._context || null);
      return;
    }
    var depth = 0;
    while (this._nStarted - this._nFinished < this._nConcurrency &&
        this._nStarted < this._nItems) {
      this._startNextItem(depth);
    }
  },

  _startNextItem: function(depth) {
    // we must return early if we have finished starting all of the
    // tasks.
    if (this._nStarted >= this._nItems) {
      return;
    }

    // we must choose the item before we increment this._nStarted.
    var current_index = this._nStarted;
    this._nStarted++;
    var item = this._items[current_index];
    if (depth && depth % 30 === 0) {
      setTimeout(
        fun.bind(this._callIteratorCallback,
          this, item, current_index, 0), 1);
    } else {
      this._callIteratorCallback(item, current_index, depth);
    }
  },

  _callIteratorCallback: function(item, i, depth) {
    var timeout_watcher = null;
    if (this._timeoutHandler) {
      setTimeout(this._timeoutHandler, this._timeoutLimit);
    }
    try {
      this._iteratorCallback.call(
        this._context || null, item, i,
        fun.bind(this._finishItem, this, depth, timeout_watcher));
    } catch (e) {
      if (this._handleException) {
        this._handleException(e);
        this._finishItem(depth, timeout_watcher);
      } else {
        throw e;
      }
    }
  },

  _finishItem: function(depth, timeout_watcher) {
    if (timeout_watcher) {
      clearTimeout(timeout_watcher);
    }
    this._nFinished++;
    if (this._nFinished < this._nItems) {
      this._startNextItem(depth + 1);
    } else if (this._nFinished == this._nItems) {
      this._finalCallback.call(this._context || null);
    }
  }
});

/**
 * Iterates over a collection of async items. Will call iteratorCallback
 * with item as a parameter. When async action for item is completed
 * iteratorCallback should call the last parameter so next item will be
 * processed.
 *
 * @example
 *   async.forEach(
 *     ads,
 *     function(ad, index, callback) {
 *       // store ad, when finished notify forEach by calling callback
 *       ad.store(callback);
 *     },
 *     function() {
 *       // all ads are stored, continue
 *     });
 **/
var forEach = function(items, iterator_callback, final_callback, context) {
  var obj = new ParallelForEach(items, iterator_callback, final_callback);
  obj.setConcurrency(1)
    .setContext(context)
    .setExceptionHandler(handleException)
    .run();
};

exports.forEach = forEach;
exports.ParallelForEach = ParallelForEach;
