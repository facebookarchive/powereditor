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

var fun   = require("../../../uki-core/function"),
    utils = require("../../../uki-core/utils"),
    AdsUtils = require("../../../lib/utils"),
    dom   = require("../../../uki-core/dom"),

    props   = require("../../lib/props"),
    ConnectedObject   = require("../connectedObject").ConnectedObject,
    ImageImporter = require("./image_importer").ImageImporter,

    urlToObjectIDSearcher = require("../../lib/fetcher").urlToObjectIDSearcher,
    AdStat          = require("../adStat").AdStat,
    Graphlink       = require("../../../lib/graphlink").Graphlink,
    FB = require("../../../lib/connect").FB,
    formatters      = require("../../../lib/formatters");

function addProps(Ad) {
  Ad.defaultPropType(props.Base);

  Ad.addProp({
    name: 'id',
    type: props.LongNumber,
    prefix: 'a:',
    remote: 'adgroup_id',
    indexed: 'INTEGER NOT NULL PRIMARY KEY',
    tabSeparated: 'Ad ID'
  });

  Ad.addProp({
    type: props.AdgroupStatus,
    name: 'adgroup_status',
    remote: true,
    db: true,
    trackChanges: true,
    tabSeparated: 'Ad Status'
  });

  Ad.addProp({
    type: props.AdgroupStatusAccessor,
    name: 'status',
    originalName: 'real_adgroup_status'
  });

  Ad.addProp({
    name: 'original_status',
    getValue: function(obj) {
      return obj.original() &&
        obj.original().adgroup_status || obj.adgroup_status();
    }
  });

  // adgroup_status that incorporates campaign status info
  Ad.addProp({
    type: props.RealAdgroupStatus,
    name: 'real_adgroup_status',
    originalName: 'adgroup_status'
  });

  // original_status that incorporates campaign status info
  Ad.addProp({
    type: props.RealAdgroupStatus,
    name: 'real_original_status',
    originalName: 'original_status'
  });

  Ad.addProp({
    name: 'demo_link',
    getValue: function(obj) {
      if (!obj.isNew()) {
        // profile or home
        return require("../../lib/demoLinkBuilder").getDemoLink(obj);
      }
      return null;
    },
    tabSeparated: 'Demo Link'
  });

  Ad.addProp({
    type: props.Number,
    name: 'bid_type',
    remote: true,
    db: true,
    def: 1,
    trackChanges: true
  });

  Ad.addProp({
    type: props.BidTypeName,
    name: 'bid_type_name',
    originalName: 'bid_type',
    tabSeparated: 'Bid Type'
  });

  Ad.addProp({
    type: props.LongNumber,
    name: 'campaign_id',
    prefix: 'c:',
    remote: true,
    db: true,
    indexed: 'INTEGER NOT NULL',
    tabSeparated: 'Campaign ID'
  });

  Ad.addProp({
    name: 'contract',
    getValue: function(obj) {
      return require("../contract").Contract
        .byId(obj.account_id()) || {};
    }
  });

  Ad.addProp({
    name: 'campaign_name',
    humanName: 'Campaign Name',
    getValue: function(obj) {
      return obj.campaign().name();
    }
  });

  Ad.addProp({
    name: 'campaign_type',
    getValue: function(obj) {
      return obj.campaign() ?
        obj.campaign().campaign_type() :
        require("../campaign/constants").CAMP_CLASSIC_TYPE;
    }
  });

  Ad.addProp({
    type: props.LongNumber,
    name: 'account_id',
    db: true,
    remote: true,
    indexed: 'TEXT NOT NULL',
    prefix: 'ac:'
  });

  Ad.addProp({
    name: 'account',
    getValue: function(obj) {
      return require("../account").Account.byId(obj.account_id());
    }
  });

  Ad.addProp({
    name: 'isCorporate',
    getValue: function(obj) {
      var acc = obj.account();
      return acc && acc.isCorporate();
    }
  });

  Ad.addProp({
    name: 'destination',
    remote: true,
    db: true
  });

  Ad.addProp({
    type: props.Number,
    name: 'max_bid',
    remote: true,
    db: true,
    trackChanges: true,
    humanName: 'Bid',
    validate: function(obj) {
      obj.toggleError(
        !this.getValue(obj) &&
        (obj.bid_type() != require("../../lib/bidTypes").BID_TYPE_MULTI_PREMIUM),
        'max_bid',
        'Bid required'
      );
    }
  });

  Ad.addProp({
    name: 'bid_100',
    getValue: function(obj) {
      // MOO ads have no explicit bids
      return obj.isMulti() ? 'N/A' : obj.max_bid() / 100;
    },
    setValue: function(obj, value) {
      // MOO ads have no explicit bids
      if (!obj.isMulti()) {
        obj.max_bid(Math.round(value * 100));
      }
    },
    humanName: 'Max Bid',
    tabSeparated: ['Max Bid', 'Bid'],
    commitAs: 'max_bid'
  });

  Ad.addProp({
    name: 'moo_clicks',
    db: true,
    
    corpExportedOnly: true,
    trackChanges: true
  });

  Ad.addProp({
    name: 'moo_reach',
    db: true,
    
    corpExportedOnly: true,
    trackChanges: true
  });

  Ad.addProp({
    name: 'moo_social',
    db: true,
    
    corpExportedOnly: true,
    trackChanges: true
  });


  Ad.addProp({
    name: 'name',
    db: true,
    remote: true,
    def: '',
    trackChanges: true,
    humanName: 'Ad Name',
    tabSeparated: ['Ad Name'],
    required: true
  });

  // dates
  Ad.addProp({
    type: props.Timestamp,
    name: 'start_time',
    db: true,
    remote: true
  });

  Ad.addProp({
    type: props.Timestamp,
    name: 'end_time',
    db: true,
    remote: true
  });

  Ad.addProp({
    type: props.Timestamp,
    name: 'time_updated',
    db: true,
    remote: true
  });

  Ad.addProp({
    type: props.FlatArray,
    name: 'creative_ids',
    db: true,
    remote: true
  });

  //                            |
  //
  //  {@@}  {@@}            | {@@}                          {@@}
  //  /""\  /""\              /""\                          /""\
  //                  *
  //    /$$\  /$$\    _\ |/  _    /$$\  /$$\  /$$\  /$$\  /$$\
  //    \()/  \()/     / |*\      \()/  \()/  \()/  \()/  \()/
  //
  //   nn    nn     |          nn                      nn    nn
  //  (~~)  (~~)              (~~)                    (~~)  (~~)
  //
  //    d[]b   |    d[]b  d[]b        d[]b              d[]b
  //    ~||~        ~||~  ~||~        ~||~              ~||~
  //
  //         [-^-]
  // --------------------------------------------------------------------- //
  // ----------------------------- Creative ------------------------------ //
  // --------------------------------------------------------------------- //
  Ad.addProp({
    type: props.LongNumber,
    name: 'creative_id',
    remote: true,
    db: true,
    def: '',
    creative: true
  });

  Ad.addProp({
    name: 'title',
    db: true,
    remote: true,
    def: '',
    trackChanges: true,
    tabSeparated: 'Title',
    validate: function(obj) {
      var value = this.getValue(obj);
      var limit = require("./constants").MAX_TITLE_LENGTH;
      obj.toggleError(
        !value && !obj.object_id(),
        'title',
        tx('ads:pe:title-or-destination-required')
      );
      obj.toggleError(
        !obj.object_id() && value.length > limit,
        'title_limit',
        tx('ads:pe:title-limit', { limit: limit })
      );
    },
    creative: true
  });

  Ad.addProp({
    name: 'body',
    db: true,
    remote: true,
    def: '',
    trackChanges: true,
    tabSeparated: ['Body'],
    validate: function(obj) {
      var value = this.getValue(obj);
      var limit = require("./constants").MAX_BODY_LENGTH;

      var is_premium = obj.is_from_premium_line();
      var fields_by_type =
        require("../../lib/creativeMap")
          .getFieldsByType(obj.type(), is_premium);

      obj.toggleError(
        !value.length && (fields_by_type.indexOf('body') > -1),
        'body',
        'Body required'
      );
      obj.toggleError(
        value.length > limit,
        'body_limit',
        tx('ads:pe:body-limit', { limit: limit })
      );
    },
    creative: true
  });

  Ad.addProp({
    name: 'link_url',
    db: true,
    remote: true,
    def: '',
    trackChanges: true,
    tabSeparated: 'Link',
    validate: function(obj) {
      obj.toggleError(
        !this.getValue(obj) && !obj.object_id(),
        'link_url',
        tx('ads:pe:link-or-destination-required')
      );
    },
    setTabSeparated: function(obj, value, callback) {
      // if we have id instead of link simply skip it
      if ((value + '').match(/^\d+$/)) {
        value = '';
      }
      this.setValue(obj, value);
      callback();
    },
    creative: true
  });

  Ad.addProp({
    type: props.LongNumber,
    name: 'related_fan_page',
    prefix: '',
    db: true,
    remote: true,
    def: '',
    trackChanges: true,
    tabSeparated: 'Related Page',
    setValue: function(obj, value) {
      obj[this.propName] = value;
      obj.related_fan_page_wanted(value ? 1 : 0);
    },
    creative: true
  });

  Ad.addProp({
    name: 'image_url',
    remote: true,
    def: '',
    creative: true
  });

  Ad.addProp({
    name: 'image',
    humanName: 'Image',
    def: '',
    matchTSHeader: function(header) {
      header = (header + '').toLowerCase().replace(/[^a-z]/g, '');
      return header == 'image';
    },
    setTabSeparated: function(obj, value, callback) {
      value = (value + '').toLowerCase();
      if (value && obj.imageLookup) {
        var imageLookup = obj.imageLookup;
        if (imageLookup.hashes[value]) {
          obj.image_hash(imageLookup.hashes[value]);
        } else if (imageLookup.data[value]) {
          var Img = require("../image").Image;
          var image = new Img();
          image.id(Img.generateLocalHash())
            .url(imageLookup.data[value])
            // implict dependency
            // hope that bulkImport sets account_id before
            // importing process
            .account_id(obj.account_id())
            .store();
          imageLookup.hashes[value] = image.id();
          obj.image_hash(imageLookup.hashes[value]);
        }
      }
      callback();
    }
  });

  Ad.addProp({
    name: 'image_hash',
    db: true,
    remote: true,
    def: '',
    trackChanges: true,
    validate: function(obj) {
      obj.toggleError(
        !this.getValue(obj) && !obj.object_id() && !obj.is_bass(),
        'image',
        tx('ads:pe:image-required')
      );
    },
    creative: true,
    humanName: 'Image',
    tabSeparated: 'Image Hash',

    getTabSeparated: function(obj) {
      return obj.account_id() + ':' + this.getValue(obj);
    },

    setTabSeparated: function(obj, value, callback) {
      var importer = new ImageImporter(obj, value, obj.imageLookup);
      importer.run(callback);
    }
  });

  Ad.addProp({
    name: 'preview_url',
    db: true,
    remote: true,
    def: '',
    creative: true
  });

  Ad.addProp({
    type: props.Number,
    name: 'type',
    db: true,
    remote: true,
    trackChanges: true,
    def: 1,
    creative: true,
    tabSeparated: ['Creative Type', 'creative_type'],
    validate: function(obj) {
      obj.storage().prop('title').validate(obj);
      obj.storage().prop('link_url').validate(obj);
      obj.storage().prop('body').validate(obj);
      obj.storage().prop('image_hash').validate(obj);
    },
    setTabSeparated: function(obj, value, callback) {
      // if we have id instead of link simply skip it
      if (value.match(/^\d+$/)) {
        this.setValue(obj, value);
        callback();
        return;
      }

      this.setValue(obj, require("../../lib/adCreativeType").string2id(value));
      callback();
    },

    getTabSeparated: function(obj) {
      return require("../../lib/adCreativeType").id2string(this.getValue(obj));
    }
  });

  Ad.addProp({
    name: 'object',
    def: '',
    setValue: function(obj, value) {
      obj.object_id(value && value.id());
    },
    getValue: function(obj) {
      return require("../connectedObject").ConnectedObject
        .byId(obj.object_id());
    },
    creative: true
  });

  Ad.addProp({
    type: props.LongNumber,
    prefix: 'o:',
    name: 'object_id',
    db: true,
    remote: true,
    def: '',
    tabSeparated: 'Link Object ID',
    trackChanges: true,
    setValue: function(target, value) {
      target[this.propName] = value ? value + '' : '';
    },
    validate: function(obj) {
      obj.storage().prop('title').validate(obj);
      obj.storage().prop('link_url').validate(obj);
      obj.storage().prop('body').validate(obj);
      obj.storage().prop('image_hash').validate(obj);
      var error = this.getValue(obj) &&
        !require("../connectedObject").ConnectedObject
          .byId(this.getValue(obj));
      obj.toggleError(error,
        'object_id',
        tx('ads:pe:unowned-content')
      );
    },

    setTabSeparated: function(ad, value, callback) {
      // we expect an "id"
      value = value.replace(/[^\d\-]/g, '');
      if (value.length <= 0) {
        this.setValue(ad, value);
        callback();
        return;
      }
      var obj = ConnectedObject.byId(value);
      if (obj) {
        this.setValue(ad, value);
        callback();
        return;
      } else {
        var wrapped = fun.bind(function(new_objs) {
          this.setValue(ad, new_objs[0].id());
          callback();
          }, this);
        ConnectedObject.loadExtraFromIds(ad.account_id(),
          [value], wrapped);
      }
    },
    creative: true
  });

  Ad.addProp({
    type: props.LongNumber,
    prefix: 's:',
    name: 'story_id',
    db: true,
    remote: true,
    def: '',
    trackChanges: true,
    creative: true,
    tabSeparated: ['Story ID', 'Story']
  });

  Ad.addProp({
    name: 'auto_update',
    db: true,
    remote: true,
    trackChanges: true,
    creative: true,
    tabSeparated: 'Auto Update'
  });

  Ad.addProp({
    name: 'url_tags',
    db: true,
    remote: true,
    def: '',
    trackChanges: true,
    creative: true,
    tabSeparated: 'URL Tags'
  });

  Ad.addProp({
    type: props.LongNumber,
    name: 'thread_id',
    db: true,
    remote: true,
    def: '',
    trackChanges: true,
    creative: true,
    tabSeparated: ['Thread ID', 'Thread']
  });

  Ad.addProp({
    name: 'prompt',
    db: true,
    remote: true,
    def: '',
    trackChanges: true,
    creative: true,
    tabSeparated: 'Prompt'
  });

  Ad.addProp({
    name: 'is_from_premium_line',
    getValue: function(obj) {
      if (obj.topline()) {
        return obj.topline().is_premium_line ?
          obj.topline().is_premium_line() : false;
      } else {
        return false;
      }
    }
  });

  Ad.addProp({
    name: 'is_bass',
    getValue: function(obj) {
      if (obj.type()) {
        return require("../../lib/adCreativeType").is_bass_type(obj.type());
      } else {
        return false;
      }
    }
  });
  //
  //                                                     *
  //
  //
  //
  //                                                      *
  //                                                   \   *
  //        /                                     _      |  |
  //      [ ]                                    |H|   \   *   -
  //     _o_o_                                  /HHH\_   *  /
  //    /HHHHH\___              ____  -[]      |HHHHHH\_ooo_
  //   /HHHHHHHHHH\__     _____/HHHH\_ooo_     |HHHHHHHHHHH|
  //  /HHHHHHHHHHHHHH\___/HHHHHHHHHHHHHHHH\___/HHHHHHHHHHHHH\    -[]
  //  HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH\___ooo_______
  //
  // --------------------------------------------------------------------- //
  // ----------------------------- Targeting ----------------------------- //
  // --------------------------------------------------------------------- //
  Ad.addProp({
    type: props.FlatArray,
    name: 'countries',
    remote: true,
    db: true,
    trackChanges: true,
    humanName: 'Countries',
    tabSeparated: ['Countries', 'Country'],
    tsFindByName: function(string, obj, callback) {
      var code = (string + '').toUpperCase();
      if (require("../../lib/countries").countries[code]) {
        callback(code);
        return;
      }
      require("../../lib/completions")
        .findBest('country', string + '', function(item) {
          callback(item && item.id);
        });
    },
    validate: function(obj) {
      obj.toggleError(
        !obj.countries().length,
        'countries',
        tx('ads:pe:countries-required')
      );
    },
    targeting: true
  });

  Ad.addProp({
    type: props.IdArray,
    name: 'cities',
    remote: true,
    db: true,
    trackChanges: true,
    humanName: 'Cities',
    tabSeparated: ['Cities', 'City'],
    delimiter: ';',
    tsFindByName: function(string, obj, callback) {
      require("../../lib/completions")
        .findBest(
          'city',
          { query: string + '', country: obj.countries()[0] || '' },
          function(item) {
            callback(item && { id: item.key, name: item.name });
          });
    },
    getTabSeparated: function(obj) {
      return utils.pluck(this.getValue(obj), 'name')
        .join(this.delimiter + ' ');
    },
    targeting: true
  });

  Ad.addProp({
    type: props.IdArray,
    name: 'regions',
    remote: true,
    db: true,
    trackChanges: true,
    humanName: 'Regions',
    tabSeparated: ['Regions', 'State'],
    tsFindByName: function(string, obj, callback) {
      require("../../lib/completions")
        .findBest(
          'region',
          { query: string + '', country: obj.countries()[0] || '' },
          function(item) {
            callback(item && { id: item.key, name: item.name });
          });
    },
    targeting: true
  });

  Ad.addProp({
    type: props.FlatArray,
    name: 'zips',
    remote: true,
    db: true,
    trackChanges: true,
    humanName: 'Zip Codes',
    tabSeparated: ['Zip', 'Zip Code'],
    targeting: true
  });

  Ad.addProp({
    name: 'loc_targeting',
    getValue: function(obj) {
      if (obj._loc_targeting === undefined) {
        if (obj.cities() && obj.cities().length) {
          obj._loc_targeting = 'cities';
        } else if (obj.regions() && obj.regions().length) {
          obj._loc_targeting = 'regions';
        } else if (obj.zips() && obj.zips().length) {
          obj._loc_targeting = 'zips';
        } else {
          obj._loc_targeting = 'countries';
        }
      }
      return obj._loc_targeting;
    },
    setValue: function(obj, value) {
      obj._loc_targeting = value;
      if (value !== 'cities') {
        obj.cities().length && obj.cities([]);
        obj.use_radius(false);
      }
      if (value !== 'regions') {
        obj.regions().length && obj.regions([]);
      }
      if (value !== 'zips') {
        obj.zips().length && obj.zips([]);
      }
    }
  });

  // gender
  Ad.addProp({
    type: props.Gender,
    name: 'genders',
    remote: true,
    db: true,
    trackChanges: true,
    targeting: true
  });

  Ad.addProp({
    type: props.GenderAccessor,
    name: 'sex',
    originalName: 'genders',
    tabSeparated: 'Gender',
    targeting: true
  });

  // age
  Ad.addProp({
    type: props.Age,
    name: 'age_min',
    remote: true,
    db: true,
    humanName: 'Min Age',
    tabSeparated: ['Age Min', 'Min Age'],
    trackChanges: true,
    targeting: true
  });

  Ad.addProp({
    type: props.Age,
    name: 'age_max',
    remote: true,
    db: true,
    humanName: 'Max Age',
    tabSeparated: ['Age Max', 'Max Age'],
    trackChanges: true,
    targeting: true
  });

  // eductaion
  Ad.addProp({
    type: props.EducationStatus,
    name: 'education_statuses',
    remote: true,
    db: true,
    trackChanges: true,
    targeting: true
  });

  Ad.addProp({
    type: props.EducationStatusAccessor,
    name: 'education_status',
    originalName: 'education_statuses',
    tabSeparated: 'Education Status',
    targeting: true,
    commitAs: 'education_statuses'
  });

  Ad.addProp({
    type: props.IdArray,
    name: 'college_networks',
    remote: true,
    db: true,
    trackChanges: true,
    tabSeparated: ['Education Networks', 'College'],
    tsFindByName: function(string, obj, callback) {
      require("../../lib/completions")
        .findBest('college', string + '', function(item) {
          callback(item && { id: item.key, name: item.name });
        });
    },
    targeting: true
  });

  Ad.addProp({
    type: props.FlatArray,
    name: 'college_majors',
    remote: true,
    db: true,
    trackChanges: true,
    tabSeparated: ['Education Majors', 'Major'],
    tsFindByName: function(string, obj, callback) {
      require("../../lib/completions")
        .findBest('collegemajor', string + '', function(item) {
          callback(item && item.name);
        });
    },
    targeting: true
  });

  Ad.addProp({
    type: props.IdArray,
    name: 'work_networks',
    remote: true,
    db: true,
    trackChanges: true,
    tabSeparated: ['Workplaces', 'Company'],
    tsFindByName: function(string, obj, callback) {
      require("../../lib/completions")
        .findBest('workplace', string + '', function(item) {
          callback(item && { id: item.key, name: item.name });
        });
    },
    targeting: true
  });


  Ad.addProp({
    type: props.FlatArray,
    name: 'college_years',
    remote: true,
    db: true,
    trackChanges: true,
    // tabSeparated: 'College Years',
    targeting: true
  });

  function setYears(obj, from, to) {
    delete obj._college_end_year;
    delete obj._college_start_year;
    if (!from && !to) {
      obj.college_years([]);
      return;
    }
    from = Math.min(Math.max(from * 1 || 2011, 2011), 2014);
    to   = Math.min(Math.max(to * 1 || 2014, 2011), 2014);
    obj.college_years(utils.range(from, to));
  }

  Ad.addProp({
    type: props.Number,
    name: 'college_start_year',
    tabSeparated: ['College Start Year', 'College Year Min'],
    getValue: function(obj) {
      return obj.college_years()[0] || '';
    },
    setValue: function(obj, value) {
      if (obj._college_end_year !== undefined) {
        setYears(obj, value, obj._college_end_year);
      } else {
        obj._college_start_year = value;
      }
    }
  });

  Ad.addProp({
    type: props.Number,
    name: 'college_end_year',
    tabSeparated: ['College End Year', 'College Year Max'],
    getValue: function(obj) {
      var years = obj.college_years();
      return years.length ? years[years.length - 1] : '';
    },
    setValue: function(obj, value) {
      if (obj._college_start_year !== undefined) {
        setYears(obj, obj._college_start_year, value);
      } else {
        obj._college_end_year = value;
      }
    }
  });

  // interested in
  Ad.addProp({
    type: props.Gender,
    name: 'interested_in',
    remote: true,
    db: true,
    trackChanges: true,
    targeting: true
  });

  Ad.addProp({
    type: props.GenderAccessor,
    name: 'interested_in_sex',
    originalName: 'interested_in',
    tabSeparated: 'Interested In',
    targeting: true
  });

  Ad.addProp({
    type: props.RelationshipStatuses,
    name: 'relationship_statuses',
    def: [0],
    remote: true,
    db: true,
    trackChanges: true,
    tabSeparated: ['Relationship', 'Relationship status'],
    targeting: true
  });


  Ad.addProp({
    type: props.Number,
    name: 'radius',
    remote: true,
    db: true,
    trackChanges: true,
    def: 0,
    tabSeparated: 'Radius',
    targeting: true
  });

  Ad.addProp({
    type: props.Boolean,
    name: 'use_radius',
    setValue: function(obj, value) {
      obj.radius(value ? (obj.radius() * 1 ? obj.radius() : 50) : 0);
    },
    getValue: function(obj) {
      var numberRadius = obj.radius() * 1;
      return !!numberRadius;
    },
    targeting: true
  });

  // connections
  Ad.addProp({
    type: props.Connections,
    name: 'connections',
    remote: true,
    db: true,
    trackChanges: true,
    tabSeparated: 'Connections',
    targeting: true
  });

  Ad.addProp({
    type: props.Connections,
    name: 'excluded_connections',
    remote: true,
    db: true,
    trackChanges: true,
    tabSeparated: 'Excluded Connections',
    targeting: true
  });

  Ad.addProp({
    type: props.Connections,
    name: 'friends_of_connections',
    remote: true,
    db: true,
    trackChanges: true,
    tabSeparated: 'Friends of Connections',
    targeting: true
  });


  Ad.addProp({
    type: props.FlatArray,
    name: 'locales',
    remote: true,
    db: true,
    trackChanges: true,
    tabSeparated: ['Locales', 'Language'],
    tsFindByName: function(string, obj, callback) {
      require("../../lib/completions")
        .findBest('locale', string + '', function(item) {
          callback(item && item.id);
        });
    },
    getTabSeparated: function(obj) {
      return this.getValue(obj).map(function(id) {
        var text = require("../../lib/locales").locales[id];
        return text;
      }).join(', ');
    },
    targeting: true
  });

  Ad.addProp({
    type: props.Boolean,
    name: 'interests_toggle',
    remote: false,
    db: true
  });

  /**
   * This class is a temporary solution to batch-ize
   * keyword validation
   */
  var KeywordValidationHack = {
    toValidate: {},
    keywordIsValid: {},
    ads: [],
    DEBOUNCE_TIME_MS: 2000,
    CHUNK_SIZE: 100,
    queue: function(ad, keywords) {
      utils.forEach(keywords, function(keyword) {
        keyword = keyword.toLowerCase();
        KeywordValidationHack.toValidate[keyword] = 1;
      });
    },

    clear: function() {
      KeywordValidationHack.toValidate = {};
      KeywordValidationHack.ads = [];
    },

    scheduleRun: function() {
      fun.debounce(KeywordValidationHack.run,
        KeywordValidationHack.DEBOUNCE_TIME_MS);
    },

    run: function(callback) {
      var to_validate = KeywordValidationHack.toValidate;
      var ads = KeywordValidationHack.ads;
      // clear early, to prevent clobbering other runs.
      KeywordValidationHack.clear();
      var all_keywords = utils.keys(to_validate);
      var chunks = AdsUtils.chunkArray(all_keywords,
          KeywordValidationHack.CHUNK_SIZE);
      var graphlink = new Graphlink();
      async.forEach(chunks, function(chunk_keywords, i_chunk, itercb) {
        graphlink.querysearch('adkeywordvalid',
          { keyword_list: chunk_keywords }, function(r) {
            r.data.forEach(function(word_result) {
              var lcase_keyword = word_result.name.toLowerCase();
              KeywordValidationHack.keywordIsValid[lcase_keyword] =
                word_result.valid;
            });
            itercb();
          });
      }, function() {
        utils.forEach(ads, function(ad) {
          var old_keywords = ad.keywords();
          // only remove keywords if they're in our "keywordIsValid" array
          // so that we can support partial keyword validation with this
          // class
          var new_keywords = old_keywords.filter(
            function(old_keyword) {
              var lcase_keyword = old_keyword.toLowerCase();
              return !(lcase_keyword in KeywordValidationHack.keywordIsValid) ||
              KeywordValidationHack.keywordIsValid[lcase_keyword];
            });
          ad.keywords(new_keywords);
        });
        callback && callback();
      });
    }
  };

  Ad.addProp({
    type: props.FlatArray,
    name: 'keywords',
    remote: true,
    db: true,
    trackChanges: true,
    tabSeparated: ['Likes and Interests', 'Keywords'],
    setTabSeparated: function(obj, value, callback) {
      // validate keywords on bulk import
      var keywords = value.split(this.delimiter);
      keywords = keywords.filter(function(x) { return x && x !== ''; });
      var new_keywords = [];
      var to_validate = [];
      utils.forEach(keywords, function(keyword) {
        var lcase_keyword = keyword.toLowerCase();
        if (lcase_keyword in KeywordValidationHack.keywordIsValid) {
          if (KeywordValidationHack.keywordIsValid[lcase_keyword]) {
            new_keywords.push(keyword);
          } else {
            // keyword is already known to be invalid... do nothing.
          }
        } else {
          to_validate.push(keyword);
        }
      });

      new_keywords.push.apply(new_keywords, to_validate);
      if (keywords.length === 0) {
        this.setValue(obj, []);
      } else {
        this.setValue(obj, new_keywords);
        KeywordValidationHack.queue(obj, to_validate);
        KeywordValidationHack.scheduleRun();
      }
      callback();
    },
    targeting: true
  });

  Ad.addProp({
    type: props.UserAdClusters,
    name: 'user_adclusters',
    humanName: 'User AdClusters',
    trackChanges: true,
    db: true,
    remote: true,
    trackChanges: true,
    targeting: true,
    tabSeparated: 'Broad Category Clusters'
  });

  Ad.addProp({
    type: props.Boolean,
    name: 'broad_age',
    remote: true,
    db: true,
    trackChanges: true,
    targeting: true,
    tabSeparated: 'Broad Age'
  });

  Ad.addProp({
    type: props.Boolean,
    name: 'exact_age',
    // tabSeparated: 'Require exact age match',
    setValue: function(obj, value) {
      return obj.broad_age(!value);
    },
    getValue: function(obj) {
      return !obj.broad_age();
    },
    targeting: true
  });


  Ad.addProp({
    type: props.FlatArray,
    name: 'user_event',
    def: [],
    remote: true,
    db: true,
    trackChanges: true,
    targeting: true
  });

  Ad.addProp({
    type: props.Boolean,
    name: 'target_on_birthday',
    tabSeparated: 'Target on birthday',
    setValue: function(obj, value) {
      obj.user_event(value * 1 ? [1] : []);
    },
    getValue: function(obj) {
      return obj.user_event() && obj.user_event().length &&
      obj.user_event()[0] == 1;
    },
    targeting: true
  });


  // --------------------------------------------------------------------- //
  // -------------------------------- More ------------------------------- //
  // --------------------------------------------------------------------- //

  Ad.addProp({
    name: 'original',
    db: true
  });

  Ad.addProp({
    name: 'errors',
    db: true
  });

  Ad.addProp({
    name: 'stat',
    def: new AdStat()
  });

  Ad.addProp({
    name: 'demolink_hash',
    remote: true,
    db: true
  });

  Ad.addProp({
    type: props.Number,
    name: 'related_fan_page_wanted',
    def: 0,
    setValue: function(obj, value) {
      if (obj.set_related_fan_page_through_check_box) {
        // avoid loop between related_fan_page_wanted and related_fan_page
        return;
      }
      // store the value to debounce
      var current_related_fan_page = obj.related_fan_page();
      obj[this.propName] = value ? 1 : 0;
      if (value && !current_related_fan_page) {
        // wanted, and not already set
        obj.set_related_fan_page_through_check_box = 1;
        obj.related_fan_page(obj.related_fan_page_id());
        obj.set_related_fan_page_through_check_box = 0;
        // need commitChanges b/c related_fan_page_wanted doesn't.
        // it will save change to db.
        obj.commitChanges('related_fan_page');
      } else if (!value && current_related_fan_page) {
        // not wanted, but set
        obj.set_related_fan_page_through_check_box = 1;
        obj.related_fan_page(0);
        obj.set_related_fan_page_through_check_box = 0;
        obj.commitChanges('related_fan_page');
      }
    },
    creative: true
  });

  Ad.addProp({
    type: props.Number,
    name: 'related_fan_page_id',
    setValue: function(obj, value) {
      if (obj.related_fan_page_wanted() && obj.isRelatedFanPageSupported()) {
        var old_value = obj.related_fan_page();
        if (old_value != value) {
          obj.related_fan_page(value);
          obj.commitChanges('related_fan_page');
        }
      }
    },
    getValue: function(obj) {
      var origin_id = !obj.isNew() && !obj.isChanged('link_url') &&
        !obj.isChanged('related_fan_page') && obj.related_fan_page();
      if (origin_id) {
        // use the original value, if nothing has changed
        return origin_id;
      }
      // otherwise, get object_id from link_url
      var result = urlToObjectIDSearcher.fromCache(obj.link_url());
      return (result && result.id) || 0;
    },
    creative: true
  });

  
}

exports.addProps = addProps;
