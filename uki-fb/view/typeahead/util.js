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

/**
 * TypeaheadUtil
 */

/**
 * TypeaheadUtil provides a set of functions that are used across multiple
 * Typeahead related classes.  These functions are stored here in order to
 * decouple functionality as much as possible.
 *
 * Private variables are actually stored in a private manner, meaning you
 * shouldn't need (nor will you be able) to access them.
 */
var Util = {
    escape:   escape,
    flatten:  flatten,
    tokenize: tokenize
};


// regular expressions to detect
// - all spaces
// - all space separated word tokens
// - all non word characters (such as punctuation)
// - and all word separating characters (such as dashes, middle dot, etc.)
var allSpaces = /[ ]+/g,
    allTokens = /[^ ]+/g,
    allNonWordChars = /[^\w ]/g,
    allSeparators = /[\-~_\u2010\u2011\u2012\u2013\u2014\u2015\u30fb]+/g;

// regex to escape special characters from user inputted strings
var charsToEscape = new RegExp('(\\'
    + ['/','.','*','+','?','|','(',')','[',']','{','}','\\'].join('|\\')
    + ')', 'g');

// map of all characters that have analogous 'unaccented' versions
var charsToFlatten = {
    "\u0430": 'a', "\u00e0": 'a', "\u00e1": 'a', "\u00e2": 'a', "\u00e3": 'a',
    "\u00e4": 'a', "\u00e5": 'a', "\u0431": 'b', "\u00e7": 'c', "\u0434": 'd',
    "\u00f0": 'd', "\u044d": 'e', "\u0435": 'e', "\u00e8": 'e', "\u00e9": 'e',
    "\u00ea": 'e', "\u00eb": 'e', "\u0444": 'f', "\u0433": 'g', "\u011f": 'g',
    "\u0445": 'h', "\u0438": 'i', "\u00ec": 'i', "\u00ed": 'i', "\u00ee": 'i',
    "\u00ef": 'i', "\u0131": 'i', "\u0439": 'j', "\u043a": 'k', "\u043b": 'l',
    "\u043c": 'm', "\u043d": 'n', "\u00f1": 'n', "\u043e": 'o', "\u00f8": 'o',
    "\u00f6": 'o', "\u00f5": 'o', "\u00f4": 'o', "\u00f3": 'o', "\u00f2": 'o',
    "\u043f": 'p', "\u0440": 'r', "\u0441": 's', "\u015f": 's', "\u0442": 't',
    "\u0443": 'u', "\u044e": 'u', "\u00fc": 'u', "\u00fb": 'u', "\u00fa": 'u',
    "\u00f9": 'u', "\u0432": 'v', "\u044b": 'y', "\u00ff": 'y', "\u00fd": 'y',
    "\u0437": 'z', "\u00e6": 'ae',"\u0153": 'oe',"\u0446": 'ts',"\u0447": 'ch',
    "\u0448": 'sh',"\u044f": 'ya'
};

// remove all non alphanumeric characters from a string
function clean(str) {
    return str ? str.replace(allNonWordChars, ' ') : '';
}

// escape all the regex special characters in a string
function escape(str) {
    return str ? str.replace(charsToEscape, '\\$1') : '';
}

// flatten accented and other special characters in a string
function flatten(str) {
    str = (''+str).toLowerCase();
    var result = '', chr = '';
    for (var ii = str.length; ii--;) {
        chr = str.charAt(ii);
        result = (charsToFlatten[chr] || chr) + result;
    }
    return result.replace(allSpaces, ' ');
}

// replace all word separating characters with spaces in a string
function separate(str) {
    return str ? str.replace(allSeparators, ' ') : '';
}

// determine all the tokens on which a string should be able to be matched on
function tokenize(str) {
    str = str.toLowerCase();
    var flattened = flatten(str),
        cleaned   = clean(flattened),
        separated = separate(flattened);

    if (str != flattened) { str += ' ' + flattened; }
    if (str != cleaned)   { str += ' ' + cleaned; }
    if (str != separated) { str += ' ' + separated; }

    var tokens = [],
    unique = {},
    result = allTokens.exec(str);
    while (result) {
        result = result[0];
        if (!unique[result]) {
            tokens.push(result);
            unique[result] = true;
        }
        result = allTokens.exec(str);
    }

    return tokens;
}


exports.Util = Util;
