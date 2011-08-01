/**
*/

var fun = require("../../uki-core/function");
var utils = require("../../uki-core/utils");
var Mustache = require("../../uki-core/mustache").Mustache;


/**
* Base class for errors. Use a newClass shortcut to
* generate subclasses.
*
* var MissingCampUpdateError = Error.newClass(
*   // code, use + new Date() result to generate a unique error code
*   101,
*   // template
*   'trying to update campaign ({{id}}) that does not exist');
*
* var error = new MissingCampUpdateError({ id: 123123 });
* error.message() // => trying to update campaign (123123) that does not exist
*
*/
var AdError = fun.newClass({
  args: fun.newProp('args'),

  _code: 1,
  _messageTemplate: 'Error',


  init: function(args) {
    this.args(args || {});
  },

  code: function() {
    return this._code;
  },

  message: function() {
    return Mustache.to_html(this._messageTemplate, this.args());
  }
});

AdError.newClass = function(code, messageTemplate) {
  return fun.newClass(AdError, {
    _code: code,
    _messageTemplate: messageTemplate
  });
};


exports.Error = AdError;
