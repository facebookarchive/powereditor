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
*/


var utils = require("../../uki-core/utils"),
    FB = require("../../lib/connect").FB,
    Img = require("../model/image").Image;

function unzip(account_id, file, callback) {
  var reader = new global.FileReader();
  reader.onloadend = function(e) {
    var bytes = reader.result.split(',')[1];
    FB.api(
      '/act_' + account_id + '/adimages',
      'post',
      { zipbytes: bytes },
      function(result) {
        if (result.images) {
          var newImages = [];
          utils.forEach(result.images, function(imgData) {
            var image = new Img();
            image
              .id(imgData.hash)
              .url(imgData.url)
              .account_id(account_id);
            newImages.push(image);
          });
          Img.addImages(account_id, newImages, function() {
            callback(result);
          });
        } else {
          callback(result);
        }
      });
  };
  reader.readAsDataURL(file);
}

exports.unzip = unzip;
