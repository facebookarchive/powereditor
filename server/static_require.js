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
*/
var jsp  = require('uglify-js').parser,
    pro  = require('uglify-js').uglify,
    fs   = require('fs'),
    path = require('path'),
    util = require('util'),
    cssom = require('cssom'),
    mime = require('mime'),
    url = require('url'),
    mod = require('module');

var REQUIRE = 'require';
var REQUIRE_TEXT = 'requireText';
var REQUIRE_CSS  = 'requireCss';
var TO_DATA_URI  = 'toDataUri';
var PREFIX  = '__module_';
var CLS     = 'CLS';


function new_sate () {
    return {
        required: {},
        requiredCount: 0,
        requiredAsts: [],

        requiredCss: {},
        requiredCssFiles: [],
        requiredCssUsed: false,

        cls: [],

        currentPath: '',
        searchPaths: [],
        options: {}
    };
}

var sate = exports.state = null;

var walker = pro.ast_walker(),
    walkers = {
       "call": function(expr, args) {
           if (expr[0] === 'name' && expr[1] === REQUIRE) {
               var file = resolvePath(args[0][1]);

               if (state.required[file] === undefined) {
                   addFileToAstList(file, true);
               }
               return [this[0], expr, [['num', state.required[file]]] ];
           } else if (expr[0] === 'name' && expr[1] === REQUIRE_TEXT) {
               var file = resolvePath(args[0][1]);
               return ['string', fs.readFileSync(file, 'utf8')];
           } else if (expr[0] === 'name' && expr[1] === REQUIRE_CSS) {
               var file = resolvePath(args[0][1]);
               if (!state.requiredCss[file]) {
                   state.requiredCss[file] = true;
                   state.requiredCssFiles.push(file);
               }
               return ['num', 1];
           } else if (expr[0] === 'name' && expr[1] === CLS) {
             var result = ['string', args[0][1]];
             state.cls.push(result);
             return result;
           }  else if (expr[0] === 'name' && expr[1] === TO_DATA_URI) {
             var file = resolvePath(args[0][1]);
             return ['string', imagePathToDataUri(file)];
           }
           return null;
       },
       "name": function(name) {
           if (name === "__dirname") {
               return ['string', path.dirname(state.currentPath)];
           } else if (name === '__filename') {
               return ['string', state.currentPath];
           } else if (name === '__requiredCss') {
               state.requiredCssUsed = true;
               return null;
           }
           return null;
       }
    };

function imagePathToDataUri (filePath) {
    var contentType = mime.lookup( path.extname(filePath) ),
        buffer = fs.readFileSync(filePath);
    return 'data:' + contentType + ';base64,' + buffer.toString('base64');
}

function absoluteImagePath (filePath) {
    return filePath.substring(state.options.serverRoot.length);
}

function dataUriCssImages (cssPath, string) {
    return string.replace(/url\(([^)]+)\)/, function(_, filePath) {
        var imagePath = path.join( path.dirname(cssPath), filePath );
        return 'url(' + imagePathToDataUri(imagePath) + ')';
    });
}

function addIEBackground (cssPath, style, sourceValue) {
    if (style['*background-image']) return;
    var filePath = sourceValue.match(/url\(([^)]+)\)/)[1],
        url = path.join( path.dirname(cssPath), filePath );

    style.setProperty('*background-image', 'url(' + absoluteImagePath(url) + ')');
}

var classRe = /\.([a-z0-9_-]+)/ig;
function processCssIncludes (cssPath, classMapping) {
    var code = fs.readFileSync(cssPath, 'utf8');
    var styleSheet = cssom.parse(code);
    styleSheet.cssRules.forEach(function(rule) {
        var was = rule.selectorText;
        rule.selectorText = rule.selectorText.replace(classRe, function(match) {
            return '.' + (classMapping[RegExp.$1] || RegExp.$1);
        });

        var style = rule.style;
        if (style.background) {
            var newBg = dataUriCssImages(cssPath, style.background);
            if (newBg != style.background) {
                addIEBackground(cssPath, style, style.background);
                style.background = newBg;
            }
        }
        if (style['background-image']) {
            var newBg = dataUriCssImages(cssPath, style['background-image']);
            if (newBg != style['background-image']) {
                addIEBackground(cssPath, style, style['background-image']);
                style['background-image'] = newBg;
            };
        }
    });
    return styleSheet + '';
}

function resolvePath (filePath) {
    var resolvedPath = mod._findPath(filePath,
        [path.dirname(state.currentPath)].concat(state.options.searchPaths));
    if (!resolvedPath) throw new Error('Path ' + filePath + ' not found.');
    return fs.realpathSync(resolvedPath);
}

function addFileToAstList (filePath, wrap) {
    state.required[filePath] = state.requiredCount++;
    var oldPath = state.currentPath;
    state.currentPath = filePath;
    var text = fs.readFileSync(filePath, 'utf8');
    // remove shebang
    text = text.replace(/^\#\!.*/, '');
    var ast;
    if (text.indexOf('@static_require noprocess') === -1) {
        if (wrap) {
            text = '(function(global, module, require) {var exports = this;' + text + '})';
        }
        ast = jsp.parse(text);
        ast = walker.with_walkers(walkers, function() {
            return walker.walk(ast);
        });
    } else {
        if (wrap) {
            text = '(function() {' + text + '})';
        }
        ast = jsp.parse(text);
    }
    state.currentPath = oldPath;
    state.requiredAsts[state.required[filePath]] = ast;
}

var CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
function generateNext(cur) {
    for (var i = cur.length - 1; i > -1; i--) {
        var index = CHARS.indexOf(cur.charAt(i));
        if (index < CHARS.length - 1) {
            return cur.substr(0, i) + CHARS.charAt(index + 1) + cur.substr(i + 1);
        }
    }
    var result = '';
    for (i = 0; i < cur.length + 1; i++) {
        result += CHARS.charAt(0);
    }
    return result;
}



function staticRequire (filePath, options) {
    state = exports.state = new_sate();
    filePath = fs.realpathSync(filePath);
    state.currentPath = filePath;
    var newOptions = {};
    options = Object.create(options || {});

    options.searchPaths = options.searchPaths ? options.searchPaths : [];
    options.searchPaths = [path.dirname(state.currentPath)].concat(options.searchPaths);

    options.serverRoot = options.serverRoot ?
        fs.realpathSync(options.serverRoot) :
        path.dirname(currentPath);

    state.options = options;

    state.requiredAsts = [];

    addFileToAstList(filePath, true);

    var code = 'var global = this;';
    code    += 'function require(index) { if (!require_cache[index]) {var module = require_cache[index] = {exports: {}}; require_modules[index].call(module.exports, global, module, require);} return require_cache[index].exports; }\n';
    code    += 'var require_modules = require.modules = []; var require_cache = require.cache = [];';
    var body = jsp.parse(code)[1];

    if (state.requiredCssUsed) {
        var map = {};
        var counts = {};
        state.cls.forEach(function(c) {
            c[1].split(/\s+/).forEach(function(c) {
                counts[c] ? counts[c]++ : (counts[c] = 1);
            });
        });
        var sequence = Object.keys(counts).sort(function(a, b) {
            return counts[b] - counts[a];
        });
        var mapping = 'a';
        sequence.forEach(function(c) {
             map[c] = options.squeeze ? mapping : (c + '_' + mapping);
             mapping = generateNext(mapping);
        });
        state.cls.forEach(function(c) {
            c[1] = c[1].split(/\s+/).map(function(c) {
                return map[c] || c;
            }).join(' ');
        });

        var code = state.requiredCssFiles.map(function(filePath) {
            return processCssIncludes(filePath, map);
        }).join('\n');
        body.push( ['var', [['__requiredCss', ['string', code]]]] );
    }

    for (var i=0; i < state.requiredCount; i++) {
        body[body.length] =
            [ 'stat',
                ['assign',
                    true,
                    ['sub',
                        ['name', 'require_modules'],
                        ['num', i]
                    ],
                    state.requiredAsts[i][1][0][1]
                ]
            ];
    };
    if (options.globalize) {
        var name = options.globalize || 'exports';
        body = body.concat(jsp.parse('global[' + JSON.stringify(name) + '] = require(0);')[1]);
    } else {
        body.push(['stat', ['call', ['name', 'require'], [['num', '0']]]]);
    }

    return [ 'toplevel',
      [ [ 'stat',
          [ 'call',
            [ 'function',
              null,
              [],
              body
            ],
            [] ] ] ] ];

}

exports.parse = staticRequire;

exports.getAppHandler = function(title, src) {
    return function(req, res) {
        res.send('<!DOCTYPE html><html><head><title>' + title + '</title>' +
            '<style>body, html { overflow: hidden; width: 100%; hieght: 100%; padding: 0; margin: 0; }</style>' +
            '</head><body>' +
            '<script src="' + src + '"></script>' +
        '</body></html>');
    };
};

exports.getHandler = function(options) {
    return function(req, res) {
        exports.handle(req, res, options);
    };
};

exports.handle = function(req, res, options) {
    options = options || {};
    var filePath = options.filePath || (url.parse(req.url).pathname.substr(1));
    if (!options.serverRoot) {
        options.serverRoot = process.cwd();
    }
    filePath = path.resolve(options.serverRoot, filePath);
    options.globalize = req.param('globalize');
    options.squeeze = req.param('squeeze');
    try {
        var ast = staticRequire(filePath, options);
        if (req.param('squeeze')) {
            ast = pro.ast_mangle(ast);
            ast = pro.ast_squeeze(ast);
            ast = pro.ast_squeeze_more(ast);
        }
        var code = pro.gen_code(ast, { beautify: !req.param('squeeze') });
    } catch (e) {
        require('util').error(e);
        var code = 'alert(' + JSON.stringify(e.stack + '. Current file ' + exports.state.currentPath) + ')';
        console.log(e.stack);
    }
    res.writeHead(200, {
        "Content-Type": 'application/javascript',
        "Content-Length": Buffer.byteLength(code, 'utf8')
    });
    res.end(req.method === "HEAD" ? "" : code);
};
