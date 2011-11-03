/**
*/

var AD_CREATIVE_TYPE = require("../../../lib/adCreativeType").AD_CREATIVE_TYPE;
var creativeUtil = require("../../../lib/creativeMap");
var controls = require("../../controls");
var Img = require("../../../model/image").Image;

// this is the fields that we support. new fields can be added
var CREATIVE_VIEW_FIELDS = [
  'link_url',
  'title',
  'body',
  'related_fan_page',
  'video_id',
  'video_hd',
  'poll_id',
  'poll_question',
  'poll_answer_0',
  'poll_answer_1',
  'poll_answer_2',
  'poll_publish_to_page',
  'question_id',
  'query_type',
  'action_spec',
  'query_templates',
  'query_object_id', // for use in templates
  'show_creative',
  'story_id',
  'auto_update',
  'url_tags',
  'thread_id',
  'prompt'
];

/**
 * creative spec fields for ad preview
 */
var ADPREVIEW_CREATIVE_FIELDS = [
  'type',
  'object_id',
  'view_tag'
].concat(CREATIVE_VIEW_FIELDS);

function _initCreativeDisplayMap() {
  var map = {};
  for (var i = 0; i < CREATIVE_VIEW_FIELDS.length; i++ ) {
    map[CREATIVE_VIEW_FIELDS[i]] = false;
  }
  return map;
}

/**
 * returns a filled creative spec given ad
 */
function getAdPreviewCreativeSpec(ad, callback) {
  var map = {};
  for (var i = 0; i < ADPREVIEW_CREATIVE_FIELDS.length; i++) {
    if (ADPREVIEW_CREATIVE_FIELDS[i] in ad) {
      var val = ad[ADPREVIEW_CREATIVE_FIELDS[i]].call(ad);
      map[ADPREVIEW_CREATIVE_FIELDS[i]] = val;
    }
  }

  Img.findAllBy('id', [ad.image_hash()], function(imgs) {
    if (imgs.length === 0) {
      callback(map);
      return;
    }
    imgs.prefetch();
    map.image_url = imgs[0].url();
    callback(map);
  });
}

function getDefaultCreativeDisplayMap(is_premium) {
  var map = {};
  for (var i = 0; i < CREATIVE_VIEW_FIELDS.length; i++ ) {
    map[CREATIVE_VIEW_FIELDS[i]] = false;
  }

  if (is_premium) {
    map.video_id = true;
    map.video_hd = true;
  }

  map.link_url = true;
  map.title = true;
  map.body = true;
  if (!is_premium) {
    map.related_fan_page = true;
  }

  return map;
}

function getCreativeDisplayMapByType(type, is_premium) {
  var map = _initCreativeDisplayMap();
  var fields = creativeUtil.getFieldsByType(type, is_premium);

  for (var i = 0; fields && i < fields.length; i++) {
    map[fields[i]] = true;
  }

  // TODO: pefa1 auto_update is a hidden field now,
  // should be removed once we open it to public.
  map.auto_update = (type == AD_CREATIVE_TYPE.PAGE_POSTS_V2);

  // Special case the query type.
  map.query_type = (type == AD_CREATIVE_TYPE.QUERY_BASED);
  return map;
}



exports.getDefaultCreativeDisplayMap = getDefaultCreativeDisplayMap;
exports.getCreativeDisplayMapByType  = getCreativeDisplayMapByType;
exports.getAdPreviewCreativeSpec = getAdPreviewCreativeSpec;

exports.CREATIVE_VIEW_FIELDS         = CREATIVE_VIEW_FIELDS;
