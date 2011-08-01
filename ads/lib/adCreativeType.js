/**
*/


var AD_CREATIVE_CATEGORY = {
  FACEBOOK_ADS : 'facebook_ads',
  SPONSORED_STORIES : 'sponsored_stories'
};

var AD_CREATIVE_TYPE_MAP = {
    1:  'Standard',
    2:  'Fan',
    3:  'RSVP',
    4:  'Platform Context',
    5:  'Social Poll',
    6:  'Comment',
    7:  'Sample',
    8:  'Bass Platform Story',
    9:  'Bass Page Connections',
    10: 'Bass Page Checkins',
    11: 'Bass Page Posts',
    12: 'Premium Standard',
    13: 'Premium Fan',
    14: 'Premium Event',
    15: 'Premium Platform',
    16: 'Bass App Connection',
    17: 'Bass Engagement',
    18: 'Bass Buy With Friend',
    19: 'Bass Link Share',
    20: 'Bass Questions Vote',
    21: 'Questions',
    22: 'Bass Sparkbox',
    23: 'Bass Sparkbox Comment',
    24: 'Page Endorsement',
    999: 'Invalid'
};

var AD_CREATIVE_TYPE = {
  STANDARD: 1,
  INLINE_FAN: 2,
  INLINE_RSVP: 3,
  PLATFORM_CONTEXT: 4,
  SOCIAL_POLL: 5,
  COMMENT: 6,
  SAMPLE: 7,
  BASS_PLATFORM_STORY: 8,
  BASS_PAGE_CONNECTIONS: 9,
  BASS_PAGE_CHECKINS: 10,
  BASS_PAGE_POSTS: 11,
  PREMIUM_STANDARD: 12,
  PREMIUM_FAN: 13,
  PREMIUM_EVENT: 14,
  PREMIUM_PLATFORM: 15,
  BASS_APP_CONNECTIONS: 16,
  BASS_ENGAGEMENT: 17,
  BASS_BUY_WITH_FRIENDS: 18,
  BASS_LINK_SHARE: 19,
  BASS_QUESTIONS_VOTE: 20,
  QUESTIONS: 21,
  BASS_SPARKBOX: 22,
  BASS_SPARKBOX_COMMENT: 23,
  PAGE_ENDORSEMENT: 24,
  EXOTIC_OR_INVALID: 999
};

var AD_CREATIVE_BASS_TYPE_MAP = {
  BASS_PLATFORM_STORY: 8,
  BASS_PAGE_CONNECTIONS: 9,
  BASS_PAGE_CHECKINS: 10,
  BASS_PAGE_POSTS: 11,
  BASS_APP_CONNECTIONS: 16,
  BASS_ENGAGEMENT: 17,
  BASS_BUY_WITH_FRIENDS: 18,
  BASS_LINK_SHARE: 19,
  BASS_QUESTIONS_VOTE: 20
};

function is_bass_type(creative_type) {
  return AD_CREATIVE_BASS_TYPE_MAP[creative_type];
};

function getCategoryByCreativeType(creative_type) {
  return is_bass_type(creative_type) ?
    AD_CREATIVE_CATEGORY.SPONSORED_STORIES :
    AD_CREATIVE_CATEGORY.FACEBOOK_ADS;
};

function getDefaultCreativeTypeByAnchor(
    anchor_type, is_bass, is_premium) {

  var premium = is_premium || false;
  var bass = is_bass || false;

  var default_type = is_premium ?
    AD_CREATIVE_TYPE.PREMIUM_STANDARD :
    AD_CREATIVE_TYPE.STANDARD;

  var type = require("../model/connectedObject").OBJECT_TYPE;
  if (premium) {
    if (anchor_type == type.EXTERNAL_WEBPAGE) {
      default_type = AD_CREATIVE_TYPE.PREMIUM_STANDARD;
      return;
    }
    anchor_type = parseInt(anchor_type, 10);

    switch (anchor_type) {
      case type.PAGE:
      case type.GROUP:
      case type.REVIEW:
      case type.PLACE:
        default_type = AD_CREATIVE_TYPE.PREMIUM_FAN;
        break;
      case type.EVENT:
        default_type = AD_CREATIVE_TYPE.PREMIUM_EVENT;
        break;
      case type.APP:
        default_type = AD_CREATIVE_TYPE.PREMIUM_PLATFORM;
        break;
      default:
        alert('not supported anchor type - (premium)');
        break;
    }
  } else {
   // for bass/non-premium type
   if (anchor_type == type.EXTERNAL_WEBPAGE) {
     default_type = AD_CREATIVE_TYPE.STANDARD;
     return;
   }
   anchor_type = parseInt(anchor_type, 10);

   switch (anchor_type) {
     case type.PAGE:
       default_type = bass ?
         AD_CREATIVE_TYPE.BASS_PAGE_CONNECTIONS :
         AD_CREATIVE_TYPE.INLINE_FAN;
       break;
     case type.GROUP:
     case type.REVIEW:
       default_type = AD_CREATIVE_TYPE.INLINE_FAN;
       break;
     case type.PLACE:
       default_type = AD_CREATIVE_TYPE.BASS_PAGE_CHECKINS;
       break;
     case type.EVENT:
       default_type = AD_CREATIVE_TYPE.INLINE_RSVP;
       break;
     case type.APP:
       default_type = bass ?
         AD_CREATIVE_TYPE.BASS_APP_CONNECTIONS :
         AD_CREATIVE_TYPE.PREMIUM_PLATFORM;
       break;
     default:
       alert('not supported anchor type');
       break;
    }
  }

  return default_type;
}

exports.getDefaultCreativeTypeByAnchor = getDefaultCreativeTypeByAnchor;
exports.is_bass_type = is_bass_type;
exports.getCategoryByCreativeType = getCategoryByCreativeType;
exports.AD_CREATIVE_TYPE = AD_CREATIVE_TYPE;
exports.AD_CREATIVE_TYPE_MAP = AD_CREATIVE_TYPE_MAP;
exports.AD_CREATIVE_CATEGORY = AD_CREATIVE_CATEGORY;
