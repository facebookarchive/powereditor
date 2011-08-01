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

    Validatable = require("../lib/model/validatable").Validatable,
    formatters = require("../lib/formatters"),
    CampResultSet = require("./campaign/campResultSet").CampResultSet,
    storage = require("../../storage/storage"),
    Converter = require("../lib/budgetImpsConverter").Converter;

var STATS_TIMEOUT = 1000 * 15; // once per 15mins

/**
* Topline Model
* @class
*/
var Topline = storage.newStorage(Validatable, {
  init: function() {
    this._children = [];

    var ts = Date.now() - STATS_TIMEOUT;
    this._stats = {
      'impressions'      : 0.0,
      'clicks'           : 0.0,
      'spent_100'        : 0.0,
      'last_update_time' : ts
    };

    this._delivery_info = {
      'overdelivery_perc' : 0,
      'spent_perc'        : 0,
      'complete_perc'     : 0
    };
  },

  displayName: function() {
    return this.name();
  },

  children: fun.newProp('children'),

  _getAllCampaignsBudget: function() {
    var budget_sum = 0;
    this.getCampaigns().forEach(function(c) {
      budget_sum += c.total_budget_100();
    });
    return budget_sum;
  },

  _getAllCampaignsUninflatedBudget: function() {
    var budget_sum = 0;
    this.getCampaigns().forEach(function(c) {
      budget_sum += Converter.uninflateBudget(
      c.total_budget_100(), c.inflation());
    });
    return budget_sum;
  },

  _getUnallocatedBudget: function() {
    // in dollar format
    var line_budget = this.func_line_amount();
    var allocated_budget = this._getAllCampaignsUninflatedBudget();

    if (allocated_budget === 0) {
      return line_budget;
    }
    // round to the nearest cent
    return Math.round(line_budget - allocated_budget);
  },

  // for topline, we should use imps as OL to
  // indicate the status
  getUnallocatedImps: function() {
    var line_price = this.func_price();
    if (line_price === 0) {
      alert('no price. cannot calculate unallocated imps.');
      return;
    }

    var unallocatedImps =
      Converter.convertToImps(this._getUnallocatedBudget(), line_price);

    // round to the nearest int
    return Math.round(unallocatedImps);
  },

  isImpressionBased: function() {
    return this.uom() === 'CPM' ||
      this.uom() === 'FCPM';
  },

  isBudgetBased: function() {
    return this.uom() === 'CPC' ||
      this.uom() == 'FCPC';
  },

  getCampaigns: function() {
    var campsByTopline = [];

    campsByTopline = Topline.byId(this.id()).children().
      filter(function(c) {
        return (c.line_id() && c.line_id() == this.id());
    }, this);

    return campsByTopline;
  },

  /**
   * aggregate stats info for the this topline.
   *
   * @returns obj with up to three keys:
   *    'impressions'
   *    'clicks'
   *    'spent'
   *    'last_update_time'
   */
  stats: fun.newProp('stats'),

  prepareStats: function(callback) {
    var t = +new Date();
    if (t - this.stats().last_update_time < STATS_TIMEOUT) {
      callback();
      return;
    }

    var camps = this.getCampaigns();
    if (camps.length) {
      var campsRS = CampResultSet.fromArray(camps);
      campsRS.statRange({from: 0, to: 0});
      campsRS.loadCampStats(camps, fun.bind(function() {
        camps.forEach(fun.bind(function(c) {

          this.stats().impressions +=
            parseInt((c.impressions() ? c.impressions() : 0), 10);
          this.stats().clicks +=
            parseInt((c.clicks() ? c.clicks() : 0), 10);
          this.stats().spent_100 +=
            parseInt((c.spent_100() ? c.spent_100() : 0), 10);

          if (this.stats().last_update_time > c.last_update_time()) {
            this.stats().last_update_time = c.last_update_time();
          }
        }, this));

        // now let us prepare the delivery info
        this._prepareDeliveryInfo();
        callback();
      }, this));

    } else {
      callback();
    }
  },

  delivery_info: fun.newProp('delivery_info'),
  /**
   * Calculates delivery info for the this topline.
   *
   * call it inside prepareStats
   *
   * @returns obj with up to three keys:
   *    'overdelivery_perc': Percentage over or under the ideal
   *                         spent amount. (e.g. 50 = "50%")
   *    'spent_perc': Percentage of total budget spent for this line
   *    'complete_perc': Percentage complete in terms of duration
   */
  _prepareDeliveryInfo: function() {
    var now = Date.now();
    var line_budget = this.func_line_amount() * 100;

    // calcuate the time pass percentage
    var line_perc_complete = 0;
    if (now < this.flight_start_date().getTime()) {
      line_perc_complete = 0;
    } else if (now > this.adjusted_flight_end_date().getTime()) {
      line_perc_complete = 1;
    } else {
      line_perc_complete =
        (now - this.flight_start_date().getTime()) /
        (this.adjusted_flight_end_date().getTime() -
          this.flight_start_date().getTime()
        );
    }

    var line_spent = this.isImpressionBased() ?
      Converter.convertToBudget(this.stats().impressions,
        this.func_price()) * 100
      : this.stats().spent_100 * 100;

    var spent_perc = 0;
    if (line_budget <= 0 && line_spent > 0) {
      spent_perc = 'N/A (no budget)';
    } else if (line_budget <= 0 && line_spent === 0) {
      spent_perc = 0;
    } else {
      spent_perc = (line_spent / line_budget);
    }
    var overdelivery_perc = spent_perc - line_perc_complete;

    this.delivery_info().overdelivery_perc = overdelivery_perc;
    this.delivery_info().spent_perc = spent_perc;
    this.delivery_info().complete_perc = line_perc_complete;

    return this.delivery_info();
  },

  commitChanges: function(name) {
    this.validate(name);
  }

});

Topline
  .defaultPropType(props.Base)
  .tableName('topline')
  .remoteMethodName('ads.getToplines');

// used by the contract-tree-map
Topline.addProp({
  name: 'name',
  getValue: function(obj) {
    if (obj.description()) {
      return obj.description() + ' (' + obj.id() + ')';
    }
    return '' + obj.id();
  }
});

Topline.addProp({
  name: 'id',
  remote: 'line_id',
  indexed: 'INTEGER NOT NULL PRIMARY KEY'
});

Topline.addProp({
    type: props.LongNumber,
    name: 'account_id',
    indexed: "INTEGER NOT NULL",
    remote: true, db: true
});

Topline.addProp({
    name: 'io_header_id',
    remote: true, db: true
});

Topline.addProp({
    name: 'line_type',
    remote: true, db: true
});

Topline.addProp({
    name: 'is_premium_line',
    getValue: function(obj) {
      var ptype = obj.product_type();
      if (ptype) {
        return (ptype.match(/^PM/) !== null);
      }
      return false;
    }
});

Topline.addProp({
    name: 'line_id',
    remote: true, db: true
});

Topline.addProp({
    name: 'line_number',
    remote: true, db: true
});

Topline.addProp({
    name: 'product_type',
    remote: true, db: true
});

Topline.addProp({
    name: 'ad_type',
    remote: true, db: true
});

Topline.addProp({
    name: 'targets',
    remote: true, db: true
});

Topline.addProp({
    name: 'description',
    remote: true, db: true
});

Topline.addProp({
    name: 'impressions',
    remote: true, db: true
});

Topline.addProp({
    name: 'uom',
    remote: true, db: true
});

Topline.addProp({
    name: 'func_price',
    remote: true, db: true
});

Topline.addProp({
    name: 'func_cap_amount',
    remote: true, db: true
});

Topline.addProp({
    name: 'func_line_amount',
    remote: true, db: true
});

Topline.addProp({
    type: props.Timestamp,
    name: 'flight_start_date',
    remote: true, db: true
});

Topline.addProp({
    type: props.Timestamp,
    name: 'flight_end_date',
    remote: true, db: true
});

Topline.addProp({
    name: 'adjusted_flight_end_date',
    getValue: function(obj) {
      // OL parity end_date will be the end of that day
      // flight_end_date always is the start of that day
      // 11:59PM (60*24 - 1)*60 = 86340
      return new Date(obj.flight_end_date().getTime() + 86340000);
    }
});

Topline.addProp({
    type: props.Timestamp,
    name: 'time_created',
    remote: true, db: true
});

Topline.addProp({
    type: props.Timestamp,
    name: 'time_updated',
    remote: true, db: true
});

Topline.addProp({
    name: 'stat_impressions',
    getValue: function(obj) {
      if (obj.stats()) {
        return obj.stats().impressions;
      }
    }
});

Topline.addProp({
    name: 'stat_clicks',
    getValue: function(obj) {
      if (obj.stats()) {
        return obj.stats().clicks;
      }
    }
});

Topline.addProp({
    name: 'stat_spent_100',
    getValue: function(obj) {
      if (obj.stats()) {
        return obj.stats().spent_100;
      }
    }
});

Topline.addProp({
    name: 'stat_last_update_time',
    getValue: function(obj) {
      if (obj.stats()) {
        var ut = obj.stats().last_update_time;
        if (ut) {
          ut *= 1;
          var d = new Date(ut);
          d.setTime(ut);
          return d;
        }
      }
    }
});

var money = formatters.createMoneyFormatter();

Topline.addProp({
  name: 'budget_status',
  validate: function(obj) {
    var over_budget =
      obj._getAllCampaignsBudget() > obj.func_line_amount();
    obj.toggleError(
      over_budget,
      'budget_status',
      'Total campaign budget [' + money(obj._getAllCampaignsBudget()) +
      '] is over the topline budget [' + money(obj.func_line_amount()) + ']'
    );
  }
});

var perc = formatters.createPercentFormatter(2);

Topline.addProp({
  name: 'delivery_status',
  validate: function(obj) {
    var delivery_info = obj.delivery_info();
    if (delivery_info.overdelivery_perc > 0) {
      obj.toggleError(
        delivery_info.overdelivery_perc > 0,
        'delivery_info',
        'Over [' + delivery_info.overdelivery_perc + '] ' +
        delivery_info.complete_perc + ' completed'
      );
    } else if (delivery_info.overdelivery_perc < 0) {
      obj.toggleError(
        delivery_info.overdelivery_perc < 0,
        'delivery_info',
        'Under [' + perc(delivery_info.overdelivery_perc) + '] ' +
        perc(delivery_info.complete_perc) + ' Completed'
      );
    }
  }
});

Topline.addProp({
    name: 'overdelivery_perc',
    getValue: function(obj) {
      if (obj.delivery_info()) {
        return obj.delivery_info().overdelivery_perc;
      }
    }
});

Topline.addProp({
    name: 'spent_perc',
    getValue: function(obj) {
      if (obj.delivery_info()) {
        return obj.delivery_info().spent_perc;
      }
    }
});

Topline.addProp({
    name: 'complete_perc',
    getValue: function(obj) {
      if (obj.delivery_info()) {
        return obj.delivery_info().complete_perc;
      }
    }
});

Topline.addProp({
    name: 'unallocatedImps',
    getValue: function(obj) {
      return obj.getUnallocatedImps();
    }
});

Topline.addProp({
  name: 'errors',
  db: true
});

Topline.addProp({
  name: 'account',
  getValue: function(obj) {
    return require("./account").Account.byId(obj.account_id());
  }
});

Topline.addProp({
  name: 'contract',
  getValue: function(obj) {
    return require("./contract").Contract.byId(obj.account_id());
  }
});

Topline._map = {};

Topline.byId = function(id) {
  return this._map[id];
};

Topline.cached = function() {
  return this._cache && this._cache.length;
};

Topline.getIdbyLineNumber = function(act_id, number) {
  var line = this._cache.filter(function(t) {
    return (t.account_id() == act_id &&
      t.line_number() == number);
  }, this);
  if (line[0]) {
    return line[0].line_id();
  } else {
    return null;
  }
};

Topline.prepare = function(callback, force) {
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

Topline.campsForTopline = function(id, callback) {
  var topline = Topline.byId(id);
  require("./campaign").Campaign.findAllBy(
    'account_id', topline.account_id(), function(camps) {

      var campsByTopline = camps.filter(function(c) {
        return (c.line_id() && c.line_id() == topline.id());
      }, this);

      callback(campsByTopline);
  });
};

/**
* Load stats for a given set of toplines
*
* @param callback to be called after load
*/
Topline.loadToplinesStats = function(toplines, callback) {
  if (!toplines.length) {
    callback();
    return;
  }
  toplines[0].prepareStats(
    fun.bind(function() {
      Topline.loadToplinesStats(
        toplines.slice(1), callback);
    }, this)
  );
};

exports.Topline = Topline;
