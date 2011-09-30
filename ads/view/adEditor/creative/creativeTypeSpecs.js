/**
*/

var AD_CREATIVE_TYPE = require("../../../lib/adCreativeType").AD_CREATIVE_TYPE;
var creativeUtil = require("../../../lib/creativeMap");

// this is the fields that we support. new fields can be added
var CREATIVE_VIEW_FIELDS = [
  "link_url",
  "title",
  "body",
  "related_fan_page",
  "video_id",
  "video_hd",
  "poll_id",
  "poll_question",
  "poll_answer_0",
  "poll_answer_1",
  "poll_answer_2",
  "poll_publish_to_page",
  "question_id",
  "show_creative",
  "story_id",
  "url_tags",
  "thread_id",
  "prompt"
];


function _initCreativeDisplayMap() {
  var map = {};
  for (var i = 0; i < CREATIVE_VIEW_FIELDS.length; i++ ) {
    map[CREATIVE_VIEW_FIELDS[i]] = false;
  }
  return map;
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

  return map;
}



exports.getDefaultCreativeDisplayMap = getDefaultCreativeDisplayMap;
exports.getCreativeDisplayMapByType  = getCreativeDisplayMapByType;

exports.CREATIVE_VIEW_FIELDS         = CREATIVE_VIEW_FIELDS;
