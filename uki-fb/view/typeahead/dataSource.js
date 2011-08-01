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


var fun   = require("../../../uki-core/function"),
    utils = require("../../../uki-core/utils"),

    Util       = require("./util").Util,
    Observable = require("../../../uki-core/observable").Observable;


var DataSource = fun.newClass(Observable, {
    init: function() {
        this._numResults = this._maxResults;
        this._activeQueries = 0;
        this._dirty();
    }
});

var proto = DataSource.prototype;

// options

/**
 * The maxResults option limits the number of items that will be returned from
 * the DataSource when a query is made.
 */
proto._maxResults = 10;

/**
 * The queryData option is an object containing key value pairs that will be
 * sent to the queryEndpoint on every query request. It's sometimes useful to
 * set parameters in PHP that will be sent to the endpoint with each query.
 */
proto._queryData = {};

/**
 * The queryEndpoint option should contain the URI (if any) that AsyncRequests
 * should be sent to as the user types, to fetch dynamic, server side results.
 * If no queryEndpoint is specified, a bootstrapEndpoint must be specified in
 * order for this DataSource to be able to do anything useful.
 */
proto._queryEndpoint = '';

/**
 * Similarly to queryData, the bootstrapData option is an object that allows
 * you to send parameters to the bootstrapEndpoint. It is only used if a
 * bootstrap endpoint is provided, and technically this could be rolled into
 * URI for the bootstrapEndpoint itself, but some might find this interface to
 * be more useful.
 */
proto._bootstrapData = {};

/**
 * Similarly to queryEndpoint, the bootstrapEndpoint option should contain the
 * URI (if any) that the initial bootstrapping AsyncRequest should be sent to
 * when this DataSource is initially created. If no bootstrapEndpoint is
 * specified, a queryEndpoint must be specified in order for this DataSource
 * to be able to do anything useful.
 */
proto._bootstrapEndpoint = '';

/**
 * Using the indexedFields option, you can customize which fields from the
 * bootstrap and query endpoints should be tokenized for matching. The format
 * of each field can be either a string that will be tokenized, or an array of
 * tokens which should match the particular entry.
 *
 * Note that indexing complicated strings will degrade performance, and arrays
 * of pre-tokenized strings should be provided whenever possible.
 */
proto._indexedFields = ['text', 'tokens'];

/**
 * The exclusions array contains a set of uids which should be excluded from
 * result sets unconditionally.
 */
proto._exclusions = [];

fun.addProps(proto, ['maxResults', 'queryData', 'queryEndpoint',
    'bootstrapEndpoint', 'bootstrapData', 'indexedFields', 'exclusions',
    'activeQueries']);

/**
 * The bootstrap method is called upon initialization to load results into the
 * local 'bootstrap' cache. The method may be called more than once, but it
 * will only do work if the bootstrap cache is empty.
 */
proto.bootstrap = function() {
    if (this._bootstrapped) { return this; }
    this._fetch(this._bootstrapEndpoint, this._bootstrapData);
    this._bootstrapped = true;
    return this;
};

/**
 * The query method should be called to put this DataSource to work. When a
 * string query is passed in, it will attempt to build up a result set of data
 * objects whose text propery matches the query in one way or another.
 *
 * Since queries may be both synchronous and asynchronous, in order to access
 * the data that is returned from a particular query, you should subscribe to
 * this DataSource's 'respond' event. The matching result set of data will be
 * passed in to any subscribers of that event.
 *
 * This method servers several purposes, including determining whether or not
 * a request should be made to the queryEndpoint.
 *
 * @param  string The query value to return results for
 * @param  bool   whether to retrieve local results only
 * @return bool   Whether or not an asynchronous query was made
 */
proto.query = function(value, local_only) {
    this.trigger({type: 'beforeQuery', value: value});

    var flat_value = Util.flatten(value);
    var uids = this._buildUids(flat_value);
    var results = this._respond(value, uids).filter(function(r) {
        return r.type != 'calltoaction';
    });

    // These properties are set so subclasses (like the SearchDataSource) can
    // call respond using the current results.
    this._value = value;
    this._flatValue = flat_value;

    this.trigger({type: 'query', value: value, results: results});

    if (local_only ||
        !flat_value ||
        !this._queryEndpoint ||
        flat_value in this._getQueryCache() ||
        !this._shouldFetchMoreResults(results)) {
        return false;
    }

    this.trigger({type: 'queryEndpoint', value: value});

    this._fetch(
        this._queryEndpoint,
        this._getQueryData(value, uids),
        value,
        flat_value
    );

    return true;
};



// Protected

/**
* Should be overridden in subclasses
*/
proto._makeRequest = function(endpoint, data, handlers) {
    // var async = new AsyncRequest()
    //     .setURI(endpoint)
    //     .setData(data)
    //     .setMethod('GET')
    //     .setReadOnly(true)
    //     .setHandler(function() {
    //          handlers.success(respond.getPayouload().entries);
    //      })
    //     .setFinallyHandler(handlers.complete);
    //
    // async.setErrorHandler(handlers.error);
    // async.send();
};

/**
 * The dirty method can be called to empty out all the caches, and reset the
 * DataSource to its initial state.  The bootstrap method can be called after
 * calling dirty to re-fetch the bootstrap cache..
 */
proto._dirty = function() {
    this._value = this._flatValue = '';
    this._bootstrapped = false;

    this._data       = {}; // unique ids mapped to the result's information
    this._localCache = {}; // queries mapped to an array of local result ids
    this._queryCache = {}; // queries mapped to an array of queried result ids
};

proto._shouldFetchMoreResults = function(results) {
    return results.length < this._numResults;
};

/**
 * The getQueryData method is called before every request that's sent to the
 * queryEndpoint to build up the relevant data the endpoint needs to do its
 * work. By default, it includes key value pairs for the value being queried
 * and an array of unique ids we already have locally named existing_ids.
 *
 * @param  string The query value to return results for
 * @param  array  An array of existing uids to send as existing_ids
 * @return object An object containing data to be sent to the queryEndpoint
 */
proto._getQueryData = function(value, existing) {
    var data = utils.extend({value: value}, this._queryData || {});
    existing = existing || [];
    if (existing.length) {
        data.existing_ids = existing.join(',');
    }
    return data;
};

/**
 * The setQueryData method can be used to add or overwrite queryData after a
 * DataSource instance has been created.
 *
 * @param   object  The data that should be sent with each query
 * @param   bool    Whether or not to overwrite existing queryData
 * @return  object  this
 */
proto._setQueryData = function(data, overwrite) {
    if (overwrite) {
        this._queryData = {};
    }
    utils.extend(this._queryData, data);
    return this;
};

/**
 * The respond method is called every time we want to inform listeners that
 * there are new results to consume. It passes back not only the results, but
 * the value which these results were assembled from.
 *
 * @param  string The query value to return results for
 * @param  array  A sorted list of matching unique ids
 * @param  bool   Whether or not these results were generated synchronously,
 *                (eg. via the existing local caches), or asynchronouslly,
 *                (eg. after an AsyncRequest to queryEndpoint has completed).
 * @return object The resulting set of objects that was passed to subscribers
 */
proto._respond = function(value, uids, is_async) {
    var results = this._buildData(uids);
    this.trigger({
        type: 'respond',
        value: value,
        results: results,
        isAsync: is_async
    });
    return results;
};

/**
 * The errors returned from the backend are ignored by default. The
 * subclasses can override this attribute to handle or display the errors.
 */
proto._asyncErrorHandler = fun.FS;

/**
 * The fetch method performs an AsyncRequest to the specified endpoint, with
 * the specified data, for the specified value. It also informs subscribers
 * that there is network activity through the 'activity' event.
 *
 * @param {string} endpoint    The endpoint to send the AsyncRequest to
 * @param {object} data        The data that should be sent to the endpoint
 * @param {string} value       The query value to return results for
 * @param {string} flat_value  The flattened version of the query value
 */
proto._fetch = function(endpoint, data, value, flat_value) {
    if (!endpoint) { return; }

    this._makeRequest(endpoint, data, {
        success: fun.bind(function(entries) {
            this._fetchHandler(entries, value, flat_value);
        }, this),

        complete: fun.bind(function() {
            this._activeQueries--;
            if (!this._activeQueries) {
                this.trigger({type: 'activity', activity: false});
            }
        }, this),

        error: this._asyncErrorHandler
    });

    if (!this._activeQueries++) {
        this.trigger({type: 'activity', activity: true});
    }
};

/**
 * The fetchHandler method is called whenever an AsyncRequest that was started
 * in fetch returns successfully. Its purpose is to add the server result
 * entries to the data and index them properly so they can be queried.
 *
 * @param {object}  entries      The response object returned by the
 *                               AsyncRequest
 * @param {string}  value        The query value that this response
 *                               corresponds to
 * @param {string}  flat_value   The flattened version of the query value
 */
proto._fetchHandler = function(entries, value, flat_value) {
    this._addEntries(entries, value, flat_value);
    this.trigger({type: 'fetchComplete', entries: entries, value: value});
    this._respond(value, this._buildUids(flat_value), true);
};

/**
 * The addEntries method is called to add entries to this.data, keyed by uid,
 * and to add the entries to the apropriate caches so they can be properly
 * queried.
 *
 * @param {array}       entries     An array of data entries
 * @param {string|null} value       The query value that this response
 *                                  corresponds to
 * @param {string|null} flat_value  The flattened version of the query value
 */
proto._addEntries = function(entries, value, flat_value) {
    var new_uids = this._processEntries(utils.toArray(entries || []), value),
    all_uids = this._buildUids(flat_value, new_uids);

    if (value) {
        var query_cache = this._getQueryCache();
        query_cache[flat_value] = all_uids;
    } else {
        this._fillCache(all_uids);
    }
};

/**
 * The processEntries method is called from addEntries to process each piece
 * of data. The unique id is converted into a string for consistency, the data
 * is added to the data store, and each entry's index is stored for sorting
 * later on.
 *
 * @param  {array}  entries A sorted array of entries to be normalized
 * @param  {string} query   Query value for which this entry was
 *                          fetched from the server
 * @return {array}          A sorted array of unique ids for this
 *                          set of entries
 */
proto._processEntries = function(entries, query) {
    return entries.map(function(obj, index) {
        var uid = (obj.id = obj.id + ''); // normalize all uids to be strings

        if (this._data[uid]) {
            // In case of collision, new values would override old ones
            obj = utils.extend(this._data[uid], obj);
        } else {
            this._data[uid] = obj;
        }

        if (obj._index === undefined) {
            obj._index = index;
        }
        obj._query = query;
        return uid;
    }, this);
};

/**
 * The getEntry method will return the cached data associated with the uid
 * passed in, or null if the uid is not in the cache.
 *
 * @param {string}  uid the uid key
 */
proto._getEntry = function(uid) {
    return this.data[uid] || null;
};

/**
 * The fillCache method is called from addEntries to fill the localCache. The
 * localCache is structured as a token key mapped to a sorted array of all the
 * uids that match that token.  See the example in the doc block at the top of
 * this file for a bit more information.
 *
 * @param   {array} uids    A sorted array of uids to be added to
 *                          one of the caches
 */
proto._fillCache = function(uids) {
    var cache = this._localCache;
    // iterate over all the uids, tokenizing and adding as necessary
    uids.forEach(function(uid) {
        var obj = this._data[uid];
        if (!obj || obj.bootstrapped) { return; }
        obj.bootstrapped = true;
        var tokens = this._getTokens(obj);
        for (var ii = 0, tl = tokens.length; ii < tl; ++ii) {
            var value = tokens[ii];
            if (!cache[value]) {
                cache[value] = [];
            }
            cache[value].push(uid);
        }
    }, this);
};

/**
 * The getTokens method is used to generate all the tokens for a particular
 * object. It uses the fields specified in indexedFields to generate a set of
 * unique tokens for each object, and once generated, stores them in the
 * preparedTokens member of the object.
 *
 * @param   {object}    obj The object to generate tokens for.
 * @return  {array}         The tokens that were generated for this object.
 */
proto._getTokens = function(obj) {
    if (obj.preparedTokens) {
        return obj.preparedTokens;
    }
    var tokens = [],
    fields = this._indexedFields;
    for (var ii = 0, fl = fields.length; ii < fl; ++ii) {
        var data = obj[fields[ii]];
        if (data) {
            tokens.push(data.join ? data.join(' ') : data);
        }
    }
    return (obj.preparedTokens = Util.tokenize(tokens.join(' ')));
};

/**
 * The buildUids method takes in a value and builds up a sorted array of uids
 * corresponding to all the entries that match that value. It first uses the
 * localCache, then the queryCache, and finally adds any new entries that are
 * passed in via the new_uids parameter. It de-duplicates but does not filter
 * out invalid data entries, as that gets done in the next (buildData) step.
 * It returns the entire matching set, for completeness when filling future
 * caches based on the results it generates.
 *
 * @param  {string} value       The flattened query value to build a matching
 *                              uid set from
 * @param  {array}  new_uids    An additive sorted array of uids that should
 *                              be appended
 *                              at the end of the matching localCache and
 *                              queryCache uids
 * @return array  Sorted list of unique ids matching the query
 */
proto._buildUids = function(value, new_uids) {
    if (!value) {
        return new_uids || [];
    }

    var sort = fun.bind(function(a, b) {
        return this._data[a].index - this._data[b].index;
    }, this);

    var tokens = Util.tokenize(value),
        local_uids = this._buildCacheResults(tokens, this._localCache)
            .sort(sort),
        query_uids = this._buildQueryResults(value, tokens),
        potentials = local_uids.concat(query_uids, new_uids || []),
        uniques = indexize(this.exclusions());

    return potentials.filter(function(uid) {
        if (uid in uniques) { return false; }
        return (uniques[uid] = true);
    });
};

/**
 * The buildData method takes in an array of uids and returns the proper data
 * objects for each of those uids. It does not de-duplicate, as that should
 * have been done before the uids were passed in. It does filter out invalid
 * entries, and only returns the number of results defined by the option.
 *
 * @param   {array} uids    Sorted list of unique ids
 * @return  {array}         Sorted list of resulting entries from the data store
 */
proto._buildData = function(uids) {
    var results = [],
        num_results = this._numResults;

    for (var ii = 0; ii < uids.length && num_results; ++ii) {
        var uid = uids[ii],
            data = this._data[uid];
        if (data) {
            results.push(data);
            num_results--;
        }
    }
    return results;
};

/**
 * The findQueryCache method is used to locate the bucket of tokens that needs
 * to be used to build up the 'query' derived portion of the uids we're
 * searching for. According to the algorithm, we must find the longest
 * previous query that is a substring of the value the user has entered, and
 * return the queryCache bucket corresponding to it.
 *
 * @param  {string} value   The query value we're building the results for
 * @return {object}         The array of uids for the longest substring query
 */
proto._findQueryCache = function(value) {
    var length = 0,
        choice = null,
        query_cache = this._getQueryCache();

    for (var query in query_cache) {
        if (value.indexOf(query) === 0 && query.length > length) {
            length = query.length;
            choice = query;
        }
    }
    return query_cache[choice] || [];
};

/**
 * This method needs to be documented better but basically, it should return
 * an array of queryReults that match all the tokens passed in, for the value
 * passed in.
 *
 * TODO(tomo) document this better, and merge it with buildCacheResults
 */
proto._buildQueryResults = function(value, tokens) {
    var query_uids = this._findQueryCache(value);
    // if we've already built a result set for this value, it doesn't need to
    // be filtered, we can just return it directly
    if (value in query_uids) {
        return query_uids;
    }
    return this._filterQueryResults(tokens, query_uids);
};

/**
 * By default filter query results using prefix match
 * @param {array}   tokens      Query tokens
 * @param {array}   query_uids  List of candidate query uids
 * @return {array}              List of matching query uids
 */
proto._filterQueryResults = function(tokens, query_uids) {
    return query_uids.filter(function(uid) {
        return this._isPrefixMatch(tokens, this._getTokens(this._data[uid]));
    }, this);
};

/**
 * This method returns true if the query tokens are prefix matches of the
 * object tokens
 *
 * @param  {array}  query_tokens    the list of query tokens to perform prefix
 *                                  match on
 * @param  {array}  object_tokens   the list of tokens in the object
 * @return {bool}                   true if the query tokens prefix matched
 *                                  the object, false otherwise
 */
proto._isPrefixMatch = function(query_tokens, object_tokens) {
    var num_query_tokens = query_tokens.length,
        num_object_tokens = object_tokens.length,
        count;

    for (var ii = 0; ii < num_query_tokens; ++ii) {
        var regex = new RegExp('^' + Util.escape(query_tokens[ii]));
        for (count = 0; count < num_object_tokens; ++count) {
            if (regex.test(object_tokens[count])) {
                break;
            }
        }
        if (count == num_object_tokens) {
            return false;
        }
    }
    return true;
};

/**
 * The buildCacheResults returns uids in cache that prefix match all the
 * tokens passed in. It does so by keeping track of the number of consecutive
 * tokens a uid matches, and only returning uids where that number is the same
 * as the number of tokens. A small optimization (and makes the code simpler)
 * is to not bother with updating the consecutive number for a uid that didn't
 * match any token along the way.
 *
 * @param {array}   Tokens that should be matched, which is basically the query
 *                  passed in split at spaces
 * @param {object}  The set of token, uid array pairs from which the final set
 *                  of matching uids will be built
 * @return {array}  De-duplicated and ranked list of uids that have as many
 *                  matching tokens as there are total tokens being evaluated
 */
proto._buildCacheResults = function(tokens, cache) {
    var num_tokens = tokens.length,
        matched_tokens = {}, // matched name tokens
        uid_matches = {},    // uid -> # consecutive tokens uid matches
        matches = [];        // result uids

    for (var ii = 0; ii < num_tokens; ++ii) {
        var token = tokens[ii],
            regex = new RegExp('^' + Util.escape(token));
        for (var name in cache) {
            if (!(name in matched_tokens) && regex.test(name)) {
                matched_tokens[name] = true;
                var entries = cache[name];
                for (var jj = 0, el = entries.length; jj < el; ++jj) {
                    var uid = entries[jj];
                    if (ii === 0 ||
                        (uid in uid_matches && uid_matches[uid] == ii)) {

                        uid_matches[uid] = ii + 1;
                    }
                }
            }
        }
    }

    // Collect uids that matched all the tokens
    for (var candidate_uid in uid_matches) {
        if (uid_matches[candidate_uid] == num_tokens) {
            matches.push(candidate_uid);
        }
    }
    return matches;
};

proto._getQueryCache = function() {
    return this._queryCache;
};

function indexize(arr) {
    var result = {};
    arr.forEach(function(key) {
        result[key] = true;
    });
    return result;
}


exports.DataSource = DataSource;
