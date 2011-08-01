/**
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
