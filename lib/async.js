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
*/
exports.forEach = function(items, iteratorCallback, callback, context) {
  var i = -1;
  function iterator() {
    if (++i < items.length) {
      if (i && i % 30 === 0) {
        // limit stack depth
        setTimeout(function() {
          iteratorCallback.call(context || null, items[i], i, iterator);
        }, 1);
      } else {
        iteratorCallback.call(context || null, items[i], i, iterator);
      }
    } else {
      if (i === items.length) {
        callback.call(context || null);
      }
      if (__DEV__) {
        if (i > items.length) {
          throw new Error('Trying to call iteratorCallback too many times');
        }
      }
    }
  }
  iterator();
};
