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

    storage = require("../../storage/storage"),
    rs = require("../lib/runStatus"),
    pathUtils = require("../../lib/pathUtils"),

    FB            = require("../../lib/connect").FB,
    libUtils       = require("../../lib/utils"),
    Changeable    = require("../lib/model/changeable").Changeable,
    Validatable   = require("../lib/model/validatable").Validatable,
    TabSeparated  = require("../lib/model/tabSeparated").TabSeparated,

    AdCreative = require("./adCreative").AdCreative,
    AdTargeting = require("./adCreative").AdTargeting;

/**
* Property mapping, conversions and validations for AdGroup
* @class
*/
var Ad = storage.newStorage(TabSeparated, Changeable, Validatable, {

  _tabSeparatedGetHeaders: function(options) {
    var ad_headers = TabSeparated._tabSeparatedGetHeaders.call(this, options);
    var stat = this.stat();
    if (stat) {
      var stat_headers =
        TabSeparated._tabSeparatedGetHeaders.call(stat, options);
      ad_headers = ad_headers.concat(stat_headers);
    }
    return ad_headers;
  },

  _tabSeparatedExportAsArray: function(options) {
    var ad_data = TabSeparated._tabSeparatedExportAsArray.call(this, options);
    var stat = this.stat();
    if (stat) {
      var stat_data =
        TabSeparated._tabSeparatedExportAsArray.call(stat, options);
      ad_data = ad_data.concat(stat_data);
    }
    return ad_data;
  },

  fromRemoteObject: function(data) {
    if (data && data.targeting) {
      // Load targeting into Ad
      utils.extend(data, data.targeting);
      data.targeting = null;
    }
    storage.Storable.fromRemoteObject.call(this, data);
    // Load bid info into ad
    if (data && data.bid_info) {
      utils.forEach(BID_INFO_MAP, function(prop, key) {
        if (data.bid_info[key]) {
          this.storage().prop(prop).setRemoteValue(this, data.bid_info[key]);
        }
      }, this);
    }
    return this;
  },

  allowedStatusTransitions: function() {
    if (this.isNew()) {
      
      return [rs.PENDING_REVIEW];
    }

    var transitions = [];
    // Use the "real" status to determine legal transitions
    switch (this.real_original_status()) {
      case rs.ACTIVE:
      case rs.CAMPAIGN_PAUSED:
      case rs.PREAPPROVED:
        transitions = [rs.ADGROUP_PAUSED, rs.DELETED];
        break;
      case rs.ADGROUP_PAUSED:
        transitions = [rs.ACTIVE, rs.DELETED];
        break;
      case rs.DELETED:
        transitions = [];
        break;
      default:
        transitions = [rs.DELETED];
        break;
    }

    // Add current option too
    transitions.unshift(this.real_original_status() || rs.ACTIVE);

    // Make sure to incorporate campaign status information
    return transitions.map(fun.bind(function(status) {
      return this.realStatus(status);
    }, this));
  },

  isNew: function() {
    return this.id() < 0;
  },

  isChanged: function(name) {
    if (!name && this.id() < 0) {
      return true;
    }
    return Changeable.isChanged.call(this, name);
  },

  campaign: function() {
    return require("./campaign").Campaign.byId(this.campaign_id());
  },

  triggerChanges: function(name) {
    this.updateCampaign(name);
    return storage.Storable.triggerChanges.call(this, name);
  },

  resetCampaign: function() {
    require("./campaign").Campaign.prepare(fun.bind(function(camps) {
      var camp = camps.byId(this.campaign_id());
      if (!camp) {
        return;
      }
      camp.toggleChildError(this.id(), false);
      camp.toggleChildChanged(this.id(), false);
    }, this));
    return this;
  },

  updateCampaign: function(name) {
    if (!name || name === 'errors' || this.isChangeable(name)) {
      require("./campaign").Campaign.prepare(fun.bind(function(camps) {
        var camp = camps.byId(this.campaign_id());
        if (!camp) {
          return;
        }
        if (!name || name === 'errors') {
          camp.toggleChildError(this.id(), this.hasErrors());
        }
        camp.toggleChildChanged(this.id(), this.isChanged());
      }, this));
    }
  },

  fromTabSeparatedMap: function(raw, map, callback, imageLookup) {
    // implict dependency
    // we need to provide imageLookup to image property somehow
    // so store it for importing process in the object itself
    var ad = this;
    ad.imageLookup = imageLookup;
    TabSeparated.fromTabSeparatedMap.call(this, raw, map, function() {
      // delete once importing is finished
      delete ad.imageLookup;
      callback();
    });
  },

  remove: function() {
    this.resetCampaign();
    return storage.Storable.remove.apply(this, arguments);
  },

  commitChanges: function(name) {
    fun.deferOnce(this.store, this);

    // HACK, start
    if (this.storage().prop(name) && this.storage().prop(name).commitAs) {
      name = this.storage().prop(name).commitAs;
    }
    // HACK, end

    this.validate(name);
  },

  targetingSpec: function() {
    var result = {};
    this.storage().props().forEach(function(f) {
      if (f.remote && f.targeting) {
        var value = f.getRemoteValue(this);
        result[f.remote] = value;
      }
    }, this);
    return result;
  },

  dataForRemoteCreate: function() {
    var store = this.dataForRemoteUpdate();
    delete store.adgroup_id;
    return store;
  },

  dataForRemoteUpdate: function() {
    var store = { creative: {}, targeting: {} };
    this.storage().props().forEach(function(f) {
      if (f.remote) {
        var value = f.getRemoteValue(this);
        if (f.creative) {
          store.creative[f.remote] = value;
        } else if (f.targeting) {
          store.targeting[f.remote] = value;
        } else {
          store[f.remote] = value;
        }
      }
    }, this);
    if (this.bid_type() == require("../lib/bidTypes").BID_TYPE_MULTI) {
      store.bid_info = {};
      utils.forEach(BID_INFO_MAP, function(prop, key) {
        store.bid_info[key] = this.storage().prop(prop).getRemoteValue(this);
      }, this);
      delete store.max_bid;
    }

    fix.call(this, store);

    return store;
  },

  /**
   * Convert ad_status to the correct value given the campaign status
   */
  realStatus: function(ad_status, camp_status) {
    if (!camp_status) {
      if (this.campaign()) {
        camp_status = this.campaign().campaign_status();
      } else {
        return ad_status;
      }
    }

    // Campaign paused ads of active campaigns should be active
    if (camp_status === 1 && ad_status === rs.CAMPAIGN_PAUSED) {
      return rs.ACTIVE;
    }

    // Active ads of paused campaigns should be campaign paused
    if (camp_status === 2 && ad_status === rs.ACTIVE) {
      return rs.CAMPAIGN_PAUSED;
    }

    // Ads of deleted campaigns should be deleted
    if (camp_status === 3) {
      return rs.DELETED;
    }

    return ad_status;
  },

  adlink: fun.newProp('adlink'),

  searchFields: function() {
    return [
    'name',
    'campaign_name',
    'title',
    'body',
    'loc_targeting'
    ];
  },

  // this is the match function for campaign
  // here we decide what fields we can match
  match: function(query) {
    return getSearchIndex.call(this).indexOf(query) > -1;
  },

  graphCreatePath: function() {
    return '/act_' + this.account_id() + '/adgroups/';
  },

  graphUpdatePath: function() {
    return '/' + this.id() + '/';
  }
});

var BID_INFO_MAP = {
  "1": "moo_clicks",
  "44": "moo_reach",
  "38": 'moo_social'
};


var proto = Ad.prototype;

// make topline props accessable through ads
fun.delegateProp(proto, [
    'line_number', 'line_id',
    'product_type', 'ad_type',
    'flight_start_date', 'flight_end_date',
    'uom', 'func_price',
    'func_line_amount', 'func_cap_amount',
    'description', 'targets',
    'is_premium_line'
], 'topline');

fun.delegateProp(proto, 'line_impressions',
  'topline', 'impressions');

// make contract props accessable through campaign
fun.delegateProp(proto, 'io_number', 'contract');
fun.delegateProp(proto, 'io_name', 'contract', 'name');

// make stat fields accessable through Ad
fun.delegateCall(proto, [
  'impressions', 'clicks', 'spent', 'social_impressions',
  'social_clicks', 'social_spent', 'actions',
  'social_percent', 'ctr', 'avg_cpc', 'avg_cpm', 'spent_100',
  'unique_impressions'
], 'stat');

fun.delegateCall(proto, 'social_connections', 'stat', 'connections');



function arrDiff(a, b) {
  return a.filter(function(i) {
    return !(b.indexOf(i) > -1);
  });
}

function fixCreative(store) {
  var creative = store.creative;
  if (creative) {
    delete creative.preview_url;
    delete creative.creative_id;
    delete creative.image_url;

    if (creative.type) {
      var is_premium = this.is_from_premium_line();
      var fields_by_type =
        require("../lib/creativeMap").getFieldsByType(creative.type, is_premium);

      var fields_to_delete = arrDiff(
        require("../view/adEditor/creative/creativeTypeSpecs").CREATIVE_VIEW_FIELDS,
        fields_by_type
        );

      fields_to_delete.forEach(function(field) {
        delete creative[field];
      });
    }
  }

}

function fix(store) {
  fixCreative.call(this, store);

  
}

Ad
  .tableName('ad')
  .resultSetType(require("./ad/resultSet").AdResultSet);

function getSearchIndex() {
  var indexes =  this.searchFields().map(fun.bind(
      function(prop) {
        return this[prop]();
      }, this))
    .join(' ').toLowerCase();

  return indexes;
}

// --- Syncing with Graph API stuff ---

Ad.loadFromAccountIds = function(account_ids, callback) {
  if (!account_ids.length) {
    callback([], true);
    return;
  }
  var paths = libUtils.wrapArray(account_ids).map(
    function(account_id) {
      return pathUtils.join('act_' + account_id, '/adgroups');
    }
  );
  Ad.fetchAndStoreEdges(paths, { 'include_demolink_hashes': true }, callback);
};

// --- END Syncing with Graph API stuff ---

require("./ad/props").addProps(Ad);

exports.Ad = Ad;
