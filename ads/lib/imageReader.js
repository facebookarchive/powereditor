/**
*/

var dom = require("../../uki-core/dom"),
    fun = require("../../uki-core/function"),
    env = require("../../uki-core/env");


var MAX_WIDTH = 110,
    MAX_HEIGHT = 80;

function read(file, callback) {
    var reader = new global.FileReader();
    reader.onloadend = function(e) {
        resizeIfNeeded(reader.result, callback);
    };
    reader.readAsDataURL(file);
}

function resizeIfNeeded(dataUri, callback) {
    var img = new Image();
    img.onload = function() {
        if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
            var canvas = dom.createElement('canvas', {
                    css: 'background-color: transparent;'
                }),
                ctx,
                kw = img.width / MAX_WIDTH,
                kh = img.height / MAX_HEIGHT,
                k = Math.max(kw, kh),
                w = img.width / k << 0,
                h = img.height / k << 0;
            canvas.setAttribute('width', w);
            canvas.setAttribute('height', h);
            ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h);
            callback(canvas.toDataURL('image/png'));
        } else {
            callback(dataUri);
        }
    };
    img.onerror = function() {
      callback('');
    };
    img.onabort = function() {
      callback('');
    };
    img.src = dataUri;
}


exports.read = read;
exports.resizeIfNeeded = resizeIfNeeded;
