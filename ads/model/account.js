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


var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),

    props = require("../lib/props"),
    userRole = require("../lib/adsUserRole"),
    libUtils = require("../../lib/utils"),

    Changeable = require("../lib/model/changeable").Changeable,

    storage = require("../../storage/storage"),
    pathUtils = require("../../lib/pathUtils");


/**
* Account Model
* @class
*/
var Account = storage.newStorage(Changeable, {
  init: function() {
    this._children = [];
  },

  isCorporate: function() {
    return this.capabilities() && this.capabilities().length == 1 &&
      this.capabilities()[0] == 1;
  },

  hasContract: function() {
    return this.isCorporate() && this.io_number() > 0;
  },

  displayName: function() {
    if (this.name()) {
      return this.name() + ' (' + this.id() + ')';
    }
    return '' + this.id();
  },

  getUserRole: function() {
    var cur_uid = require("../controller/app").App.userStorage().uid;
    if (this.user_perm_map()) {
      var obj = this.user_perm_map().filter(function(obj) {
        return obj.uid == cur_uid;
      });

      if (obj.length === 0) {
        return userRole.ROLE_NONE;
      } else if (obj.length == 1) {
        return obj[0].role;
      } else {
        // My linter would not let this go. :)
        return userRole.ROLE_NONE;
      }
    } else {
      return userRole.ROLE_NONE;
    }
  },

  children: fun.newProp('children'),

  // loop thru the children of the account (camps) to
  // check if the account has been changed.
  isChanged: function() {
    var items = this.children();
    for (var i = 0; i < items.length; i++) {
      var c = items[i];
      if (c.isChanged()) {
        return true;
      }
    }

    return false;
  },

  isNew: function() {
    // TODO: allow to create new account later.
    return this.id() < 0;
  },

  removeSelf: function(callback) {
    storage.Storable.remove.call(this, callback);
  },

  remove: function(callback) {
    Account.dropAccounts([this], callback);
  }
});

Account
  .defaultPropType(props.Base)
  .tableName('account');

Account.addProp({
  type: props.LongNumber,
  name: 'id',
  remote: 'account_id',
  indexed: 'TEXT NOT NULL PRIMARY KEY'
});

Account.addProp({
  name: 'user_perm_map',
  remote: 'users',
  db: true
});

Account.addProp({
  name: 'status',
  remote: 'account_status',
  db: true
});

Account.addProp({
  name: 'currency',
  remote: true, db: true
});

Account.addProp({
  name: 'daily_spend_limit',
  remote: true, db: true
});

Account.addProp({
  name: 'name',
  remote: true, db: true
});

Account.addProp({
  name: 'timezone_id',
  remote: true, db: true
});

Account.addProp({
  name: 'timezone_name',
  def: 'Pacific Time',
  remote: true, db: true
});

Account.addProp({
  name: 'timezone_offsets',
  remote: true, db: true
});

Account.addProp({
  name: 'capabilities',
  remote: true, db: true
});



// --- Syncing with Graph API stuff ---

Account.loadFromIds = function(account_ids, callback) {
  if (!account_ids || !account_ids.length) {
    var path = pathUtils.join('/me', '/adaccounts');
    Account.fetchAndStoreEdges(path, callback);
  } else {
    var paths = libUtils.wrapArray(account_ids).map(
      function(account_id) {
        return pathUtils.join('act_' + account_id);
      }
    );
    Account.fetchAndStoreObjects(paths, callback);
  }
};

// --- END Syncing with Graph API stuff ---

Account._map = {};

Account.byId = function(id) {
  return this._map[id];
};

Account.cached = function() {
  return this._cache && this._cache.length;
};

Account.prepare = function(callback, force) {
  if (!force && this._cache) {
    callback(this._cache);
    return;
  }
  this.findAll(fun.bind(function(objects) {
    this._cache = objects;
    this._map = {};
    objects.forEach(function(o) {
      this._map[o.id()] = o;
    }, this);
    callback(this._cache);
  }, this));
};

Account.hasCorpAct = function(accounts) {
  var acts = accounts || this._cache;
  if (acts) {
    for (var i = 0, l = acts.length; i < l; i++) {
      if (acts[i].isCorporate()) {
        return true;
      }
    }
  }

  return false;
};

Account.hasChangedAct = function(accounts) {
  var acts = accounts || this._cache;
  if (acts) {
    for (var i = 0, l = acts.length; i < l; i++) {
      if (acts[i].isChanged()) {
        return true;
      }
    }
  }

  return false;
};

/**
 * removing data associated with accounts being dropped
 */
Account.dropAccounts = function(accounts, callback) {
  // clean up all previous contracts/toplines
  var account_ids = utils.pluck(accounts, 'id');
  require("./topline").Topline.deleteBy(
    'account_id',
    account_ids,
    function() {
      require("./contract").Contract.deleteBy(
        'id',
        account_ids,
        function() {
      });
  });

  // clean up all previous campaigns/ads
  require("./ad").Ad.deleteBy(
    'account_id',
    account_ids,
    function() {
      require("./campaign").Campaign.deleteBy(
        'account_id',
        account_ids,
        function() {
          // clean up all previous contracts and toplines
          Account.deleteBy(
            'id',
            account_ids,
            function() {
              callback(null);
          });
      });
  });
};

exports.Account = Account;
