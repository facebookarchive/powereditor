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

    props   = require("../lib/props"),
    asyncUtils = require("../../lib/async"),

    Ad = require("./ad").Ad,
    DeferredList  = require("../../lib/deferredList").DeferredList;


/**
* Stat for a given Ad
* @class
*/
var Img = storage.newStorage({
  isNew: function() {
    return this.id() < 0;
  },

  countText: function() {
    var count = this.count();
    if (count === 1) {
      return '1 ad';
    }
    return (count || 0) + ' ads';
  },

  isReference: function() {
    return Img.isReferenceID(this.id());
  },

  isLocal: function() {
    return !!this.id().match(/image_\d+/);
  },

  isSavedRemotely: function() {
    return !this.isReference() &&
      !this.isLocal();
  },

  getHashFromReference: function() {
    return Img.getHashFromReferenceID(this.id());
  },

  getSourceAccountFromReference: function() {
    return Img.getSourceAccountFromReferenceID(this.id());
  }

});

Img.getSourceAccountFromReferenceID = function(reference_id) {
  if (!Img.isReferenceID(reference_id)) {
    return null;
  }
  var matches = /^(\d+):.*/.exec(reference_id);
  if (matches) {
    return matches[1];
  }
  return null;
};

Img.getHashFromReferenceID = function(reference_id) {
  if (!Img.isReferenceID(reference_id)) {
    return null;
  }
  var matches = /^\d+:(.*)$/.exec(reference_id);
  if (matches) {
    return matches[1];
  }
  return null;
};

Img.isReferenceID = function(id) {
  return !!id.match(/\d+:.*/);
};

Img.generateLocalHash = function() {
  return 'image_' + (+new Date()) + require("../../uki-core/env").guid++;
};

Img.isHashLocal = function(hash) {
  return (hash && !!hash.match(/image_\d+/));
};


Img
  .defaultPropType(props.Base)
  .tableName('image');

Img.addProp({
    name: 'id',
    remote: 'image_hash',
    indexed: 'TEXT NOT NULL'
});

Img.addProp({
    name: 'url',
    remote: true, db: true
});

Img.addProp({
    name: 'count'
});

Img.addProp({
    type: props.LongNumber,
    name: 'account_id',
    remote: true, db: true,
    indexed: 'INTEGER'
});

Img.cache = {};

Img.imageUrl = function(ad, callback) {
  var cache = Img.cache[ad.account_id()] || (Img.cache[ad.account_id()] = {});

  if (!ad.image_hash()) {
    callback('');
  } else if (cache[ad.image_hash()]) {
    callback(cache[ad.image_hash()]);
  } else {
    Img.newImagesForAccount(ad.account_id(), function(images) {
      var found = null;
      images.forEach(function(image) {
        cache[image.id()] = image.url();
      });
      callback(cache[ad.image_hash()] || '');
    });
  }
};

Img.addImages = function(account_id, images, callback) {
  var cache = Img.cache[account_id] || (Img.cache[account_id] = {});
  var ids = utils.pluck(images, 'id');

  // find old images with the same hashes...
  Img.findAllBy('id', ids, function(oldImages) {
    var list = new DeferredList();

    // ... delete them
    oldImages.forEach(function(oldImage) {
      if (oldImage.account_id() == account_id) {
        oldImage.remove(list.newWaitHandler());
      }
    });

    // ... create new ones and update the cache
    list.complete(function() {
      images.forEach(function(image) {
        cache[image.id()] = image.url();
      });
      Img.storeMulti(images, callback);
    });
  });
};

Img.updateImageHash = function(account_id, oldHash, newHash, newUrl, callback) {
  var cache = Img.cache[account_id] || (Img.cache[account_id] = {});
  cache[newHash] = cache[oldHash];
  delete cache[oldHash];

  var image = new Img();
  image
    .id(newHash)
    .url(newUrl)
    .account_id(account_id);

  image.store(function() {
    Img.findAllBy('id', oldHash, function(images) {
      try {
        images.forEach(function(image) {
          if (image.account_id() === account_id) {
            image.remove(callback);
            throw 'break';
          }
        });
        callback();
      } catch (e) {}
    });
  });

};

Img.newImagesForAccount = function(id, callback) {
  this.findAllBy('account_id', id, callback);
};

Img.updateImagesInAllAccounts = function(account_ids, totalAds, callback) {
  var allImages = [];
  asyncUtils.forEach(account_ids,
    function(account_id, i, iterCallback) {
      var ads = totalAds.filter(function(ad) {
        return ad.account_id() == account_id;
      });
      Img.updateImagesInAccount(account_id, ads, function(images) {
        Array.prototype.push.apply(allImages, images);
        iterCallback();
      });
    },
    function() {
      callback(allImages);
    }
  );
};

// dedupes images in account by hash
Img.updateImagesInAccount = function(accountId, ads, callback) {
  Img.cache[accountId] = {};

  Img.deleteBy(
    'account_id',
    accountId + '',
    function() {

      var usedHashes = {};
      var images = ads.map(function(ad) {
        if (ad.image_hash() && !usedHashes[ad.image_hash()]) {
          usedHashes[ad.image_hash()] = true;
          var image = new Img();
          image
            .id(ad.image_hash())
            .url(ad.image_url())
            .account_id(ad.account_id());

          return image;
        }
      });

      images = images.filter(Boolean);
      Img.storeMulti(images, callback);
    });

};

Img.imagesForAccount = function(id, callback) {
  var Ad = require("./ad").Ad,
  Campaign = require("./campaign").Campaign;

  Img.newImagesForAccount(id, function(images) {
    var imageMap = {};
    images.forEach(function(image) {
      image.count(0);
      imageMap[image.id()] = image;
    });

    Campaign.findAllBy('account_id', id,
    function(camps) {

      Ad.findAllBy('campaign_id',
      utils.pluck(camps, 'id'), function(ads) {

        ads.forEach(function(ad) {
          if (ad.image_hash() && imageMap[ad.image_hash()]) {
            imageMap[ad.image_hash()].count(
              imageMap[ad.image_hash()].count() + 1);
          }
        });

        callback(images);
      });
    });
  });
};


exports.Image = Img;
