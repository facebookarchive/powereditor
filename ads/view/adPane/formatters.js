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

var utils = require("../../../uki-core/utils");
var formatters = require("../../../lib/formatters");
var dom = require("../../../uki-core/dom");
var DemoLinkBuilder = require("../../lib/demoLinkBuilder");

function changes(c, row) {
  if (row.isNew()) { return '<i class="adPane-col-new"></i>'; }
  if (c) { return '<i class="adPane-col-changes"></i>'; }
  return '';
}

function status(s) {
  return '<i class="adPane-status adPane-status_' +
    (s || 1) + '"></i>';
}

function money(m, row) {
  if (row.account()) {
    var curcode = row.account().currency();
    return formatters.createMoneyFormatter(2, curcode)(m);
  }
}

function errors(e) {
  return '<i class="adPane-errors adPane-errors_' +
    (e ? 'yes' : 'no') + '"></i>';
}

function destination(c, row) {
  if (row.object_id()) {
    var obj = row.object();
    if (obj) {
      return dom.escapeHTML(obj.name());
    }
    return row.object_id();
  }
  return '';
}

function location(countries, row) {
  if (countries.length == 1) {
    var regions = row.regions();
    if (regions.length) {
      return countries[0] + ': ' +
        utils.pluck(regions, 'name').join(', ');
    }
    var cities = row.cities();
    if (cities.length) {
      return countries[0] + ': ' +
        utils.pluck(cities, 'name').join('; ');
    }
  }
  return countries.join(', ');
}

function age(_, row) {
  var age_min = row.age_min(),
    age_max = row.age_max();
  if (age_min || age_max) {
    age_min = age_min || 'Any';
    age_max = age_max || 'Any';
    return age_min + '&ndash;' + age_max;
  }
  return 'Any';
}

function sex(_, row) {
  var v = row.sex() + '';
  if (v === '0') {
    return 'All';
  } else if (v === '1') {
    return 'Men';
  }
  return 'Women';
}

function adlink(ad) {
  // account link to ads/manager
  // current admanger format
  // adgroups.php#adgroup_id.6003130630363
  // adgroups.php?campaign_id={num}&act={num}#adgroup_id.{num}
  if (ad.isNew && !ad.isNew()) {
    var ad_link =
      '/ads/manage/adgroups.php?campaign_id=' + ad.campaign_id() +
      '&act=' + ad.account_id() + '#adgroup_id.' + ad.id();
    ad_link = 'http://www.facebook.com/' + ad_link;
    
    return '<a target="_blank" href=' +
      ad_link + '>' + ad.id() + '</a>';
  } else {
    return '';
  }
}

function lineNumber(c, row) {
  if (row.is_bonus_line && row.is_bonus_line()) {
    c = '<span class="adPane-bonus">' +
        ' B ' + '</span>' + c;
  }
  return c;
}

function targets(c, row) {
  if (row.targets && row.targets()) {
    return '<span title="' + c + '">' + c + '</span>';
  }
  return c;
}

exports.adlink      = adlink;
exports.changes     = changes;
exports.status      = status;
exports.money       = money;
exports.errors      = errors;
exports.destination = destination;
exports.location    = location;
exports.targets      = targets;
exports.age         = age;
exports.sex         = sex;
exports.lineNumber  = lineNumber;
