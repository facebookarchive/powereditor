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

    props = require("../lib/props"),

    ResultSet  = require("../../storage/resultSet").ResultSet,

    Util = require("../../uki-fb/view/typeahead/util").Util,

    FB = require("../../storage/lib/connect").FB;


/**
 * Completions like countries or college networks
 * @class
 */
var Completion = storage.newStorage({

  // STORE
  toRemoteObject: function() {
    return this.data();
  },

  fromRemoteObject: function(data) {
    // Enforce string ids. Otherwise binary search sometimes fail on ids
    // sorted as numbers.
    // Example: finding '1' in this index
    // '1', '2', '3', ..., '9', '10', '11', '12', '13' .. '21', '22'
    // will yield '10', so convert it to
    // '1', '10', '11', '12', '13', ..., '2', '21', '22'
    data.forEach(function(row) { row.id += ''; });

    return this.data(data.sort(compareIds));
  },

  /**
   * Native JSON.stringify is terribly slow on 10k+ arrays
   */
  toDBString: function() {
    return this.data().map(function(row) {
      return row.id + '\t' + row.value;
    }).join('\n');
  },

  fromDBString: function(string) {
    var rows = string.split('\n');
    var data = new Array(rows.length);
    for (var i = rows.length - 1; i >= 0; i--) {
      var match = rows[i].split('\t');
      data[i] = new Row(match[0], match[1]);
    }
    return this.data(data);
  },

  searchById: function(id, country) {
    var data = this.data();
    var low = 0;
    var high = data.length;
    var mid;
    var result;
    while (low < high) {
      mid = (low + high) >> 1;
      data[mid].id < id ? low = mid + 1 : high = mid;
    }
    // ids of regions are not uniq
    if (this.id() === 'regions') {
      country = country.toLowerCase();
      while (data[low] && data[low].id == id) {
        if (data[low].country == country) {
          return data[low];
        }
        low++;
      }
      return null;
    } else {
      return data[low] && data[low].id === id ? data[low] : null;
    }
  },

  bestMatch: function(query, country) {
    // find top 10 results, try to find exact match
    // if not avilable return first
    var result = this.search(query, 10, [], country);
    query = Util.tokenize(query).join(' ');
    for (var i = 0; i < result.length; i++) {
      if (Util.tokenize(result[i].value) == query) {
        return result[i];
      }
    }
    return result[0];
  },

  search: function(query, limit, exclusions, country) {
    limit = limit || 10;
    exclusions = exclusions || [];
    country && (country = country.toLowerCase());
    var index = this._indexFor(country);
    var data = this.data();
    var ranges = this._queryRanges(index, query);
    var result = [];
    if (!ranges) { return []; }
    var i, row;

    // for most common case when we have only one tokens
    // do fast search from the start of the matching zone
    if (ranges.length === 1) {
      for (i = ranges[0].low;
        i < ranges[0].high && result.length < limit; i++) {
        row = data[index[i][1]];
        if (exclusions.indexOf(row.id) === -1) {
          if (!country || row.country == country) {
            result.push(row);
          }
        }
      }
    // for the cases where we have many tokens do a hash merge of all
    // index ranges
    // NOTE that searching for 'a b' is pretty expensive. I hope though
    // that it's a rare case
    } else {
      var merged = this._intersectRanges(index, ranges);
      for (i = 0; i < merged.length && result.length < limit; i++) {
        row = data[merged[i]];
        if (exclusions.indexOf(row.id) === -1) {
          if (!country || row.country == country) {
            result.push(row);
          }
        }
      }
    }
    return result;
  },

  _intersectRanges: function(index, ranges) {
    var map = {};
    var range = ranges[0];
    var merged = [];
    var k;
    for (var i = range.low; i < range.high; i++) {
      map[index[i][1]] = 1;
    }
    for (var j = 1; j < ranges.length - 1; j++) {
      range = ranges[j];
      for (i = range.low; i < range.high; i++) {
        k = index[i][1];
        if (map[k] == j) { map[k] = j + 1; }
      }
    }
    range = ranges[ranges.length - 1];
    var count = ranges.length - 1;
    for (i = range.low; i < range.high; i++) {
      k = index[i][1];
      if (map[k] == count) {
        merged[merged.length] = k;
      }
    }
    return merged;
  },

  _queryRanges: function(index, query) {
    var tokens = Util.tokenize(query);
    var result = [];
    for (var i = 0; i < tokens.length; i++) {
      result[i] = this._tokenRange(index, tokens[i]);
      if (!result[i]) { return null; }
    }
    return result;
  },

  _tokenRange: function(index, token) {
    var len = token.length;
    var low = this._tokenIndex(index, token);
    if (!index[low] || index[low][0].indexOf(token) !== 0) { return null; }

    var nextToken = token.substr(0, len - 1) +
      String.fromCharCode(token.charCodeAt(len - 1) + 1);
    return {
      low:  low,
      high: this._tokenIndex(index, nextToken)
    };
  },

  _tokenIndex: function(index, token) {
    var low = 0;
    var high = index.length;
    var mid;
    while (low < high) {
      mid = (low + high) >> 1;
      index[mid][0] < token ? low = mid + 1 : high = mid;
    }
    return low;
  },

  _indexFor: function(country) {
    var tmp = Completion.cached(this.id() + '_index');
    return tmp && tmp.data() || [];
  },

  buildIndex: function() {
    var data = this.data();
    var index = [];
    for (var i = 0, l = data.length; i < l; i++) {
      var tokens = Util.tokenize(data[i].value);
      for (var j = 0, lj = tokens.length; j < lj; j++) {
        index[index.length] = [tokens[j], i];
      }
    }
    return index.sort(compareIndexRows);
  }
});

/**
* Use predefined class to optimize object creation in Chrome
* See http://en.wikipedia.org/wiki/Inline_caching
*/
function Row(id, value) {
  this.id = id;
  this.value = value;
}
City.prototype.id = '';
City.prototype.value = '';

Completion
  .defaultPropType(props.Base)
  .tableName('completion')
  .remoteMethodName('ads.getAutoCompleteData');

Completion.addProp({
    name: 'id',
    remote: true,
    indexed: 'TEXT NOT NULL PRIMARY KEY'
});

Completion.addProp({
    name: 'data',
    remote: true, db: true
});

/**
* Base class for RegionsCompletion and CitiesCompletion
*/
var LocationCompletion = fun.newClass(Completion, {

  buildIndex: function() {
    var data = this.data();
    var index = {};
    for (var i = 0, l = data.length; i < l; i++) {
      var country = data[i].country;
      if (!index[country]) {
        index[country] = [];
      }
      var tokens = Util.tokenize(data[i].value);
      for (var j = 0, lj = tokens.length; j < lj; j++) {
        index[country][index[country].length] = [tokens[j], i];
      }
    }
    utils.forEach(index, function(data, key) {
      index[key] = index[key].sort(compareIndexRows);
    });
    return index;
  },

  _indexFor: function(country) {
    var tmp = Completion.cached(this.id() + '_index');
    return tmp && tmp.data()[country] || [];
  }

});

LocationCompletion.shortenRegion = function(region, country) {
  if (country.toLowerCase() === 'us') {
    return require("./completion/usRegions")
      .longToShort(region).toUpperCase();
  }
  return region;
};

LocationCompletion.expandRegion = function(region, country) {
  if (country.toLowerCase() === 'us') {
    return require("./completion/usRegions")
      .shortToLong(region);
  }
  return region;
};

/**
* Use predefined class to optimize object creation in Chrome
* See http://en.wikipedia.org/wiki/Inline_caching
*/
function City(id, value, country, region) {
  this.id = id;
  this.value = value;
  this.country = country;
  this.region = region;
}
City.prototype.id = '';
City.prototype.value = '';
City.prototype.country = '';
City.prototype.region = '';
City.prototype.getFullName = function() {
  return this.value +
    (this.region ?
      ', ' + LocationCompletion.shortenRegion(this.region, this.country) :
      '');
};

var CitiesCompletion = fun.newClass(LocationCompletion, {
  toDBString: function() {
    return this.data().map(function(row) {
      return [row.id, row.value, row.country, row.region].join('\t');
    }).join('\n');
  },

  fromDBString: function(string) {
    var rows = string.split('\n');
    var data = new Array(rows.length);
    for (var i = rows.length - 1; i >= 0; i--) {
      var match = rows[i].split('\t');
      data[i] = new City(match[0], match[1], match[2], match[3]);
    }
    return this.data(data);
  },

  search: function(query, limit, exclusions, country) {
    var match = query.match(/([^,]+)(,.(.*))?/);
    var result = Completion.prototype
      .search.call(this, match[1], limit, exclusions, country);

    // filter by region
    if (match[3] && match[3].match(/\S/)) {
      var region = match[3].toLowerCase();
      region = LocationCompletion.expandRegion(region, country) || region;
      result = result.filter(function(city) {
        return city.region &&
          city.region.toLowerCase().indexOf(region) === 0;
      });
    }
    return result;
  }
});

var RegionsCompletion = fun.newClass(LocationCompletion, {
  toDBString: function() {
    return this.data().map(function(row) {
      return [row.id, row.value, row.country].join('\t');
    }).join('\n');
  },

  fromDBString: function(string) {
    return this.data(string.split('\n').map(function(row) {
      var match = row.split('\t');
      return {
        id: match[0],
        value: match[1],
        country: match[2]
      };
    }));
  },
  /**
  * Regions come in a format of it's own. Instead of array
  * it's a hash of hashes. Convert it to array that looks like everything
  * else.
  */
  fromRemoteObject: function(raw) {
    var data = [];
    for (var i = 0; i < raw.length; i++) {
      var country = raw[i].id.toLowerCase();
      utils.forEach(raw[i].value, function(region, key) {
        data.push({ id: key, value: region, country: country });
      });
    }
    return this.data(data.sort(compareIds));
  }
});

var IndexCompletion = fun.newClass(Completion, {
  toDBString: function() {
    return this.data().map(function(row) {
      return row.join('\t');
    }).join('\n');
  },

  fromDBString: function(string) {
    var rows = string.split('\n');
    var data = new Array(rows.length);
    for (var i = rows.length - 1; i >= 0; i--) {
      data[i] = rows[i].split('\t');
    }
    return this.data(data);
  }
});

var ClusteredIndexCompletion = fun.newClass(Completion, {
  toDBString: function() {
    var result = [];
    utils.forEach(this.data(), function(rows, cluster) {
      result[result.length] = cluster + ' ' + rows.length;
      result[result.length] = rows.map(function(row) {
        return row.join('\t');
      }).join('\n');
    });
    return result.join('\n');
  },

  fromDBString: function(string) {
    var data = {};
    var cluster;
    var count = 0;

    var rows = string.split('\n');
    var current;
    for (var i = 0, l = rows.length; i < l; i++) {
      var row = rows[i];
      if (count === 0) {
        cluster = row.split(' ')[0];
        count   = row.split(' ')[1] * 1;
        current = data[cluster] = [];
      } else {
        current[current.length] = row.split('\t');
        count--;
      }
    }
    return this.data(data);
  }
});



// methods
Completion.newInstance = function(id) {
  var compl;
  if (id === 'cities') {
    compl = new CitiesCompletion();
  } else if (id === 'regions') {
    compl = new RegionsCompletion();
  } else if (id === 'regions_index' || id === 'cities_index') {
    compl = new ClusteredIndexCompletion();
  } else if (id.match(/_index$/)) {
    compl = new IndexCompletion();
  } else {
    compl = new Completion();
  }
  compl.id(id);
  return compl;
};

Completion._cache = {};

Completion.cached = function(id) {
  return this._cache[id];
};

Completion.prepare = function(what, callback) {
  var unloaded = [];
  what.forEach(function(w) {
    if (!this._cache[w]) {
      unloaded.push(w);
      unloaded.push(w + '_index');
    }
  }, this);

  if (!unloaded.length) {
    callback();
    return;
  }
  this.findAllBy('id', unloaded, fun.bind(function(completions) {
    completions.forEach(function(c) {
      this._cache[c.id()] = c;
    }, this);
    callback();
  }, this));
};

Completion.hasRegionsFor = function(country) {
  var tmp = Completion.cached('regions_index');
  return !!tmp && !!tmp.data()[country.toLowerCase()];
};

Completion.hasCitiesFor = function(country) {
  var tmp = Completion.cached('cities_index');
  return !!tmp && !!tmp.data()[country.toLowerCase()];
};

Completion.categories = function(account) {
  var result = [
    'colleges',
    'workplaces',
    'countries',
    'regions',
    'cities',
    'locales',
    'college_majors'
  ];
  if (account.isCorporate()) {
    result.push('user_clusters');
  }
  return result;
};

function compareIndexRows(a, b) {
  return a[0] < b[0] ? -1 :
         a[0] > b[0] ?  1 : 0;
}

function compareIds(a, b) {
  return a.id < b.id ? -1 :
         a.id > b.id ?  1 : 0;
}

Completion.createSearcher = function(id, country) {
  return function(query, limit, exclusions) {
    var compl = Completion.cached(id);
    if (!compl) { return []; }
    return compl.search(query, limit, exclusions, country).map(function(row) {
      var text = row.getFullName ? row.getFullName() : row.value;
      return { id: row.id, text: text, name: row.value, region: row.region };
    });
  };
};

Completion.buildIndexes = function(completions) {
  var result = [];
  completions.forEach(function(completion) {
    result.push(indexCompletion);
  }, this);
  return result;
};

Completion.loadFromRESTAPI = function(options, callback) {
  this._cache = {};
  FB.api(
    utils.extend({ method: this.remoteMethodName() }, options),
    fun.bind(function(data) {
      var items = [];
      utils.forEach(data, function(raw, key) {
        var item = Completion.newInstance(key);
        items.push(item.fromRemoteObject(raw));
        var index = Completion.newInstance(key + '_index');
        items.push(index.data(item.buildIndex()));
      });
      this.storeMulti(items, callback);
    }, this)
  );
};

Completion.dbDrop = function() {
  storage.Storage.dbDrop.call(this);
};

Completion.resultSetType(fun.newClass(ResultSet, {
  item: function(i) {
    if (!this[i]) {
      var row = this._rows.item(i);
      if (!row) {
        return null;
      }
      var obj = Completion.newInstance(row.id).fromDBString(row.data);

      this._registerItem(i, obj);
    }
    return this[i];
  }
}));


exports.Completion = Completion;
