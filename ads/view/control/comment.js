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
requireCss("./comment/comment.css");


// fb comment wideget view
var fun   = require("../../../uki-core/function"),
    utils = require("../../../uki-core/utils"),
    dom   = require("../../../uki-core/dom"),
    build = require("../../../uki-core/builder").build,
    find = require("../../../uki-core/selector").find,
    Container = require("../../../uki-core/view/container").Container;


var Comment = fun.newClass(Container, {

  typeName: 'app.control.Comment',

  _createDom: function(initArgs) {

    Container.prototype._createDom.call(this, initArgs);
    this.addClass('comment');

    // fb comment box
    this._comment = dom.createElement('fb:comments', {
      href: this._href,
      num_posts: this._numPosts,
      width: this._width
    });
    this.dom().appendChild(this._comment);
  }

});

proto = Comment.prototype;

// 3 public attributes of fb comment box
// https://developers.facebook.com/blog/post/472
fun.addProps(proto, ['href', 'numPosts', 'width']);

/* Protected */
proto._href = location.origin + location.pathname + 'comment';

proto._numPosts = 5;

proto._width = 500;

proto.updateHref = function(href) {

  proto._href = href;
  var iframe = this.dom().getElementsByTagName('iframe')[0];
  var iframe_src = iframe.getAttribute('src');

  if (iframe_src.indexOf('comments.php') > 0) {
    var new_src = iframe_src.replace(/href=([a-zA-Z0-9.%])+&/g,
      'href=' + encodeURIComponent(href) + '&');

    iframe.setAttribute('src', new_src);
  }
  this._togglePostCheck(false);
};

proto.updateNumPosts = function(numPosts) {

  proto._numPosts = numPosts;
  var iframe = this.dom().getElementsByTagName('iframe')[0];
  var iframe_src = iframe.getAttribute('src');

  if (iframe_src.indexOf('comments.php') > 0) {
    var new_src = iframe_src.replace(/numposts=([0-9])+&/g,
      'numposts=' + encodeURIComponent(numPosts) + '&');

    iframe.setAttribute('src', new_src);
  }

};

proto.updateWidth = function(width) {

  proto._width = width;
  var iframe = this.dom().getElementsByTagName('iframe')[0];
  var iframe_src = iframe.getAttribute('src');

  if (iframe_src.indexOf('comments.php') > 0) {
    var new_src = iframe_src.replace(/width=([0-9])+(&|$)/g,
      'width=' + encodeURIComponent(width) + '&');

    iframe.setAttribute('src', new_src);
  }

};

proto._togglePostCheck = function(toggle) {

  var iframe = this.dom().getElementsByTagName('iframe')[0];
  var iframe_src = iframe.getAttribute('src');

  if (iframe_src.indexOf('comments.php') > 0) {
    if (iframe_src.indexOf('&publish_feed=') > 0) {
      return;
    }
    var show = toggle ? 'true' : 'false';

    iframe.setAttribute('src', iframe_src + "&publish_feed=" + show);
  }

};

exports.Comment = Comment;
