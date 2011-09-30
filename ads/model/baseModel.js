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

var fun       = require("../../uki-core/function"),
    utils     = require("../../uki-core/utils"),

    storage   = require("../../storage/storage"),

    libutils  = require("../../lib/utils");

/**
* Base class for all models
* @class
*/
var BaseModel = storage.newStorage({

  isConflicted: function() {
    if (this.conflicts) {
      return libutils.isNotEmpty(this.conflicts());
    }
    return false;
  }

});

// BaseModel
//   .defaultPropType(require("../../storage/prop/base").Base)
//   .resultSetType(ResultSet);

/**
 * Base conflicts property to be used in all editable models
 * format of conflicts: p = conflicted prop, remote = value of remote[prop]
 * { p.name : { prop: p, remote: p.getValue(remote) }}
 * as many conflicts as there are keys in conflicts
 */
BaseModel.addProp({
  name: 'conflicts',
  humanName: 'Conflicts',
  db: true,
  remote: false,
  def: {}
});

exports.BaseModel = BaseModel;
