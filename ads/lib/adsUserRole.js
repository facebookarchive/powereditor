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


var account = require("../model/account").Account;

var ROLE_NONE = 1000;
var ROLE_FULL_ADMIN_RIGHTS = 1001;
var ROLE_ADMANGER_USER = 1002;
var ROLE_REPORTS = 1003;
var ROLE_DSO_ADVERTISER = 1004;

var USERROLE_MAP = {
  1000 : 'NONE',
  1001 : 'FULL_ADMIN_RIGHTS',
  1002 : 'ADMANAGER_USER',
  1003 : 'REPORTS',
  1004 : 'DSO_ADVERTISER'
};


var RoleChecker = {
  isDSOAdvertiser: function(act) {
    return ROLE_DSO_ADVERTISER == act.getUserRole();
  },

  isAdmin: function(act) {
    return ROLE_FULL_ADMIN_RIGHTS == act.getUserRole();
  },

  isAdmanagerUser: function(act) {
    return ROLE_ADMANGER_USER == act.getUserRole();
  },

  isReportOnly: function(act) {
    return ROLE_REPORTS == act.getUserRole();
  },

  hasNoAccess: function(act) {
    return ROLE_NONE == act.getUserRole();
  },

  canEditDraft: function(act) {
    if (act.isCorporate()) {
     return this.isDSOAdvertiser(act) || this.isAdmin(act);
    }

    return false;
  },

  canSetAliveDraft: function(act) {
    if (act.isCorporate()) {
      return this.isAdmin(act)
        ;
    }

    return false;
  }
};

exports.RoleChecker = RoleChecker;
exports.USERROLE_MAP = USERROLE_MAP;

exports.ROLE_NONE = ROLE_NONE;
exports.ROLE_FULL_ADMIN_RIGHTS = ROLE_FULL_ADMIN_RIGHTS;
exports.ROLE_ADMANGER_USER = ROLE_ADMANGER_USER;
exports.ROLE_REPORTS = ROLE_REPORTS;
exports.ROLE_DSO_ADVERTISER = ROLE_DSO_ADVERTISER;
