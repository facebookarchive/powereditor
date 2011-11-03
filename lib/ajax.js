/**
*/


var post = function(endpoint, data, success, failure) {
  data = data || {};
  data.fb_dtsg = global.Env && global.Env.fb_dtsg;
  data.lsd = require("./cookieGetter").getCookie('lsd');
  data.__a = 1; // marker that it's an ajax request
  if (global.Env.user) {
    data.__user = Env.user;
  }
  if (global.Env.DEBUG && console && console.log) {
    console.log('Error vvv');
    console.log(data);
  }
  var req = new XMLHttpRequest();
  req.open('POST', endpoint, true);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onreadystatechange = function() {
    if (req.readyState == 4) {
      if (req.status == 200) {
        success && success.call(null, req.responseText);
      } else {
        failure && failure.call(null, req.statusText, req.status);
      }
    }
  };
  req.send(require("./urllib").stringify(data));
};

exports.post = post;
