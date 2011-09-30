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
    storage = require("../../storage/storage");

/**
* Contract Model
* @class
*/
var Contract = storage.newStorage({
  init: function() {
    this._children = [];
  },

  displayName: function() {
    if (this.name()) {
      return this.name() + ' (' + this.io_number() + ')';
    }
    return '' + this.io_number();
  },

  children: fun.newProp('children'),

  currency: fun.newDelegateCall('account', 'currency'),
  timezone_name: fun.newDelegateCall('account', 'timezone_name')

});

Contract
  .defaultPropType(props.Base)
  .tableName('contract')
  .remoteMethodName('ads.getAccountContracts');

Contract.addProp({
  name: 'account',
  getValue: function(obj) {
    return require("./account").Account.byId(obj.id());
  }
});

Contract.addProp({
  name: 'id',
  type: props.LongNumber,
  remote: 'account_id',
  indexed: 'TEXT NOT NULL PRIMARY KEY'
});

Contract.addProp({
    name: 'io_number',
    remote: true, db: true
});

Contract.addProp({
  name: 'name',
  getValue: function(obj) {
    return obj.campaign_name();
  }
});

Contract.addProp({
    name: 'campaign_name',
    remote: true, db: true
});

Contract.addProp({
    name: 'status',
    remote: true, db: true
});

Contract.addProp({
    name: 'vertical',
    remote: true, db: true
});

Contract.addProp({
    name: 'subvertical',
    remote: true, db: true
});

Contract.addProp({
    name: 'agency_name',
    remote: true, db: true
});

Contract.addProp({
    name: 'advertiser_name',
    remote: true, db: true
});

Contract.addProp({
    name: 'adops_person_name',
    remote: true, db: true
});

Contract.addProp({
    name: 'salesrep_name',
    remote: true, db: true
});

Contract.addProp({
    name: 'account_mgr_name',
    remote: true, db: true
});

Contract.addProp({
    type: props.Bool,
    name: 'thirdparty_billed',
    remote: true, db: true
});

Contract.addProp({
    type: props.Timestamp,
    name: 'time_created',
    remote: true, db: true
});

Contract.addProp({
    type: props.Timestamp,
    name: 'time_updated',
    remote: true, db: true
});

Contract._map = {};

Contract.byId = function(id) {
  return this._map[id];
};

Contract.prepare = function(callback, force) {
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

exports.Contract = Contract;
