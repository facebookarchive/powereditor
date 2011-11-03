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
    adsConnect = require("../../../lib/connect"),
    FB = adsConnect.FB,
    Img = require("../image").Image,
    utils = require("../../../uki-core/utils");

var ImageImporter = fun.newClass({
  init: function(obj, hash_or_reference, image_lookup) {

    // todo (brosenthal) restructure this "imageLookup" part so that it's more
    // clear what it does.
    this.imageLookup = image_lookup;
    this.orig = hash_or_reference;
    this.obj = obj;

    if (Img.isReferenceID(hash_or_reference)) {
      this.hash = Img.getHashFromReferenceID(hash_or_reference);
      this.sourceAccountID =
        Img.getSourceAccountFromReferenceID(hash_or_reference);
    } else {
      this.hash = hash_or_reference;
      this.sourceAccountID = null;
    }
  },

  _isReference: function() {
    return !!this.sourceAccountID;
  },

  _storeImageLocally: function(account_id, id, url, callback) {
    Img.findAllBy('id', id, fun.bind(function(imgs) {
      imgs.prefetch();

      // don't bother storing if we have an image
      // with exactly the same id and account id.
      for (var i = 0; i < imgs.length; i++) {
        if (imgs[i].account_id() == account_id) {
          this.obj.image_hash(id);
          callback();
          return;
        }
      }

      // otherwise, we need to store a new image...
      // ... one for this particular account with the id.
      var image = new Img();
      image.id(id)
        .url(url)
        .account_id(account_id)
        .store(fun.bind(function() {
          this.obj.image_hash(id);
          callback();
        }, this));
    }, this));
  },

  run: function(callback) {
    if (!this.hash) {
      callback();
      return;
    }

    if (this.imageLookup && this.imageLookup.hashes &&
        this.imageLookup.hashes[this.hash] !== undefined) {
      this.obj.image_hash(imageLookup.hashes[this.hash]);
      callback();
      return;
    }

    this._findExistingImage(fun.bind(function(found_image) {
      if (!found_image) {
        if (this._isReference()) {
          FB.api('/act_' + this.sourceAccountID + '/adimages',
            'get',
            {hashes: [this.hash]}, fun.bind(function(resp) {
              if (!resp && resp.data && resp.data[this.hash]) {
                throw new Error('Could not find hash ' + this.orig);
              }
              this._storeImageLocally(this.obj.account_id(),
                this.sourceAccountID + ':' + this.hash,
                resp.data[this.hash].url, callback);
            }, this));
        } else {
          throw new Error('Could not find image: ' + this.orig);
        }
      } else if (found_image.account_id() == this.obj.account_id()) {
        this.obj.image_hash(found_image.id());
        callback();
      } else {
        // found the image, but different account id.
        this._storeImageLocally(this.obj.account_id(),
          found_image.account_id() + ':' + this.hash,
          found_image.url(),
          callback);
      }
    }, this));
  },

  _findExistingImage: function(callback) {
    var hashes = [this.hash];
    if (this._isReference()) {
      hashes.push(this.sourceAccountID + ':' + this.hash);
    }

    // find all the images in our local database with this hash
    Img.findAllBy('id', hashes, fun.bind(function(imgs) {
      if (imgs.length < 1) {
        // (the following line was there before... honestly, I (brian) don't
        // understand why it's necessary here.
        this.imageLookup.hashes[this.hash] = null;
        callback(null);
        return;
      }

      // if we don't find anything, return early.
      imgs.prefetch();

      var match_in_another_account = null;
      for (var i = 0; i < imgs.length; i++) {
        // if we have an image in the right account, return it.
        if (imgs[i].account_id() == this.obj.account_id()) {
          callback(imgs[i]);
          return;
        } else if (imgs[i].isSavedRemotely()) {
          match_in_another_account = imgs[i];
        }
      }
      if (match_in_another_account) {
        callback(match_in_another_account);
      } else {
        callback(null);
      }
    }, this));
  }
});

exports.ImageImporter = ImageImporter;
