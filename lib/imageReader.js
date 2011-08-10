/**
* Copyright (c) 2011, Facebook, Inc.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
*   * Redistributions of source code must retain the above copyright notice,
*     this list of conditions and the following disclaimer.
*   * Redistributions in binary form must reproduce the above copyright notice,
*     this list of conditions and the following disclaimer in the documentation
*     and/or other materials provided with the distribution.
*   * Neither the name Facebook nor the names of its contributors may be used to
*     endorse or promote products derived from this software without specific
*     prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
* AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*
*/

var dom = require("../uki-core/dom"),
    fun = require("../uki-core/function"),
    env = require("../uki-core/env");


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
