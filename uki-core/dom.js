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
* @providesModule uki-dom
* @option preserve-header
*/

var env = require("./env"),
    utils = require("./utils");


var trans = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
};

/**
 * Basic utils to work with the dom tree
 * @namespace
 * @author voloko
 */
module.exports = {
    /**
     * Convenience wrapper around document.createElement
     * Creates dom element with given tagName, cssText and innerHTML
     *
     * @param {string} tagName
     * @param {string=} cssText
     * @param {string=} innerHTML
     * @returns {Element} created element
     */
    createElement: function(tagName, options, children) {
        var e = env.doc.createElement(tagName);
        utils.forEach(options || {}, function(value, name) {
            if (name == 'style') { e.style.cssText = value; }
            else if (name == 'html') { e.innerHTML = value; }
            else if (name == 'className') { e.className = value; }
            else { e.setAttribute(name, value); }
        });
        children && utils.forEach(children, function(c) {
            e.appendChild(c);
        });
        return e;
    },

    removeElement: function(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },

    createStylesheet: function(code) {
        var style = env.doc.createElement('style');
        env.doc.getElementsByTagName('head')[0].appendChild(style);
        if (style.styleSheet) { //IE
            style.styleSheet.cssText = code;
        } else {
            style.appendChild(env.doc.createTextNode(code));
        }
        return style;
    },

    computedStyle: function(element) {
        if (env.doc.defaultView && env.doc.defaultView.getComputedStyle) {
            return env.doc.defaultView.getComputedStyle(element, null);
        } else if (element.currentStyle) {
            return element.currentStyle;
        }
    },

    fromHTML: function(html) {
        var fragment = env.doc.createElement('div');
        fragment.innerHTML = html;
        return fragment.firstChild;
    },

    // client rect adjusted to window scroll
    clientRect: function(elem, ignoreScroll) {
        var rect = elem.getBoundingClientRect();
        rect = {
            // FF doesn't round the top/bottom coordinates.
            top:    Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            left: rect.left,
            right: rect.right
        };
        // IE 8 doesn't give you width nor height
        rect.width = rect.right - rect.left;
        rect.height = rect.bottom - rect.top;

        if (ignoreScroll) { return rect; }

        var body = env.doc.body,
            docElem = env.docElem,
            scrollTop  =
              env.root.pageYOffset || body.scrollTop ||
              (docElem && docElem.scrollTop) || 0,
            scrollLeft =
              env.root.pageXOffset || body.scrollLeft ||
              (docElem && docElem.scrollLeft) || 0;
        rect.top += scrollTop;
        rect.left += scrollLeft;
        return rect;
    },

    hasClass: function(elem, className) {
        return (' ' + elem.className + ' ').indexOf(' ' + className + ' ') > -1;
    },

    addClass: function(elem, classNames) {
        var string = elem.className;
        utils.forEach(classNames.split(/\s+/), function(className) {
            if (!this.hasClass(elem, className)) {
                string += (string ? ' ' : '') + className;
            }
        }, this);
        elem.className = string;
    },

    removeClass: function(elem, classNames) {
        var string = elem.className;
        utils.forEach(classNames.split(/\s+/), function(className) {
            string = utils.trim(string
                .replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)', 'g'), ' ')
                .replace(/\s{2,}/g, ' '));
        }, this);
        elem.className = string;
    },

    toggleClass: function(elem, className, condition) {
        if (condition === undefined) {
            condition = !this.hasClass(elem, className);
        }
        condition ? this.addClass(elem, className) :
            this.removeClass(elem, className);
    },

    /**
     * Converts unsafe symbols to entities
     *
     * @param {string} html
     * @returns {string} escaped html
     */
    escapeHTML: function(html) {
        return (html + '').replace(/[&<>\"\']/g, function(c) { return trans[c]; });
    }
};
