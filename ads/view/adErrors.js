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
requireCss("./adErrors/adErrors.css");

var fun   = require("../../uki-core/function"),
    utils = require("../../uki-core/utils"),
    dom   = require("../../uki-core/dom"),
    view  = require("../../uki-core/view"),
    build = require("../../uki-core/builder").build,

    Container = require("../../uki-core/view/container").Container;


var AdErrors = view.newClass('ads.AdErrors', Container, {

    model: fun.newProp('model', function(v) {
        if (this._model) {
            this._model.removeListener('change.errors',
                fun.bindOnce(this._changeErrors, this));
        }
        this._model = v;
        if (this._model) {
            this._model.addListener('change.errors',
                fun.bindOnce(this._changeErrors, this));
            this._changeErrors();
        }
    }),

    _createDom: function(initArgs) {
        this._dom = dom.createElement('div', { className: 'adErrors'});
        this._text = build({ view: 'Text', addClass: 'adErrors-text phs pvs' })
          .appendTo(this)[0];
    },

    _changeErrors: function() {
        var errors = [];
        utils.forEach(this.model().errors() || {}, function(message, key) {
            if (message && key !== 'count') {
                errors.push(
                    '<span class="adErrors-error">' +
                        (errors.length + 1) + '. ' + message + '.' +
                    '</span>'
                );
            }
        });
        var word = errors.length > 1 ? 'Errors' : 'Error';
        this._text.html('<strong class="adErrors-title">' +
            errors.length + ' ' + word + ':</strong>' +
            errors.join(' '));

        if (this._lastErrorCount !== errors.length) {
            this._lastErrorCount = errors.length;
            this.visible(!!errors.length).trigger({ type: 'resized' });
        }
    }
});


exports.AdErrors = AdErrors;

