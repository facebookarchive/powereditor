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


var creativeTypesByAnchor_map =
{"external_webpage":{"facebook_ads":{"standard":[1],"premium":[12]}},"1":{"facebook_ads":{"standard":[2],"premium":[5,6,7,13,21,22,24]},"sponsored_stories":{"standard":[9,11,17],"premium":[20,23]}},"4":{"facebook_ads":{"standard":[2]}},"5":{"facebook_ads":{"standard":[2]},"sponsored_stories":{"standard":[10]}},"6":{"facebook_ads":{"standard":[2],"premium":[5,6,13,21,22,24]},"sponsored_stories":{"standard":[9,10,11,17],"premium":[20,23]}},"3":{"facebook_ads":{"standard":[3],"premium":[14]}},"2":{"facebook_ads":{"standard":[4],"premium":[15]},"sponsored_stories":{"standard":[16,8,18]}},"7":{"sponsored_stories":{"standard":[19]}}};

var fieldsByCreativeType_standard_map =
{"1":["link_url","title","body"],"2":["title","body","link_url"],"3":["title","body"],"4":["link_url","title","body"],"5":["title","body","link_url","poll_id","poll_question","poll_answer_0","poll_answer_1","poll_answer_2","poll_publish_to_page"],"6":["title","body","link_url"],"7":["title","body","sample_id","sample_name","sample_starting_inventory","sample_target_country","sample_visible_to_friends","sample_link_text","sample_flavour_category","sample_flavour_0","sample_flavour_1","sample_flavour_2","sample_flavour_3","sample_flavour_4"],"16":["url_tags"],"8":["url_tags"],"9":[],"10":[],"11":["url_tags"],"12":["title","body","link_url"],"13":["title","body","link_url"],"14":["title","body","link_url"],"15":["title","body","link_url"],"17":[],"18":["url_tags"],"19":["url_tags"],"21":["link_url","title","body","question_id","show_creative"],"20":["question_id"],"22":["story_id","prompt"],"23":["thread_id","prompt"],"24":["liker_page_id","liked_page_id","ab_test_id"]};

var fieldsByCreativeType_premium_map =
{"1":["link_url","title","body","video_id","video_hd"],"2":["title","body","link_url","video_id","video_hd"],"3":["title","body"],"4":["link_url","title","body","video_id","video_hd"],"5":["title","body","link_url","video_id","video_hd","poll_id","poll_question","poll_answer_0","poll_answer_1","poll_answer_2","poll_publish_to_page"],"6":["title","body","link_url","video_id","video_hd"],"7":["title","body","sample_id","sample_name","sample_starting_inventory","sample_target_country","sample_visible_to_friends","sample_link_text","sample_flavour_category","sample_flavour_0","sample_flavour_1","sample_flavour_2","sample_flavour_3","sample_flavour_4"],"16":["url_tags"],"8":["url_tags"],"9":[],"10":[],"11":["url_tags"],"12":["title","body","link_url","video_id","video_hd"],"13":["title","body","link_url","video_id","video_hd"],"14":["title","body","link_url","video_id","video_hd"],"15":["title","body","link_url","video_id","video_hd"],"17":[],"18":["url_tags"],"19":["url_tags"],"21":["link_url","title","body","video_id","video_hd","question_id","show_creative"],"20":["question_id"],"22":["story_id","prompt"],"23":["thread_id","prompt"],"24":["liker_page_id","liked_page_id","ab_test_id"]};

var api_fields =
["object_id","creative_id","type","name","url_tags","link_url","title","body","image_path","image_volume","image_hash","image_url","video_id","video_hd","view_tag","alt_view_tags","poll_id","poll_question","poll_answer_0","poll_answer_1","poll_answer_2","poll_publish_to_page","question_id","show_creative","prompt","story_id","thread_id","sample_name","sample_starting_inventory","sample_target_country","sample_visible_to_friends","sample_link_text","sample_flavour_category","sample_flavour_0","sample_flavour_1","sample_flavour_2","sample_flavour_3","sample_flavour_4","sample_dialog_title","sample_dialog_description","sample_id","liker_page_id","liked_page_id","ab_test_id"];

// premium ==> true
var COMMON_FIELDS = {
  "link_url" : false,
  "title"    : false,
  "body"     : false,
  "video_id" : true,
  "video_hd" : true
};

var SUPPRESSED_CREATIVE_TYPE_MAP = {
  // SAMPLE being deprecated (rarely used)
  // Bass Sparkbox not support for non-bass (should be enabled after Bass)
  // Page Endorsement used as a testing type for now
  7: true,
  22: true,
  24: true
};

function getFieldsByType(type, is_premium) {
  var fields = [];
  if (is_premium === undefined) {
    // go with the standard map
    fields =
      fieldsByCreativeType_standard_map[type];
  } else {
    fields =
      fieldsByCreativeType_premium_map[type];
  }

  return fields;
}

function getTypesByAnchor(anchor, is_bass, is_premium) {
  var category = (is_bass || false) ?
    'sponsored_stories' : 'facebook_ads';

  var types =
    creativeTypesByAnchor_map[anchor][category]['standard'];

  if (is_premium) {
    types = types.concat(
      creativeTypesByAnchor_map[anchor][category]['premium'] || []);
  }

  return types.filter(function(type) {
    return !SUPPRESSED_CREATIVE_TYPE_MAP[type];
  });
}

exports.getFieldsByType = getFieldsByType;
exports.getTypesByAnchor = getTypesByAnchor;
