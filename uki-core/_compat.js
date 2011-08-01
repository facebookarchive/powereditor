/**
* Copyright (c) 2011, Vladimir Kolesnikov, Facebook, Inc.
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
* This file was automatically generated from uki source by Facebook.
* @providesModule uki-_compat
* @option preserve-header
*/

var arrayPrototype = Array.prototype;

var arrayFunctions = ['indexOf', 'lastIndexOf', 'forEach', 'map',
    'filter', 'reduce', 'reduceRight', 'every', 'some'];

exports.arrayFunctions = arrayFunctions;

exports.applyCompat = function() {
    exports.forEach.call(arrayFunctions, function(name) {
        if (!arrayPrototype[name]) {
            arrayPrototype[name] = exports[name];
        }
    });

    if (!Object.keys) {
        Object.keys = exports.keys;
    }
};

exports.indexOf = function(searchElement, i) {
    var len = this.length;
    if (i === undefined) { i = 0; }
    if (i < 0) { i += len; }
    if (i < 0) { i = 0; }
    for (; i < len; i++) {
        if (i in this && this[i] === searchElement) {
            return i;
        }
    }
    return -1;
};

exports.lastIndexOf = function(searchElement, i) {
    var len = this.length;
    if (i === undefined) { i = len - 1; }
    if (i < 0) { i += len; }
    if (i >= len) { i = len - 1; }
    while (i >= 0) {
        if (i in this && this[i--] === searchElement) {
            return i;
        }
    }
    return -1;
};

exports.forEach = function(fun, context) {
    for (var i = 0, n = this.length; i < n; i++) {
        if (i in this) {
            fun.call(context, this[i], i, this);
        }
    }
};

exports.every = function(fun, context) {
    for (var i = 0, n = this.length; i < n; i++) {
        if (i in this && !fun.call(context, this[i], i, this)) {
            return false;
        }
    }
    return true;
};

exports.some = function(fun, context) {
    for (var i = 0, n = this.length; i < n; i++) {
        if (i in this && fun.call(context, this[i], i, this)) {
            return true;
        }
    }
    return false;
};

exports.map = function(mapper, context) {
    var other = new Array(this.length);
    for (var i = 0, n = this.length; i < n; i++) {
        if (i in this) {
            other[i] = mapper.call(context, this[i], i, this);
        }
    }
    return other;
};

exports.filter = function(filter, context) {
    var other = [], v;
    for (var i = 0, n = this.length; i < n; i++) {
        if (i in this && filter.call(context, v = this[i], i, this)) {
            other.push(v);
        }
    }
    return other;
};

exports.reduce = function(fun, accumulator) {
    if (accumulator === undefined) {
        accumulator = this[0];
    }
    for (var i = 0, n = this.length; i < n; i++) {
        accumulator = fun.call(undefined, accumulator, this[i], i, this);
    }
    return accumulator;
};

exports.reduceRight = function(fun, accumulator) {
    var len = this.length;
    if (accumulator === undefined) {
        accumulator = this[len - 1];
    }
    for (var i = len-1; i >= 0; i--) {
        accumulator = fun.call(undefined, accumulator, this[i], i, this);
    }
    return accumulator;
};

exports.keys = function(o) {
    var ret = [], p;
    for (p in o) {
        if (o.hasOwnProperty(p)) {
            ret.push(p);
        }
    }
    return ret;
};

exports.trim = function() {
    return this.replace(/^\s*|\s*$/g, "");
};
