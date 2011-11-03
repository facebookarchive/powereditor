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

var fun  = require("../../../uki-core/function"),
    find = require("../../../uki-core/selector").find,

    HTMLLayout = require("../../../uki-fb/view/HTMLLayout").HTMLLayout;


/**
* Base class for all adEditors.
* Deals with bindings and data preparation
* @class
*/
var Base = fun.newClass(HTMLLayout, {

    _createDom: function(initArgs) {
        HTMLLayout.prototype._createDom.call(this, initArgs);
        this.addClass('adEditor-editor adEditor_loading pvs');
    },

    model: fun.newProp('model', function(m) {
        if (this._model) {
            this._model.removeListener('change',
                fun.bindOnce(this._modelChange, this));
        }
        this._model = m;
        if (m) {
            this.prepare();
        }
    }),

    _row: function(el) {
        while (el) {
            if (el.tagName == 'TR') { return el; }
            el = el.parentNode;
        }
        return null;
    },

    /**
    * Prepares the view for a given model
    * Until the view is fully prepared everything is hidden
    */
    prepare: function() {
        this.addClass('adEditor_loading');
        var currentModel = this.model();

        this._prepare(fun.bind(function() {
            if (this.model() != currentModel) { return; }
            this._setupBindings(this.model());

            if (this.model()) {
                this.model().addListener('change',
                    fun.bindOnce(this._modelChange, this));
            }
            this._modelChange();
            this.removeClass('adEditor_loading');
        }, this));
    },

    /**
    * Fast accessor to children marked with childName property
    */
    child: function(name) {
        return this['_view_' + name];
    },

    /**
    * Should be called in _createDom to use this.child('foo')
    */
    _indexChildViews: function() {
        find('[childName]', this).forEach(function(view) {
            this['_view_' + view.childName] = view;
        }, this);
    },

    /**
    * Called after _prepare is complete
    */
    _setupBindings: function(m) {},

    /**
    * Called on model.addListener('change') and after
    * bindings setup
    */
    _modelChange: function(e) {
      this._lockUpdate(function() {
        this._lockedModelChange(e);
      });
    },


    /**
    * Same as _modelChange but will not receive 'changed'
    * events causes by itself
    */
    _lockedModelChange: function(e) {},

    /**
    * Should prepare all the nessesary data for this._model
    * When ready should call callback
    */
    _prepare: function(callback) { callback(); },

    _lockUpdate: function(callback) {
      if (this._updating) { return; }
      this._updating = true;
      try {
        callback.call(this);
      } catch (e) {
        this._updating = false;
        throw e;
      }
      this._updating = false;
    }

});


exports.Base = Base;
