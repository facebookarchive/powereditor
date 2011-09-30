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


var fun = require("../uki-core/function"),
    utils = require("../uki-core/utils"),
    Observable = require("../uki-core/observable").Observable,

    libutils = require("./utils");

/**
 * Checker for conflicts
 */
var Conflicter = fun.newClass(Observable, {

  checkAll: function(localObjs, remoteObjs) {
    var remoteIdMap = {};
    // build up an id => remoteObj map
    remoteObjs.forEach(function(remoteObj) {
      remoteIdMap[remoteObj.id()] = remoteObj;
    });
    localObjs.forEach(function(localObj) {
      var remoteObj = remoteIdMap[localObj.id()];
      remoteObj && this.check(localObj, remoteObj);
    }, this);
  },

  check: function(local, remote) {
    var original = local.original();
    local.storage().props().forEach(function(p) {
      if (p.trackChanges) {
        // single letter vars are prop values
        var l = p.getValue(local),
            r = p.getValue(remote),
            o = original[p.name];
        var localChanges = !p.compare(l, o),
            remoteChanges = !p.compare(o, r),
            sameChanges = p.compare(l, r);
        if (localChanges && remoteChanges && !sameChanges) {
          // nothing is equal. conflict!
          if (__DEV__) {
            console.log('CONFLICT: l: ' + l + '| r: ' + r + '| o: ' + o);
          }
          addLocalConflict(p, local, remote);
        } else if (localChanges && !remoteChanges) {
          // reapply local changes
          p.setValue(remote, l);
        }
      }
    });
    if (libutils.isNotEmpty(local.conflicts())) {
      // set remote to local => remote is going to get stored
      remote.fromDBObject(local.toDBObject());
      this._onConflict(local, libutils.count(remote.conflicts()));
    }
  },

  _onConflict: function(local, numconflicts) {
    this.trigger({
      type: 'conflict',
      local: local,
      numconflicts: numconflicts
    });
  }

});

// --- Utility functions

/**
 * Add remote prop value to local conflicts tracker
 * since local is going to replace remote
 */
function addLocalConflict(p, local, remote) {
  var conflicts = local.conflicts() || {};
  conflicts[p.name] = {
    prop: p,
    remote: p.getValue(remote)
  };
  local.conflicts(conflicts);
}

exports.Conflicter = Conflicter;
exports.cc = new Conflicter();
