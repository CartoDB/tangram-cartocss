(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.CCSS = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = _dereq_('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":45}],2:[function(_dereq_,module,exports){

},{}],3:[function(_dereq_,module,exports){
(function (tree) {

tree.functions = {
    rgb: function (r, g, b) {
        return this.rgba(r, g, b, 1.0);
    },
    rgba: function (r, g, b, a) {
        var rgb = [r, g, b].map(function (c) { return number(c); });
        a = number(a);
        if (rgb.some(isNaN) || isNaN(a)) return null;
        return new tree.Color(rgb, a);
    },
    // Only require val
    stop: function (val) {
        var color, mode;
        if (arguments.length > 1) color = arguments[1];
        if (arguments.length > 2) mode = arguments[2];

        return {
            is: 'tag',
            val: val,
            color: color,
            mode: mode,
            toString: function(env) {
                return '\n\t<stop value="' + val.ev(env) + '"' +
                    (color ? ' color="' + color.ev(env) + '" ' : '') +
                    (mode ? ' mode="' + mode.ev(env) + '" ' : '') +
                    '/>';
            }
        };
    },
    hsl: function (h, s, l) {
        return this.hsla(h, s, l, 1.0);
    },
    hsla: function (h, s, l, a) {
        h = (number(h) % 360) / 360;
        s = number(s); l = number(l); a = number(a);
        if ([h, s, l, a].some(isNaN)) return null;

        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s,
            m1 = l * 2 - m2;

        return this.rgba(hue(h + 1/3) * 255,
                         hue(h)       * 255,
                         hue(h - 1/3) * 255,
                         a);

        function hue(h) {
            h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
            if      (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
            else if (h * 2 < 1) return m2;
            else if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
            else                return m1;
        }
    },
    hue: function (color) {
        if (!('toHSL' in color)) return null;
        return new tree.Dimension(Math.round(color.toHSL().h));
    },
    saturation: function (color) {
        if (!('toHSL' in color)) return null;
        return new tree.Dimension(Math.round(color.toHSL().s * 100), '%');
    },
    lightness: function (color) {
        if (!('toHSL' in color)) return null;
        return new tree.Dimension(Math.round(color.toHSL().l * 100), '%');
    },
    alpha: function (color) {
        if (!('toHSL' in color)) return null;
        return new tree.Dimension(color.toHSL().a);
    },
    saturate: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();

        hsl.s += amount.value / 100;
        hsl.s = clamp(hsl.s);
        return hsla(hsl);
    },
    desaturate: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();

        hsl.s -= amount.value / 100;
        hsl.s = clamp(hsl.s);
        return hsla(hsl);
    },
    lighten: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();

        hsl.l += amount.value / 100;
        hsl.l = clamp(hsl.l);
        return hsla(hsl);
    },
    darken: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();

        hsl.l -= amount.value / 100;
        hsl.l = clamp(hsl.l);
        return hsla(hsl);
    },
    fadein: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();

        hsl.a += amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    fadeout: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();

        hsl.a -= amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    spin: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();
        var hue = (hsl.h + amount.value) % 360;

        hsl.h = hue < 0 ? 360 + hue : hue;

        return hsla(hsl);
    },
    replace: function (entity, a, b) {
        if (entity.is === 'field') {
            return entity.toString + '.replace(' + a.toString() + ', ' + b.toString() + ')';
        } else {
            return entity.replace(a, b);
        }
    },
    //
    // Copyright (c) 2006-2009 Hampton Catlin, Nathan Weizenbaum, and Chris Eppstein
    // http://sass-lang.com
    //
    mix: function (color1, color2, weight) {
        var p = weight.value / 100.0;
        var w = p * 2 - 1;
        var a = color1.toHSL().a - color2.toHSL().a;

        var w1 = (((w * a == -1) ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
        var w2 = 1 - w1;

        var rgb = [color1.rgb[0] * w1 + color2.rgb[0] * w2,
                   color1.rgb[1] * w1 + color2.rgb[1] * w2,
                   color1.rgb[2] * w1 + color2.rgb[2] * w2];

        var alpha = color1.alpha * p + color2.alpha * (1 - p);

        return new tree.Color(rgb, alpha);
    },
    greyscale: function (color) {
        return this.desaturate(color, new tree.Dimension(100));
    },
    '%': function (quoted /* arg, arg, ...*/) {
        var args = Array.prototype.slice.call(arguments, 1),
            str = quoted.value;

        for (var i = 0; i < args.length; i++) {
            str = str.replace(/%s/,    args[i].value)
                     .replace(/%[da]/, args[i].toString());
        }
        str = str.replace(/%%/g, '%');
        return new tree.Quoted(str);
    }
};

var image_filter_functors = [
    'emboss', 'blur', 'gray', 'sobel', 'edge-detect',
    'x-gradient', 'y-gradient', 'sharpen'];

for (var i = 0; i < image_filter_functors.length; i++) {
    var f = image_filter_functors[i];
    tree.functions[f] = (function(f) {
        return function() {
            return new tree.ImageFilter(f);
        };
    })(f);
}

tree.functions['agg-stack-blur'] = function(x, y) {
    return new tree.ImageFilter('agg-stack-blur', [x, y]);
};

tree.functions['scale-hsla'] = function(h0,h1,s0,s1,l0,l1,a0,a1) {
    return new tree.ImageFilter('scale-hsla', [h0,h1,s0,s1,l0,l1,a0,a1]);
};

function hsla(h) {
    return tree.functions.hsla(h.h, h.s, h.l, h.a);
}

function number(n) {
    if (n instanceof tree.Dimension) {
        return parseFloat(n.unit == '%' ? n.value / 100 : n.value);
    } else if (typeof(n) === 'number') {
        return n;
    } else {
        return NaN;
    }
}

function clamp(val) {
    return Math.min(1, Math.max(0, val));
}

})(_dereq_('./tree'));

},{"./tree":9}],4:[function(_dereq_,module,exports){
(function (process,__dirname){
var util = _dereq_('util'),
    fs = _dereq_('fs'),
    path = _dereq_('path');


function getVersion() {
    if (process.browser) {
        return _dereq_('../../package.json').version.split('.');
    } else if (parseInt(process.version.split('.')[1], 10) > 4) {
        return _dereq_('../../package.json').version.split('.');
    } else {
        // older node
        var package_json = JSON.parse(fs.readFileSync(path.join(__dirname,'../../package.json')));
        return package_json.version.split('.');
    }
}

var carto = {
    version: getVersion(),
    Parser: _dereq_('./parser').Parser,
    Renderer: _dereq_('./renderer').Renderer,
    tree: _dereq_('./tree'),
    RendererJS: _dereq_('./renderer_js'),
    default_reference: _dereq_('./torque-reference'),

    // @TODO
    writeError: function(ctx, options) {
        var message = '';
        var extract = ctx.extract;
        var error = [];

        options = options || {};

        if (options.silent) { return; }

        options.indent = options.indent || '';

        if (!('index' in ctx) || !extract) {
            return util.error(options.indent + (ctx.stack || ctx.message));
        }

        if (typeof(extract[0]) === 'string') {
            error.push(stylize((ctx.line - 1) + ' ' + extract[0], 'grey'));
        }

        if (extract[1] === '' && typeof extract[2] === 'undefined') {
            extract[1] = '¶';
        }
        error.push(ctx.line + ' ' + extract[1].slice(0, ctx.column) +
            stylize(stylize(extract[1][ctx.column], 'bold') +
            extract[1].slice(ctx.column + 1), 'yellow'));

        if (typeof(extract[2]) === 'string') {
            error.push(stylize((ctx.line + 1) + ' ' + extract[2], 'grey'));
        }
        error = options.indent + error.join('\n' + options.indent) + '\033[0m\n';

        message = options.indent + message + stylize(ctx.message, 'red');
        if (ctx.filename) (message += stylize(' in ', 'red') + ctx.filename);

        util.error(message, error);

        if (ctx.callLine) {
            util.error(stylize('from ', 'red') + (ctx.filename || ''));
            util.error(stylize(ctx.callLine, 'grey') + ' ' + ctx.callExtract);
        }
        if (ctx.stack) { util.error(stylize(ctx.stack, 'red')); }
    }
};

_dereq_('./tree/call');
_dereq_('./tree/color');
_dereq_('./tree/comment');
_dereq_('./tree/definition');
_dereq_('./tree/dimension');
_dereq_('./tree/element');
_dereq_('./tree/expression');
_dereq_('./tree/filterset');
_dereq_('./tree/filter');
_dereq_('./tree/field');
_dereq_('./tree/keyword');
_dereq_('./tree/layer');
_dereq_('./tree/literal');
_dereq_('./tree/operation');
_dereq_('./tree/quoted');
_dereq_('./tree/imagefilter');
_dereq_('./tree/reference');
_dereq_('./tree/rule');
_dereq_('./tree/ruleset');
_dereq_('./tree/selector');
_dereq_('./tree/style');
_dereq_('./tree/url');
_dereq_('./tree/value');
_dereq_('./tree/variable');
_dereq_('./tree/zoom');
_dereq_('./tree/invalid');
_dereq_('./tree/fontset');
_dereq_('./tree/frame_offset');
_dereq_('./functions');

for (var k in carto) { exports[k] = carto[k]; }

// Stylize a string
function stylize(str, style) {
    var styles = {
        'bold' : [1, 22],
        'inverse' : [7, 27],
        'underline' : [4, 24],
        'yellow' : [33, 39],
        'green' : [32, 39],
        'red' : [31, 39],
        'grey' : [90, 39]
    };
    return '\033[' + styles[style][0] + 'm' + str +
           '\033[' + styles[style][1] + 'm';
}

}).call(this,_dereq_('_process'),"/node_modules/carto/lib/carto")

},{"../../package.json":38,"./functions":3,"./parser":5,"./renderer":6,"./renderer_js":7,"./torque-reference":8,"./tree":9,"./tree/call":10,"./tree/color":11,"./tree/comment":12,"./tree/definition":13,"./tree/dimension":14,"./tree/element":15,"./tree/expression":16,"./tree/field":17,"./tree/filter":18,"./tree/filterset":19,"./tree/fontset":20,"./tree/frame_offset":21,"./tree/imagefilter":22,"./tree/invalid":23,"./tree/keyword":24,"./tree/layer":25,"./tree/literal":26,"./tree/operation":27,"./tree/quoted":28,"./tree/reference":29,"./tree/rule":30,"./tree/ruleset":31,"./tree/selector":32,"./tree/style":33,"./tree/url":34,"./tree/value":35,"./tree/variable":36,"./tree/zoom":37,"_process":41,"fs":2,"path":40,"util":45}],5:[function(_dereq_,module,exports){
(function (global){
var carto = exports,
    tree = _dereq_('./tree'),
    _ = global._ || _dereq_('underscore');

//    Token matching is done with the `$` function, which either takes
//    a terminal string or regexp, or a non-terminal function to call.
//    It also takes care of moving all the indices forwards.
carto.Parser = function Parser(env) {
    var input,       // LeSS input string
        i,           // current index in `input`
        j,           // current chunk
        temp,        // temporarily holds a chunk's state, for backtracking
        memo,        // temporarily holds `i`, when backtracking
        furthest,    // furthest index the parser has gone to
        chunks,      // chunkified input
        current,     // index of current chunk, in `input`
        parser;

    var that = this;

    // This function is called after all files
    // have been imported through `@import`.
    var finish = function() {};

    function save()    {
        temp = chunks[j];
        memo = i;
        current = i;
    }
    function restore() {
        chunks[j] = temp;
        i = memo;
        current = i;
    }

    function sync() {
        if (i > current) {
            chunks[j] = chunks[j].slice(i - current);
            current = i;
        }
    }
    //
    // Parse from a token, regexp or string, and move forward if match
    //
    function $(tok) {
        var match, args, length, c, index, endIndex, k;

        // Non-terminal
        if (tok instanceof Function) {
            return tok.call(parser.parsers);
        // Terminal
        // Either match a single character in the input,
        // or match a regexp in the current chunk (chunk[j]).
        } else if (typeof(tok) === 'string') {
            match = input.charAt(i) === tok ? tok : null;
            length = 1;
            sync();
        } else {
            sync();

            match = tok.exec(chunks[j]);
            if (match) {
                length = match[0].length;
            } else {
                return null;
            }
        }

        // The match is confirmed, add the match length to `i`,
        // and consume any extra white-space characters (' ' || '\n')
        // which come after that. The reason for this is that LeSS's
        // grammar is mostly white-space insensitive.
        if (match) {
            var mem = i += length;
            endIndex = i + chunks[j].length - length;

            while (i < endIndex) {
                c = input.charCodeAt(i);
                if (! (c === 32 || c === 10 || c === 9)) { break; }
                i++;
            }
            chunks[j] = chunks[j].slice(length + (i - mem));
            current = i;

            if (chunks[j].length === 0 && j < chunks.length - 1) { j++; }

            if (typeof(match) === 'string') {
                return match;
            } else {
                return match.length === 1 ? match[0] : match;
            }
        }
    }

    // Same as $(), but don't change the state of the parser,
    // just return the match.
    function peek(tok) {
        if (typeof(tok) === 'string') {
            return input.charAt(i) === tok;
        } else {
            return !!tok.test(chunks[j]);
        }
    }

    function extractErrorLine(style, errorIndex) {
        return (style.slice(0, errorIndex).match(/\n/g) || '').length + 1;
    }


    // Make an error object from a passed set of properties.
    // Accepted properties:
    // - `message`: Text of the error message.
    // - `filename`: Filename where the error occurred.
    // - `index`: Char. index where the error occurred.
    function makeError(err) {
        var einput;
        var errorTemplate;

        _.defaults(err, {
            index: furthest,
            filename: env.filename,
            message: 'Parse error.',
            line: 0,
            column: -1
        });

        if (err.filename && that.env.inputs && that.env.inputs[err.filename]) {
            einput = that.env.inputs[err.filename];
        } else {
            einput = input;
        }

        err.line = extractErrorLine(einput, err.index);
        for (var n = err.index; n >= 0 && einput.charAt(n) !== '\n'; n--) {
            err.column++;
        }
        errorTemplate = _.template('<%=filename%>:<%=line%>:<%=column%> <%=message%>');
        return new Error(errorTemplate(err));
    }

    this.env = env = env || {};
    this.env.filename = this.env.filename || null;
    this.env.inputs = this.env.inputs || {};

    // The Parser
    parser = {

        extractErrorLine: extractErrorLine,
        //
        // Parse an input string into an abstract syntax tree.
        // Throws an error on parse errors.
        parse: function(str) {
            var root, start, end, zone, line, lines, buff = [], c, error = null;

            i = j = current = furthest = 0;
            chunks = [];
            input = str.replace(/\r\n/g, '\n');
            if (env.filename) {
                that.env.inputs[env.filename] = input;
            }

            var early_exit = false;

            // Split the input into chunks.
            chunks = (function (chunks) {
                var j = 0,
                    skip = /(?:@\{[\w-]+\}|[^"'`\{\}\/\(\)\\])+/g,
                    comment = /\/\*(?:[^*]|\*+[^\/*])*\*+\/|\/\/.*/g,
                    string = /"((?:[^"\\\r\n]|\\.)*)"|'((?:[^'\\\r\n]|\\.)*)'|`((?:[^`]|\\.)*)`/g,
                    level = 0,
                    match,
                    chunk = chunks[0],
                    inParam;

                for (var i = 0, c, cc; i < input.length;) {
                    skip.lastIndex = i;
                    if (match = skip.exec(input)) {
                        if (match.index === i) {
                            i += match[0].length;
                            chunk.push(match[0]);
                        }
                    }
                    c = input.charAt(i);
                    comment.lastIndex = string.lastIndex = i;

                    if (match = string.exec(input)) {
                        if (match.index === i) {
                            i += match[0].length;
                            chunk.push(match[0]);
                            continue;
                        }
                    }

                    if (!inParam && c === '/') {
                        cc = input.charAt(i + 1);
                        if (cc === '/' || cc === '*') {
                            if (match = comment.exec(input)) {
                                if (match.index === i) {
                                    i += match[0].length;
                                    chunk.push(match[0]);
                                    continue;
                                }
                            }
                        }
                    }

                    switch (c) {
                        case '{': if (! inParam) { level ++;        chunk.push(c);                           break; }
                        case '}': if (! inParam) { level --;        chunk.push(c); chunks[++j] = chunk = []; break; }
                        case '(': if (! inParam) { inParam = true;  chunk.push(c);                           break; }
                        case ')': if (  inParam) { inParam = false; chunk.push(c);                           break; }
                        default:                                    chunk.push(c);
                    }

                    i++;
                }
                if (level !== 0) {
                    error = {
                        index: i - 1,
                        type: 'Parse',
                        message: (level > 0) ? "missing closing `}`" : "missing opening `{`"
                    };
                }

                return chunks.map(function (c) { return c.join(''); });
            })([[]]);

            if (error) {
                throw makeError(error);
            }

            // Start with the primary rule.
            // The whole syntax tree is held under a Ruleset node,
            // with the `root` property set to true, so no `{}` are
            // output.
            root = new tree.Ruleset([], $(this.parsers.primary));
            root.root = true;

            // Get an array of Ruleset objects, flattened
            // and sorted according to specificitySort
            root.toList = (function() {
                var line, lines, column;
                return function(env) {
                    env.error = function(e) {
                        if (!env.errors) env.errors = new Error('');
                        if (env.errors.message) {
                            env.errors.message += '\n' + makeError(e).message;
                        } else {
                            env.errors.message = makeError(e).message;
                        }
                    };
                    env.frames = env.frames || [];


                    // call populates Invalid-caused errors
                    var definitions = this.flatten([], [], env);
                    definitions.sort(specificitySort);
                    return definitions;
                };
            })();

            // Sort rules by specificity: this function expects selectors to be
            // split already.
            //
            // Written to be used as a .sort(Function);
            // argument.
            //
            // [1, 0, 0, 467] > [0, 0, 1, 520]
            var specificitySort = function(a, b) {
                var as = a.specificity;
                var bs = b.specificity;

                if (as[0] != bs[0]) return bs[0] - as[0];
                if (as[1] != bs[1]) return bs[1] - as[1];
                if (as[2] != bs[2]) return bs[2] - as[2];
                return bs[3] - as[3];
            };

            return root;
        },

        // Here in, the parsing rules/functions
        //
        // The basic structure of the syntax tree generated is as follows:
        //
        //   Ruleset ->  Rule -> Value -> Expression -> Entity
        //
        //  In general, most rules will try to parse a token with the `$()` function, and if the return
        //  value is truly, will return a new node, of the relevant type. Sometimes, we need to check
        //  first, before parsing, that's when we use `peek()`.
        parsers: {
            // The `primary` rule is the *entry* and *exit* point of the parser.
            // The rules here can appear at any level of the parse tree.
            //
            // The recursive nature of the grammar is an interplay between the `block`
            // rule, which represents `{ ... }`, the `ruleset` rule, and this `primary` rule,
            // as represented by this simplified grammar:
            //
            //     primary  →  (ruleset | rule)+
            //     ruleset  →  selector+ block
            //     block    →  '{' primary '}'
            //
            // Only at one point is the primary rule not called from the
            // block rule: at the root level.
            primary: function() {
                var node, root = [];

                while ((node = $(this.rule) || $(this.ruleset) ||
                               $(this.comment)) ||
                               $(/^[\s\n]+/) || (node = $(this.invalid))) {
                    if (node) root.push(node);
                }
                return root;
            },

            invalid: function () {
                var chunk = $(/^[^;\n]*[;\n]/);

                // To fail gracefully, match everything until a semicolon or linebreak.
                if (chunk) {
                    return new tree.Invalid(chunk, memo);
                }
            },

            // We create a Comment node for CSS comments `/* */`,
            // but keep the LeSS comments `//` silent, by just skipping
            // over them.
            comment: function() {
                var comment;

                if (input.charAt(i) !== '/') return;

                if (input.charAt(i + 1) === '/') {
                    return new tree.Comment($(/^\/\/.*/), true);
                } else if (comment = $(/^\/\*(?:[^*]|\*+[^\/*])*\*+\/\n?/)) {
                    return new tree.Comment(comment);
                }
            },

            // Entities are tokens which can be found inside an Expression
            entities: {

                // A string, which supports escaping " and ' "milky way" 'he\'s the one!'
                quoted: function() {
                    if (input.charAt(i) !== '"' && input.charAt(i) !== "'") return;
                    var str = $(/^"((?:[^"\\\r\n]|\\.)*)"|'((?:[^'\\\r\n]|\\.)*)'/);
                    if (str) {
                        return new tree.Quoted(str[1] || str[2]);
                    }
                },

                // A reference to a Mapnik field, like [NAME]
                // Behind the scenes, this has the same representation, but Carto
                // needs to be careful to warn when unsupported operations are used.
                field: function() {
                    if (! $('[')) return;
                    var field_name = $(/(^[^\]]+)/);
                    if (! $(']')) return;
                    if (field_name) return new tree.Field(field_name[1]);
                },

                // This is a comparison operator
                comparison: function() {
                    var str = $(/^=~|=|!=|<=|>=|<|>/);
                    if (str) {
                        return str;
                    }
                },

                // A catch-all word, such as: hard-light
                // These can start with either a letter or a dash (-),
                // and then contain numbers, underscores, and letters.
                keyword: function() {
                    var k = $(/^[A-Za-z-]+[A-Za-z-0-9_]*/);
                    if (k) { return new tree.Keyword(k); }
                },

                // A function call like rgb(255, 0, 255)
                // The arguments are parsed with the `entities.arguments` parser.
                call: function() {
                    var name, args;

                    if (!(name = /^([\w\-]+|%)\(/.exec(chunks[j]))) return;

                    name = name[1];

                    if (name === 'url') {
                        // url() is handled by the url parser instead
                        return null;
                    } else {
                        i += name.length;
                    }

                    $('('); // Parse the '(' and consume whitespace.

                    args = $(this.entities['arguments']);

                    if (!$(')')) return;

                    if (name) {
                        return new tree.Call(name, args, i);
                    }
                },
                // Arguments are comma-separated expressions
                'arguments': function() {
                    var args = [], arg;

                    while (arg = $(this.expression)) {
                        args.push(arg);
                        if (! $(',')) { break; }
                    }

                    return args;
                },
                literal: function() {
                    return $(this.entities.dimension) ||
                        $(this.entities.keywordcolor) ||
                        $(this.entities.hexcolor) ||
                        $(this.entities.quoted);
                },

                // Parse url() tokens
                //
                // We use a specific rule for urls, because they don't really behave like
                // standard function calls. The difference is that the argument doesn't have
                // to be enclosed within a string, so it can't be parsed as an Expression.
                url: function() {
                    var value;

                    if (input.charAt(i) !== 'u' || !$(/^url\(/)) return;
                    value = $(this.entities.quoted) || $(this.entities.variable) ||
                            $(/^[\-\w%@$\/.&=:;#+?~]+/) || '';
                    if (! $(')')) {
                        return new tree.Invalid(value, memo, 'Missing closing ) in URL.');
                    } else {
                        return new tree.URL((typeof value.value !== 'undefined' ||
                            value instanceof tree.Variable) ?
                            value : new tree.Quoted(value));
                    }
                },

                // A Variable entity, such as `@fink`, in
                //
                //     width: @fink + 2px
                //
                // We use a different parser for variable definitions,
                // see `parsers.variable`.
                variable: function() {
                    var name, index = i;

                    if (input.charAt(i) === '@' && (name = $(/^@[\w-]+/))) {
                        return new tree.Variable(name, index, env.filename);
                    }
                },

                hexcolor: function() {
                    var rgb;
                    if (input.charAt(i) === '#' && (rgb = $(/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/))) {
                        return new tree.Color(rgb[1]);
                    }
                },

                keywordcolor: function() {
                    var rgb = chunks[j].match(/^[a-z]+/);
                    if (rgb && rgb[0] in tree.Reference.data.colors) {
                        return new tree.Color(tree.Reference.data.colors[$(/^[a-z]+/)]);
                    }
                },

                // A Dimension, that is, a number and a unit. The only
                // unit that has an effect is %
                dimension: function() {
                    var c = input.charCodeAt(i);
                    if ((c > 57 || c < 45) || c === 47) return;
                    var value = $(/^(-?\d*\.?\d+(?:[eE][-+]?\d+)?)(\%|\w+)?/);
                    if (value) {
                        return new tree.Dimension(value[1], value[2], memo);
                    }
                }

            },

            // The variable part of a variable definition.
            // Used in the `rule` parser. Like @fink:
            variable: function() {
                var name;

                if (input.charAt(i) === '@' && (name = $(/^(@[\w-]+)\s*:/))) {
                    return name[1];
                }
            },

            // Entities are the smallest recognized token,
            // and can be found inside a rule's value.
            entity: function() {
                return $(this.entities.call) ||
                    $(this.entities.literal) ||
                    $(this.entities.field) ||
                    $(this.entities.variable) ||
                    $(this.entities.url) ||
                    $(this.entities.keyword);
            },

            // A Rule terminator. Note that we use `peek()` to check for '}',
            // because the `block` rule will be expecting it, but we still need to make sure
            // it's there, if ';' was ommitted.
            end: function() {
                return $(';') || peek('}');
            },

            // Elements are the building blocks for Selectors. They consist of
            // an element name, such as a tag a class, or `*`.
            element: function() {
                var e = $(/^(?:[.#][\w\-]+|\*|Map)/);
                if (e) return new tree.Element(e);
            },

            // Attachments allow adding multiple lines, polygons etc. to an
            // object. There can only be one attachment per selector.
            attachment: function() {
                var s = $(/^::([\w\-]+(?:\/[\w\-]+)*)/);
                if (s) return s[1];
            },

            // Selectors are made out of one or more Elements, see above.
            selector: function() {
                var a, attachment,
                    e, elements = [],
                    f, filters = new tree.Filterset(),
                    z, zooms = [],
                    frame_offset = tree.FrameOffset.none;
                    segments = 0, conditions = 0;

                while (
                        (e = $(this.element)) ||
                        (z = $(this.zoom)) ||
                        (fo = $(this.frame_offset)) ||
                        (f = $(this.filter)) ||
                        (a = $(this.attachment))
                    ) {
                    segments++;
                    if (e) {
                        elements.push(e);
                    } else if (z) {
                        zooms.push(z);
                        conditions++;
                    } else if (fo) {
                        frame_offset = fo;
                        conditions++;
                    } else if (f) {
                        var err = filters.add(f);
                        if (err) {
                            throw makeError({
                                message: err,
                                index: i - 1
                            });
                        }
                        conditions++;
                    } else if (attachment) {
                        throw makeError({
                            message: 'Encountered second attachment name.',
                            index: i - 1
                        });
                    } else {
                        attachment = a;
                    }

                    var c = input.charAt(i);
                    if (c === '{' || c === '}' || c === ';' || c === ',') { break; }
                }

                if (segments) {
                    return new tree.Selector(filters, zooms, frame_offset, elements, attachment, conditions, memo);
                }
            },

            filter: function() {
                save();
                var key, op, val;
                if (! $('[')) return;
                if (key = $(/^[a-zA-Z0-9\-_]+/) ||
                    $(this.entities.quoted) ||
                    $(this.entities.variable) ||
                    $(this.entities.keyword) ||
                    $(this.entities.field)) {
                    // TODO: remove at 1.0.0
                    if (key instanceof tree.Quoted) {
                        key = new tree.Field(key.toString());
                    }
                    if ((op = $(this.entities.comparison)) &&
                        (val = $(this.entities.quoted) ||
                             $(this.entities.variable) ||
                             $(this.entities.dimension) ||
                             $(this.entities.keyword) ||
                             $(this.entities.field))) {
                        if (! $(']')) {
                            throw makeError({
                                message: 'Missing closing ] of filter.',
                                index: memo - 1
                            });
                        }
                        if (!key.is) key = new tree.Field(key);
                        return new tree.Filter(key, op, val, memo, env.filename);
                    }
                }
            },

            frame_offset: function() {
                save();
                var op, val;
                if ($(/^\[\s*frame-offset/g) &&
                    (op = $(this.entities.comparison)) &&
                    (val = $(/^\d+/)) &&
                    $(']'))  {
                        return tree.FrameOffset(op, val, memo);
                }
            },

            zoom: function() {
                save();
                var op, val;
                if ($(/^\[\s*zoom/g) &&
                    (op = $(this.entities.comparison)) &&
                    (val = $(this.entities.variable) || $(this.entities.dimension)) && $(']')) {
                        return new tree.Zoom(op, val, memo);
                } else {
                    // backtrack
                    restore();
                }
            },

            // The `block` rule is used by `ruleset`
            // It's a wrapper around the `primary` rule, with added `{}`.
            block: function() {
                var content;

                if ($('{') && (content = $(this.primary)) && $('}')) {
                    return content;
                }
            },

            // div, .class, body > p {...}
            ruleset: function() {
                var selectors = [], s, f, l, rules, filters = [];
                save();

                while (s = $(this.selector)) {
                    selectors.push(s);
                    while ($(this.comment)) {}
                    if (! $(',')) { break; }
                    while ($(this.comment)) {}
                }
                if (s) {
                    while ($(this.comment)) {}
                }

                if (selectors.length > 0 && (rules = $(this.block))) {
                    if (selectors.length === 1 &&
                        selectors[0].elements.length &&
                        selectors[0].elements[0].value === 'Map') {
                        var rs = new tree.Ruleset(selectors, rules);
                        rs.isMap = true;
                        return rs;
                    }
                    return new tree.Ruleset(selectors, rules);
                } else {
                    // Backtrack
                    restore();
                }
            },

            rule: function() {
                var name, value, c = input.charAt(i);
                save();

                if (c === '.' || c === '#') { return; }

                if (name = $(this.variable) || $(this.property)) {
                    value = $(this.value);

                    if (value && $(this.end)) {
                        return new tree.Rule(name, value, memo, env.filename);
                    } else {
                        furthest = i;
                        restore();
                    }
                }
            },

            font: function() {
                var value = [], expression = [], weight, font, e;

                while (e = $(this.entity)) {
                    expression.push(e);
                }

                value.push(new tree.Expression(expression));

                if ($(',')) {
                    while (e = $(this.expression)) {
                        value.push(e);
                        if (! $(',')) { break; }
                    }
                }
                return new tree.Value(value);
            },

            // A Value is a comma-delimited list of Expressions
            // In a Rule, a Value represents everything after the `:`,
            // and before the `;`.
            value: function() {
                var e, expressions = [];

                while (e = $(this.expression)) {
                    expressions.push(e);
                    if (! $(',')) { break; }
                }

                if (expressions.length > 1) {
                    return new tree.Value(expressions.map(function(e) {
                        return e.value[0];
                    }));
                } else if (expressions.length === 1) {
                    return new tree.Value(expressions);
                }
            },
            // A sub-expression, contained by parenthensis
            sub: function() {
                var e, expressions = [];

                if ($('(')) {
                  while (e = $(this.expression)) {
                      expressions.push(e);
                      if (! $(',')) { break; }
                  }
                  $(')');
                }

                if (expressions.length > 1) {
                    return new tree.Value(expressions.map(function(e) {
                        return e.value[0];
                    }));
                } else if (expressions.length === 1) {
                    return new tree.Value(expressions);
                }
            },
            // This is a misnomer because it actually handles multiplication
            // and division.
            multiplication: function() {
                var m, a, op, operation;
                if (m = $(this.operand)) {
                    while ((op = ($('/') || $('*') || $('%'))) && (a = $(this.operand))) {
                        operation = new tree.Operation(op, [operation || m, a], memo);
                    }
                    return operation || m;
                }
            },
            addition: function() {
                var m, a, op, operation;
                if (m = $(this.multiplication)) {
                    while ((op = $(/^[-+]\s+/) || (input.charAt(i - 1) != ' ' && ($('+') || $('-')))) &&
                           (a = $(this.multiplication))) {
                        operation = new tree.Operation(op, [operation || m, a], memo);
                    }
                    return operation || m;
                }
            },

            // An operand is anything that can be part of an operation,
            // such as a Color, or a Variable
            operand: function() {
                return $(this.sub) || $(this.entity);
            },

            // Expressions either represent mathematical operations,
            // or white-space delimited Entities.  @var * 2
            expression: function() {
                var e, delim, entities = [], d;

                while (e = $(this.addition) || $(this.entity)) {
                    entities.push(e);
                }

                if (entities.length > 0) {
                    return new tree.Expression(entities);
                }
            },
            property: function() {
                var name = $(/^(([a-z][-a-z_0-9]*\/)?\*?-?[-a-z_0-9]+)\s*:/);
                if (name) return name[1];
            }
        }
    };
    return parser;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./tree":9,"underscore":42}],6:[function(_dereq_,module,exports){
(function (global){
var _ = global._ || _dereq_('underscore');
var carto = _dereq_('./index');

carto.Renderer = function Renderer(env, options) {
    this.env = env || {};
    this.options = options || {};
    this.options.mapnik_version = this.options.mapnik_version || '3.0.0';
};

/**
 * Prepare a MSS document (given as an string) into a
 * XML Style fragment (mostly useful for debugging)
 *
 * @param {String} data the mss contents as a string.
 */
carto.Renderer.prototype.renderMSS = function render(data) {
    // effects is a container for side-effects, which currently
    // are limited to FontSets.
    var env = _.defaults(this.env, {
        benchmark: false,
        validation_data: false,
        effects: []
    });

    if (!carto.tree.Reference.setVersion(this.options.mapnik_version)) {
        throw new Error("Could not set mapnik version to " + this.options.mapnik_version);
    }

    var output = [];
    var styles = [];

    if (env.benchmark) console.time('Parsing MSS');
    var parser = (carto.Parser(env)).parse(data);
    if (env.benchmark) console.timeEnd('Parsing MSS');

    if (env.benchmark) console.time('Rule generation');
    var rule_list = parser.toList(env);
    if (env.benchmark) console.timeEnd('Rule generation');

    if (env.benchmark) console.time('Rule inheritance');
    var rules = inheritDefinitions(rule_list, env);
    if (env.benchmark) console.timeEnd('Rule inheritance');

    if (env.benchmark) console.time('Style sort');
    var sorted = sortStyles(rules,env);
    if (env.benchmark) console.timeEnd('Style sort');

    if (env.benchmark) console.time('Total Style generation');
    for (var k = 0, rule, style_name; k < sorted.length; k++) {
        rule = sorted[k];
        style_name = 'style' + (rule.attachment !== '__default__' ? '-' + rule.attachment : '');
        styles.push(style_name);
        var bench_name = '\tStyle "'+style_name+'" (#'+k+') toXML';
        if (env.benchmark) console.time(bench_name);
        // env.effects can be modified by this call
        output.push(carto.tree.StyleXML(style_name, rule.attachment, rule, env));
        if (env.benchmark) console.timeEnd(bench_name);
    }
    if (env.benchmark) console.timeEnd('Total Style generation');
    if (env.errors) throw env.errors;
    return output.join('\n');
};

/**
 * Prepare a MML document (given as an object) into a
 * fully-localized XML file ready for Mapnik2 consumption
 *
 * @param {String} m - the JSON file as a string.
 */
carto.Renderer.prototype.render = function render(m) {
    // effects is a container for side-effects, which currently
    // are limited to FontSets.
    var env = _.defaults(this.env, {
        benchmark: false,
        validation_data: false,
        effects: [],
        ppi: 90.714
    });

    if (!carto.tree.Reference.setVersion(this.options.mapnik_version)) {
        throw new Error("Could not set mapnik version to " + this.options.mapnik_version);
    }

    var output = [];

    // Transform stylesheets into definitions.
    var definitions = _.chain(m.Stylesheet)
        .map(function(s) {
            if (typeof s == 'string') {
                throw new Error("Stylesheet object is expected not a string: '" + s + "'");
            }
            // Passing the environment from stylesheet to stylesheet,
            // allows frames and effects to be maintained.
            env = _.extend(env, {filename:s.id});

            var time = +new Date(),
                root = (carto.Parser(env)).parse(s.data);
            if (env.benchmark)
                console.warn('Parsing time: ' + (new Date() - time) + 'ms');
            return root.toList(env);
        })
        .flatten()
        .value();

    function appliesTo(name, classIndex) {
        return function(definition) {
            return definition.appliesTo(l.name, classIndex);
        };
    }

    // Iterate through layers and create styles custom-built
    // for each of them, and apply those styles to the layers.
    var styles, l, classIndex, rules, sorted, matching;
    for (var i = 0; i < m.Layer.length; i++) {
        l = m.Layer[i];
        styles = [];
        classIndex = {};

        if (env.benchmark) console.warn('processing layer: ' + l.id);
        // Classes are given as space-separated alphanumeric strings.
        var classes = (l['class'] || '').split(/\s+/g);
        for (var j = 0; j < classes.length; j++) {
            classIndex[classes[j]] = true;
        }
        matching = definitions.filter(appliesTo(l.name, classIndex));
        rules = inheritDefinitions(matching, env);
        sorted = sortStyles(rules, env);

        for (var k = 0, rule, style_name; k < sorted.length; k++) {
            rule = sorted[k];
            style_name = l.name + (rule.attachment !== '__default__' ? '-' + rule.attachment : '');

            // env.effects can be modified by this call
            var styleXML = carto.tree.StyleXML(style_name, rule.attachment, rule, env);

            if (styleXML) {
                output.push(styleXML);
                styles.push(style_name);
            }
        }

        output.push(carto.tree.LayerXML(l, styles));
    }

    output.unshift(env.effects.map(function(e) {
        return e.toXML(env);
    }).join('\n'));

    var map_properties = getMapProperties(m, definitions, env);

    // Exit on errors.
    if (env.errors) throw env.errors;

    // Pass TileJSON and other custom parameters through to Mapnik XML.
    var parameters = _.reduce(m, function(memo, v, k) {
        if (!v && v !== 0) return memo;

        switch (k) {
        // Known skippable properties.
        case 'srs':
        case 'Layer':
        case 'Stylesheet':
            break;
        // Non URL-bound TileJSON properties.
        case 'bounds':
        case 'center':
        case 'minzoom':
        case 'maxzoom':
        case 'version':
            memo.push('  <Parameter name="' + k + '">' + v + '</Parameter>');
            break;
        // Properties that require CDATA.
        case 'name':
        case 'description':
        case 'legend':
        case 'attribution':
        case 'template':
            memo.push('  <Parameter name="' + k + '"><![CDATA[' + v + ']]></Parameter>');
            break;
        // Mapnik image format.
        case 'format':
            memo.push('  <Parameter name="' + k + '">' + v + '</Parameter>');
            break;
        // Mapnik interactivity settings.
        case 'interactivity':
            memo.push('  <Parameter name="interactivity_layer">' + v.layer + '</Parameter>');
            memo.push('  <Parameter name="interactivity_fields">' + v.fields + '</Parameter>');
            break;
        // Support any additional scalar properties.
        default:
            if ('string' === typeof v) {
                memo.push('  <Parameter name="' + k + '"><![CDATA[' + v + ']]></Parameter>');
            } else if ('number' === typeof v) {
                memo.push('  <Parameter name="' + k + '">' + v + '</Parameter>');
            } else if ('boolean' === typeof v) {
                memo.push('  <Parameter name="' + k + '">' + v + '</Parameter>');
            }
            break;
        }
        return memo;
    }, []);
    if (parameters.length) output.unshift(
        '<Parameters>\n' +
        parameters.join('\n') +
        '\n</Parameters>\n'
    );

    var properties = _.map(map_properties, function(v) { return ' ' + v; }).join('');

    output.unshift(
        '<?xml version="1.0" ' +
        'encoding="utf-8"?>\n' +
        '<!DOCTYPE Map[]>\n' +
        '<Map' + properties +'>\n');
    output.push('</Map>');
    return output.join('\n');
};

/**
 * This function currently modifies 'current'
 * @param {Array}  current  current list of rules
 * @param {Object} definition a Definition object to add to the rules
 * @param {Object} byFilter an object/dictionary of existing filters. This is
 * actually keyed `attachment->filter`
 * @param {Object} env the current environment
*/
function addRules(current, definition, byFilter, env) {
    var newFilters = definition.filters,
        newRules = definition.rules,
        updatedFilters, clone, previous;

    // The current definition might have been split up into
    // multiple definitions already.
    for (var k = 0; k < current.length; k++) {
        updatedFilters = current[k].filters.cloneWith(newFilters);
        if (updatedFilters) {
            previous = byFilter[updatedFilters];
            if (previous) {
                // There's already a definition with those exact
                // filters. Add the current definitions' rules
                // and stop processing it as the existing rule
                // has already gone down the inheritance chain.
                previous.addRules(newRules);
            } else {
                clone = current[k].clone(updatedFilters);
                // Make sure that we're only maintaining the clone
                // when we did actually add rules. If not, there's
                // no need to keep the clone around.
                if (clone.addRules(newRules)) {
                    // We inserted an element before this one, so we need
                    // to make sure that in the next loop iteration, we're
                    // not performing the same task for this element again,
                    // hence the k++.
                    byFilter[updatedFilters] = clone;
                    current.splice(k, 0, clone);
                    k++;
                }
            }
        } else if (updatedFilters === null) {
            // if updatedFilters is null, then adding the filters doesn't
            // invalidate or split the selector, so we addRules to the
            // combined selector

            // Filters can be added, but they don't change the
            // filters. This means we don't have to split the
            // definition.
            //
            // this is cloned here because of shared classes, see
            // sharedclass.mss
            current[k] = current[k].clone();
            current[k].addRules(newRules);
        }
        // if updatedFeatures is false, then the filters split the rule,
        // so they aren't the same inheritance chain
    }
    return current;
}

/**
 * Apply inherited styles from their ancestors to them.
 *
 * called either once per render (in the case of mss) or per layer
 * (for mml)
 *
 * @param {Object} definitions - a list of definitions objects
 *   that contain .rules
 * @param {Object} env - the environment
 * @return {Array<Array>} an array of arrays is returned,
 *   in which each array refers to a specific attachment
 */
function inheritDefinitions(definitions, env) {
    var inheritTime = +new Date();
    // definitions are ordered by specificity,
    // high (index 0) to low
    var byAttachment = {},
        byFilter = {};
    var result = [];
    var current, previous, attachment;

    // Evaluate the filters specified by each definition with the given
    // environment to correctly resolve variable references
    definitions.forEach(function(d) {
        d.filters.ev(env);
    });

    for (var i = 0; i < definitions.length; i++) {

        attachment = definitions[i].attachment;
        current = [definitions[i]];

        if (!byAttachment[attachment]) {
            byAttachment[attachment] = [];
            byAttachment[attachment].attachment = attachment;
            byFilter[attachment] = {};
            result.push(byAttachment[attachment]);
        }

        // Iterate over all subsequent rules.
        for (var j = i + 1; j < definitions.length; j++) {
            if (definitions[j].attachment === attachment) {
                // Only inherit rules from the same attachment.
                current = addRules(current, definitions[j], byFilter[attachment], env);
            }
        }

        for (var k = 0; k < current.length; k++) {
            byFilter[attachment][current[k].filters] = current[k];
            byAttachment[attachment].push(current[k]);
        }
    }

    if (env.benchmark) console.warn('Inheritance time: ' + ((new Date() - inheritTime)) + 'ms');

    return result;

}

// Sort styles by the minimum index of their rules.
// This sorts a slice of the styles, so it returns a sorted
// array but does not change the input.
function sortStylesIndex(a, b) { return b.index - a.index; }
function sortStyles(styles, env) {
    for (var i = 0; i < styles.length; i++) {
        var style = styles[i];
        style.index = Infinity;
        for (var b = 0; b < style.length; b++) {
            var rules = style[b].rules;
            for (var r = 0; r < rules.length; r++) {
                var rule = rules[r];
                if (rule.index < style.index) {
                    style.index = rule.index;
                }
            }
        }
    }

    var result = styles.slice();
    result.sort(sortStylesIndex);
    return result;
}

/**
 * Find a rule like Map { background-color: #fff; },
 * if any, and return a list of properties to be inserted
 * into the <Map element of the resulting XML. Translates
 * properties of the mml object at `m` directly into XML
 * properties.
 *
 * @param {Object} m the mml object.
 * @param {Array} definitions the output of toList.
 * @param {Object} env
 * @return {String} rendered properties.
 */
function getMapProperties(m, definitions, env) {
    var rules = {};
    var symbolizers = carto.tree.Reference.data.symbolizers.map;

    _(m).each(function(value, key) {
        if (key in symbolizers) rules[key] = key + '="' + value + '"';
    });

    definitions.filter(function(r) {
        return r.elements.join('') === 'Map';
    }).forEach(function(r) {
        for (var i = 0; i < r.rules.length; i++) {
            var key = r.rules[i].name;
            if (!(key in symbolizers)) {
                env.error({
                    message: 'Rule ' + key + ' not allowed for Map.',
                    index: r.rules[i].index
                });
            }
            rules[key] = r.rules[i].ev(env).toXML(env);
        }
    });
    return rules;
}

module.exports = carto;
module.exports.addRules = addRules;
module.exports.inheritDefinitions = inheritDefinitions;
module.exports.sortStyles = sortStyles;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./index":4,"underscore":42}],7:[function(_dereq_,module,exports){
(function (global){
(function(carto) {
var tree = _dereq_('./tree');
var _ = global._ || _dereq_('underscore');


function CartoCSS(style, options) {
  this.options = options || {};
  this.imageURLs = [];
  if(style) {
    this.setStyle(style);
  }
}

CartoCSS.Layer = function(shader, options) {
  this.options = options;
  this.shader = shader;
};


CartoCSS.Layer.prototype = {

  fullName: function() {
    return this.shader.attachment;
  },

  name: function() {
    return this.fullName().split('::')[0];
  },

  // frames this layer need to be rendered
  frames: function() {
    return this.shader.frames;
  },

  attachment: function() {
    return this.fullName().split('::')[1];
  },

  eval: function(prop) {
    var p = this.shader[prop];
    if (!p || !p.style) return;
    return p.style({}, { zoom: 0, 'frame-offset': 0 });
  },

  /*
   * `props`: feature properties
   * `context`: rendering properties, i.e zoom
   */
  getStyle: function(props, context) {
    var style = {};
    for(var i in this.shader) {
      if(i !== 'attachment' && i !== 'zoom' && i !== 'frames' && i !== 'symbolizers') {
        style[i] = this.shader[i].style(props, context);
      }
    }
    return style;
  },

  /**
   * return the symbolizers that need to be rendered with 
   * this style. The order is the rendering order.
   * @returns a list with 3 possible values 'line', 'marker', 'polygon'
   */
  getSymbolizers: function() {
    return this.shader.symbolizers;
  },

  /**
   * returns if the style varies with some feature property.
   * Useful to optimize rendering
   */
  isVariable: function() {
    for(var i in this.shader) {
      if(i !== 'attachment' && i !== 'zoom' && i !== 'frames' && i !== 'symbolizers') {
        if (!this.shader[i].constant) {
          return true;
        }
      }
    }
    return false;
  },

  getShader: function() {
    return this.shader;
  },

  /**
   * returns true if a feature needs to be rendered
   */
  filter: function(featureType, props, context) {
    for(var i in this.shader) {
     var s = this.shader[i](props, context);
     if(s) {
       return true;
     }
    }
    return false;
  },

  //
  // given a geoemtry type returns the transformed one acording the CartoCSS
  // For points there are two kind of types: point and sprite, the first one 
  // is a circle, second one is an image sprite
  //
  // the other geometry types are the same than geojson (polygon, linestring...)
  //
  transformGeometry: function(type) {
    return type;
  },

  transformGeometries: function(geojson) {
    return geojson;
  }

};

CartoCSS.prototype = {

  setStyle: function(style) {
    var layers = this.parse(style);
    if(!layers) {
      throw new Error(this.parse_env.errors);
    }
    this.layers = layers.map(function(shader) {
        return new CartoCSS.Layer(shader);
    });
  },

  getLayers: function() {
    return this.layers;
  },

  getDefault: function() {
    return this.findLayer({ attachment: '__default__' });
  },

  findLayer: function(where) {
    return _.find(this.layers, function(value) {
      for (var key in where) {
        var v = value[key];
        if (typeof(v) === 'function') {
          v = v.call(value);
        }
        if (where[key] !== v) return false;
      }
      return true;
    });
  },

  _createFn: function(ops) {
    var body = ops.join('\n');
    if(this.options.debug) console.log(body);
    return Function("data","ctx", "var _value = null; " +  body + "; return _value; ");
  },

  _compile: function(shader) {
    if(typeof shader === 'string') {
        shader = eval("(function() { return " + shader +"; })()");
    }
    this.shader_src = shader;
    for(var attr in shader) {
        var c = mapper[attr];
        if(c) {
            this.compiled[c] = eval("(function() { return shader[attr]; })();");
        }
    }
  },
  getImageURLs: function(){
    return this.imageURLs;
  },

  parse: function(cartocss) {
    var parse_env = {
      frames: [],
      errors: [],
      error: function(obj) {
        this.errors.push(obj);
      }
    };
    this.parse_env = parse_env;

    var ruleset = null;
    try {
      ruleset = (new carto.Parser(parse_env)).parse(cartocss);
    } catch(e) {
      // add the style.mss string to match the response from the server
      parse_env.errors.push(e.message);
      return;
    }
    if(ruleset) {

      function defKey(def) {
        return def.elements[0] + "::" + def.attachment;
      }
      var defs = ruleset.toList(parse_env);
      defs.reverse();
      // group by elements[0].value::attachment
      var layers = {};
      for(var i = 0; i < defs.length; ++i) {
        var def = defs[i];
        var key = defKey(def);
        var layer = layers[key] = (layers[key] || {
          symbolizers: []
        });
        for(var u = 0; u<def.rules.length; u++){
            if(def.rules[u].name === "marker-file" || def.rules[u].name === "point-file"){
                var value = def.rules[u].value.value[0].value[0].value.value;
                this.imageURLs.push(value);
            }
        } 
        layer.frames = [];
        layer.zoom = tree.Zoom.all;
        var props = def.toJS(parse_env);
        if (this.options.debug) console.log("props", props);
        for(var v in props) {
          var lyr = layer[v] = layer[v] || {
            constant: false,
            symbolizer: null,
            js: [],
            index: 0
          };
          // build javascript statements
          lyr.js.push(props[v].map(function(a) { return a.js; }).join('\n'));
          // get symbolizer for prop
          lyr.symbolizer = _.first(props[v].map(function(a) { return a.symbolizer; }));
          // serach the max index to know rendering order
          lyr.index = _.max(props[v].map(function(a) { return a.index; }).concat(lyr.index));
          lyr.constant = !_.any(props[v].map(function(a) { return !a.constant; }));
        }
      }

      var ordered_layers = [];
      if (this.options.debug) console.log(layers);

      var done = {};
      for(var i = 0; i < defs.length; ++i) {
        var def = defs[i];
        var k = defKey(def);
        var layer = layers[k];
        if(!done[k]) {
          if(this.options.debug) console.log("**", k);
          for(var prop in layer) {
            if (prop !== 'zoom' && prop !== 'frames' && prop !== 'symbolizers') {
              if(this.options.debug) console.log("*", prop);
              layer[prop].style = this._createFn(layer[prop].js);
              layer.symbolizers.push(layer[prop].symbolizer);
              layer.symbolizers = _.uniq(layer.symbolizers);
            }
          }
          layer.attachment = k;
          ordered_layers.push(layer);
          done[k] = true;
        }
        layer.zoom |= def.zoom;
        layer.frames.push(def.frame_offset);
      }

      // uniq the frames
      for(i = 0; i < ordered_layers.length; ++i) {
        ordered_layers[i].frames = _.uniq(ordered_layers[i].frames);
      }

      return ordered_layers;

    }
    return null;
  }
};


carto.RendererJS = function (options) {
    this.options = options || {};
    this.options.mapnik_version = this.options.mapnik_version || 'latest';
};

// Prepare a javascript object which contains the layers
carto.RendererJS.prototype.render = function render(cartocss, callback) {
    var reference = _dereq_('./torque-reference');
    tree.Reference.setData(reference.version.latest);
    return new CartoCSS(cartocss, this.options);
}

if(typeof(module) !== 'undefined') {
  module.exports = carto.RendererJS;
}


})(_dereq_('../carto'));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../carto":4,"./torque-reference":8,"./tree":9,"underscore":42}],8:[function(_dereq_,module,exports){
var _mapnik_reference_latest = {
    "version": "2.1.1",
    "style": {
        "filter-mode": {
            "type": [
                "all",
                "first"
            ],
            "doc": "Control the processing behavior of Rule filters within a Style. If 'all' is used then all Rules are processed sequentially independent of whether any previous filters matched. If 'first' is used then it means processing ends after the first match (a positive filter evaluation) and no further Rules in the Style are processed ('first' is usually the default for CSS implementations on top of Mapnik to simplify translation from CSS to Mapnik XML)",
            "default-value": "all",
            "default-meaning": "All Rules in a Style are processed whether they have filters or not and whether or not the filter conditions evaluate to true."
        },
        "image-filters": {
            "css": "image-filters",
            "default-value": "none",
            "default-meaning": "no filters",
            "type": "functions",
            "functions": [
                ["agg-stack-blur", 2],
                ["emboss", 0],
                ["blur", 0],
                ["gray", 0],
                ["sobel", 0],
                ["edge-detect", 0],
                ["x-gradient", 0],
                ["y-gradient", 0],
                ["invert", 0],
                ["sharpen", 0],
                ["colorize-alpha", -1],
                ["color-to-alpha", 1],
                ["scale-hsla", 8]
            ],
            "doc": "A list of image filters."
        },
        "comp-op": {
            "css": "comp-op",
            "default-value": "src-over",
            "default-meaning": "add the current layer on top of other layers",
            "doc": "Composite operation. This defines how this layer should behave relative to layers atop or below it.",
            "type": ["clear",
                "src",
                "dst",
                "src-over",
                "source-over", // added for torque
                "dst-over",
                "src-in",
                "dst-in",
                "src-out",
                "dst-out",
                "src-atop",
                "dst-atop",
                "xor",
                "plus",
                "minus",
                "multiply",
                "screen",
                "overlay",
                "darken",
                "lighten",
                "lighter", // added for torque
                "color-dodge",
                "color-burn",
                "hard-light",
                "soft-light",
                "difference",
                "exclusion",
                "contrast",
                "invert",
                "invert-rgb",
                "grain-merge",
                "grain-extract",
                "hue",
                "saturation",
                "color",
                "value"
            ]
        },
        "opacity": {
            "css": "opacity",
            "type": "float",
            "doc": "An alpha value for the style (which means an alpha applied to all features in separate buffer and then composited back to main buffer)",
            "default-value": 1,
            "default-meaning": "no separate buffer will be used and no alpha will be applied to the style after rendering"
        }
    },
    "layer" : {
        "name": {
            "default-value": "",
            "type":"string",
            "required" : true,
            "default-meaning": "No layer name has been provided",
            "doc": "The name of a layer. Can be anything you wish and is not strictly validated, but ideally unique  in the map"
        },
        "srs": {
            "default-value": "",
            "type":"string",
            "default-meaning": "No srs value is provided and the value will be inherited from the Map's srs",
            "doc": "The spatial reference system definition for the layer, aka the projection. Can either be a proj4 literal string like '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs' or, if the proper proj4 epsg/nad/etc identifier files are installed, a string that uses an id like: '+init=epsg:4326'"
        },
        "status": {
            "default-value": true,
            "type":"boolean",
            "default-meaning": "This layer will be marked as active and available for processing",
            "doc": "A property that can be set to false to disable this layer from being processed"
        },
        "minzoom": {
            "default-value": "0",
            "type":"float",
            "default-meaning": "The layer will be visible at the minimum possible scale",
            "doc": "The minimum scale denominator that this layer will be visible at. A layer's visibility is determined by whether its status is true and if the Map scale >= minzoom - 1e-6 and scale < maxzoom + 1e-6"
        },
        "maxzoom": {
            "default-value": "1.79769e+308",
            "type":"float",
            "default-meaning": "The layer will be visible at the maximum possible scale",
            "doc": "The maximum scale denominator that this layer will be visible at. The default is the numeric limit of the C++ double type, which may vary slightly by system, but is likely a massive number like 1.79769e+308 and ensures that this layer will always be visible unless the value is reduced. A layer's visibility is determined by whether its status is true and if the Map scale >= minzoom - 1e-6 and scale < maxzoom + 1e-6"
        },
        "queryable": {
            "default-value": false,
            "type":"boolean",
            "default-meaning": "The layer will not be available for the direct querying of data values",
            "doc": "This property was added for GetFeatureInfo/WMS compatibility and is rarely used. It is off by default meaning that in a WMS context the layer will not be able to be queried unless the property is explicitly set to true"
        },
        "clear-label-cache": {
            "default-value": false,
            "type":"boolean",
            "default-meaning": "The renderer's collision detector cache (used for avoiding duplicate labels and overlapping markers) will not be cleared immediately before processing this layer",
            "doc": "This property, by default off, can be enabled to allow a user to clear the collision detector cache before a given layer is processed. This may be desirable to ensure that a given layers data shows up on the map even if it normally would not because of collisions with previously rendered labels or markers"
        },
        "group-by": {
            "default-value": "",
            "type":"string",
            "default-meaning": "No special layer grouping will be used during rendering",
            "doc": "https://github.com/mapnik/mapnik/wiki/Grouped-rendering"
        },
        "buffer-size": {
            "default-value": "0",
            "type":"float",
            "default-meaning": "No buffer will be used",
            "doc": "Extra tolerance around the Layer extent (in pixels) used to when querying and (potentially) clipping the layer data during rendering"
        },
        "maximum-extent": {
            "default-value": "none",
            "type":"bbox",
            "default-meaning": "No clipping extent will be used",
            "doc": "An extent to be used to limit the bounds used to query this specific layer data during rendering. Should be minx, miny, maxx, maxy in the coordinates of the Layer."
        }
    },
    "symbolizers" : {
        "*": {
            "image-filters": {
                "css": "image-filters",
                "default-value": "none",
                "default-meaning": "no filters",
                "type": "functions",
                "functions": [
                    ["agg-stack-blur", 2],
                    ["emboss", 0],
                    ["blur", 0],
                    ["gray", 0],
                    ["sobel", 0],
                    ["edge-detect", 0],
                    ["x-gradient", 0],
                    ["y-gradient", 0],
                    ["invert", 0],
                    ["sharpen", 0],
                    ["colorize-alpha", -1],
                    ["color-to-alpha", 1],
                    ["scale-hsla", 8],
                    ["buckets", -1],
                    ["category", -1],
                    ["equal", -1],
                    ["headtails", -1],
                    ["jenks", -1],
                    ["quantiles", -1],
                    ["cartocolor", -1],
                    ["colorbrewer", -1],
                    ["range", -1],
                    ["ramp", -1]
                ],
                "doc": "A list of image filters."
            },
            "comp-op": {
                "css": "comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current layer on top of other layers",
                "doc": "Composite operation. This defines how this layer should behave relative to layers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "source-over", // added for torque
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "lighter", // added for torque
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            },
            "opacity": {
                "css": "opacity",
                "type": "float",
                "doc": "An alpha value for the style (which means an alpha applied to all features in separate buffer and then composited back to main buffer)",
                "default-value": 1,
                "default-meaning": "no separate buffer will be used and no alpha will be applied to the style after rendering"
            }
        },
        "map": {
            "background-color": {
                "css": "background-color",
                "default-value": "none",
                "default-meaning": "transparent",
                "type": "color",
                "doc": "Map Background color"
            },
            "background-image": {
                "css": "background-image",
                "type": "uri",
                "default-value": "",
                "default-meaning": "transparent",
                "doc": "An image that is repeated below all features on a map as a background.",
                "description": "Map Background image"
            },
            "srs": {
                "css": "srs",
                "type": "string",
                "default-value": "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs",
                "default-meaning": "The proj4 literal of EPSG:4326 is assumed to be the Map's spatial reference and all data from layers within this map will be plotted using this coordinate system. If any layers do not declare an srs value then they will be assumed to be in the same srs as the Map and not transformations will be needed to plot them in the Map's coordinate space",
                "doc": "Map spatial reference (proj4 string)"
            },
            "buffer-size": {
                "css": "buffer-size",
                "default-value": "0",
                "type":"float",
                "default-meaning": "No buffer will be used",
                "doc": "Extra tolerance around the map (in pixels) used to ensure labels crossing tile boundaries are equally rendered in each tile (e.g. cut in each tile). Not intended to be used in combination with \"avoid-edges\"."
            },
            "maximum-extent": {
                "css": "",
                "default-value": "none",
                "type":"bbox",
                "default-meaning": "No clipping extent will be used",
                "doc": "An extent to be used to limit the bounds used to query all layers during rendering. Should be minx, miny, maxx, maxy in the coordinates of the Map."
            },
            "base": {
                "css": "base",
                "default-value": "",
                "default-meaning": "This base path defaults to an empty string meaning that any relative paths to files referenced in styles or layers will be interpreted relative to the application process.",
                "type": "string",
                "doc": "Any relative paths used to reference files will be understood as relative to this directory path if the map is loaded from an in memory object rather than from the filesystem. If the map is loaded from the filesystem and this option is not provided it will be set to the directory of the stylesheet."
            },
            "paths-from-xml": {
                "css": "",
                "default-value": true,
                "default-meaning": "Paths read from XML will be interpreted from the location of the XML",
                "type": "boolean",
                "doc": "value to control whether paths in the XML will be interpreted from the location of the XML or from the working directory of the program that calls load_map()"
            },
            "minimum-version": {
                "css": "",
                "default-value": "none",
                "default-meaning": "Mapnik version will not be detected and no error will be thrown about compatibility",
                "type": "string",
                "doc": "The minumum Mapnik version (e.g. 0.7.2) needed to use certain functionality in the stylesheet"
            },
            "font-directory": {
                "css": "font-directory",
                "type": "uri",
                "default-value": "none",
                "default-meaning": "No map-specific fonts will be registered",
                "doc": "Path to a directory which holds fonts which should be registered when the Map is loaded (in addition to any fonts that may be automatically registered)."
            }
        },
        "polygon": {
            "fill": {
                "css": "polygon-fill",
                "type": "color",
                "default-value": "rgba(128,128,128,1)",
                "default-meaning": "gray and fully opaque (alpha = 1), same as rgb(128,128,128)",
                "doc": "Fill color to assign to a polygon",
                "expression": true
            },
            "fill-opacity": {
                "css": "polygon-opacity",
                "type": "float",
                "doc": "The opacity of the polygon",
                "default-value": 1,
                "default-meaning": "opaque"
            },
            "gamma": {
                "css": "polygon-gamma",
                "type": "float",
                "default-value": 1,
                "default-meaning": "fully antialiased",
                "range": "0-1",
                "doc": "Level of antialiasing of polygon edges"
            },
            "gamma-method": {
                "css": "polygon-gamma-method",
                "type": [
                    "power",
                    "linear",
                    "none",
                    "threshold",
                    "multiply"
                ],
                "default-value": "power",
                "default-meaning": "pow(x,gamma) is used to calculate pixel gamma, which produces slightly smoother line and polygon antialiasing than the 'linear' method, while other methods are usually only used to disable AA",
                "doc": "An Antigrain Geometry specific rendering hint to control the quality of antialiasing. Under the hood in Mapnik this method is used in combination with the 'gamma' value (which defaults to 1). The methods are in the AGG source at https://github.com/mapnik/mapnik/blob/master/deps/agg/include/agg_gamma_functions.h"
            },
            "clip": {
                "css": "polygon-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "polygon-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "geometry-transform": {
                "css": "polygon-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "polygon-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "line": {
            "stroke": {
                "css": "line-color",
                "default-value": "rgba(0,0,0,1)",
                "type": "color",
                "default-meaning": "black and fully opaque (alpha = 1), same as rgb(0,0,0)",
                "doc": "The color of a drawn line",
                "expression": true
            },
            "stroke-width": {
                "css": "line-width",
                "default-value": 1,
                "type": "float",
                "doc": "The width of a line in pixels",
                "expression": true
            },
            "stroke-opacity": {
                "css": "line-opacity",
                "default-value": 1,
                "type": "float",
                "default-meaning": "opaque",
                "doc": "The opacity of a line"
            },
            "stroke-linejoin": {
                "css": "line-join",
                "default-value": "miter",
                "type": [
                    "miter",
                    "round",
                    "bevel"
                ],
                "doc": "The behavior of lines when joining"
            },
            "stroke-linecap": {
                "css": "line-cap",
                "default-value": "butt",
                "type": [
                    "butt",
                    "round",
                    "square"
                ],
                "doc": "The display of line endings"
            },
            "stroke-gamma": {
                "css": "line-gamma",
                "type": "float",
                "default-value": 1,
                "default-meaning": "fully antialiased",
                "range": "0-1",
                "doc": "Level of antialiasing of stroke line"
            },
            "stroke-gamma-method": {
                "css": "line-gamma-method",
                "type": [
                    "power",
                    "linear",
                    "none",
                    "threshold",
                    "multiply"
                ],
                "default-value": "power",
                "default-meaning": "pow(x,gamma) is used to calculate pixel gamma, which produces slightly smoother line and polygon antialiasing than the 'linear' method, while other methods are usually only used to disable AA",
                "doc": "An Antigrain Geometry specific rendering hint to control the quality of antialiasing. Under the hood in Mapnik this method is used in combination with the 'gamma' value (which defaults to 1). The methods are in the AGG source at https://github.com/mapnik/mapnik/blob/master/deps/agg/include/agg_gamma_functions.h"
            },
            "stroke-dasharray": {
                "css": "line-dasharray",
                "type": "numbers",
                "doc": "A pair of length values [a,b], where (a) is the dash length and (b) is the gap length respectively. More than two values are supported for more complex patterns.",
                "default-value": "none",
                "default-meaning": "solid line"
            },
            "stroke-dashoffset": {
                "css": "line-dash-offset",
                "type": "numbers",
                "doc": "valid parameter but not currently used in renderers (only exists for experimental svg support in Mapnik which is not yet enabled)",
                "default-value": "none",
                "default-meaning": "solid line"
            },
            "stroke-miterlimit": {
                "css": "line-miterlimit",
                "type": "float",
                "doc": "The limit on the ratio of the miter length to the stroke-width. Used to automatically convert miter joins to bevel joins for sharp angles to avoid the miter extending beyond the thickness of the stroking path. Normally will not need to be set, but a larger value can sometimes help avoid jaggy artifacts.",
                "default-value": 4.0,
                "default-meaning": "Will auto-convert miters to bevel line joins when theta is less than 29 degrees as per the SVG spec: 'miterLength / stroke-width = 1 / sin ( theta / 2 )'"
            },
            "clip": {
                "css": "line-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "line-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "offset": {
                "css": "line-offset",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no offset",
                "doc": "Offsets a line a number of pixels parallel to its actual path. Postive values move the line left, negative values move it right (relative to the directionality of the line)."
            },
            "rasterizer": {
                "css": "line-rasterizer",
                "type": [
                    "full",
                    "fast"
                ],
                "default-value": "full",
                "doc": "Exposes an alternate AGG rendering method that sacrifices some accuracy for speed."
            },
            "geometry-transform": {
                "css": "line-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "line-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "markers": {
            "file": {
                "css": "marker-file",
                "doc": "An SVG file that this marker shows at each placement. If no file is given, the marker will show an ellipse.",
                "default-value": "",
                "default-meaning": "An ellipse or circle, if width equals height",
                "type": "uri"
            },
            "opacity": {
                "css": "marker-opacity",
                "doc": "The overall opacity of the marker, if set, overrides both the opacity of both the fill and stroke",
                "default-value": 1,
                "default-meaning": "The stroke-opacity and fill-opacity will be used",
                "type": "float"
            },
            "fill-opacity": {
                "css": "marker-fill-opacity",
                "doc": "The fill opacity of the marker",
                "default-value": 1,
                "default-meaning": "opaque",
                "type": "float"
            },
            "stroke": {
                "css": "marker-line-color",
                "doc": "The color of the stroke around a marker shape.",
                "default-value": "black",
                "type": "color"
            },
            "stroke-width": {
                "css": "marker-line-width",
                "doc": "The width of the stroke around a marker shape, in pixels. This is positioned on the boundary, so high values can cover the area itself.",
                "type": "float"
            },
            "stroke-opacity": {
                "css": "marker-line-opacity",
                "default-value": 1,
                "default-meaning": "opaque",
                "doc": "The opacity of a line",
                "type": "float"
            },
            "placement": {
                "css": "marker-placement",
                "type": [
                    "point",
                    "line",
                    "interior"
                ],
                "default-value": "point",
                "default-meaning": "Place markers at the center point (centroid) of the geometry",
                "doc": "Attempt to place markers on a point, in the center of a polygon, or if markers-placement:line, then multiple times along a line. 'interior' placement can be used to ensure that points placed on polygons are forced to be inside the polygon interior"
            },
            "multi-policy": {
                "css": "marker-multi-policy",
                "type": [
                    "each",
                    "whole",
                    "largest"
                ],
                "default-value": "each",
                "default-meaning": "If a feature contains multiple geometries and the placement type is either point or interior then a marker will be rendered for each",
                "doc": "A special setting to allow the user to control rendering behavior for 'multi-geometries' (when a feature contains multiple geometries). This setting does not apply to markers placed along lines. The 'each' policy is default and means all geometries will get a marker. The 'whole' policy means that the aggregate centroid between all geometries will be used. The 'largest' policy means that only the largest (by bounding box areas) feature will get a rendered marker (this is how text labeling behaves by default)."
            },
            "marker-type": {
                "css": "marker-type",
                "type": [
                    "arrow",
                    "ellipse",
                    "rectangle"
                ],
                "default-value": "ellipse",
                "doc": "The default marker-type. If a SVG file is not given as the marker-file parameter, the renderer provides either an arrow or an ellipse (a circle if height is equal to width)"
            },
            "width": {
                "css": "marker-width",
                "default-value": 10,
                "doc": "The width of the marker, if using one of the default types.",
                "type": "float",
                "expression": true
            },
            "height": {
                "css": "marker-height",
                "default-value": 10,
                "doc": "The height of the marker, if using one of the default types.",
                "type": "float",
                "expression": true
            },
            "fill": {
                "css": "marker-fill",
                "default-value": "blue",
                "doc": "The color of the area of the marker.",
                "type": "color",
                "expression": true
            },
            "allow-overlap": {
                "css": "marker-allow-overlap",
                "type": "boolean",
                "default-value": false,
                "doc": "Control whether overlapping markers are shown or hidden.",
                "default-meaning": "Do not allow makers to overlap with each other - overlapping markers will not be shown."
            },
            "ignore-placement": {
                "css": "marker-ignore-placement",
                "type": "boolean",
                "default-value": false,
                "default-meaning": "do not store the bbox of this geometry in the collision detector cache",
                "doc": "value to control whether the placement of the feature will prevent the placement of other features"
            },
            "spacing": {
                "css": "marker-spacing",
                "doc": "Space between repeated labels",
                "default-value": 100,
                "type": "float"
            },
            "max-error": {
                "css": "marker-max-error",
                "type": "float",
                "default-value": 0.2,
                "doc": "The maximum difference between actual marker placement and the marker-spacing parameter. Setting a high value can allow the renderer to try to resolve placement conflicts with other symbolizers."
            },
            "transform": {
                "css": "marker-transform",
                "type": "functions",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ],
                "default-value": "",
                "default-meaning": "No transformation",
                "doc": "SVG transformation definition"
            },
            "clip": {
                "css": "marker-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "marker-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "geometry-transform": {
                "css": "marker-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "marker-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "shield": {
            "name": {
                "css": "shield-name",
                "type": "string",
                "expression": true,
                "serialization": "content",
                "doc": "Value to use for a shield\"s text label. Data columns are specified using brackets like [column_name]"
            },
            "file": {
                "css": "shield-file",
                "required": true,
                "type": "uri",
                "default-value": "none",
                "doc": "Image file to render behind the shield text"
            },
            "face-name": {
                "css": "shield-face-name",
                "type": "string",
                "validate": "font",
                "doc": "Font name and style to use for the shield text",
                "default-value": "",
                "required": true
            },
            "unlock-image": {
                "css": "shield-unlock-image",
                "type": "boolean",
                "doc": "This parameter should be set to true if you are trying to position text beside rather than on top of the shield image",
                "default-value": false,
                "default-meaning": "text alignment relative to the shield image uses the center of the image as the anchor for text positioning."
            },
            "size": {
                "css": "shield-size",
                "type": "float",
                "doc": "The size of the shield text in pixels"
            },
            "fill": {
                "css": "shield-fill",
                "type": "color",
                "doc": "The color of the shield text"
            },
            "placement": {
                "css": "shield-placement",
                "type": [
                    "point",
                    "line",
                    "vertex",
                    "interior"
                ],
                "default-value": "point",
                "doc": "How this shield should be placed. Point placement attempts to place it on top of points, line places along lines multiple times per feature, vertex places on the vertexes of polygons, and interior attempts to place inside of polygons."
            },
            "avoid-edges": {
                "css": "shield-avoid-edges",
                "doc": "Tell positioning algorithm to avoid labeling near intersection edges.",
                "type": "boolean",
                "default-value": false
            },
            "allow-overlap": {
                "css": "shield-allow-overlap",
                "type": "boolean",
                "default-value": false,
                "doc": "Control whether overlapping shields are shown or hidden.",
                "default-meaning": "Do not allow shields to overlap with other map elements already placed."
            },
            "minimum-distance": {
                "css": "shield-min-distance",
                "type": "float",
                "default-value": 0,
                "doc": "Minimum distance to the next shield symbol, not necessarily the same shield."
            },
            "spacing": {
                "css": "shield-spacing",
                "type": "float",
                "default-value": 0,
                "doc": "The spacing between repeated occurrences of the same shield on a line"
            },
            "minimum-padding": {
                "css": "shield-min-padding",
                "default-value": 0,
                "doc": "Determines the minimum amount of padding that a shield gets relative to other shields",
                "type": "float"
            },
            "wrap-width": {
                "css": "shield-wrap-width",
                "type": "unsigned",
                "default-value": 0,
                "doc": "Length of a chunk of text in characters before wrapping text"
            },
            "wrap-before": {
                "css": "shield-wrap-before",
                "type": "boolean",
                "default-value": false,
                "doc": "Wrap text before wrap-width is reached. If false, wrapped lines will be a bit longer than wrap-width."
            },
            "wrap-character": {
                "css": "shield-wrap-character",
                "type": "string",
                "default-value": " ",
                "doc": "Use this character instead of a space to wrap long names."
            },
            "halo-fill": {
                "css": "shield-halo-fill",
                "type": "color",
                "default-value": "#FFFFFF",
                "default-meaning": "white",
                "doc": "Specifies the color of the halo around the text."
            },
            "halo-radius": {
                "css": "shield-halo-radius",
                "doc": "Specify the radius of the halo in pixels",
                "default-value": 0,
                "default-meaning": "no halo",
                "type": "float"
            },
            "character-spacing": {
                "css": "shield-character-spacing",
                "type": "unsigned",
                "default-value": 0,
                "doc": "Horizontal spacing between characters (in pixels). Currently works for point placement only, not line placement."
            },
            "line-spacing": {
                "css": "shield-line-spacing",
                "doc": "Vertical spacing between lines of multiline labels (in pixels)",
                "type": "unsigned"
            },
            "dx": {
                "css": "shield-text-dx",
                "type": "float",
                "doc": "Displace text within shield by fixed amount, in pixels, +/- along the X axis.  A positive value will shift the text right",
                "default-value": 0
            },
            "dy": {
                "css": "shield-text-dy",
                "type": "float",
                "doc": "Displace text within shield by fixed amount, in pixels, +/- along the Y axis.  A positive value will shift the text down",
                "default-value": 0
            },
            "shield-dx": {
                "css": "shield-dx",
                "type": "float",
                "doc": "Displace shield by fixed amount, in pixels, +/- along the X axis.  A positive value will shift the text right",
                "default-value": 0
            },
            "shield-dy": {
                "css": "shield-dy",
                "type": "float",
                "doc": "Displace shield by fixed amount, in pixels, +/- along the Y axis.  A positive value will shift the text down",
                "default-value": 0
            },
            "opacity": {
                "css": "shield-opacity",
                "type": "float",
                "doc": "(Default 1.0) - opacity of the image used for the shield",
                "default-value": 1
            },
            "text-opacity": {
                "css": "shield-text-opacity",
                "type": "float",
                "doc": "(Default 1.0) - opacity of the text placed on top of the shield",
                "default-value": 1
            },
            "horizontal-alignment": {
                "css": "shield-horizontal-alignment",
                "type": [
                    "left",
                    "middle",
                    "right",
                    "auto"
                ],
                "doc": "The shield's horizontal alignment from its centerpoint",
                "default-value": "auto"
            },
            "vertical-alignment": {
                "css": "shield-vertical-alignment",
                "type": [
                    "top",
                    "middle",
                    "bottom",
                    "auto"
                ],
                "doc": "The shield's vertical alignment from its centerpoint",
                "default-value": "middle"
            },
            "text-transform": {
                "css": "shield-text-transform",
                "type": [
                    "none",
                    "uppercase",
                    "lowercase",
                    "capitalize"
                ],
                "doc": "Transform the case of the characters",
                "default-value": "none"
            },
            "justify-alignment": {
                "css": "shield-justify-alignment",
                "type": [
                    "left",
                    "center",
                    "right",
                    "auto"
                ],
                "doc": "Define how text in a shield's label is justified",
                "default-value": "auto"
            },
            "clip": {
                "css": "shield-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "comp-op": {
                "css": "shield-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "line-pattern": {
            "file": {
                "css": "line-pattern-file",
                "type": "uri",
                "default-value": "none",
                "required": true,
                "doc": "An image file to be repeated and warped along a line"
            },
            "clip": {
                "css": "line-pattern-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "line-pattern-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "geometry-transform": {
                "css": "line-pattern-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "line-pattern-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "polygon-pattern": {
            "file": {
                "css": "polygon-pattern-file",
                "type": "uri",
                "default-value": "none",
                "required": true,
                "doc": "Image to use as a repeated pattern fill within a polygon"
            },
            "alignment": {
                "css": "polygon-pattern-alignment",
                "type": [
                    "local",
                    "global"
                ],
                "default-value": "local",
                "doc": "Specify whether to align pattern fills to the layer or to the map."
            },
            "gamma": {
                "css": "polygon-pattern-gamma",
                "type": "float",
                "default-value": 1,
                "default-meaning": "fully antialiased",
                "range": "0-1",
                "doc": "Level of antialiasing of polygon pattern edges"
            },
            "opacity": {
                "css": "polygon-pattern-opacity",
                "type": "float",
                "doc": "(Default 1.0) - Apply an opacity level to the image used for the pattern",
                "default-value": 1,
                "default-meaning": "The image is rendered without modifications"
            },
            "clip": {
                "css": "polygon-pattern-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "polygon-pattern-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "geometry-transform": {
                "css": "polygon-pattern-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "polygon-pattern-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "raster": {
            "opacity": {
                "css": "raster-opacity",
                "default-value": 1,
                "default-meaning": "opaque",
                "type": "float",
                "doc": "The opacity of the raster symbolizer on top of other symbolizers."
            },
            "filter-factor": {
                "css": "raster-filter-factor",
                "default-value": -1,
                "default-meaning": "Allow the datasource to choose appropriate downscaling.",
                "type": "float",
                "doc": "This is used by the Raster or Gdal datasources to pre-downscale images using overviews. Higher numbers can sometimes cause much better scaled image output, at the cost of speed."
            },
            "scaling": {
                "css": "raster-scaling",
                "type": [
                    "near",
                    "fast",
                    "bilinear",
                    "bilinear8",
                    "bicubic",
                    "spline16",
                    "spline36",
                    "hanning",
                    "hamming",
                    "hermite",
                    "kaiser",
                    "quadric",
                    "catrom",
                    "gaussian",
                    "bessel",
                    "mitchell",
                    "sinc",
                    "lanczos",
                    "blackman"
                ],
                "default-value": "near",
                "doc": "The scaling algorithm used to making different resolution versions of this raster layer. Bilinear is a good compromise between speed and accuracy, while lanczos gives the highest quality."
            },
            "mesh-size": {
                "css": "raster-mesh-size",
                "default-value": 16,
                "default-meaning": "Reprojection mesh will be 1/16 of the resolution of the source image",
                "type": "unsigned",
                "doc": "A reduced resolution mesh is used for raster reprojection, and the total image size is divided by the mesh-size to determine the quality of that mesh. Values for mesh-size larger than the default will result in faster reprojection but might lead to distortion."
            },
            "comp-op": {
                "css": "raster-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "point": {
            "file": {
                "css": "point-file",
                "type": "uri",
                "required": false,
                "default-value": "none",
                "doc": "Image file to represent a point"
            },
            "allow-overlap": {
                "css": "point-allow-overlap",
                "type": "boolean",
                "default-value": false,
                "doc": "Control whether overlapping points are shown or hidden.",
                "default-meaning": "Do not allow points to overlap with each other - overlapping markers will not be shown."
            },
            "ignore-placement": {
                "css": "point-ignore-placement",
                "type": "boolean",
                "default-value": false,
                "default-meaning": "do not store the bbox of this geometry in the collision detector cache",
                "doc": "value to control whether the placement of the feature will prevent the placement of other features"
            },
            "opacity": {
                "css": "point-opacity",
                "type": "float",
                "default-value": 1.0,
                "default-meaning": "Fully opaque",
                "doc": "A value from 0 to 1 to control the opacity of the point"
            },
            "placement": {
                "css": "point-placement",
                "type": [
                    "centroid",
                    "interior"
                ],
                "doc": "How this point should be placed. Centroid calculates the geometric center of a polygon, which can be outside of it, while interior always places inside of a polygon.",
                "default-value": "centroid"
            },
            "transform": {
                "css": "point-transform",
                "type": "functions",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ],
                "default-value": "",
                "default-meaning": "No transformation",
                "doc": "SVG transformation definition"
            },
            "comp-op": {
                "css": "point-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "text": {
            "name": {
                "css": "text-name",
                "type": "string",
                "expression": true,
                "required": true,
                "default-value": "",
                "serialization": "content",
                "doc": "Value to use for a text label. Data columns are specified using brackets like [column_name]"
            },
            "face-name": {
                "css": "text-face-name",
                "type": "string",
                "validate": "font",
                "doc": "Font name and style to render a label in",
                "required": true
            },
            "size": {
                "css": "text-size",
                "type": "float",
                "default-value": 10,
                "doc": "Text size in pixels"
            },
            "text-ratio": {
                "css": "text-ratio",
                "doc": "Define the amount of text (of the total) present on successive lines when wrapping occurs",
                "default-value": 0,
                "type": "unsigned"
            },
            "wrap-width": {
                "css": "text-wrap-width",
                "doc": "Length of a chunk of text in characters before wrapping text",
                "default-value": 0,
                "type": "unsigned"
            },
            "wrap-before": {
                "css": "text-wrap-before",
                "type": "boolean",
                "default-value": false,
                "doc": "Wrap text before wrap-width is reached. If false, wrapped lines will be a bit longer than wrap-width."
            },
            "wrap-character": {
                "css": "text-wrap-character",
                "type": "string",
                "default-value": " ",
                "doc": "Use this character instead of a space to wrap long text."
            },
            "spacing": {
                "css": "text-spacing",
                "type": "unsigned",
                "doc": "Distance between repeated text labels on a line (aka. label-spacing)"
            },
            "character-spacing": {
                "css": "text-character-spacing",
                "type": "float",
                "default-value": 0,
                "doc": "Horizontal spacing adjustment between characters in pixels"
            },
            "line-spacing": {
                "css": "text-line-spacing",
                "default-value": 0,
                "type": "unsigned",
                "doc": "Vertical spacing adjustment between lines in pixels"
            },
            "label-position-tolerance": {
                "css": "text-label-position-tolerance",
                "default-value": 0,
                "type": "unsigned",
                "doc": "Allows the label to be displaced from its ideal position by a number of pixels (only works with placement:line)"
            },
            "max-char-angle-delta": {
                "css": "text-max-char-angle-delta",
                "type": "float",
                "default-value": "22.5",
                "doc": "The maximum angle change, in degrees, allowed between adjacent characters in a label. This value internally is converted to radians to the default is 22.5*math.pi/180.0. The higher the value the fewer labels will be placed around around sharp corners."
            },
            "fill": {
                "css": "text-fill",
                "doc": "Specifies the color for the text",
                "default-value": "#000000",
                "type": "color"
            },
            "opacity": {
                "css": "text-opacity",
                "doc": "A number from 0 to 1 specifying the opacity for the text",
                "default-value": 1.0,
                "default-meaning": "Fully opaque",
                "type": "float"
            },
            "halo-fill": {
                "css": "text-halo-fill",
                "type": "color",
                "default-value": "#FFFFFF",
                "default-meaning": "white",
                "doc": "Specifies the color of the halo around the text."
            },
            "halo-radius": {
                "css": "text-halo-radius",
                "doc": "Specify the radius of the halo in pixels",
                "default-value": 0,
                "default-meaning": "no halo",
                "type": "float"
            },
            "dx": {
                "css": "text-dx",
                "type": "float",
                "doc": "Displace text by fixed amount, in pixels, +/- along the X axis.  A positive value will shift the text right",
                "default-value": 0
            },
            "dy": {
                "css": "text-dy",
                "type": "float",
                "doc": "Displace text by fixed amount, in pixels, +/- along the Y axis.  A positive value will shift the text down",
                "default-value": 0
            },
            "vertical-alignment": {
                "css": "text-vertical-alignment",
                "type": [
                  "top",
                  "middle",
                  "bottom",
                  "auto"
                ],
                "doc": "Position of label relative to point position.",
                "default-value": "auto",
                "default-meaning": "Default affected by value of dy; \"bottom\" for dy>0, \"top\" for dy<0."
            },
            "avoid-edges": {
                "css": "text-avoid-edges",
                "doc": "Tell positioning algorithm to avoid labeling near intersection edges.",
                "default-value": false,
                "type": "boolean"
            },
            "minimum-distance": {
                "css": "text-min-distance",
                "doc": "Minimum permitted distance to the next text symbolizer.",
                "type": "float"
            },
            "minimum-padding": {
                "css": "text-min-padding",
                "doc": "Determines the minimum amount of padding that a text symbolizer gets relative to other text",
                "type": "float"
            },
            "minimum-path-length": {
                "css": "text-min-path-length",
                "type": "float",
                "default-value": 0,
                "default-meaning": "place labels on all paths",
                "doc": "Place labels only on paths longer than this value."
            },
            "allow-overlap": {
                "css": "text-allow-overlap",
                "type": "boolean",
                "default-value": false,
                "doc": "Control whether overlapping text is shown or hidden.",
                "default-meaning": "Do not allow text to overlap with other text - overlapping markers will not be shown."
            },
            "orientation": {
                "css": "text-orientation",
                "type": "float",
                "expression": true,
                "doc": "Rotate the text."
            },
            "placement": {
                "css": "text-placement",
                "type": [
                    "point",
                    "line",
                    "vertex",
                    "interior"
                ],
                "default-value": "point",
                "doc": "Control the style of placement of a point versus the geometry it is attached to."
            },
            "placement-type": {
                "css": "text-placement-type",
                "doc": "Re-position and/or re-size text to avoid overlaps. \"simple\" for basic algorithm (using text-placements string,) \"dummy\" to turn this feature off.",
                "type": [
                    "dummy",
                    "simple"
                ],
                "default-value": "dummy"
            },
            "placements": {
                "css": "text-placements",
                "type": "string",
                "default-value": "",
                "doc": "If \"placement-type\" is set to \"simple\", use this \"POSITIONS,[SIZES]\" string. An example is `text-placements: \"E,NE,SE,W,NW,SW\";` "
            },
            "text-transform": {
                "css": "text-transform",
                "type": [
                    "none",
                    "uppercase",
                    "lowercase",
                    "capitalize"
                ],
                "doc": "Transform the case of the characters",
                "default-value": "none"
            },
            "horizontal-alignment": {
                "css": "text-horizontal-alignment",
                "type": [
                    "left",
                    "middle",
                    "right",
                    "auto"
                ],
                "doc": "The text's horizontal alignment from its centerpoint",
                "default-value": "auto"
            },
            "justify-alignment": {
                "css": "text-align",
                "type": [
                    "left",
                    "right",
                    "center",
                    "auto"
                ],
                "doc": "Define how text is justified",
                "default-value": "auto",
                "default-meaning": "Auto alignment means that text will be centered by default except when using the `placement-type` parameter - in that case either right or left justification will be used automatically depending on where the text could be fit given the `text-placements` directives"
            },
            "clip": {
                "css": "text-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "comp-op": {
                "css": "text-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "building": {
            "fill": {
                "css": "building-fill",
                "default-value": "#FFFFFF",
                "doc": "The color of the buildings walls.",
                "type": "color"
            },
            "fill-opacity": {
                "css": "building-fill-opacity",
                "type": "float",
                "doc": "The opacity of the building as a whole, including all walls.",
                "default-value": 1
            },
            "height": {
                "css": "building-height",
                "doc": "The height of the building in pixels.",
                "type": "float",
                "expression": true,
                "default-value": "0"
            }
        },
        "torque": {
          "-torque-clear-color": {
              "css": "-torque-clear-color",
              "type": "color",
              "default-value": "rgba(255, 255, 255, 0)",
              "default-meaning": "full clear",
              "doc": "color used to clear canvas on each frame"
          },
          "-torque-frame-count": {
              "css": "-torque-frame-count",
              "default-value": "128",
              "type":"float",
              "default-meaning": "the data is broken into 128 time frames",
              "doc": "Number of animation steps/frames used in the animation. If the data contains a fewere number of total frames, the lesser value will be used."
          },
          "-torque-resolution": {
              "css": "-torque-resolution",
              "default-value": "2",
              "type":"float",
              "default-meaning": "",
              "doc": "Spatial resolution in pixels. A resolution of 1 means no spatial aggregation of the data. Any other resolution of N results in spatial aggregation into cells of NxN pixels. The value N must be power of 2"
          },
          "-torque-animation-duration": {
              "css": "-torque-animation-duration",
              "default-value": "30",
              "type":"float",
              "default-meaning": "the animation lasts 30 seconds",
              "doc": "Animation duration in seconds"
          },
          "-torque-aggregation-function": {
              "css": "-torque-aggregation-function",
              "default-value": "count(cartodb_id)",
              "type": "string",
              "default-meaning": "the value for each cell is the count of points in that cell",
              "doc": "A function used to calculate a value from the aggregate data for each cell. See -torque-resolution"
          },
          "-torque-time-attribute": {
              "css": "-torque-time-attribute",
              "default-value": "time",
              "type": "string",
              "default-meaning": "the data column in your table that is of a time based type",
              "doc": "The table column that contains the time information used create the animation"
          },
          "-torque-data-aggregation": {
              "css": "-torque-data-aggregation",
              "default-value": "linear",
              "type": [
                "linear",
                "cumulative"
              ],
              "default-meaning": "previous values are discarded",
              "doc": "A linear animation will discard previous values while a cumulative animation will accumulate them until it restarts"
          }
        }
    },
    "colors": {
        "aliceblue":  [240, 248, 255],
        "antiquewhite":  [250, 235, 215],
        "aqua":  [0, 255, 255],
        "aquamarine":  [127, 255, 212],
        "azure":  [240, 255, 255],
        "beige":  [245, 245, 220],
        "bisque":  [255, 228, 196],
        "black":  [0, 0, 0],
        "blanchedalmond":  [255,235,205],
        "blue":  [0, 0, 255],
        "blueviolet":  [138, 43, 226],
        "brown":  [165, 42, 42],
        "burlywood":  [222, 184, 135],
        "cadetblue":  [95, 158, 160],
        "chartreuse":  [127, 255, 0],
        "chocolate":  [210, 105, 30],
        "coral":  [255, 127, 80],
        "cornflowerblue":  [100, 149, 237],
        "cornsilk":  [255, 248, 220],
        "crimson":  [220, 20, 60],
        "cyan":  [0, 255, 255],
        "darkblue":  [0, 0, 139],
        "darkcyan":  [0, 139, 139],
        "darkgoldenrod":  [184, 134, 11],
        "darkgray":  [169, 169, 169],
        "darkgreen":  [0, 100, 0],
        "darkgrey":  [169, 169, 169],
        "darkkhaki":  [189, 183, 107],
        "darkmagenta":  [139, 0, 139],
        "darkolivegreen":  [85, 107, 47],
        "darkorange":  [255, 140, 0],
        "darkorchid":  [153, 50, 204],
        "darkred":  [139, 0, 0],
        "darksalmon":  [233, 150, 122],
        "darkseagreen":  [143, 188, 143],
        "darkslateblue":  [72, 61, 139],
        "darkslategrey":  [47, 79, 79],
        "darkturquoise":  [0, 206, 209],
        "darkviolet":  [148, 0, 211],
        "deeppink":  [255, 20, 147],
        "deepskyblue":  [0, 191, 255],
        "dimgray":  [105, 105, 105],
        "dimgrey":  [105, 105, 105],
        "dodgerblue":  [30, 144, 255],
        "firebrick":  [178, 34, 34],
        "floralwhite":  [255, 250, 240],
        "forestgreen":  [34, 139, 34],
        "fuchsia":  [255, 0, 255],
        "gainsboro":  [220, 220, 220],
        "ghostwhite":  [248, 248, 255],
        "gold":  [255, 215, 0],
        "goldenrod":  [218, 165, 32],
        "gray":  [128, 128, 128],
        "grey":  [128, 128, 128],
        "green":  [0, 128, 0],
        "greenyellow":  [173, 255, 47],
        "honeydew":  [240, 255, 240],
        "hotpink":  [255, 105, 180],
        "indianred":  [205, 92, 92],
        "indigo":  [75, 0, 130],
        "ivory":  [255, 255, 240],
        "khaki":  [240, 230, 140],
        "lavender":  [230, 230, 250],
        "lavenderblush":  [255, 240, 245],
        "lawngreen":  [124, 252, 0],
        "lemonchiffon":  [255, 250, 205],
        "lightblue":  [173, 216, 230],
        "lightcoral":  [240, 128, 128],
        "lightcyan":  [224, 255, 255],
        "lightgoldenrodyellow":  [250, 250, 210],
        "lightgray":  [211, 211, 211],
        "lightgreen":  [144, 238, 144],
        "lightgrey":  [211, 211, 211],
        "lightpink":  [255, 182, 193],
        "lightsalmon":  [255, 160, 122],
        "lightseagreen":  [32, 178, 170],
        "lightskyblue":  [135, 206, 250],
        "lightslategray":  [119, 136, 153],
        "lightslategrey":  [119, 136, 153],
        "lightsteelblue":  [176, 196, 222],
        "lightyellow":  [255, 255, 224],
        "lime":  [0, 255, 0],
        "limegreen":  [50, 205, 50],
        "linen":  [250, 240, 230],
        "magenta":  [255, 0, 255],
        "maroon":  [128, 0, 0],
        "mediumaquamarine":  [102, 205, 170],
        "mediumblue":  [0, 0, 205],
        "mediumorchid":  [186, 85, 211],
        "mediumpurple":  [147, 112, 219],
        "mediumseagreen":  [60, 179, 113],
        "mediumslateblue":  [123, 104, 238],
        "mediumspringgreen":  [0, 250, 154],
        "mediumturquoise":  [72, 209, 204],
        "mediumvioletred":  [199, 21, 133],
        "midnightblue":  [25, 25, 112],
        "mintcream":  [245, 255, 250],
        "mistyrose":  [255, 228, 225],
        "moccasin":  [255, 228, 181],
        "navajowhite":  [255, 222, 173],
        "navy":  [0, 0, 128],
        "oldlace":  [253, 245, 230],
        "olive":  [128, 128, 0],
        "olivedrab":  [107, 142, 35],
        "orange":  [255, 165, 0],
        "orangered":  [255, 69, 0],
        "orchid":  [218, 112, 214],
        "palegoldenrod":  [238, 232, 170],
        "palegreen":  [152, 251, 152],
        "paleturquoise":  [175, 238, 238],
        "palevioletred":  [219, 112, 147],
        "papayawhip":  [255, 239, 213],
        "peachpuff":  [255, 218, 185],
        "peru":  [205, 133, 63],
        "pink":  [255, 192, 203],
        "plum":  [221, 160, 221],
        "powderblue":  [176, 224, 230],
        "purple":  [128, 0, 128],
        "red":  [255, 0, 0],
        "rosybrown":  [188, 143, 143],
        "royalblue":  [65, 105, 225],
        "saddlebrown":  [139, 69, 19],
        "salmon":  [250, 128, 114],
        "sandybrown":  [244, 164, 96],
        "seagreen":  [46, 139, 87],
        "seashell":  [255, 245, 238],
        "sienna":  [160, 82, 45],
        "silver":  [192, 192, 192],
        "skyblue":  [135, 206, 235],
        "slateblue":  [106, 90, 205],
        "slategray":  [112, 128, 144],
        "slategrey":  [112, 128, 144],
        "snow":  [255, 250, 250],
        "springgreen":  [0, 255, 127],
        "steelblue":  [70, 130, 180],
        "tan":  [210, 180, 140],
        "teal":  [0, 128, 128],
        "thistle":  [216, 191, 216],
        "tomato":  [255, 99, 71],
        "turquoise":  [64, 224, 208],
        "violet":  [238, 130, 238],
        "wheat":  [245, 222, 179],
        "white":  [255, 255, 255],
        "whitesmoke":  [245, 245, 245],
        "yellow":  [255, 255, 0],
        "yellowgreen":  [154, 205, 50],
        "transparent":  [0, 0, 0, 0]
    },
    "filter": {
        "value": [
            "true",
            "false",
            "null",
            "point",
            "linestring",
            "polygon",
            "collection"
        ]
    }
}

module.exports = {
  version: {
    latest: _mapnik_reference_latest,
    '2.1.1': _mapnik_reference_latest
  }
};

},{}],9:[function(_dereq_,module,exports){
/**
 * TODO: document this. What does this do?
 */
if(typeof(module) !== "undefined") {
  module.exports.find = function (obj, fun) {
      for (var i = 0, r; i < obj.length; i++) {
          if (r = fun.call(obj, obj[i])) { return r; }
      }
      return null;
  };
}

},{}],10:[function(_dereq_,module,exports){
(function (global){
(function(tree) {
var _ = global._ || _dereq_('underscore');
tree.Call = function Call(name, args, index) {
    this.name = name;
    this.args = args;
    this.index = index;
};

tree.Call.prototype = {
    is: 'call',
    // When evuating a function call,
    // we either find the function in `tree.functions` [1],
    // in which case we call it, passing the  evaluated arguments,
    // or we simply print it out as it appeared originally [2].
    // The *functions.js* file contains the built-in functions.
    // The reason why we evaluate the arguments, is in the case where
    // we try to pass a variable to a function, like: `saturate(@color)`.
    // The function should receive the value, not the variable.
    'ev': function(env) {
        var args = this.args.map(function(a) { return a.ev(env); });

        for (var i = 0; i < args.length; i++) {
            if (args[i].is === 'undefined') {
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            }
        }

        if (this.name in tree.functions) {
            if (tree.functions[this.name].length <= args.length) {
                var val = tree.functions[this.name].apply(tree.functions, args);
                if (val === null) {
                    env.error({
                        message: 'incorrect arguments given to ' + this.name + '()',
                        index: this.index,
                        type: 'runtime',
                        filename: this.filename
                    });
                    return { is: 'undefined', value: 'undefined' };
                }
                return val;
            } else {
                env.error({
                    message: 'incorrect number of arguments for ' + this.name +
                        '(). ' + tree.functions[this.name].length + ' expected.',
                    index: this.index,
                    type: 'runtime',
                    filename: this.filename
                });
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            }
        } else {
            var fn = tree.Reference.mapnikFunctions[this.name];
            if (fn === undefined) {
                var functions = _.pairs(tree.Reference.mapnikFunctions);
                // cheap closest, needs improvement.
                var name = this.name;
                var mean = functions.map(function(f) {
                    return [f[0], tree.Reference.editDistance(name, f[0]), f[1]];
                }).sort(function(a, b) {
                    return a[1] - b[1];
                });
                env.error({
                    message: 'unknown function ' + this.name + '(), did you mean ' +
                        mean[0][0] + '(' + mean[0][2] + ')',
                    index: this.index,
                    type: 'runtime',
                    filename: this.filename
                });
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            }
            if (fn !== args.length &&
                !(Array.isArray(fn) && _.include(fn, args.length)) &&
                // support variable-arg functions like `colorize-alpha`
                fn !== -1) {
                env.error({
                    message: 'function ' + this.name + '() takes ' +
                        fn + ' arguments and was given ' + args.length,
                    index: this.index,
                    type: 'runtime',
                    filename: this.filename
                });
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            } else {
                // Save the evaluated versions of arguments
                this.args = args;
                return this;
            }
        }
    },

    toString: function(env, format) {
        if (this.args.length) {
            return this.name + '(' + this.args.join(',') + ')';
        } else {
            return this.name;
        }
    }
};

})(_dereq_('../tree'));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../tree":9,"underscore":42}],11:[function(_dereq_,module,exports){
(function(tree) {
// RGB Colors - #ff0014, #eee
// can be initialized with a 3 or 6 char string or a 3 or 4 element
// numerical array
tree.Color = function Color(rgb, a) {
    // The end goal here, is to parse the arguments
    // into an integer triplet, such as `128, 255, 0`
    //
    // This facilitates operations and conversions.
    if (Array.isArray(rgb)) {
        this.rgb = rgb.slice(0, 3);
    } else if (rgb.length == 6) {
        this.rgb = rgb.match(/.{2}/g).map(function(c) {
            return parseInt(c, 16);
        });
    } else {
        this.rgb = rgb.split('').map(function(c) {
            return parseInt(c + c, 16);
        });
    }

    if (typeof(a) === 'number') {
        this.alpha = a;
    } else if (rgb.length === 4) {
        this.alpha = rgb[3];
    } else {
        this.alpha = 1;
    }
};

tree.Color.prototype = {
    is: 'color',
    'ev': function() { return this; },

    // If we have some transparency, the only way to represent it
    // is via `rgba`. Otherwise, we use the hex representation,
    // which has better compatibility with older browsers.
    // Values are capped between `0` and `255`, rounded and zero-padded.
    toString: function() {
        if (this.alpha < 1.0) {
            return 'rgba(' + this.rgb.map(function(c) {
                return Math.round(c);
            }).concat(this.alpha).join(', ') + ')';
        } else {
            return '#' + this.rgb.map(function(i) {
                i = Math.round(i);
                i = (i > 255 ? 255 : (i < 0 ? 0 : i)).toString(16);
                return i.length === 1 ? '0' + i : i;
            }).join('');
        }
    },

    // Operations have to be done per-channel, if not,
    // channels will spill onto each other. Once we have
    // our result, in the form of an integer triplet,
    // we create a new Color node to hold the result.
    operate: function(env, op, other) {
        var result = [];

        if (! (other instanceof tree.Color)) {
            other = other.toColor();
        }

        for (var c = 0; c < 3; c++) {
            result[c] = tree.operate(op, this.rgb[c], other.rgb[c]);
        }
        return new tree.Color(result);
    },

    toHSL: function() {
        var r = this.rgb[0] / 255,
            g = this.rgb[1] / 255,
            b = this.rgb[2] / 255,
            a = this.alpha;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2, d = max - min;

        if (max === min) {
            h = s = 0;
        } else {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s, l: l, a: a };
    }
};

})(_dereq_('../tree'));

},{"../tree":9}],12:[function(_dereq_,module,exports){
(function(tree) {

tree.Comment = function Comment(value, silent) {
    this.value = value;
    this.silent = !!silent;
};

tree.Comment.prototype = {
    toString: function(env) {
        return '<!--' + this.value + '-->';
    },
    'ev': function() { return this; }
};

})(_dereq_('../tree'));

},{"../tree":9}],13:[function(_dereq_,module,exports){
(function (global){
(function(tree) {
var assert = _dereq_('assert'),
    _ = global._ || _dereq_('underscore');

// A definition is the combination of a selector and rules, like
// #foo {
//     polygon-opacity:1.0;
// }
//
// The selector can have filters
tree.Definition = function Definition(selector, rules) {
    this.elements = selector.elements;
    assert.ok(selector.filters instanceof tree.Filterset);
    this.rules = rules;
    this.ruleIndex = {};
    for (var i = 0; i < this.rules.length; i++) {
        if ('zoom' in this.rules[i]) this.rules[i] = this.rules[i].clone();
        this.rules[i].zoom = selector.zoom;
        this.ruleIndex[this.rules[i].updateID()] = true;
    }
    this.filters = selector.filters;
    this.zoom = selector.zoom;
    this.frame_offset = selector.frame_offset;
    this.attachment = selector.attachment || '__default__';
    this.specificity = selector.specificity();
};

tree.Definition.prototype.toString = function() {
    var str = this.filters.toString();
    for (var i = 0; i < this.rules.length; i++) {
        str += '\n    ' + this.rules[i];
    }
    return str;
};

tree.Definition.prototype.clone = function(filters) {
    if (filters) assert.ok(filters instanceof tree.Filterset);
    var clone = Object.create(tree.Definition.prototype);
    clone.rules = this.rules.slice();
    clone.ruleIndex = _.clone(this.ruleIndex);
    clone.filters = filters ? filters : this.filters.clone();
    clone.attachment = this.attachment;
    return clone;
};

tree.Definition.prototype.addRules = function(rules) {
    var added = 0;

    // Add only unique rules.
    for (var i = 0; i < rules.length; i++) {
        if (!this.ruleIndex[rules[i].id]) {
            this.rules.push(rules[i]);
            this.ruleIndex[rules[i].id] = true;
            added++;
        }
    }

    return added;
};

// Determine whether this selector matches a given id
// and array of classes, by determining whether
// all elements it contains match.
tree.Definition.prototype.appliesTo = function(id, classes) {
    for (var i = 0, l = this.elements.length; i < l; i++) {
        var elem = this.elements[i];
        if (!(elem.wildcard ||
            (elem.type === 'class' && classes[elem.clean]) ||
            (elem.type === 'id' && id === elem.clean))) return false;
    }
    return true;
};

function symbolizerName(symbolizer) {
    function capitalize(str) { return str[1].toUpperCase(); }
    return symbolizer.charAt(0).toUpperCase() +
           symbolizer.slice(1).replace(/\-./, capitalize) + 'Symbolizer';
}

// Get a simple list of the symbolizers, in order
function symbolizerList(sym_order) {
    return sym_order.sort(function(a, b) { return a[1] - b[1]; })
        .map(function(v) { return v[0]; });
}

tree.Definition.prototype.symbolizersToXML = function(env, symbolizers, zoom) {
    var xml = zoom.toXML(env).join('') + this.filters.toXML(env);

    // Sort symbolizers by the index of their first property definition
    var sym_order = [], indexes = [];
    for (var key in symbolizers) {
        indexes = [];
        for (var prop in symbolizers[key]) {
            indexes.push(symbolizers[key][prop].index);
        }
        var min_idx = Math.min.apply(Math, indexes);
        sym_order.push([key, min_idx]);
    }

    sym_order = symbolizerList(sym_order);
    var sym_count = 0;

    for (var i = 0; i < sym_order.length; i++) {
        var attributes = symbolizers[sym_order[i]];
        var symbolizer = sym_order[i].split('/').pop();

        // Skip the magical * symbolizer which is used for universal properties
        // which are bubbled up to Style elements intead of Symbolizer elements.
        if (symbolizer === '*') continue;
        sym_count++;

        var fail = tree.Reference.requiredProperties(symbolizer, attributes);
        if (fail) {
            var rule = attributes[Object.keys(attributes).shift()];
            env.error({
                message: fail,
                index: rule.index,
                filename: rule.filename
            });
        }

        var name = symbolizerName(symbolizer);

        var selfclosing = true, tagcontent;
        xml += '    <' + name + ' ';
        for (var j in attributes) {
            if (symbolizer === 'map') env.error({
                message: 'Map properties are not permitted in other rules',
                index: attributes[j].index,
                filename: attributes[j].filename
            });
            var x = tree.Reference.selector(attributes[j].name);
            if (x && x.serialization && x.serialization === 'content') {
                selfclosing = false;
                tagcontent = attributes[j].ev(env).toXML(env, true);
            } else if (x && x.serialization && x.serialization === 'tag') {
                selfclosing = false;
                tagcontent = attributes[j].ev(env).toXML(env, true);
            } else {
                xml += attributes[j].ev(env).toXML(env) + ' ';
            }
        }
        if (selfclosing) {
            xml += '/>\n';
        } else if (typeof tagcontent !== "undefined") {
            if (tagcontent.indexOf('<') != -1) {
                xml += '>' + tagcontent + '</' + name + '>\n';
            } else {
                xml += '><![CDATA[' + tagcontent + ']]></' + name + '>\n';
            }
        }
    }
    if (!sym_count || !xml) return '';
    return '  <Rule>\n' + xml + '  </Rule>\n';
};

// Take a zoom range of zooms and 'i', the index of a rule in this.rules,
// and finds all applicable symbolizers
tree.Definition.prototype.collectSymbolizers = function(zooms, i) {
    var symbolizers = {}, child;

    for (var j = i; j < this.rules.length; j++) {
        child = this.rules[j];
        var key = child.instance + '/' + child.symbolizer;
        if (zooms.current & child.zoom &&
           (!(key in symbolizers) ||
           (!(child.name in symbolizers[key])))) {
            zooms.current &= child.zoom;
            if (!(key in symbolizers)) {
                symbolizers[key] = {};
            }
            symbolizers[key][child.name] = child;
        }
    }

    if (Object.keys(symbolizers).length) {
        zooms.rule &= (zooms.available &= ~zooms.current);
        return symbolizers;
    }
};

// The tree.Zoom.toString function ignores the holes in zoom ranges and outputs
// scaledenominators that cover the whole range from the first to last bit set.
// This algorithm can produces zoom ranges that may have holes. However,
// when using the filter-mode="first", more specific zoom filters will always
// end up before broader ranges. The filter-mode will pick those first before
// resorting to the zoom range with the hole and stop processing further rules.
tree.Definition.prototype.toXML = function(env, existing) {
    var filter = this.filters.toString();
    if (!(filter in existing)) existing[filter] = tree.Zoom.all;

    var available = tree.Zoom.all, xml = '', zoom, symbolizers,
        zooms = { available: tree.Zoom.all };
    for (var i = 0; i < this.rules.length && available; i++) {
        zooms.rule = this.rules[i].zoom;
        if (!(existing[filter] & zooms.rule)) continue;

        while (zooms.current = zooms.rule & available) {
            if (symbolizers = this.collectSymbolizers(zooms, i)) {
                if (!(existing[filter] & zooms.current)) continue;
                xml += this.symbolizersToXML(env, symbolizers,
                    (new tree.Zoom()).setZoom(existing[filter] & zooms.current));
                existing[filter] &= ~zooms.current;
            }
        }
    }

    return xml;
};

tree.Definition.prototype.toJS = function(env) {
  var shaderAttrs = {};

  // merge conditions from filters with zoom condition of the
  // definition
  var zoom = "(" + this.zoom + " & (1 << ctx.zoom))";
  var frame_offset = this.frame_offset;
  var _if = this.filters.toJS(env);
  var filters = [zoom];
  if(_if) filters.push(_if);
  if(frame_offset) filters.push('ctx["frame-offset"] === ' + frame_offset);
  _if = filters.join(" && ");
  _.each(this.rules, function(rule) {
      if(rule instanceof tree.Rule) {
        shaderAttrs[rule.name] = shaderAttrs[rule.name] || [];

        var r = {
          index: rule.index,
          symbolizer: rule.symbolizer
        };

        if (_if) {
          r.js = "if(" + _if + "){" + rule.value.toJS(env) + "}"
        } else {
          r.js = rule.value.toJS(env);
        }

        r.constant = rule.value.ev(env).is !== 'field';
        r.filtered = !!_if;

        shaderAttrs[rule.name].push(r);
      } else {
        throw new Error("Ruleset not supported");
        //if (rule instanceof tree.Ruleset) {
          //var sh = rule.toJS(env);
          //for(var v in sh) {
            //shaderAttrs[v] = shaderAttrs[v] || [];
            //for(var attr in sh[v]) {
              //shaderAttrs[v].push(sh[v][attr]);
            //}
          //}
        //}
      }
  });
  return shaderAttrs;
};


})(_dereq_('../tree'));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../tree":9,"assert":1,"underscore":42}],14:[function(_dereq_,module,exports){
(function (global){
(function(tree) {
var _ = global._ || _dereq_('underscore');
//
// A number with a unit
//
tree.Dimension = function Dimension(value, unit, index) {
    this.value = parseFloat(value);
    this.unit = unit || null;
    this.index = index;
};

tree.Dimension.prototype = {
    is: 'float',
    physical_units: ['m', 'cm', 'in', 'mm', 'pt', 'pc'],
    screen_units: ['px', '%'],
    all_units: ['m', 'cm', 'in', 'mm', 'pt', 'pc', 'px', '%'],
    densities: {
        m: 0.0254,
        mm: 25.4,
        cm: 2.54,
        pt: 72,
        pc: 6
    },
    ev: function (env) {
        if (this.unit && !_.contains(this.all_units, this.unit)) {
            env.error({
                message: "Invalid unit: '" + this.unit + "'",
                index: this.index
            });
            return { is: 'undefined', value: 'undefined' };
        }

        // normalize units which are not px or %
        if (this.unit && _.contains(this.physical_units, this.unit)) {
            if (!env.ppi) {
                env.error({
                    message: "ppi is not set, so metric units can't be used",
                    index: this.index
                });
                return { is: 'undefined', value: 'undefined' };
            }
            // convert all units to inch
            // convert inch to px using ppi
            this.value = (this.value / this.densities[this.unit]) * env.ppi;
            this.unit = 'px';
        }

        return this;
    },
    round: function() {
        this.value = Math.round(this.value);
        return this;
    },
    toColor: function() {
        return new tree.Color([this.value, this.value, this.value]);
    },
    round: function() {
        this.value = Math.round(this.value);
        return this;
    },
    toString: function() {
        return this.value.toString();
    },
    operate: function(env, op, other) {
        if (this.unit === '%' && other.unit !== '%') {
            env.error({
                message: 'If two operands differ, the first must not be %',
                index: this.index
            });
            return {
                is: 'undefined',
                value: 'undefined'
            };
        }

        if (this.unit !== '%' && other.unit === '%') {
            if (op === '*' || op === '/' || op === '%') {
                env.error({
                    message: 'Percent values can only be added or subtracted from other values',
                    index: this.index
                });
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            }

            return new tree.Dimension(tree.operate(op,
                    this.value, this.value * other.value * 0.01),
                this.unit);
        }

        //here the operands are either the same (% or undefined or px), or one is undefined and the other is px
        return new tree.Dimension(tree.operate(op, this.value, other.value),
            this.unit || other.unit);
    }
};

})(_dereq_('../tree'));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../tree":9,"underscore":42}],15:[function(_dereq_,module,exports){
(function(tree) {

// An element is an id or class selector
tree.Element = function Element(value) {
    this.value = value.trim();
    if (this.value[0] === '#') {
        this.type = 'id';
        this.clean = this.value.replace(/^#/, '');
    }
    if (this.value[0] === '.') {
        this.type = 'class';
        this.clean = this.value.replace(/^\./, '');
    }
    if (this.value.indexOf('*') !== -1) {
        this.type = 'wildcard';
    }
};

// Determine the 'specificity matrix' of this
// specific selector
tree.Element.prototype.specificity = function() {
    return [
        (this.type === 'id') ? 1 : 0, // a
        (this.type === 'class') ? 1 : 0  // b
    ];
};

tree.Element.prototype.toString = function() { return this.value; };

})(_dereq_('../tree'));

},{"../tree":9}],16:[function(_dereq_,module,exports){
(function(tree) {

tree.Expression = function Expression(value) {
    this.value = value;
};

tree.Expression.prototype = {
    is: 'expression',
    ev: function(env) {
        if (this.value.length > 1) {
            return new tree.Expression(this.value.map(function(e) {
                return e.ev(env);
            }));
        } else {
            return this.value[0].ev(env);
        }
    },

    toString: function(env) {
        return this.value.map(function(e) {
            return e.toString(env);
        }).join(' ');
    }
};

})(_dereq_('../tree'));

},{"../tree":9}],17:[function(_dereq_,module,exports){
(function(tree) {

tree.Field = function Field(content) {
    this.value = content || '';
};

tree.Field.prototype = {
    is: 'field',
    toString: function() {
        return '[' + this.value + ']';
    },
    'ev': function() {
        return this;
    }
};

})(_dereq_('../tree'));

},{"../tree":9}],18:[function(_dereq_,module,exports){
(function(tree) {

tree.Filter = function Filter(key, op, val, index, filename) {
    this.key = key;
    this.op = op;
    this.val = val;
    this.index = index;
    this.filename = filename;

    this.id = this.key + this.op + this.val;
};

// xmlsafe, numeric, suffix
var ops = {
    '<': [' &lt; ', 'numeric'],
    '>': [' &gt; ', 'numeric'],
    '=': [' = ', 'both'],
    '!=': [' != ', 'both'],
    '<=': [' &lt;= ', 'numeric'],
    '>=': [' &gt;= ', 'numeric'],
    '=~': ['.match(', 'string', ')']
};

tree.Filter.prototype.ev = function(env) {
    this.key = this.key.ev(env);
    this.val = this.val.ev(env);
    return this;
};

tree.Filter.prototype.toXML = function(env) {
    if (tree.Reference.data.filter) {
        if (this.key.is === 'keyword' && -1 === tree.Reference.data.filter.value.indexOf(this.key.toString())) {
            env.error({
                message: this.key.toString() + ' is not a valid keyword in a filter expression',
                index: this.index,
                filename: this.filename
            });
        }
        if (this.val.is === 'keyword' && -1 === tree.Reference.data.filter.value.indexOf(this.val.toString())) {
            env.error({
                message: this.val.toString() + ' is not a valid keyword in a filter expression',
                index: this.index,
                filename: this.filename
            });
        }
    }
    var key = this.key.toString(false);
    var val = this.val.toString(this.val.is == 'string');

    if (
        (ops[this.op][1] == 'numeric' && isNaN(val) && this.val.is !== 'field') ||
        (ops[this.op][1] == 'string' && (val)[0] != "'")
    ) {
        env.error({
            message: 'Cannot use operator "' + this.op + '" with value ' + this.val,
            index: this.index,
            filename: this.filename
        });
    }

    return key + ops[this.op][0] + val + (ops[this.op][2] || '');
};

tree.Filter.prototype.toString = function() {
    return '[' + this.id + ']';
};

})(_dereq_('../tree'));

},{"../tree":9}],19:[function(_dereq_,module,exports){
(function (global){
var tree = _dereq_('../tree');
var _ = global._ || _dereq_('underscore');

tree.Filterset = function Filterset() {
    this.filters = {};
};

tree.Filterset.prototype.toXML = function(env) {
    var filters = [];
    for (var id in this.filters) {
        filters.push('(' + this.filters[id].toXML(env).trim() + ')');
    }
    if (filters.length) {
        return '    <Filter>' + filters.join(' and ') + '</Filter>\n';
    } else {
        return '';
    }
};

tree.Filterset.prototype.toString = function() {
    var arr = [];
    for (var id in this.filters) arr.push(this.filters[id].id);
    return arr.sort().join('\t');
};

tree.Filterset.prototype.ev = function(env) {
    for (var i in this.filters) {
        this.filters[i].ev(env);
    }
    return this;
};

tree.Filterset.prototype.clone = function() {
    var clone = new tree.Filterset();
    for (var id in this.filters) {
        clone.filters[id] = this.filters[id];
    }
    return clone;
};

// Note: other has to be a tree.Filterset.
tree.Filterset.prototype.cloneWith = function(other) {
    var additions = [];
    for (var id in other.filters) {
        var status = this.addable(other.filters[id]);
        // status is true, false or null. if it's null we don't fail this
        // clone nor do we add the filter.
        if (status === false) {
            return false;
        }
        if (status === true) {
            // Adding the filter will override another value.
            additions.push(other.filters[id]);
        }
    }

    // Adding the other filters doesn't make this filterset invalid, but it
    // doesn't add anything to it either.
    if (!additions.length) {
        return null;
    }

    // We can successfully add all filters. Now clone the filterset and add the
    // new rules.
    var clone = new tree.Filterset();

    // We can add the rules that are already present without going through the
    // add function as a Filterset is always in it's simplest canonical form.
    for (id in this.filters) {
        clone.filters[id] = this.filters[id];
    }

    // Only add new filters that actually change the filter.
    while (id = additions.shift()) {
        clone.add(id);
    }

    return clone;
};

tree.Filterset.prototype.toJS = function(env) {
  var opMap = {
    '=': '==='
  };
  return _.map(this.filters, function(filter) {
    var op = filter.op;
    if(op in opMap) {
      op = opMap[op];
    }
    var val = filter.val;
    if(filter._val !== undefined) {
      val = filter._val.toString(true);
    }
    var attrs = "data";
    return attrs + "['" + filter.key.value  + "'] " + op + " " + (val.is === 'string' ? "'" + val.toString().replace(/'/g, "\\'") + "'" : val);
  }).join(' && ');
};

// Returns true when the new filter can be added, false otherwise.
// It can also return null, and on the other side we test for === true or
// false
tree.Filterset.prototype.addable = function(filter) {
    var key = filter.key.toString(),
        value = filter.val.toString();

    if (value.match(/^[0-9]+(\.[0-9]*)?$/)) value = parseFloat(value);

    switch (filter.op) {
        case '=':
            // if there is already foo= and we're adding foo=
            if (this.filters[key + '='] !== undefined) {
                if (this.filters[key + '='].val.toString() != value) {
                    return false;
                } else {
                    return null;
                }
            }
            if (this.filters[key + '!=' + value] !== undefined) return false;
            if (this.filters[key + '>'] !== undefined && this.filters[key + '>'].val >= value) return false;
            if (this.filters[key + '<'] !== undefined && this.filters[key + '<'].val <= value) return false;
            if (this.filters[key + '>='] !== undefined  && this.filters[key + '>='].val > value) return false;
            if (this.filters[key + '<='] !== undefined  && this.filters[key + '<='].val < value) return false;
            return true;

        case '=~':
            return true;

        case '!=':
            if (this.filters[key + '='] !== undefined) return (this.filters[key + '='].val == value) ? false : null;
            if (this.filters[key + '!=' + value] !== undefined) return null;
            if (this.filters[key + '>'] !== undefined && this.filters[key + '>'].val >= value) return null;
            if (this.filters[key + '<'] !== undefined && this.filters[key + '<'].val <= value) return null;
            if (this.filters[key + '>='] !== undefined && this.filters[key + '>='].val > value) return null;
            if (this.filters[key + '<='] !== undefined && this.filters[key + '<='].val < value) return null;
            return true;

        case '>':
            if (key + '=' in this.filters) {
                if (this.filters[key + '='].val <= value) {
                    return false;
                } else {
                    return null;
                }
            }
            if (this.filters[key + '<'] !== undefined && this.filters[key + '<'].val <= value) return false;
            if (this.filters[key + '<='] !== undefined  && this.filters[key + '<='].val <= value) return false;
            if (this.filters[key + '>'] !== undefined && this.filters[key + '>'].val >= value) return null;
            if (this.filters[key + '>='] !== undefined  && this.filters[key + '>='].val > value) return null;
            return true;

        case '>=':
            if (this.filters[key + '=' ] !== undefined) return (this.filters[key + '='].val < value) ? false : null;
            if (this.filters[key + '<' ] !== undefined && this.filters[key + '<'].val <= value) return false;
            if (this.filters[key + '<='] !== undefined && this.filters[key + '<='].val < value) return false;
            if (this.filters[key + '>' ] !== undefined && this.filters[key + '>'].val >= value) return null;
            if (this.filters[key + '>='] !== undefined && this.filters[key + '>='].val >= value) return null;
            return true;

        case '<':
            if (this.filters[key + '=' ] !== undefined) return (this.filters[key + '='].val >= value) ? false : null;
            if (this.filters[key + '>' ] !== undefined && this.filters[key + '>'].val >= value) return false;
            if (this.filters[key + '>='] !== undefined && this.filters[key + '>='].val >= value) return false;
            if (this.filters[key + '<' ] !== undefined && this.filters[key + '<'].val <= value) return null;
            if (this.filters[key + '<='] !== undefined && this.filters[key + '<='].val < value) return null;
            return true;

        case '<=':
            if (this.filters[key + '=' ] !== undefined) return (this.filters[key + '='].val > value) ? false : null;
            if (this.filters[key + '>' ] !== undefined && this.filters[key + '>'].val >= value) return false;
            if (this.filters[key + '>='] !== undefined && this.filters[key + '>='].val > value) return false;
            if (this.filters[key + '<' ] !== undefined && this.filters[key + '<'].val <= value) return null;
            if (this.filters[key + '<='] !== undefined && this.filters[key + '<='].val <= value) return null;
            return true;
    }
};

// Does the new filter constitute a conflict?
tree.Filterset.prototype.conflict = function(filter) {
    var key = filter.key.toString(),
        value = filter.val.toString();

    if (!isNaN(parseFloat(value))) value = parseFloat(value);

    // if (a=b) && (a=c)
    // if (a=b) && (a!=b)
    // or (a!=b) && (a=b)
    if ((filter.op === '=' && this.filters[key + '='] !== undefined &&
        value != this.filters[key + '='].val.toString()) ||
        (filter.op === '!=' && this.filters[key + '='] !== undefined &&
        value == this.filters[key + '='].val.toString()) ||
        (filter.op === '=' && this.filters[key + '!='] !== undefined &&
        value == this.filters[key + '!='].val.toString())) {
        return filter.toString() + ' added to ' + this.toString() + ' produces an invalid filter';
    }

    return false;
};

// Only call this function for filters that have been cleared by .addable().
tree.Filterset.prototype.add = function(filter, env) {
    var key = filter.key.toString(),
        id,
        op = filter.op,
        conflict = this.conflict(filter),
        numval;

    if (conflict) return conflict;

    if (op === '=') {
        for (var i in this.filters) {
            if (this.filters[i].key == key) delete this.filters[i];
        }
        this.filters[key + '='] = filter;
    } else if (op === '!=') {
        this.filters[key + '!=' + filter.val] = filter;
    } else if (op === '=~') {
        this.filters[key + '=~' + filter.val] = filter;
    } else if (op === '>') {
        // If there are other filters that are also >
        // but are less than this one, they don't matter, so
        // remove them.
        for (var j in this.filters) {
            if (this.filters[j].key == key && this.filters[j].val <= filter.val) {
                delete this.filters[j];
            }
        }
        this.filters[key + '>'] = filter;
    } else if (op === '>=') {
        for (var k in this.filters) {
            numval = (+this.filters[k].val.toString());
            if (this.filters[k].key == key && numval < filter.val) {
                delete this.filters[k];
            }
        }
        if (this.filters[key + '!=' + filter.val] !== undefined) {
            delete this.filters[key + '!=' + filter.val];
            filter.op = '>';
            this.filters[key + '>'] = filter;
        }
        else {
            this.filters[key + '>='] = filter;
        }
    } else if (op === '<') {
        for (var l in this.filters) {
            numval = (+this.filters[l].val.toString());
            if (this.filters[l].key == key && numval >= filter.val) {
                delete this.filters[l];
            }
        }
        this.filters[key + '<'] = filter;
    } else if (op === '<=') {
        for (var m in this.filters) {
            numval = (+this.filters[m].val.toString());
            if (this.filters[m].key == key && numval > filter.val) {
                delete this.filters[m];
            }
        }
        if (this.filters[key + '!=' + filter.val] !== undefined) {
            delete this.filters[key + '!=' + filter.val];
            filter.op = '<';
            this.filters[key + '<'] = filter;
        }
        else {
            this.filters[key + '<='] = filter;
        }
    }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../tree":9,"underscore":42}],20:[function(_dereq_,module,exports){
(function(tree) {

tree._getFontSet = function(env, fonts) {
    var fontKey = fonts.join('');
    if (env._fontMap && env._fontMap[fontKey]) {
        return env._fontMap[fontKey];
    }

    var new_fontset = new tree.FontSet(env, fonts);
    env.effects.push(new_fontset);
    if (!env._fontMap) env._fontMap = {};
    env._fontMap[fontKey] = new_fontset;
    return new_fontset;
};

tree.FontSet = function FontSet(env, fonts) {
    this.fonts = fonts;
    this.name = 'fontset-' + env.effects.length;
};

tree.FontSet.prototype.toXML = function(env) {
    return '<FontSet name="' +
        this.name +
        '">\n' +
        this.fonts.map(function(f) {
            return '  <Font face-name="' + f +'"/>';
        }).join('\n') +
        '\n</FontSet>';
};

})(_dereq_('../tree'));

},{"../tree":9}],21:[function(_dereq_,module,exports){
var tree = _dereq_('../tree');

// Storage for Frame offset value
// and stores them as bit-sequences so that they can be combined,
// inverted, and compared quickly.
tree.FrameOffset = function(op, value, index) {
    value = parseInt(value, 10);
    if (value > tree.FrameOffset.max || value <= 0) {
        throw {
            message: 'Only frame-offset levels between 1 and ' +
                tree.FrameOffset.max + ' supported.',
            index: index
        };
    }

    if (op !== '=') {
        throw {
            message: 'only = operator is supported for frame-offset',
            index: index
        };
    }
    return value;
};

tree.FrameOffset.max = 32;
tree.FrameOffset.none = 0;


},{"../tree":9}],22:[function(_dereq_,module,exports){
(function(tree) {

tree.ImageFilter = function ImageFilter(filter, args) {
    this.filter = filter;
    this.args = args || null;
};

tree.ImageFilter.prototype = {
    is: 'imagefilter',
    ev: function() { return this; },

    toString: function() {
        if (this.args) {
            return this.filter + '(' + this.args.join(',') + ')';
        } else {
            return this.filter;
        }
    }
};


})(_dereq_('../tree'));

},{"../tree":9}],23:[function(_dereq_,module,exports){
(function (tree) {
tree.Invalid = function Invalid(chunk, index, message) {
    this.chunk = chunk;
    this.index = index;
    this.type = 'syntax';
    this.message = message || "Invalid code: " + this.chunk;
};

tree.Invalid.prototype.is = 'invalid';

tree.Invalid.prototype.ev = function(env) {
    env.error({
        chunk: this.chunk,
        index: this.index,
        type: 'syntax',
        message: this.message || "Invalid code: " + this.chunk
    });
    return {
        is: 'undefined'
    };
};
})(_dereq_('../tree'));

},{"../tree":9}],24:[function(_dereq_,module,exports){
(function(tree) {

tree.Keyword = function Keyword(value) {
    this.value = value;
    var special = {
        'transparent': 'color',
        'true': 'boolean',
        'false': 'boolean'
    };
    this.is = special[value] ? special[value] : 'keyword';
};
tree.Keyword.prototype = {
    ev: function() { return this; },
    toString: function() { return this.value; }
};

})(_dereq_('../tree'));

},{"../tree":9}],25:[function(_dereq_,module,exports){
(function(tree) {

tree.LayerXML = function(obj, styles) {
    var dsoptions = [];
    for (var i in obj.Datasource) {
        dsoptions.push('<Parameter name="' + i + '"><![CDATA[' +
            obj.Datasource[i] + ']]></Parameter>');
    }

    var prop_string = '';
    for (var prop in obj.properties) {
        if (prop === 'minzoom') {
            prop_string += '  maxzoom="' + tree.Zoom.ranges[obj.properties[prop]] + '"\n';
        } else if (prop === 'maxzoom') {
            prop_string += '  minzoom="' + tree.Zoom.ranges[obj.properties[prop]+1] + '"\n';
        } else {
            prop_string += '  ' + prop + '="' + obj.properties[prop] + '"\n';
        }
    }

    return '<Layer' +
        ' name="' + obj.name + '"\n' +
        prop_string +
        ((typeof obj.status === 'undefined') ? '' : '  status="' + obj.status + '"\n') +
        ((typeof obj.srs === 'undefined') ? '' : '  srs="' + obj.srs + '"') + '>\n    ' +
        styles.reverse().map(function(s) {
            return '<StyleName>' + s + '</StyleName>';
        }).join('\n    ') +
        (dsoptions.length ?
        '\n    <Datasource>\n       ' +
        dsoptions.join('\n       ') +
        '\n    </Datasource>\n'
        : '') +
        '  </Layer>\n';
};

})(_dereq_('../tree'));

},{"../tree":9}],26:[function(_dereq_,module,exports){
// A literal is a literal string for Mapnik - the
// result of the combination of a `tree.Field` with any
// other type.
(function(tree) {

tree.Literal = function Field(content) {
    this.value = content || '';
    this.is = 'field';
};

tree.Literal.prototype = {
    toString: function() {
        return this.value;
    },
    'ev': function() {
        return this;
    }
};

})(_dereq_('../tree'));

},{"../tree":9}],27:[function(_dereq_,module,exports){
// An operation is an expression with an op in between two operands,
// like 2 + 1.
(function(tree) {

tree.Operation = function Operation(op, operands, index) {
    this.op = op.trim();
    this.operands = operands;
    this.index = index;
};

tree.Operation.prototype.is = 'operation';

tree.Operation.prototype.ev = function(env) {
    var a = this.operands[0].ev(env),
        b = this.operands[1].ev(env),
        temp;

    if (a.is === 'undefined' || b.is === 'undefined') {
        return {
            is: 'undefined',
            value: 'undefined'
        };
    }

    if (a instanceof tree.Dimension && b instanceof tree.Color) {
        if (this.op === '*' || this.op === '+') {
            temp = b, b = a, a = temp;
        } else {
            env.error({
                name: "OperationError",
                message: "Can't substract or divide a color from a number",
                index: this.index
            });
        }
    }

    // Only concatenate plain strings, because this is easily
    // pre-processed
    if (a instanceof tree.Quoted && b instanceof tree.Quoted && this.op !== '+') {
        env.error({
           message: "Can't subtract, divide, or multiply strings.",
           index: this.index,
           type: 'runtime',
           filename: this.filename
        });
        return {
            is: 'undefined',
            value: 'undefined'
        };
    }

    // Fields, literals, dimensions, and quoted strings can be combined.
    if (a instanceof tree.Field || b instanceof tree.Field ||
        a instanceof tree.Literal || b instanceof tree.Literal) {
        if (a.is === 'color' || b.is === 'color') {
            env.error({
               message: "Can't subtract, divide, or multiply colors in expressions.",
               index: this.index,
               type: 'runtime',
               filename: this.filename
            });
            return {
                is: 'undefined',
                value: 'undefined'
            };
        } else {
            return new tree.Literal(a.ev(env).toString(true) + this.op + b.ev(env).toString(true));
        }
    }

    if (a.operate === undefined) {
        env.error({
           message: 'Cannot do math with type ' + a.is + '.',
           index: this.index,
           type: 'runtime',
           filename: this.filename
        });
        return {
            is: 'undefined',
            value: 'undefined'
        };
    }

    return a.operate(env, this.op, b);
};

tree.operate = function(op, a, b) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '%': return a % b;
        case '/': return a / b;
    }
};

})(_dereq_('../tree'));

},{"../tree":9}],28:[function(_dereq_,module,exports){
(function(tree) {

tree.Quoted = function Quoted(content) {
    this.value = content || '';
};

tree.Quoted.prototype = {
    is: 'string',

    toString: function(quotes) {
        var escapedValue = this.value
            .replace(/&/g, '&amp;')
        var xmlvalue = escapedValue
            .replace(/\'/g, '\\\'')
            .replace(/\"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/\>/g, '&gt;');
        return (quotes === true) ? "'" + xmlvalue + "'" : escapedValue;
    },

    'ev': function() {
        return this;
    },

    operate: function(env, op, other) {
        return new tree.Quoted(tree.operate(op, this.toString(), other.toString(this.contains_field)));
    }
};

})(_dereq_('../tree'));

},{"../tree":9}],29:[function(_dereq_,module,exports){
(function (global){
// Carto pulls in a reference from the `mapnik-reference`
// module. This file builds indexes from that file for its various
// options, and provides validation methods for property: value
// combinations.
(function(tree) {

var _ = global._ || _dereq_('underscore'),
    ref = {};

ref.setData = function(data) {
    ref.data = data;
    ref.selector_cache = generateSelectorCache(data);
    ref.mapnikFunctions = generateMapnikFunctions(data);

    ref.mapnikFunctions.matrix = [6];
    ref.mapnikFunctions.translate = [1, 2];
    ref.mapnikFunctions.scale = [1, 2];
    ref.mapnikFunctions.rotate = [1, 3];
    ref.mapnikFunctions.skewX = [1];
    ref.mapnikFunctions.skewY = [1];

    ref.required_cache = generateRequiredProperties(data);
};

ref.setVersion = function(version) {
    var mapnik_reference = _dereq_('mapnik-reference');
    if (mapnik_reference.version.hasOwnProperty(version)) {
        ref.setData(mapnik_reference.version[version]);
        return true;
    } else {
        return false;
    }
};

ref.selectorData = function(selector, i) {
    if (ref.selector_cache[selector]) return ref.selector_cache[selector][i];
};

ref.validSelector = function(selector) { return !!ref.selector_cache[selector]; };
ref.selectorName = function(selector) { return ref.selectorData(selector, 2); };
ref.selector = function(selector) { return ref.selectorData(selector, 0); };
ref.symbolizer = function(selector) { return ref.selectorData(selector, 1); };

function generateSelectorCache(data) {
    var index = {};
    for (var i in data.symbolizers) {
        for (var j in data.symbolizers[i]) {
            if (data.symbolizers[i][j].hasOwnProperty('css')) {
                index[data.symbolizers[i][j].css] = [data.symbolizers[i][j], i, j];
            }
        }
    }
    return index;
}

function generateMapnikFunctions(data) {
    var functions = {};
    for (var i in data.symbolizers) {
        for (var j in data.symbolizers[i]) {
            if (data.symbolizers[i][j].type === 'functions') {
                for (var k = 0; k < data.symbolizers[i][j].functions.length; k++) {
                    var fn = data.symbolizers[i][j].functions[k];
                    functions[fn[0]] = fn[1];
                }
            }
        }
    }
    return functions;
}

function generateRequiredProperties(data) {
    var cache = {};
    for (var symbolizer_name in data.symbolizers) {
        cache[symbolizer_name] = [];
        for (var j in data.symbolizers[symbolizer_name]) {
            if (data.symbolizers[symbolizer_name][j].required) {
                cache[symbolizer_name].push(data.symbolizers[symbolizer_name][j].css);
            }
        }
    }
    return cache;
}

ref.requiredProperties = function(symbolizer_name, rules) {
    var req = ref.required_cache[symbolizer_name];
    for (var i in req) {
        if (!(req[i] in rules)) {
            return 'Property ' + req[i] + ' required for defining ' +
                symbolizer_name + ' styles.';
        }
    }
};

// TODO: finish implementation - this is dead code
ref._validateValue = {
    'font': function(env, value) {
        if (env.validation_data && env.validation_data.fonts) {
            return env.validation_data.fonts.indexOf(value) != -1;
        } else {
            return true;
        }
    }
};

ref.isFont = function(selector) {
    return ref.selector(selector).validate == 'font';
};

// https://gist.github.com/982927
ref.editDistance = function(a, b){
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    var matrix = [];
    for (var i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (var j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i-1) == a.charAt(j-1)) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                    Math.min(matrix[i][j-1] + 1, // insertion
                    matrix[i-1][j] + 1)); // deletion
            }
        }
    }
    return matrix[b.length][a.length];
};

function validateFunctions(value, selector) {
    if (value.value[0].is === 'string') return true;
    for (var i in value.value) {
        for (var j in value.value[i].value) {
            if (value.value[i].value[j].is !== 'call') return false;
            var f = _.find(ref
                .selector(selector).functions, function(x) {
                    return x[0] == value.value[i].value[j].name;
                });
            if (!(f && f[1] == -1)) {
                // This filter is unknown or given an incorrect number of arguments
                if (!f || f[1] !== value.value[i].value[j].args.length) return false;
            }
        }
    }
    return true;
}

function validateKeyword(value, selector) {
    if (typeof ref.selector(selector).type === 'object') {
        return ref.selector(selector).type
            .indexOf(value.value[0].value) !== -1;
    } else {
        // allow unquoted keywords as strings
        return ref.selector(selector).type === 'string';
    }
}

ref.validValue = function(env, selector, value) {
    var i, j;
    // TODO: handle in reusable way
    if (!ref.selector(selector)) {
        return false;
    } else if (value.value[0].is == 'keyword') {
        return validateKeyword(value, selector);
    } else if (value.value[0].is == 'undefined') {
        // caught earlier in the chain - ignore here so that
        // error is not overridden
        return true;
    } else if (ref.selector(selector).type == 'numbers') {
        for (i in value.value) {
            if (value.value[i].is !== 'float') {
                return false;
            }
        }
        return true;
    } else if (ref.selector(selector).type == 'tags') {
        if (!value.value) return false;
        if (!value.value[0].value) {
            return value.value[0].is === 'tag';
        }
        for (i = 0; i < value.value[0].value.length; i++) {
            if (value.value[0].value[i].is !== 'tag') return false;
        }
        return true;
    } else if (ref.selector(selector).type == 'functions') {
        // For backwards compatibility, you can specify a string for `functions`-compatible
        // values, though they will not be validated.
        return validateFunctions(value, selector);
    } else if (ref.selector(selector).type === 'unsigned') {
        if (value.value[0].is === 'float') {
            value.value[0].round();
            return true;
        } else {
            return false;
        }
    } else if ((ref.selector(selector).expression)) {
        return true;
    } else {
        if (ref.selector(selector).validate) {
            var valid = false;
            for (i = 0; i < value.value.length; i++) {
                if (ref.selector(selector).type == value.value[i].is &&
                    ref
                        ._validateValue
                            [ref.selector(selector).validate]
                            (env, value.value[i].value)) {
                    return true;
                }
            }
            return valid;
        } else {
            return ref.selector(selector).type == value.value[0].is;
        }
    }
};

tree.Reference = ref;

})(_dereq_('../tree'));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../tree":9,"mapnik-reference":39,"underscore":42}],30:[function(_dereq_,module,exports){
(function(tree) {
// a rule is a single property and value combination, or variable
// name and value combination, like
// polygon-opacity: 1.0; or @opacity: 1.0;
tree.Rule = function Rule(name, value, index, filename) {
    var parts = name.split('/');
    this.name = parts.pop();
    this.instance = parts.length ? parts[0] : '__default__';
    this.value = (value instanceof tree.Value) ?
        value : new tree.Value([value]);
    this.index = index;
    this.symbolizer = tree.Reference.symbolizer(this.name);
    this.filename = filename;
    this.variable = (name.charAt(0) === '@');
};

tree.Rule.prototype.is = 'rule';

tree.Rule.prototype.clone = function() {
    var clone = Object.create(tree.Rule.prototype);
    clone.name = this.name;
    clone.value = this.value;
    clone.index = this.index;
    clone.instance = this.instance;
    clone.symbolizer = this.symbolizer;
    clone.filename = this.filename;
    clone.variable = this.variable;
    return clone;
};

tree.Rule.prototype.updateID = function() {
    return this.id = this.zoom + '#' + this.instance + '#' + this.name;
};

tree.Rule.prototype.toString = function() {
    return '[' + tree.Zoom.toString(this.zoom) + '] ' + this.name + ': ' + this.value;
};

function getMean(name) {
    return Object.keys(tree.Reference.selector_cache).map(function(f) {
        return [f, tree.Reference.editDistance(name, f)];
    }).sort(function(a, b) { return a[1] - b[1]; });
}

// second argument, if true, outputs the value of this
// rule without the usual attribute="content" wrapping. Right
// now this is just for the TextSymbolizer, but applies to other
// properties in reference.json which specify serialization=content
tree.Rule.prototype.toXML = function(env, content, sep, format) {
    if (!tree.Reference.validSelector(this.name)) {
        var mean = getMean(this.name);
        var mean_message = '';
        if (mean[0][1] < 3) {
            mean_message = '. Did you mean ' + mean[0][0] + '?';
        }
        return env.error({
            message: "Unrecognized rule: " + this.name + mean_message,
            index: this.index,
            type: 'syntax',
            filename: this.filename
        });
    }

    if ((this.value instanceof tree.Value) &&
        !tree.Reference.validValue(env, this.name, this.value)) {
        if (!tree.Reference.selector(this.name)) {
            return env.error({
                message: 'Unrecognized property: ' +
                    this.name,
                index: this.index,
                type: 'syntax',
                filename: this.filename
            });
        } else {
            var typename;
            if (tree.Reference.selector(this.name).validate) {
                typename = tree.Reference.selector(this.name).validate;
            } else if (typeof tree.Reference.selector(this.name).type === 'object') {
                typename = 'keyword (options: ' + tree.Reference.selector(this.name).type.join(', ') + ')';
            } else {
                typename = tree.Reference.selector(this.name).type;
            }
            return env.error({
                message: 'Invalid value for ' +
                    this.name +
                    ', the type ' + typename +
                    ' is expected. ' + this.value +
                    ' (of type ' + this.value.value[0].is + ') ' +
                    ' was given.',
                index: this.index,
                type: 'syntax',
                filename: this.filename
            });
        }
    }

    if (this.variable) {
        return '';
    } else if (tree.Reference.isFont(this.name) && this.value.value.length > 1) {
        var f = tree._getFontSet(env, this.value.value);
        return 'fontset-name="' + f.name + '"';
    } else if (content) {
        return this.value.toString(env, this.name, sep);
    } else {
        return tree.Reference.selectorName(this.name) +
            '="' +
            this.value.toString(env, this.name) +
            '"';
    }
};

// TODO: Rule ev chain should add fontsets to env.frames
tree.Rule.prototype.ev = function(context) {
    return new tree.Rule(this.name,
        this.value.ev(context),
        this.index,
        this.filename);
};

})(_dereq_('../tree'));

},{"../tree":9}],31:[function(_dereq_,module,exports){
(function(tree) {

tree.Ruleset = function Ruleset(selectors, rules) {
    this.selectors = selectors;
    this.rules = rules;
    // static cache of find() function
    this._lookups = {};
};
tree.Ruleset.prototype = {
    is: 'ruleset',
    'ev': function(env) {
        var i,
            ruleset = new tree.Ruleset(this.selectors, this.rules.slice(0));
        ruleset.root = this.root;

        // push the current ruleset to the frames stack
        env.frames.unshift(ruleset);

        // Evaluate everything else
        for (i = 0, rule; i < ruleset.rules.length; i++) {
            rule = ruleset.rules[i];
            ruleset.rules[i] = rule.ev ? rule.ev(env) : rule;
        }

        // Pop the stack
        env.frames.shift();

        return ruleset;
    },
    match: function(args) {
        return !args || args.length === 0;
    },
    variables: function() {
        if (this._variables) { return this._variables; }
        else {
            return this._variables = this.rules.reduce(function(hash, r) {
                if (r instanceof tree.Rule && r.variable === true) {
                    hash[r.name] = r;
                }
                return hash;
            }, {});
        }
    },
    variable: function(name) {
        return this.variables()[name];
    },
    rulesets: function() {
        if (this._rulesets) { return this._rulesets; }
        else {
            return this._rulesets = this.rules.filter(function(r) {
                return (r instanceof tree.Ruleset);
            });
        }
    },
    find: function(selector, self) {
        self = self || this;
        var rules = [], rule, match,
            key = selector.toString();

        if (key in this._lookups) { return this._lookups[key]; }

        this.rulesets().forEach(function(rule) {
            if (rule !== self) {
                for (var j = 0; j < rule.selectors.length; j++) {
                    match = selector.match(rule.selectors[j]);
                    if (match) {
                        if (selector.elements.length > 1) {
                            Array.prototype.push.apply(rules, rule.find(
                                new tree.Selector(null, null, null, selector.elements.slice(1)), self));
                        } else {
                            rules.push(rule);
                        }
                        break;
                    }
                }
            }
        });
        return this._lookups[key] = rules;
    },
    // Zooms can use variables. This replaces tree.Zoom objects on selectors
    // with simple bit-arrays that we can compare easily.
    evZooms: function(env) {
        for (var i = 0; i < this.selectors.length; i++) {
            var zval = tree.Zoom.all;
            for (var z = 0; z < this.selectors[i].zoom.length; z++) {
                zval = zval & this.selectors[i].zoom[z].ev(env).zoom;
            }
            this.selectors[i].zoom = zval;
        }
    },
    flatten: function(result, parents, env) {
        var selectors = [], i, j;
        if (this.selectors.length === 0) {
            env.frames = env.frames.concat(this.rules);
        }
        // evaluate zoom variables on this object.
        this.evZooms(env);
        for (i = 0; i < this.selectors.length; i++) {
            var child = this.selectors[i];

            if (!child.filters) {
                // TODO: is this internal inconsistency?
                // This is an invalid filterset.
                continue;
            }

            if (parents.length) {
                for (j = 0; j < parents.length; j++) {
                    var parent = parents[j];

                    var mergedFilters = parent.filters.cloneWith(child.filters);
                    if (mergedFilters === null) {
                        // Filters could be added, but they didn't change the
                        // filters. This means that we only have to clone when
                        // the zoom levels or the attachment is different too.
                        if (parent.zoom === (parent.zoom & child.zoom) &&
                            parent.frame_offset === child.frame_offset &&
                            parent.attachment === child.attachment &&
                            parent.elements.join() === child.elements.join()) {
                            selectors.push(parent);
                            continue;
                        } else {
                            mergedFilters = parent.filters;
                        }
                    } else if (!mergedFilters) {
                        // The merged filters are invalid, that means we don't
                        // have to clone.
                        continue;
                    }

                    var clone = Object.create(tree.Selector.prototype);
                    clone.filters = mergedFilters;
                    clone.zoom = parent.zoom & child.zoom;
                    clone.frame_offset = child.frame_offset;
                    clone.elements = parent.elements.concat(child.elements);
                    if (parent.attachment && child.attachment) {
                        clone.attachment = parent.attachment + '/' + child.attachment;
                    }
                    else clone.attachment = child.attachment || parent.attachment;
                    clone.conditions = parent.conditions + child.conditions;
                    clone.index = child.index;
                    selectors.push(clone);
                }
            } else {
                selectors.push(child);
            }
        }

        var rules = [];
        for (i = 0; i < this.rules.length; i++) {
            var rule = this.rules[i];

            // Recursively flatten any nested rulesets
            if (rule instanceof tree.Ruleset) {
                rule.flatten(result, selectors, env);
            } else if (rule instanceof tree.Rule) {
                rules.push(rule);
            } else if (rule instanceof tree.Invalid) {
                env.error(rule);
            }
        }

        var index = rules.length ? rules[0].index : false;
        for (i = 0; i < selectors.length; i++) {
            // For specificity sort, use the position of the first rule to allow
            // defining attachments that are under current element as a descendant
            // selector.
            if (index !== false) {
                selectors[i].index = index;
            }
            result.push(new tree.Definition(selectors[i], rules.slice()));
        }

        return result;
    }
};
})(_dereq_('../tree'));

},{"../tree":9}],32:[function(_dereq_,module,exports){
(function(tree) {

tree.Selector = function Selector(filters, zoom, frame_offset, elements, attachment, conditions, index) {
    this.elements = elements || [];
    this.attachment = attachment;
    this.filters = filters || {};
    this.frame_offset = frame_offset;
    this.zoom = typeof zoom !== 'undefined' ? zoom : tree.Zoom.all;
    this.conditions = conditions;
    this.index = index;
};

// Determine the specificity of this selector
// based on the specificity of its elements - calling
// Element.specificity() in order to do so
//
// [ID, Class, Filters, Position in document]
tree.Selector.prototype.specificity = function() {
    return this.elements.reduce(function(memo, e) {
        var spec = e.specificity();
        memo[0] += spec[0];
        memo[1] += spec[1];
        return memo;
    }, [0, 0, this.conditions, this.index]);
};

})(_dereq_('../tree'));

},{"../tree":9}],33:[function(_dereq_,module,exports){
(function (global){
(function(tree) {
var _ = global._ || _dereq_('underscore');

// Given a style's name, attachment, definitions, and an environment object,
// return a stringified style for Mapnik
tree.StyleXML = function(name, attachment, definitions, env) {
    var existing = {};
    var image_filters = [], image_filters_inflate = [], direct_image_filters = [], comp_op = [], opacity = [];

    for (var i = 0; i < definitions.length; i++) {
        for (var j = 0; j < definitions[i].rules.length; j++) {
            if (definitions[i].rules[j].name === 'image-filters') {
                image_filters.push(definitions[i].rules[j]);
            }
            if (definitions[i].rules[j].name === 'image-filters-inflate') {
                image_filters_inflate.push(definitions[i].rules[j]);
            }
            if (definitions[i].rules[j].name === 'direct-image-filters') {
                direct_image_filters.push(definitions[i].rules[j]);
            }
            if (definitions[i].rules[j].name === 'comp-op') {
                comp_op.push(definitions[i].rules[j]);
            }
            if (definitions[i].rules[j].name === 'opacity') {
                opacity.push(definitions[i].rules[j]);
            }
        }
    }

    var rules = definitions.map(function(definition) {
        return definition.toXML(env, existing);
    });

    var attrs_xml = '';

    if (image_filters.length) {
        attrs_xml += ' image-filters="' + _.chain(image_filters)
            // prevent identical filters from being duplicated in the style
            .uniq(function(i) { return i.id; }).map(function(f) {
            return f.ev(env).toXML(env, true, ',', 'image-filter');
        }).value().join(',') + '"';
    }

    if (image_filters_inflate.length) {
        attrs_xml += ' image-filters-inflate="' + image_filters_inflate[0].value.ev(env).toString() + '"';
    }

    if (direct_image_filters.length) {
        attrs_xml += ' direct-image-filters="' + _.chain(direct_image_filters)
            // prevent identical filters from being duplicated in the style
            .uniq(function(i) { return i.id; }).map(function(f) {
            return f.ev(env).toXML(env, true, ',', 'direct-image-filter');
        }).value().join(',') + '"';
    }

    if (comp_op.length && comp_op[0].value.ev(env).value != 'src-over') {
        attrs_xml += ' comp-op="' + comp_op[0].value.ev(env).toString() + '"';
    }

    if (opacity.length && opacity[0].value.ev(env).value != 1) {
        attrs_xml += ' opacity="' + opacity[0].value.ev(env).toString() + '"';
    }
    var rule_string = rules.join('');
    if (!attrs_xml && !rule_string) return '';
    return '<Style name="' + name + '" filter-mode="first"' + attrs_xml + '>\n' + rule_string + '</Style>';
};

})(_dereq_('../tree'));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../tree":9,"underscore":42}],34:[function(_dereq_,module,exports){
(function(tree) {

tree.URL = function URL(val, paths) {
    this.value = val;
    this.paths = paths;
};

tree.URL.prototype = {
    is: 'uri',
    toString: function() {
        return this.value.toString();
    },
    ev: function(ctx) {
        return new tree.URL(this.value.ev(ctx), this.paths);
    }
};

})(_dereq_('../tree'));

},{"../tree":9}],35:[function(_dereq_,module,exports){
(function(tree) {

tree.Value = function Value(value) {
    this.value = value;
};

tree.Value.prototype = {
    is: 'value',
    ev: function(env) {
        if (this.value.length === 1) {
            return this.value[0].ev(env);
        } else {
            return new tree.Value(this.value.map(function(v) {
                return v.ev(env);
            }));
        }
    },
    toString: function(env, selector, sep, format) {
        return this.value.map(function(e) {
            return e.toString(env, format);
        }).join(sep || ', ');
    },
    clone: function() {
        var obj = Object.create(tree.Value.prototype);
        if (Array.isArray(obj)) obj.value = this.value.slice();
        else obj.value = this.value;
        obj.is = this.is;
        return obj;
    },

    toJS: function(env) {
      //var v = this.value[0].value[0];
      var val = this.ev(env);
      var v = val.toString();
      if(val.is === "color" || val.is === 'uri' || val.is === 'string' || val.is === 'keyword') {
        v = "'" + v + "'";
      } else if (val.is === 'field') {
        // replace [variable] by ctx['variable']
        v = v.replace(/\[(.*)\]/g, "data['$1']");
      }else if (val.is === 'call') {
        v = JSON.stringify({
            name: val.name,
            args: val.args
        })
      }
      return "_value = " + v + ";";
    }

};

})(_dereq_('../tree'));

},{"../tree":9}],36:[function(_dereq_,module,exports){
(function(tree) {

tree.Variable = function Variable(name, index, filename) {
    this.name = name;
    this.index = index;
    this.filename = filename;
};

tree.Variable.prototype = {
    is: 'variable',
    toString: function() {
        return this.name;
    },
    ev: function(env) {
        var variable,
            v,
            name = this.name;

        if (this._css) return this._css;

        var thisframe = env.frames.filter(function(f) {
            return f.name == this.name;
        }.bind(this));
        if (thisframe.length) {
            return thisframe[0].value.ev(env);
        } else {
            env.error({
                message: 'variable ' + this.name + ' is undefined',
                index: this.index,
                type: 'runtime',
                filename: this.filename
            });
            return {
                is: 'undefined',
                value: 'undefined'
            };
        }
    }
};

})(_dereq_('../tree'));

},{"../tree":9}],37:[function(_dereq_,module,exports){
var tree = _dereq_('../tree');

// Storage for zoom ranges. Only supports continuous ranges,
// and stores them as bit-sequences so that they can be combined,
// inverted, and compared quickly.
tree.Zoom = function(op, value, index) {
    this.op = op;
    this.value = value;
    this.index = index;
};

tree.Zoom.prototype.setZoom = function(zoom) {
    this.zoom = zoom;
    return this;
};

tree.Zoom.prototype.ev = function(env) {
    var start = 0,
        end = Infinity,
        value = parseInt(this.value.ev(env).toString(), 10),
        zoom = 0;

    if (value > tree.Zoom.maxZoom || value < 0) {
        env.error({
            message: 'Only zoom levels between 0 and ' +
                tree.Zoom.maxZoom + ' supported.',
            index: this.index
        });
    }

    switch (this.op) {
        case '=':
            this.zoom = 1 << value;
            return this;
        case '>':
            start = value + 1;
            break;
        case '>=':
            start = value;
            break;
        case '<':
            end = value - 1;
            break;
        case '<=':
            end = value;
            break;
    }
    for (var i = 0; i <= tree.Zoom.maxZoom; i++) {
        if (i >= start && i <= end) {
            zoom |= (1 << i);
        }
    }
    this.zoom = zoom;
    return this;
};

tree.Zoom.prototype.toString = function() {
    return this.zoom;
};

// Covers all zoomlevels from 0 to 22
tree.Zoom.all = 0x7FFFFF;

tree.Zoom.maxZoom = 22;

tree.Zoom.ranges = {
     0: 1000000000,
     1: 500000000,
     2: 200000000,
     3: 100000000,
     4: 50000000,
     5: 25000000,
     6: 12500000,
     7: 6500000,
     8: 3000000,
     9: 1500000,
    10: 750000,
    11: 400000,
    12: 200000,
    13: 100000,
    14: 50000,
    15: 25000,
    16: 12500,
    17: 5000,
    18: 2500,
    19: 1500,
    20: 750,
    21: 500,
    22: 250,
    23: 100
};

// Only works for single range zooms. `[XXX....XXXXX.........]` is invalid.
tree.Zoom.prototype.toXML = function() {
    var conditions = [];
    if (this.zoom != tree.Zoom.all) {
        var start = null, end = null;
        for (var i = 0; i <= tree.Zoom.maxZoom; i++) {
            if (this.zoom & (1 << i)) {
                if (start === null) start = i;
                end = i;
            }
        }
        if (start > 0) conditions.push('    <MaxScaleDenominator>' +
            tree.Zoom.ranges[start] + '</MaxScaleDenominator>\n');
        if (end < 22) conditions.push('    <MinScaleDenominator>' +
            tree.Zoom.ranges[end + 1] + '</MinScaleDenominator>\n');
    }
    return conditions;
};

tree.Zoom.prototype.toString = function() {
    var str = '';
    for (var i = 0; i <= tree.Zoom.maxZoom; i++) {
        str += (this.zoom & (1 << i)) ? 'X' : '.';
    }
    return str;
};

},{"../tree":9}],38:[function(_dereq_,module,exports){
module.exports={
  "name": "carto",
  "version": "0.15.1-cdb1",
  "description": "CartoCSS Stylesheet Compiler",
  "url": "https://github.com/cartodb/carto",
  "repository": {
    "type": "git",
    "url": "http://github.com/cartodb/carto.git"
  },
  "author": {
    "name": "CartoDB",
    "url": "http://cartodb.com/"
  },
  "keywords": [
    "maps",
    "css",
    "stylesheets"
  ],
  "contributors": [
    "Tom MacWright <macwright@gmail.com>",
    "Konstantin Käfer",
    "Alexis Sellier <self@cloudhead.net>",
    "Raul Ochoa <rochoa@cartodb.com>",
    "Javi Santana <jsantana@cartodb.com>"
  ],
  "licenses": [
    {
      "type": "Apache"
    }
  ],
  "bin": {
    "carto": "./bin/carto"
  },
  "man": "./man/carto.1",
  "main": "./lib/carto/index",
  "engines": {
    "node": ">=0.4.x"
  },
  "dependencies": {
    "underscore": "1.8.3",
    "mapnik-reference": "~6.0.2",
    "optimist": "~0.6.0"
  },
  "devDependencies": {
    "mocha": "1.12.x",
    "jshint": "0.2.x",
    "sax": "0.1.x",
    "istanbul": "~0.2.14",
    "coveralls": "~2.10.1",
    "browserify": "~7.0.0",
    "uglify-js": "1.3.3"
  },
  "scripts": {
    "pretest": "npm install",
    "test": "mocha -R spec",
    "coverage": "istanbul cover ./node_modules/.bin/_mocha && coveralls < ./coverage/lcov.info"
  }
}

},{}],39:[function(_dereq_,module,exports){
(function (__dirname){
var fs = _dereq_('fs'),
    path = _dereq_('path'),
    existsSync = _dereq_('fs').existsSync || _dereq_('path').existsSync;

// Load all stated versions into the module exports
module.exports.version = {};

var refs = [
 '2.0.0',
 '2.0.1',
 '2.0.2',
 '2.1.0',
 '2.1.1',
 '2.2.0',
 '2.3.0',
 '3.0.0'
];

refs.map(function(version) {
    module.exports.version[version] = _dereq_(path.join(__dirname, version, 'reference.json'));
    var ds_path = path.join(__dirname, version, 'datasources.json');
    if (existsSync(ds_path)) {
        module.exports.version[version].datasources = _dereq_(ds_path).datasources;
    }
});

}).call(this,"/node_modules/mapnik-reference")

},{"fs":2,"path":40}],40:[function(_dereq_,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,_dereq_('_process'))

},{"_process":41}],41:[function(_dereq_,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],42:[function(_dereq_,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],43:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],44:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],45:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":44,"_process":41,"inherits":43}],46:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _carto = _dereq_('carto');

var _carto2 = _interopRequireDefault(_carto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SYMBOLYZERS = {
  marker: 'points',
  polygon: 'polygons',
  line: 'lines'
};

var CCSS = new _carto2.default.RendererJS();

var translateSymName = function translateSymName(symName) {
  return SYMBOLYZERS[symName];
};

var getAttributeName = function getAttributeName(sym, feature) {
  return sym + '-' + feature;
};

var addFunction = function addFunction(innerCode) {
  return 'function () {\n    var _value = null;\n    ' + innerCode + '\n    return _value;\n  }';
};

var makeTangramCond = function makeTangramCond(cond) {
  return cond.replace(/ctx.zoom/g, '$zoom').replace(/data\[/g, 'feature[');
};

var getAttributeFeature = function getAttributeFeature(sym, feature, ly) {
  var attr = ly[getAttributeName(sym, feature)];
  if (!attr) return '';

  var js = attr.js,
      fnBody = '';

  for (var i = 0; i < js.length; i++) {
    fnBody += makeTangramCond(js[i]);
  }

  return addFunction(fnBody);
};

var getSymbolizers = function getSymbolizers(layer) {
  var draw = {};
  for (var i = 0; i < layer.symbolizers.length; i++) {
    var sym = layer.symbolizers[i];
    draw[translateSymName(sym)] = {
      color: getAttributeFeature(sym, 'fill', layer),
      size: getAttributeFeature(sym, 'size', layer),
      width: getAttributeFeature(sym, 'width', layer)
    };
  }

  return draw;
};

var extractFeatures = function extractFeatures(ccss) {
  var layers = CCSS.render(ccss).getLayers(),
      draws = {};

  // NOTE: this is wrong, we have to separate the layers.
  for (var i = 0; i < layers.length; i++) {
    var ly = layers[i].shader;

    draws = getSymbolizers(ly);
  }

  return draws;
};

var C2Y;

exports.default = C2Y = {
  extractFeatures: extractFeatures
};

},{"carto":4}],47:[function(_dereq_,module,exports){
'use strict';

var _carto = _dereq_('./carto');

var _carto2 = _interopRequireDefault(_carto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  carto2Draw: _carto2.default.extractFeatures
};

},{"./carto":46}]},{},[47])(47)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL2Z1bmN0aW9ucy5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3BhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vcmVuZGVyZXIuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3JlbmRlcmVyX2pzLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90b3JxdWUtcmVmZXJlbmNlLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL2NhbGwuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvY29sb3IuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvY29tbWVudC5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9kZWZpbml0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL2RpbWVuc2lvbi5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9lbGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL2V4cHJlc3Npb24uanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvZmllbGQuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL2ZpbHRlcnNldC5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9mb250c2V0LmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL2ZyYW1lX29mZnNldC5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9pbWFnZWZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9pbnZhbGlkLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL2tleXdvcmQuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvbGF5ZXIuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvbGl0ZXJhbC5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9vcGVyYXRpb24uanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvcXVvdGVkLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL3JlZmVyZW5jZS5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9ydWxlLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL3J1bGVzZXQuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvc2VsZWN0b3IuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvc3R5bGUuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvdXJsLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL3ZhbHVlLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL3ZhcmlhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL3pvb20uanMiLCJub2RlX21vZHVsZXMvY2FydG8vcGFja2FnZS5qc29uIiwibm9kZV9tb2R1bGVzL21hcG5pay1yZWZlcmVuY2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91bmRlcnNjb3JlL3VuZGVyc2NvcmUuanMiLCJub2RlX21vZHVsZXMvdXRpbC9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsInNyYy9jYXJ0by5qcyIsInNyYy9tb2R1bGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdldBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbFpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3Q0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDblFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVnREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7QUMxa0JBOzs7Ozs7QUFFQSxJQUFNLGNBQWM7QUFDbEIsVUFBUSxRQURVO0FBRWxCLFdBQVMsVUFGUztBQUdsQixRQUFNO0FBSFksQ0FBcEI7O0FBTUEsSUFBTSxPQUFPLElBQUksZ0JBQU0sVUFBVixFQUFiOztBQUVBLElBQU0sbUJBQW1CLFNBQW5CLGdCQUFtQixDQUFVLE9BQVYsRUFBbUI7QUFDMUMsU0FBTyxZQUFZLE9BQVosQ0FBUDtBQUNBLENBRkY7O0FBSUEsSUFBTSxtQkFBbUIsU0FBbkIsZ0JBQW1CLENBQVUsR0FBVixFQUFlLE9BQWYsRUFBd0I7QUFDL0MsU0FBTyxNQUFNLEdBQU4sR0FBWSxPQUFuQjtBQUNBLENBRkY7O0FBSUEsSUFBTSxjQUFjLFNBQWQsV0FBYyxDQUFVLFNBQVYsRUFBcUI7QUFDdkMseURBRUksU0FGSjtBQUtBLENBTkY7O0FBUUEsSUFBTSxrQkFBa0IsU0FBbEIsZUFBa0IsQ0FBVSxJQUFWLEVBQWdCO0FBQ3RDLFNBQU8sS0FDSixPQURJLENBQ0ksV0FESixFQUNpQixPQURqQixFQUVKLE9BRkksQ0FFSSxTQUZKLEVBRWUsVUFGZixDQUFQO0FBR0EsQ0FKRjs7QUFNQSxJQUFNLHNCQUFzQixTQUF0QixtQkFBc0IsQ0FBVSxHQUFWLEVBQWUsT0FBZixFQUF3QixFQUF4QixFQUE0QjtBQUN0RCxNQUFJLE9BQU8sR0FBRyxpQkFBaUIsR0FBakIsRUFBc0IsT0FBdEIsQ0FBSCxDQUFYO0FBQ0EsTUFBSSxDQUFDLElBQUwsRUFBVyxPQUFPLEVBQVA7O0FBRVgsTUFBSSxLQUFLLEtBQUssRUFBZDtBQUFBLE1BQ0ksU0FBUyxFQURiOztBQUdBLE9BQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxHQUFHLE1BQXZCLEVBQStCLEdBQS9CLEVBQW9DO0FBQ25DLGNBQVUsZ0JBQWdCLEdBQUcsQ0FBSCxDQUFoQixDQUFWO0FBQ0E7O0FBRUQsU0FBTyxZQUFZLE1BQVosQ0FBUDtBQUNBLENBWkY7O0FBY0EsSUFBTSxpQkFBaUIsU0FBakIsY0FBaUIsQ0FBVSxLQUFWLEVBQWlCO0FBQ3RDLE1BQUksT0FBTyxFQUFYO0FBQ0EsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLE1BQU0sV0FBTixDQUFrQixNQUF0QyxFQUE4QyxHQUE5QyxFQUFtRDtBQUNsRCxRQUFJLE1BQU0sTUFBTSxXQUFOLENBQWtCLENBQWxCLENBQVY7QUFDQSxTQUFLLGlCQUFpQixHQUFqQixDQUFMLElBQThCO0FBQzVCLGFBQU8sb0JBQW9CLEdBQXBCLEVBQXlCLE1BQXpCLEVBQWlDLEtBQWpDLENBRHFCO0FBRTVCLFlBQU0sb0JBQW9CLEdBQXBCLEVBQXlCLE1BQXpCLEVBQWlDLEtBQWpDLENBRnNCO0FBRzVCLGFBQU8sb0JBQW9CLEdBQXBCLEVBQXlCLE9BQXpCLEVBQWtDLEtBQWxDO0FBSHFCLEtBQTlCO0FBS0E7O0FBRUQsU0FBTyxJQUFQO0FBQ0EsQ0FaRjs7QUFjQSxJQUFNLGtCQUFrQixTQUFsQixlQUFrQixDQUFVLElBQVYsRUFBZ0I7QUFDdEMsTUFBSSxTQUFTLEtBQUssTUFBTCxDQUFZLElBQVosRUFBa0IsU0FBbEIsRUFBYjtBQUFBLE1BQ0ksUUFBUSxFQURaOztBQUdBO0FBQ0EsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLE9BQU8sTUFBM0IsRUFBbUMsR0FBbkMsRUFBd0M7QUFDdkMsUUFBSSxLQUFLLE9BQU8sQ0FBUCxFQUFVLE1BQW5COztBQUVBLFlBQVEsZUFBZSxFQUFmLENBQVI7QUFDQTs7QUFFRCxTQUFPLEtBQVA7QUFDRCxDQVpEOztBQWNBLElBQUksR0FBSjs7a0JBRWUsTUFBTTtBQUNuQjtBQURtQixDOzs7OztBQzVFckI7Ozs7OztBQUVBLE9BQU8sT0FBUCxHQUFpQjtBQUNmLGNBQVksZ0JBQUs7QUFERixDQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gd2hlbiB1c2VkIGluIG5vZGUsIHRoaXMgd2lsbCBhY3R1YWxseSBsb2FkIHRoZSB1dGlsIG1vZHVsZSB3ZSBkZXBlbmQgb25cbi8vIHZlcnN1cyBsb2FkaW5nIHRoZSBidWlsdGluIHV0aWwgbW9kdWxlIGFzIGhhcHBlbnMgb3RoZXJ3aXNlXG4vLyB0aGlzIGlzIGEgYnVnIGluIG5vZGUgbW9kdWxlIGxvYWRpbmcgYXMgZmFyIGFzIEkgYW0gY29uY2VybmVkXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG5cbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gc3RhY2tTdGFydEZ1bmN0aW9uLm5hbWU7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgIHJldHVybiAnJyArIHZhbHVlO1xuICB9XG4gIGlmICh1dGlsLmlzTnVtYmVyKHZhbHVlKSAmJiAhaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKHV0aWwuaXNGdW5jdGlvbih2YWx1ZSkgfHwgdXRpbC5pc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHV0aWwuaXNTdHJpbmcocykpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmFjdHVhbCwgcmVwbGFjZXIpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5leHBlY3RlZCwgcmVwbGFjZXIpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICh1dGlsLmlzQnVmZmVyKGFjdHVhbCkgJiYgdXRpbC5pc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICBpZiAoYWN0dWFsLmxlbmd0aCAhPSBleHBlY3RlZC5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0dWFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWN0dWFsW2ldICE9PSBleHBlY3RlZFtpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICghdXRpbC5pc09iamVjdChhY3R1YWwpICYmICF1dGlsLmlzT2JqZWN0KGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYikge1xuICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZChhKSB8fCB1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vIGlmIG9uZSBpcyBhIHByaW1pdGl2ZSwgdGhlIG90aGVyIG11c3QgYmUgc2FtZVxuICBpZiAodXRpbC5pc1ByaW1pdGl2ZShhKSB8fCB1dGlsLmlzUHJpbWl0aXZlKGIpKSB7XG4gICAgcmV0dXJuIGEgPT09IGI7XG4gIH1cbiAgdmFyIGFJc0FyZ3MgPSBpc0FyZ3VtZW50cyhhKSxcbiAgICAgIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgaWYgKChhSXNBcmdzICYmICFiSXNBcmdzKSB8fCAoIWFJc0FyZ3MgJiYgYklzQXJncykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYUlzQXJncykge1xuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYik7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGFjdHVhbCA9IGU7XG4gIH1cblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICghc2hvdWxkVGhyb3cgJiYgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFtmYWxzZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHt0aHJvdyBlcnI7fX07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiIiwiKGZ1bmN0aW9uICh0cmVlKSB7XG5cbnRyZWUuZnVuY3Rpb25zID0ge1xuICAgIHJnYjogZnVuY3Rpb24gKHIsIGcsIGIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmdiYShyLCBnLCBiLCAxLjApO1xuICAgIH0sXG4gICAgcmdiYTogZnVuY3Rpb24gKHIsIGcsIGIsIGEpIHtcbiAgICAgICAgdmFyIHJnYiA9IFtyLCBnLCBiXS5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIG51bWJlcihjKTsgfSk7XG4gICAgICAgIGEgPSBudW1iZXIoYSk7XG4gICAgICAgIGlmIChyZ2Iuc29tZShpc05hTikgfHwgaXNOYU4oYSkpIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gbmV3IHRyZWUuQ29sb3IocmdiLCBhKTtcbiAgICB9LFxuICAgIC8vIE9ubHkgcmVxdWlyZSB2YWxcbiAgICBzdG9wOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIHZhciBjb2xvciwgbW9kZTtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSBjb2xvciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSBtb2RlID0gYXJndW1lbnRzWzJdO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpczogJ3RhZycsXG4gICAgICAgICAgICB2YWw6IHZhbCxcbiAgICAgICAgICAgIGNvbG9yOiBjb2xvcixcbiAgICAgICAgICAgIG1vZGU6IG1vZGUsXG4gICAgICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24oZW52KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdcXG5cXHQ8c3RvcCB2YWx1ZT1cIicgKyB2YWwuZXYoZW52KSArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAoY29sb3IgPyAnIGNvbG9yPVwiJyArIGNvbG9yLmV2KGVudikgKyAnXCIgJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgIChtb2RlID8gJyBtb2RlPVwiJyArIG1vZGUuZXYoZW52KSArICdcIiAnIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgJy8+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGhzbDogZnVuY3Rpb24gKGgsIHMsIGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaHNsYShoLCBzLCBsLCAxLjApO1xuICAgIH0sXG4gICAgaHNsYTogZnVuY3Rpb24gKGgsIHMsIGwsIGEpIHtcbiAgICAgICAgaCA9IChudW1iZXIoaCkgJSAzNjApIC8gMzYwO1xuICAgICAgICBzID0gbnVtYmVyKHMpOyBsID0gbnVtYmVyKGwpOyBhID0gbnVtYmVyKGEpO1xuICAgICAgICBpZiAoW2gsIHMsIGwsIGFdLnNvbWUoaXNOYU4pKSByZXR1cm4gbnVsbDtcblxuICAgICAgICB2YXIgbTIgPSBsIDw9IDAuNSA/IGwgKiAocyArIDEpIDogbCArIHMgLSBsICogcyxcbiAgICAgICAgICAgIG0xID0gbCAqIDIgLSBtMjtcblxuICAgICAgICByZXR1cm4gdGhpcy5yZ2JhKGh1ZShoICsgMS8zKSAqIDI1NSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBodWUoaCkgICAgICAgKiAyNTUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgaHVlKGggLSAxLzMpICogMjU1LFxuICAgICAgICAgICAgICAgICAgICAgICAgIGEpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGh1ZShoKSB7XG4gICAgICAgICAgICBoID0gaCA8IDAgPyBoICsgMSA6IChoID4gMSA/IGggLSAxIDogaCk7XG4gICAgICAgICAgICBpZiAgICAgIChoICogNiA8IDEpIHJldHVybiBtMSArIChtMiAtIG0xKSAqIGggKiA2O1xuICAgICAgICAgICAgZWxzZSBpZiAoaCAqIDIgPCAxKSByZXR1cm4gbTI7XG4gICAgICAgICAgICBlbHNlIGlmIChoICogMyA8IDIpIHJldHVybiBtMSArIChtMiAtIG0xKSAqICgyLzMgLSBoKSAqIDY7XG4gICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgIHJldHVybiBtMTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaHVlOiBmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gbmV3IHRyZWUuRGltZW5zaW9uKE1hdGgucm91bmQoY29sb3IudG9IU0woKS5oKSk7XG4gICAgfSxcbiAgICBzYXR1cmF0aW9uOiBmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gbmV3IHRyZWUuRGltZW5zaW9uKE1hdGgucm91bmQoY29sb3IudG9IU0woKS5zICogMTAwKSwgJyUnKTtcbiAgICB9LFxuICAgIGxpZ2h0bmVzczogZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICAgIGlmICghKCd0b0hTTCcgaW4gY29sb3IpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkRpbWVuc2lvbihNYXRoLnJvdW5kKGNvbG9yLnRvSFNMKCkubCAqIDEwMCksICclJyk7XG4gICAgfSxcbiAgICBhbHBoYTogZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICAgIGlmICghKCd0b0hTTCcgaW4gY29sb3IpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkRpbWVuc2lvbihjb2xvci50b0hTTCgpLmEpO1xuICAgIH0sXG4gICAgc2F0dXJhdGU6IGZ1bmN0aW9uIChjb2xvciwgYW1vdW50KSB7XG4gICAgICAgIGlmICghKCd0b0hTTCcgaW4gY29sb3IpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGhzbCA9IGNvbG9yLnRvSFNMKCk7XG5cbiAgICAgICAgaHNsLnMgKz0gYW1vdW50LnZhbHVlIC8gMTAwO1xuICAgICAgICBoc2wucyA9IGNsYW1wKGhzbC5zKTtcbiAgICAgICAgcmV0dXJuIGhzbGEoaHNsKTtcbiAgICB9LFxuICAgIGRlc2F0dXJhdGU6IGZ1bmN0aW9uIChjb2xvciwgYW1vdW50KSB7XG4gICAgICAgIGlmICghKCd0b0hTTCcgaW4gY29sb3IpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGhzbCA9IGNvbG9yLnRvSFNMKCk7XG5cbiAgICAgICAgaHNsLnMgLT0gYW1vdW50LnZhbHVlIC8gMTAwO1xuICAgICAgICBoc2wucyA9IGNsYW1wKGhzbC5zKTtcbiAgICAgICAgcmV0dXJuIGhzbGEoaHNsKTtcbiAgICB9LFxuICAgIGxpZ2h0ZW46IGZ1bmN0aW9uIChjb2xvciwgYW1vdW50KSB7XG4gICAgICAgIGlmICghKCd0b0hTTCcgaW4gY29sb3IpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGhzbCA9IGNvbG9yLnRvSFNMKCk7XG5cbiAgICAgICAgaHNsLmwgKz0gYW1vdW50LnZhbHVlIC8gMTAwO1xuICAgICAgICBoc2wubCA9IGNsYW1wKGhzbC5sKTtcbiAgICAgICAgcmV0dXJuIGhzbGEoaHNsKTtcbiAgICB9LFxuICAgIGRhcmtlbjogZnVuY3Rpb24gKGNvbG9yLCBhbW91bnQpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgaHNsID0gY29sb3IudG9IU0woKTtcblxuICAgICAgICBoc2wubCAtPSBhbW91bnQudmFsdWUgLyAxMDA7XG4gICAgICAgIGhzbC5sID0gY2xhbXAoaHNsLmwpO1xuICAgICAgICByZXR1cm4gaHNsYShoc2wpO1xuICAgIH0sXG4gICAgZmFkZWluOiBmdW5jdGlvbiAoY29sb3IsIGFtb3VudCkge1xuICAgICAgICBpZiAoISgndG9IU0wnIGluIGNvbG9yKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHZhciBoc2wgPSBjb2xvci50b0hTTCgpO1xuXG4gICAgICAgIGhzbC5hICs9IGFtb3VudC52YWx1ZSAvIDEwMDtcbiAgICAgICAgaHNsLmEgPSBjbGFtcChoc2wuYSk7XG4gICAgICAgIHJldHVybiBoc2xhKGhzbCk7XG4gICAgfSxcbiAgICBmYWRlb3V0OiBmdW5jdGlvbiAoY29sb3IsIGFtb3VudCkge1xuICAgICAgICBpZiAoISgndG9IU0wnIGluIGNvbG9yKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHZhciBoc2wgPSBjb2xvci50b0hTTCgpO1xuXG4gICAgICAgIGhzbC5hIC09IGFtb3VudC52YWx1ZSAvIDEwMDtcbiAgICAgICAgaHNsLmEgPSBjbGFtcChoc2wuYSk7XG4gICAgICAgIHJldHVybiBoc2xhKGhzbCk7XG4gICAgfSxcbiAgICBzcGluOiBmdW5jdGlvbiAoY29sb3IsIGFtb3VudCkge1xuICAgICAgICBpZiAoISgndG9IU0wnIGluIGNvbG9yKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHZhciBoc2wgPSBjb2xvci50b0hTTCgpO1xuICAgICAgICB2YXIgaHVlID0gKGhzbC5oICsgYW1vdW50LnZhbHVlKSAlIDM2MDtcblxuICAgICAgICBoc2wuaCA9IGh1ZSA8IDAgPyAzNjAgKyBodWUgOiBodWU7XG5cbiAgICAgICAgcmV0dXJuIGhzbGEoaHNsKTtcbiAgICB9LFxuICAgIHJlcGxhY2U6IGZ1bmN0aW9uIChlbnRpdHksIGEsIGIpIHtcbiAgICAgICAgaWYgKGVudGl0eS5pcyA9PT0gJ2ZpZWxkJykge1xuICAgICAgICAgICAgcmV0dXJuIGVudGl0eS50b1N0cmluZyArICcucmVwbGFjZSgnICsgYS50b1N0cmluZygpICsgJywgJyArIGIudG9TdHJpbmcoKSArICcpJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBlbnRpdHkucmVwbGFjZShhLCBiKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLy9cbiAgICAvLyBDb3B5cmlnaHQgKGMpIDIwMDYtMjAwOSBIYW1wdG9uIENhdGxpbiwgTmF0aGFuIFdlaXplbmJhdW0sIGFuZCBDaHJpcyBFcHBzdGVpblxuICAgIC8vIGh0dHA6Ly9zYXNzLWxhbmcuY29tXG4gICAgLy9cbiAgICBtaXg6IGZ1bmN0aW9uIChjb2xvcjEsIGNvbG9yMiwgd2VpZ2h0KSB7XG4gICAgICAgIHZhciBwID0gd2VpZ2h0LnZhbHVlIC8gMTAwLjA7XG4gICAgICAgIHZhciB3ID0gcCAqIDIgLSAxO1xuICAgICAgICB2YXIgYSA9IGNvbG9yMS50b0hTTCgpLmEgLSBjb2xvcjIudG9IU0woKS5hO1xuXG4gICAgICAgIHZhciB3MSA9ICgoKHcgKiBhID09IC0xKSA/IHcgOiAodyArIGEpIC8gKDEgKyB3ICogYSkpICsgMSkgLyAyLjA7XG4gICAgICAgIHZhciB3MiA9IDEgLSB3MTtcblxuICAgICAgICB2YXIgcmdiID0gW2NvbG9yMS5yZ2JbMF0gKiB3MSArIGNvbG9yMi5yZ2JbMF0gKiB3MixcbiAgICAgICAgICAgICAgICAgICBjb2xvcjEucmdiWzFdICogdzEgKyBjb2xvcjIucmdiWzFdICogdzIsXG4gICAgICAgICAgICAgICAgICAgY29sb3IxLnJnYlsyXSAqIHcxICsgY29sb3IyLnJnYlsyXSAqIHcyXTtcblxuICAgICAgICB2YXIgYWxwaGEgPSBjb2xvcjEuYWxwaGEgKiBwICsgY29sb3IyLmFscGhhICogKDEgLSBwKTtcblxuICAgICAgICByZXR1cm4gbmV3IHRyZWUuQ29sb3IocmdiLCBhbHBoYSk7XG4gICAgfSxcbiAgICBncmV5c2NhbGU6IGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXNhdHVyYXRlKGNvbG9yLCBuZXcgdHJlZS5EaW1lbnNpb24oMTAwKSk7XG4gICAgfSxcbiAgICAnJSc6IGZ1bmN0aW9uIChxdW90ZWQgLyogYXJnLCBhcmcsIC4uLiovKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgICAgIHN0ciA9IHF1b3RlZC52YWx1ZTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC8lcy8sICAgIGFyZ3NbaV0udmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJVtkYV0vLCBhcmdzW2ldLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC8lJS9nLCAnJScpO1xuICAgICAgICByZXR1cm4gbmV3IHRyZWUuUXVvdGVkKHN0cik7XG4gICAgfVxufTtcblxudmFyIGltYWdlX2ZpbHRlcl9mdW5jdG9ycyA9IFtcbiAgICAnZW1ib3NzJywgJ2JsdXInLCAnZ3JheScsICdzb2JlbCcsICdlZGdlLWRldGVjdCcsXG4gICAgJ3gtZ3JhZGllbnQnLCAneS1ncmFkaWVudCcsICdzaGFycGVuJ107XG5cbmZvciAodmFyIGkgPSAwOyBpIDwgaW1hZ2VfZmlsdGVyX2Z1bmN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGYgPSBpbWFnZV9maWx0ZXJfZnVuY3RvcnNbaV07XG4gICAgdHJlZS5mdW5jdGlvbnNbZl0gPSAoZnVuY3Rpb24oZikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuSW1hZ2VGaWx0ZXIoZik7XG4gICAgICAgIH07XG4gICAgfSkoZik7XG59XG5cbnRyZWUuZnVuY3Rpb25zWydhZ2ctc3RhY2stYmx1ciddID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHJldHVybiBuZXcgdHJlZS5JbWFnZUZpbHRlcignYWdnLXN0YWNrLWJsdXInLCBbeCwgeV0pO1xufTtcblxudHJlZS5mdW5jdGlvbnNbJ3NjYWxlLWhzbGEnXSA9IGZ1bmN0aW9uKGgwLGgxLHMwLHMxLGwwLGwxLGEwLGExKSB7XG4gICAgcmV0dXJuIG5ldyB0cmVlLkltYWdlRmlsdGVyKCdzY2FsZS1oc2xhJywgW2gwLGgxLHMwLHMxLGwwLGwxLGEwLGExXSk7XG59O1xuXG5mdW5jdGlvbiBoc2xhKGgpIHtcbiAgICByZXR1cm4gdHJlZS5mdW5jdGlvbnMuaHNsYShoLmgsIGgucywgaC5sLCBoLmEpO1xufVxuXG5mdW5jdGlvbiBudW1iZXIobikge1xuICAgIGlmIChuIGluc3RhbmNlb2YgdHJlZS5EaW1lbnNpb24pIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQobi51bml0ID09ICclJyA/IG4udmFsdWUgLyAxMDAgOiBuLnZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZihuKSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIG47XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNsYW1wKHZhbCkge1xuICAgIHJldHVybiBNYXRoLm1pbigxLCBNYXRoLm1heCgwLCB2YWwpKTtcbn1cblxufSkocmVxdWlyZSgnLi90cmVlJykpO1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgZnMgPSByZXF1aXJlKCdmcycpLFxuICAgIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cblxuZnVuY3Rpb24gZ2V0VmVyc2lvbigpIHtcbiAgICBpZiAocHJvY2Vzcy5icm93c2VyKSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlKCcuLi8uLi9wYWNrYWdlLmpzb24nKS52ZXJzaW9uLnNwbGl0KCcuJyk7XG4gICAgfSBlbHNlIGlmIChwYXJzZUludChwcm9jZXNzLnZlcnNpb24uc3BsaXQoJy4nKVsxXSwgMTApID4gNCkge1xuICAgICAgICByZXR1cm4gcmVxdWlyZSgnLi4vLi4vcGFja2FnZS5qc29uJykudmVyc2lvbi5zcGxpdCgnLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG9sZGVyIG5vZGVcbiAgICAgICAgdmFyIHBhY2thZ2VfanNvbiA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsJy4uLy4uL3BhY2thZ2UuanNvbicpKSk7XG4gICAgICAgIHJldHVybiBwYWNrYWdlX2pzb24udmVyc2lvbi5zcGxpdCgnLicpO1xuICAgIH1cbn1cblxudmFyIGNhcnRvID0ge1xuICAgIHZlcnNpb246IGdldFZlcnNpb24oKSxcbiAgICBQYXJzZXI6IHJlcXVpcmUoJy4vcGFyc2VyJykuUGFyc2VyLFxuICAgIFJlbmRlcmVyOiByZXF1aXJlKCcuL3JlbmRlcmVyJykuUmVuZGVyZXIsXG4gICAgdHJlZTogcmVxdWlyZSgnLi90cmVlJyksXG4gICAgUmVuZGVyZXJKUzogcmVxdWlyZSgnLi9yZW5kZXJlcl9qcycpLFxuICAgIGRlZmF1bHRfcmVmZXJlbmNlOiByZXF1aXJlKCcuL3RvcnF1ZS1yZWZlcmVuY2UnKSxcblxuICAgIC8vIEBUT0RPXG4gICAgd3JpdGVFcnJvcjogZnVuY3Rpb24oY3R4LCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gJyc7XG4gICAgICAgIHZhciBleHRyYWN0ID0gY3R4LmV4dHJhY3Q7XG4gICAgICAgIHZhciBlcnJvciA9IFtdO1xuXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIGlmIChvcHRpb25zLnNpbGVudCkgeyByZXR1cm47IH1cblxuICAgICAgICBvcHRpb25zLmluZGVudCA9IG9wdGlvbnMuaW5kZW50IHx8ICcnO1xuXG4gICAgICAgIGlmICghKCdpbmRleCcgaW4gY3R4KSB8fCAhZXh0cmFjdCkge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWwuZXJyb3Iob3B0aW9ucy5pbmRlbnQgKyAoY3R4LnN0YWNrIHx8IGN0eC5tZXNzYWdlKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mKGV4dHJhY3RbMF0pID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZXJyb3IucHVzaChzdHlsaXplKChjdHgubGluZSAtIDEpICsgJyAnICsgZXh0cmFjdFswXSwgJ2dyZXknKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXh0cmFjdFsxXSA9PT0gJycgJiYgdHlwZW9mIGV4dHJhY3RbMl0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBleHRyYWN0WzFdID0gJ8K2JztcbiAgICAgICAgfVxuICAgICAgICBlcnJvci5wdXNoKGN0eC5saW5lICsgJyAnICsgZXh0cmFjdFsxXS5zbGljZSgwLCBjdHguY29sdW1uKSArXG4gICAgICAgICAgICBzdHlsaXplKHN0eWxpemUoZXh0cmFjdFsxXVtjdHguY29sdW1uXSwgJ2JvbGQnKSArXG4gICAgICAgICAgICBleHRyYWN0WzFdLnNsaWNlKGN0eC5jb2x1bW4gKyAxKSwgJ3llbGxvdycpKTtcblxuICAgICAgICBpZiAodHlwZW9mKGV4dHJhY3RbMl0pID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZXJyb3IucHVzaChzdHlsaXplKChjdHgubGluZSArIDEpICsgJyAnICsgZXh0cmFjdFsyXSwgJ2dyZXknKSk7XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3IgPSBvcHRpb25zLmluZGVudCArIGVycm9yLmpvaW4oJ1xcbicgKyBvcHRpb25zLmluZGVudCkgKyAnXFwwMzNbMG1cXG4nO1xuXG4gICAgICAgIG1lc3NhZ2UgPSBvcHRpb25zLmluZGVudCArIG1lc3NhZ2UgKyBzdHlsaXplKGN0eC5tZXNzYWdlLCAncmVkJyk7XG4gICAgICAgIGlmIChjdHguZmlsZW5hbWUpIChtZXNzYWdlICs9IHN0eWxpemUoJyBpbiAnLCAncmVkJykgKyBjdHguZmlsZW5hbWUpO1xuXG4gICAgICAgIHV0aWwuZXJyb3IobWVzc2FnZSwgZXJyb3IpO1xuXG4gICAgICAgIGlmIChjdHguY2FsbExpbmUpIHtcbiAgICAgICAgICAgIHV0aWwuZXJyb3Ioc3R5bGl6ZSgnZnJvbSAnLCAncmVkJykgKyAoY3R4LmZpbGVuYW1lIHx8ICcnKSk7XG4gICAgICAgICAgICB1dGlsLmVycm9yKHN0eWxpemUoY3R4LmNhbGxMaW5lLCAnZ3JleScpICsgJyAnICsgY3R4LmNhbGxFeHRyYWN0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY3R4LnN0YWNrKSB7IHV0aWwuZXJyb3Ioc3R5bGl6ZShjdHguc3RhY2ssICdyZWQnKSk7IH1cbiAgICB9XG59O1xuXG5yZXF1aXJlKCcuL3RyZWUvY2FsbCcpO1xucmVxdWlyZSgnLi90cmVlL2NvbG9yJyk7XG5yZXF1aXJlKCcuL3RyZWUvY29tbWVudCcpO1xucmVxdWlyZSgnLi90cmVlL2RlZmluaXRpb24nKTtcbnJlcXVpcmUoJy4vdHJlZS9kaW1lbnNpb24nKTtcbnJlcXVpcmUoJy4vdHJlZS9lbGVtZW50Jyk7XG5yZXF1aXJlKCcuL3RyZWUvZXhwcmVzc2lvbicpO1xucmVxdWlyZSgnLi90cmVlL2ZpbHRlcnNldCcpO1xucmVxdWlyZSgnLi90cmVlL2ZpbHRlcicpO1xucmVxdWlyZSgnLi90cmVlL2ZpZWxkJyk7XG5yZXF1aXJlKCcuL3RyZWUva2V5d29yZCcpO1xucmVxdWlyZSgnLi90cmVlL2xheWVyJyk7XG5yZXF1aXJlKCcuL3RyZWUvbGl0ZXJhbCcpO1xucmVxdWlyZSgnLi90cmVlL29wZXJhdGlvbicpO1xucmVxdWlyZSgnLi90cmVlL3F1b3RlZCcpO1xucmVxdWlyZSgnLi90cmVlL2ltYWdlZmlsdGVyJyk7XG5yZXF1aXJlKCcuL3RyZWUvcmVmZXJlbmNlJyk7XG5yZXF1aXJlKCcuL3RyZWUvcnVsZScpO1xucmVxdWlyZSgnLi90cmVlL3J1bGVzZXQnKTtcbnJlcXVpcmUoJy4vdHJlZS9zZWxlY3RvcicpO1xucmVxdWlyZSgnLi90cmVlL3N0eWxlJyk7XG5yZXF1aXJlKCcuL3RyZWUvdXJsJyk7XG5yZXF1aXJlKCcuL3RyZWUvdmFsdWUnKTtcbnJlcXVpcmUoJy4vdHJlZS92YXJpYWJsZScpO1xucmVxdWlyZSgnLi90cmVlL3pvb20nKTtcbnJlcXVpcmUoJy4vdHJlZS9pbnZhbGlkJyk7XG5yZXF1aXJlKCcuL3RyZWUvZm9udHNldCcpO1xucmVxdWlyZSgnLi90cmVlL2ZyYW1lX29mZnNldCcpO1xucmVxdWlyZSgnLi9mdW5jdGlvbnMnKTtcblxuZm9yICh2YXIgayBpbiBjYXJ0bykgeyBleHBvcnRzW2tdID0gY2FydG9ba107IH1cblxuLy8gU3R5bGl6ZSBhIHN0cmluZ1xuZnVuY3Rpb24gc3R5bGl6ZShzdHIsIHN0eWxlKSB7XG4gICAgdmFyIHN0eWxlcyA9IHtcbiAgICAgICAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgICAgICAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgICAgICAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAgICAgICAneWVsbG93JyA6IFszMywgMzldLFxuICAgICAgICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICAgICAgICdyZWQnIDogWzMxLCAzOV0sXG4gICAgICAgICdncmV5JyA6IFs5MCwgMzldXG4gICAgfTtcbiAgICByZXR1cm4gJ1xcMDMzWycgKyBzdHlsZXNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcMDMzWycgKyBzdHlsZXNbc3R5bGVdWzFdICsgJ20nO1xufVxuIiwidmFyIGNhcnRvID0gZXhwb3J0cyxcbiAgICB0cmVlID0gcmVxdWlyZSgnLi90cmVlJyksXG4gICAgXyA9IGdsb2JhbC5fIHx8IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuLy8gICAgVG9rZW4gbWF0Y2hpbmcgaXMgZG9uZSB3aXRoIHRoZSBgJGAgZnVuY3Rpb24sIHdoaWNoIGVpdGhlciB0YWtlc1xuLy8gICAgYSB0ZXJtaW5hbCBzdHJpbmcgb3IgcmVnZXhwLCBvciBhIG5vbi10ZXJtaW5hbCBmdW5jdGlvbiB0byBjYWxsLlxuLy8gICAgSXQgYWxzbyB0YWtlcyBjYXJlIG9mIG1vdmluZyBhbGwgdGhlIGluZGljZXMgZm9yd2FyZHMuXG5jYXJ0by5QYXJzZXIgPSBmdW5jdGlvbiBQYXJzZXIoZW52KSB7XG4gICAgdmFyIGlucHV0LCAgICAgICAvLyBMZVNTIGlucHV0IHN0cmluZ1xuICAgICAgICBpLCAgICAgICAgICAgLy8gY3VycmVudCBpbmRleCBpbiBgaW5wdXRgXG4gICAgICAgIGosICAgICAgICAgICAvLyBjdXJyZW50IGNodW5rXG4gICAgICAgIHRlbXAsICAgICAgICAvLyB0ZW1wb3JhcmlseSBob2xkcyBhIGNodW5rJ3Mgc3RhdGUsIGZvciBiYWNrdHJhY2tpbmdcbiAgICAgICAgbWVtbywgICAgICAgIC8vIHRlbXBvcmFyaWx5IGhvbGRzIGBpYCwgd2hlbiBiYWNrdHJhY2tpbmdcbiAgICAgICAgZnVydGhlc3QsICAgIC8vIGZ1cnRoZXN0IGluZGV4IHRoZSBwYXJzZXIgaGFzIGdvbmUgdG9cbiAgICAgICAgY2h1bmtzLCAgICAgIC8vIGNodW5raWZpZWQgaW5wdXRcbiAgICAgICAgY3VycmVudCwgICAgIC8vIGluZGV4IG9mIGN1cnJlbnQgY2h1bmssIGluIGBpbnB1dGBcbiAgICAgICAgcGFyc2VyO1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYWZ0ZXIgYWxsIGZpbGVzXG4gICAgLy8gaGF2ZSBiZWVuIGltcG9ydGVkIHRocm91Z2ggYEBpbXBvcnRgLlxuICAgIHZhciBmaW5pc2ggPSBmdW5jdGlvbigpIHt9O1xuXG4gICAgZnVuY3Rpb24gc2F2ZSgpICAgIHtcbiAgICAgICAgdGVtcCA9IGNodW5rc1tqXTtcbiAgICAgICAgbWVtbyA9IGk7XG4gICAgICAgIGN1cnJlbnQgPSBpO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZXN0b3JlKCkge1xuICAgICAgICBjaHVua3Nbal0gPSB0ZW1wO1xuICAgICAgICBpID0gbWVtbztcbiAgICAgICAgY3VycmVudCA9IGk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3luYygpIHtcbiAgICAgICAgaWYgKGkgPiBjdXJyZW50KSB7XG4gICAgICAgICAgICBjaHVua3Nbal0gPSBjaHVua3Nbal0uc2xpY2UoaSAtIGN1cnJlbnQpO1xuICAgICAgICAgICAgY3VycmVudCA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy9cbiAgICAvLyBQYXJzZSBmcm9tIGEgdG9rZW4sIHJlZ2V4cCBvciBzdHJpbmcsIGFuZCBtb3ZlIGZvcndhcmQgaWYgbWF0Y2hcbiAgICAvL1xuICAgIGZ1bmN0aW9uICQodG9rKSB7XG4gICAgICAgIHZhciBtYXRjaCwgYXJncywgbGVuZ3RoLCBjLCBpbmRleCwgZW5kSW5kZXgsIGs7XG5cbiAgICAgICAgLy8gTm9uLXRlcm1pbmFsXG4gICAgICAgIGlmICh0b2sgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHRvay5jYWxsKHBhcnNlci5wYXJzZXJzKTtcbiAgICAgICAgLy8gVGVybWluYWxcbiAgICAgICAgLy8gRWl0aGVyIG1hdGNoIGEgc2luZ2xlIGNoYXJhY3RlciBpbiB0aGUgaW5wdXQsXG4gICAgICAgIC8vIG9yIG1hdGNoIGEgcmVnZXhwIGluIHRoZSBjdXJyZW50IGNodW5rIChjaHVua1tqXSkuXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mKHRvaykgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBtYXRjaCA9IGlucHV0LmNoYXJBdChpKSA9PT0gdG9rID8gdG9rIDogbnVsbDtcbiAgICAgICAgICAgIGxlbmd0aCA9IDE7XG4gICAgICAgICAgICBzeW5jKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzeW5jKCk7XG5cbiAgICAgICAgICAgIG1hdGNoID0gdG9rLmV4ZWMoY2h1bmtzW2pdKTtcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIGxlbmd0aCA9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgbWF0Y2ggaXMgY29uZmlybWVkLCBhZGQgdGhlIG1hdGNoIGxlbmd0aCB0byBgaWAsXG4gICAgICAgIC8vIGFuZCBjb25zdW1lIGFueSBleHRyYSB3aGl0ZS1zcGFjZSBjaGFyYWN0ZXJzICgnICcgfHwgJ1xcbicpXG4gICAgICAgIC8vIHdoaWNoIGNvbWUgYWZ0ZXIgdGhhdC4gVGhlIHJlYXNvbiBmb3IgdGhpcyBpcyB0aGF0IExlU1Mnc1xuICAgICAgICAvLyBncmFtbWFyIGlzIG1vc3RseSB3aGl0ZS1zcGFjZSBpbnNlbnNpdGl2ZS5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICB2YXIgbWVtID0gaSArPSBsZW5ndGg7XG4gICAgICAgICAgICBlbmRJbmRleCA9IGkgKyBjaHVua3Nbal0ubGVuZ3RoIC0gbGVuZ3RoO1xuXG4gICAgICAgICAgICB3aGlsZSAoaSA8IGVuZEluZGV4KSB7XG4gICAgICAgICAgICAgICAgYyA9IGlucHV0LmNoYXJDb2RlQXQoaSk7XG4gICAgICAgICAgICAgICAgaWYgKCEgKGMgPT09IDMyIHx8IGMgPT09IDEwIHx8IGMgPT09IDkpKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2h1bmtzW2pdID0gY2h1bmtzW2pdLnNsaWNlKGxlbmd0aCArIChpIC0gbWVtKSk7XG4gICAgICAgICAgICBjdXJyZW50ID0gaTtcblxuICAgICAgICAgICAgaWYgKGNodW5rc1tqXS5sZW5ndGggPT09IDAgJiYgaiA8IGNodW5rcy5sZW5ndGggLSAxKSB7IGorKzsgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mKG1hdGNoKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaC5sZW5ndGggPT09IDEgPyBtYXRjaFswXSA6IG1hdGNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2FtZSBhcyAkKCksIGJ1dCBkb24ndCBjaGFuZ2UgdGhlIHN0YXRlIG9mIHRoZSBwYXJzZXIsXG4gICAgLy8ganVzdCByZXR1cm4gdGhlIG1hdGNoLlxuICAgIGZ1bmN0aW9uIHBlZWsodG9rKSB7XG4gICAgICAgIGlmICh0eXBlb2YodG9rKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dC5jaGFyQXQoaSkgPT09IHRvaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAhIXRvay50ZXN0KGNodW5rc1tqXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHRyYWN0RXJyb3JMaW5lKHN0eWxlLCBlcnJvckluZGV4KSB7XG4gICAgICAgIHJldHVybiAoc3R5bGUuc2xpY2UoMCwgZXJyb3JJbmRleCkubWF0Y2goL1xcbi9nKSB8fCAnJykubGVuZ3RoICsgMTtcbiAgICB9XG5cblxuICAgIC8vIE1ha2UgYW4gZXJyb3Igb2JqZWN0IGZyb20gYSBwYXNzZWQgc2V0IG9mIHByb3BlcnRpZXMuXG4gICAgLy8gQWNjZXB0ZWQgcHJvcGVydGllczpcbiAgICAvLyAtIGBtZXNzYWdlYDogVGV4dCBvZiB0aGUgZXJyb3IgbWVzc2FnZS5cbiAgICAvLyAtIGBmaWxlbmFtZWA6IEZpbGVuYW1lIHdoZXJlIHRoZSBlcnJvciBvY2N1cnJlZC5cbiAgICAvLyAtIGBpbmRleGA6IENoYXIuIGluZGV4IHdoZXJlIHRoZSBlcnJvciBvY2N1cnJlZC5cbiAgICBmdW5jdGlvbiBtYWtlRXJyb3IoZXJyKSB7XG4gICAgICAgIHZhciBlaW5wdXQ7XG4gICAgICAgIHZhciBlcnJvclRlbXBsYXRlO1xuXG4gICAgICAgIF8uZGVmYXVsdHMoZXJyLCB7XG4gICAgICAgICAgICBpbmRleDogZnVydGhlc3QsXG4gICAgICAgICAgICBmaWxlbmFtZTogZW52LmZpbGVuYW1lLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1BhcnNlIGVycm9yLicsXG4gICAgICAgICAgICBsaW5lOiAwLFxuICAgICAgICAgICAgY29sdW1uOiAtMVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZXJyLmZpbGVuYW1lICYmIHRoYXQuZW52LmlucHV0cyAmJiB0aGF0LmVudi5pbnB1dHNbZXJyLmZpbGVuYW1lXSkge1xuICAgICAgICAgICAgZWlucHV0ID0gdGhhdC5lbnYuaW5wdXRzW2Vyci5maWxlbmFtZV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlaW5wdXQgPSBpbnB1dDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVyci5saW5lID0gZXh0cmFjdEVycm9yTGluZShlaW5wdXQsIGVyci5pbmRleCk7XG4gICAgICAgIGZvciAodmFyIG4gPSBlcnIuaW5kZXg7IG4gPj0gMCAmJiBlaW5wdXQuY2hhckF0KG4pICE9PSAnXFxuJzsgbi0tKSB7XG4gICAgICAgICAgICBlcnIuY29sdW1uKys7XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3JUZW1wbGF0ZSA9IF8udGVtcGxhdGUoJzwlPWZpbGVuYW1lJT46PCU9bGluZSU+OjwlPWNvbHVtbiU+IDwlPW1lc3NhZ2UlPicpO1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKGVycm9yVGVtcGxhdGUoZXJyKSk7XG4gICAgfVxuXG4gICAgdGhpcy5lbnYgPSBlbnYgPSBlbnYgfHwge307XG4gICAgdGhpcy5lbnYuZmlsZW5hbWUgPSB0aGlzLmVudi5maWxlbmFtZSB8fCBudWxsO1xuICAgIHRoaXMuZW52LmlucHV0cyA9IHRoaXMuZW52LmlucHV0cyB8fCB7fTtcblxuICAgIC8vIFRoZSBQYXJzZXJcbiAgICBwYXJzZXIgPSB7XG5cbiAgICAgICAgZXh0cmFjdEVycm9yTGluZTogZXh0cmFjdEVycm9yTGluZSxcbiAgICAgICAgLy9cbiAgICAgICAgLy8gUGFyc2UgYW4gaW5wdXQgc3RyaW5nIGludG8gYW4gYWJzdHJhY3Qgc3ludGF4IHRyZWUuXG4gICAgICAgIC8vIFRocm93cyBhbiBlcnJvciBvbiBwYXJzZSBlcnJvcnMuXG4gICAgICAgIHBhcnNlOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgICAgIHZhciByb290LCBzdGFydCwgZW5kLCB6b25lLCBsaW5lLCBsaW5lcywgYnVmZiA9IFtdLCBjLCBlcnJvciA9IG51bGw7XG5cbiAgICAgICAgICAgIGkgPSBqID0gY3VycmVudCA9IGZ1cnRoZXN0ID0gMDtcbiAgICAgICAgICAgIGNodW5rcyA9IFtdO1xuICAgICAgICAgICAgaW5wdXQgPSBzdHIucmVwbGFjZSgvXFxyXFxuL2csICdcXG4nKTtcbiAgICAgICAgICAgIGlmIChlbnYuZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aGF0LmVudi5pbnB1dHNbZW52LmZpbGVuYW1lXSA9IGlucHV0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZWFybHlfZXhpdCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBTcGxpdCB0aGUgaW5wdXQgaW50byBjaHVua3MuXG4gICAgICAgICAgICBjaHVua3MgPSAoZnVuY3Rpb24gKGNodW5rcykge1xuICAgICAgICAgICAgICAgIHZhciBqID0gMCxcbiAgICAgICAgICAgICAgICAgICAgc2tpcCA9IC8oPzpAXFx7W1xcdy1dK1xcfXxbXlwiJ2BcXHtcXH1cXC9cXChcXClcXFxcXSkrL2csXG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSAvXFwvXFwqKD86W14qXXxcXCorW15cXC8qXSkqXFwqK1xcL3xcXC9cXC8uKi9nLFxuICAgICAgICAgICAgICAgICAgICBzdHJpbmcgPSAvXCIoKD86W15cIlxcXFxcXHJcXG5dfFxcXFwuKSopXCJ8JygoPzpbXidcXFxcXFxyXFxuXXxcXFxcLikqKSd8YCgoPzpbXmBdfFxcXFwuKSopYC9nLFxuICAgICAgICAgICAgICAgICAgICBsZXZlbCA9IDAsXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgICAgICAgICAgICBjaHVuayA9IGNodW5rc1swXSxcbiAgICAgICAgICAgICAgICAgICAgaW5QYXJhbTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBjLCBjYzsgaSA8IGlucHV0Lmxlbmd0aDspIHtcbiAgICAgICAgICAgICAgICAgICAgc2tpcC5sYXN0SW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2ggPSBza2lwLmV4ZWMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2guaW5kZXggPT09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpICs9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaHVuay5wdXNoKG1hdGNoWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjID0gaW5wdXQuY2hhckF0KGkpO1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50Lmxhc3RJbmRleCA9IHN0cmluZy5sYXN0SW5kZXggPSBpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaCA9IHN0cmluZy5leGVjKGlucHV0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoLmluZGV4ID09PSBpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaSArPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmsucHVzaChtYXRjaFswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWluUGFyYW0gJiYgYyA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYyA9IGlucHV0LmNoYXJBdChpICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2MgPT09ICcvJyB8fCBjYyA9PT0gJyonKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoID0gY29tbWVudC5leGVjKGlucHV0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2guaW5kZXggPT09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmsucHVzaChtYXRjaFswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAneyc6IGlmICghIGluUGFyYW0pIHsgbGV2ZWwgKys7ICAgICAgICBjaHVuay5wdXNoKGMpOyAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd9JzogaWYgKCEgaW5QYXJhbSkgeyBsZXZlbCAtLTsgICAgICAgIGNodW5rLnB1c2goYyk7IGNodW5rc1srK2pdID0gY2h1bmsgPSBbXTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJygnOiBpZiAoISBpblBhcmFtKSB7IGluUGFyYW0gPSB0cnVlOyAgY2h1bmsucHVzaChjKTsgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnKSc6IGlmICggIGluUGFyYW0pIHsgaW5QYXJhbSA9IGZhbHNlOyBjaHVuay5wdXNoKGMpOyAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNodW5rLnB1c2goYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsZXZlbCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBlcnJvciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBpIC0gMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdQYXJzZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAobGV2ZWwgPiAwKSA/IFwibWlzc2luZyBjbG9zaW5nIGB9YFwiIDogXCJtaXNzaW5nIG9wZW5pbmcgYHtgXCJcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY2h1bmtzLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5qb2luKCcnKTsgfSk7XG4gICAgICAgICAgICB9KShbW11dKTtcblxuICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbWFrZUVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU3RhcnQgd2l0aCB0aGUgcHJpbWFyeSBydWxlLlxuICAgICAgICAgICAgLy8gVGhlIHdob2xlIHN5bnRheCB0cmVlIGlzIGhlbGQgdW5kZXIgYSBSdWxlc2V0IG5vZGUsXG4gICAgICAgICAgICAvLyB3aXRoIHRoZSBgcm9vdGAgcHJvcGVydHkgc2V0IHRvIHRydWUsIHNvIG5vIGB7fWAgYXJlXG4gICAgICAgICAgICAvLyBvdXRwdXQuXG4gICAgICAgICAgICByb290ID0gbmV3IHRyZWUuUnVsZXNldChbXSwgJCh0aGlzLnBhcnNlcnMucHJpbWFyeSkpO1xuICAgICAgICAgICAgcm9vdC5yb290ID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gR2V0IGFuIGFycmF5IG9mIFJ1bGVzZXQgb2JqZWN0cywgZmxhdHRlbmVkXG4gICAgICAgICAgICAvLyBhbmQgc29ydGVkIGFjY29yZGluZyB0byBzcGVjaWZpY2l0eVNvcnRcbiAgICAgICAgICAgIHJvb3QudG9MaXN0ID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBsaW5lLCBsaW5lcywgY29sdW1uO1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlbnYpIHtcbiAgICAgICAgICAgICAgICAgICAgZW52LmVycm9yID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlbnYuZXJyb3JzKSBlbnYuZXJyb3JzID0gbmV3IEVycm9yKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnYuZXJyb3JzLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnYuZXJyb3JzLm1lc3NhZ2UgKz0gJ1xcbicgKyBtYWtlRXJyb3IoZSkubWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW52LmVycm9ycy5tZXNzYWdlID0gbWFrZUVycm9yKGUpLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGVudi5mcmFtZXMgPSBlbnYuZnJhbWVzIHx8IFtdO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2FsbCBwb3B1bGF0ZXMgSW52YWxpZC1jYXVzZWQgZXJyb3JzXG4gICAgICAgICAgICAgICAgICAgIHZhciBkZWZpbml0aW9ucyA9IHRoaXMuZmxhdHRlbihbXSwgW10sIGVudik7XG4gICAgICAgICAgICAgICAgICAgIGRlZmluaXRpb25zLnNvcnQoc3BlY2lmaWNpdHlTb3J0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmluaXRpb25zO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICAvLyBTb3J0IHJ1bGVzIGJ5IHNwZWNpZmljaXR5OiB0aGlzIGZ1bmN0aW9uIGV4cGVjdHMgc2VsZWN0b3JzIHRvIGJlXG4gICAgICAgICAgICAvLyBzcGxpdCBhbHJlYWR5LlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFdyaXR0ZW4gdG8gYmUgdXNlZCBhcyBhIC5zb3J0KEZ1bmN0aW9uKTtcbiAgICAgICAgICAgIC8vIGFyZ3VtZW50LlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFsxLCAwLCAwLCA0NjddID4gWzAsIDAsIDEsIDUyMF1cbiAgICAgICAgICAgIHZhciBzcGVjaWZpY2l0eVNvcnQgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFzID0gYS5zcGVjaWZpY2l0eTtcbiAgICAgICAgICAgICAgICB2YXIgYnMgPSBiLnNwZWNpZmljaXR5O1xuXG4gICAgICAgICAgICAgICAgaWYgKGFzWzBdICE9IGJzWzBdKSByZXR1cm4gYnNbMF0gLSBhc1swXTtcbiAgICAgICAgICAgICAgICBpZiAoYXNbMV0gIT0gYnNbMV0pIHJldHVybiBic1sxXSAtIGFzWzFdO1xuICAgICAgICAgICAgICAgIGlmIChhc1syXSAhPSBic1syXSkgcmV0dXJuIGJzWzJdIC0gYXNbMl07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJzWzNdIC0gYXNbM107XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4gcm9vdDtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBIZXJlIGluLCB0aGUgcGFyc2luZyBydWxlcy9mdW5jdGlvbnNcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIGJhc2ljIHN0cnVjdHVyZSBvZiB0aGUgc3ludGF4IHRyZWUgZ2VuZXJhdGVkIGlzIGFzIGZvbGxvd3M6XG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgUnVsZXNldCAtPiAgUnVsZSAtPiBWYWx1ZSAtPiBFeHByZXNzaW9uIC0+IEVudGl0eVxuICAgICAgICAvL1xuICAgICAgICAvLyAgSW4gZ2VuZXJhbCwgbW9zdCBydWxlcyB3aWxsIHRyeSB0byBwYXJzZSBhIHRva2VuIHdpdGggdGhlIGAkKClgIGZ1bmN0aW9uLCBhbmQgaWYgdGhlIHJldHVyblxuICAgICAgICAvLyAgdmFsdWUgaXMgdHJ1bHksIHdpbGwgcmV0dXJuIGEgbmV3IG5vZGUsIG9mIHRoZSByZWxldmFudCB0eXBlLiBTb21ldGltZXMsIHdlIG5lZWQgdG8gY2hlY2tcbiAgICAgICAgLy8gIGZpcnN0LCBiZWZvcmUgcGFyc2luZywgdGhhdCdzIHdoZW4gd2UgdXNlIGBwZWVrKClgLlxuICAgICAgICBwYXJzZXJzOiB7XG4gICAgICAgICAgICAvLyBUaGUgYHByaW1hcnlgIHJ1bGUgaXMgdGhlICplbnRyeSogYW5kICpleGl0KiBwb2ludCBvZiB0aGUgcGFyc2VyLlxuICAgICAgICAgICAgLy8gVGhlIHJ1bGVzIGhlcmUgY2FuIGFwcGVhciBhdCBhbnkgbGV2ZWwgb2YgdGhlIHBhcnNlIHRyZWUuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gVGhlIHJlY3Vyc2l2ZSBuYXR1cmUgb2YgdGhlIGdyYW1tYXIgaXMgYW4gaW50ZXJwbGF5IGJldHdlZW4gdGhlIGBibG9ja2BcbiAgICAgICAgICAgIC8vIHJ1bGUsIHdoaWNoIHJlcHJlc2VudHMgYHsgLi4uIH1gLCB0aGUgYHJ1bGVzZXRgIHJ1bGUsIGFuZCB0aGlzIGBwcmltYXJ5YCBydWxlLFxuICAgICAgICAgICAgLy8gYXMgcmVwcmVzZW50ZWQgYnkgdGhpcyBzaW1wbGlmaWVkIGdyYW1tYXI6XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gICAgIHByaW1hcnkgIOKGkiAgKHJ1bGVzZXQgfCBydWxlKStcbiAgICAgICAgICAgIC8vICAgICBydWxlc2V0ICDihpIgIHNlbGVjdG9yKyBibG9ja1xuICAgICAgICAgICAgLy8gICAgIGJsb2NrICAgIOKGkiAgJ3snIHByaW1hcnkgJ30nXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gT25seSBhdCBvbmUgcG9pbnQgaXMgdGhlIHByaW1hcnkgcnVsZSBub3QgY2FsbGVkIGZyb20gdGhlXG4gICAgICAgICAgICAvLyBibG9jayBydWxlOiBhdCB0aGUgcm9vdCBsZXZlbC5cbiAgICAgICAgICAgIHByaW1hcnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBub2RlLCByb290ID0gW107XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoKG5vZGUgPSAkKHRoaXMucnVsZSkgfHwgJCh0aGlzLnJ1bGVzZXQpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmNvbW1lbnQpKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoL15bXFxzXFxuXSsvKSB8fCAobm9kZSA9ICQodGhpcy5pbnZhbGlkKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUpIHJvb3QucHVzaChub2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvb3Q7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBpbnZhbGlkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNodW5rID0gJCgvXlteO1xcbl0qWztcXG5dLyk7XG5cbiAgICAgICAgICAgICAgICAvLyBUbyBmYWlsIGdyYWNlZnVsbHksIG1hdGNoIGV2ZXJ5dGhpbmcgdW50aWwgYSBzZW1pY29sb24gb3IgbGluZWJyZWFrLlxuICAgICAgICAgICAgICAgIGlmIChjaHVuaykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuSW52YWxpZChjaHVuaywgbWVtbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gV2UgY3JlYXRlIGEgQ29tbWVudCBub2RlIGZvciBDU1MgY29tbWVudHMgYC8qICovYCxcbiAgICAgICAgICAgIC8vIGJ1dCBrZWVwIHRoZSBMZVNTIGNvbW1lbnRzIGAvL2Agc2lsZW50LCBieSBqdXN0IHNraXBwaW5nXG4gICAgICAgICAgICAvLyBvdmVyIHRoZW0uXG4gICAgICAgICAgICBjb21tZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29tbWVudDtcblxuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQXQoaSkgIT09ICcvJykgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJBdChpICsgMSkgPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuQ29tbWVudCgkKC9eXFwvXFwvLiovKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tZW50ID0gJCgvXlxcL1xcKig/OlteKl18XFwqK1teXFwvKl0pKlxcKitcXC9cXG4/LykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkNvbW1lbnQoY29tbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gRW50aXRpZXMgYXJlIHRva2VucyB3aGljaCBjYW4gYmUgZm91bmQgaW5zaWRlIGFuIEV4cHJlc3Npb25cbiAgICAgICAgICAgIGVudGl0aWVzOiB7XG5cbiAgICAgICAgICAgICAgICAvLyBBIHN0cmluZywgd2hpY2ggc3VwcG9ydHMgZXNjYXBpbmcgXCIgYW5kICcgXCJtaWxreSB3YXlcIiAnaGVcXCdzIHRoZSBvbmUhJ1xuICAgICAgICAgICAgICAgIHF1b3RlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQXQoaSkgIT09ICdcIicgJiYgaW5wdXQuY2hhckF0KGkpICE9PSBcIidcIikgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RyID0gJCgvXlwiKCg/OlteXCJcXFxcXFxyXFxuXXxcXFxcLikqKVwifCcoKD86W14nXFxcXFxcclxcbl18XFxcXC4pKiknLyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5RdW90ZWQoc3RyWzFdIHx8IHN0clsyXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gQSByZWZlcmVuY2UgdG8gYSBNYXBuaWsgZmllbGQsIGxpa2UgW05BTUVdXG4gICAgICAgICAgICAgICAgLy8gQmVoaW5kIHRoZSBzY2VuZXMsIHRoaXMgaGFzIHRoZSBzYW1lIHJlcHJlc2VudGF0aW9uLCBidXQgQ2FydG9cbiAgICAgICAgICAgICAgICAvLyBuZWVkcyB0byBiZSBjYXJlZnVsIHRvIHdhcm4gd2hlbiB1bnN1cHBvcnRlZCBvcGVyYXRpb25zIGFyZSB1c2VkLlxuICAgICAgICAgICAgICAgIGZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgJCgnWycpKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWVsZF9uYW1lID0gJCgvKF5bXlxcXV0rKS8pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoISAkKCddJykpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkX25hbWUpIHJldHVybiBuZXcgdHJlZS5GaWVsZChmaWVsZF9uYW1lWzFdKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhIGNvbXBhcmlzb24gb3BlcmF0b3JcbiAgICAgICAgICAgICAgICBjb21wYXJpc29uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0ciA9ICQoL149fnw9fCE9fDw9fD49fDx8Pi8pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIC8vIEEgY2F0Y2gtYWxsIHdvcmQsIHN1Y2ggYXM6IGhhcmQtbGlnaHRcbiAgICAgICAgICAgICAgICAvLyBUaGVzZSBjYW4gc3RhcnQgd2l0aCBlaXRoZXIgYSBsZXR0ZXIgb3IgYSBkYXNoICgtKSxcbiAgICAgICAgICAgICAgICAvLyBhbmQgdGhlbiBjb250YWluIG51bWJlcnMsIHVuZGVyc2NvcmVzLCBhbmQgbGV0dGVycy5cbiAgICAgICAgICAgICAgICBrZXl3b3JkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGsgPSAkKC9eW0EtWmEtei1dK1tBLVphLXotMC05X10qLyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrKSB7IHJldHVybiBuZXcgdHJlZS5LZXl3b3JkKGspOyB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIC8vIEEgZnVuY3Rpb24gY2FsbCBsaWtlIHJnYigyNTUsIDAsIDI1NSlcbiAgICAgICAgICAgICAgICAvLyBUaGUgYXJndW1lbnRzIGFyZSBwYXJzZWQgd2l0aCB0aGUgYGVudGl0aWVzLmFyZ3VtZW50c2AgcGFyc2VyLlxuICAgICAgICAgICAgICAgIGNhbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSwgYXJncztcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIShuYW1lID0gL14oW1xcd1xcLV0rfCUpXFwoLy5leGVjKGNodW5rc1tqXSkpKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IG5hbWVbMV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgPT09ICd1cmwnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB1cmwoKSBpcyBoYW5kbGVkIGJ5IHRoZSB1cmwgcGFyc2VyIGluc3RlYWRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaSArPSBuYW1lLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICQoJygnKTsgLy8gUGFyc2UgdGhlICcoJyBhbmQgY29uc3VtZSB3aGl0ZXNwYWNlLlxuXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSAkKHRoaXMuZW50aXRpZXNbJ2FyZ3VtZW50cyddKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoISQoJyknKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuQ2FsbChuYW1lLCBhcmdzLCBpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gQXJndW1lbnRzIGFyZSBjb21tYS1zZXBhcmF0ZWQgZXhwcmVzc2lvbnNcbiAgICAgICAgICAgICAgICAnYXJndW1lbnRzJzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW10sIGFyZztcblxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoYXJnID0gJCh0aGlzLmV4cHJlc3Npb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2goYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghICQoJywnKSkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFyZ3M7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBsaXRlcmFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQodGhpcy5lbnRpdGllcy5kaW1lbnNpb24pIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMua2V5d29yZGNvbG9yKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLmhleGNvbG9yKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLnF1b3RlZCk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIHVybCgpIHRva2Vuc1xuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gV2UgdXNlIGEgc3BlY2lmaWMgcnVsZSBmb3IgdXJscywgYmVjYXVzZSB0aGV5IGRvbid0IHJlYWxseSBiZWhhdmUgbGlrZVxuICAgICAgICAgICAgICAgIC8vIHN0YW5kYXJkIGZ1bmN0aW9uIGNhbGxzLiBUaGUgZGlmZmVyZW5jZSBpcyB0aGF0IHRoZSBhcmd1bWVudCBkb2Vzbid0IGhhdmVcbiAgICAgICAgICAgICAgICAvLyB0byBiZSBlbmNsb3NlZCB3aXRoaW4gYSBzdHJpbmcsIHNvIGl0IGNhbid0IGJlIHBhcnNlZCBhcyBhbiBFeHByZXNzaW9uLlxuICAgICAgICAgICAgICAgIHVybDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckF0KGkpICE9PSAndScgfHwgISQoL151cmxcXCgvKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9ICQodGhpcy5lbnRpdGllcy5xdW90ZWQpIHx8ICQodGhpcy5lbnRpdGllcy52YXJpYWJsZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKC9eW1xcLVxcdyVAJFxcLy4mPTo7Iys/fl0rLykgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgIGlmICghICQoJyknKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkludmFsaWQodmFsdWUsIG1lbW8sICdNaXNzaW5nIGNsb3NpbmcgKSBpbiBVUkwuJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuVVJMKCh0eXBlb2YgdmFsdWUudmFsdWUgIT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgaW5zdGFuY2VvZiB0cmVlLlZhcmlhYmxlKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgOiBuZXcgdHJlZS5RdW90ZWQodmFsdWUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAvLyBBIFZhcmlhYmxlIGVudGl0eSwgc3VjaCBhcyBgQGZpbmtgLCBpblxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gICAgIHdpZHRoOiBAZmluayArIDJweFxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gV2UgdXNlIGEgZGlmZmVyZW50IHBhcnNlciBmb3IgdmFyaWFibGUgZGVmaW5pdGlvbnMsXG4gICAgICAgICAgICAgICAgLy8gc2VlIGBwYXJzZXJzLnZhcmlhYmxlYC5cbiAgICAgICAgICAgICAgICB2YXJpYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lLCBpbmRleCA9IGk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJBdChpKSA9PT0gJ0AnICYmIChuYW1lID0gJCgvXkBbXFx3LV0rLykpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuVmFyaWFibGUobmFtZSwgaW5kZXgsIGVudi5maWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgaGV4Y29sb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmdiO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckF0KGkpID09PSAnIycgJiYgKHJnYiA9ICQoL14jKFthLWZBLUYwLTldezZ9fFthLWZBLUYwLTldezN9KS8pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkNvbG9yKHJnYlsxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAga2V5d29yZGNvbG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJnYiA9IGNodW5rc1tqXS5tYXRjaCgvXlthLXpdKy8pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmdiICYmIHJnYlswXSBpbiB0cmVlLlJlZmVyZW5jZS5kYXRhLmNvbG9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkNvbG9yKHRyZWUuUmVmZXJlbmNlLmRhdGEuY29sb3JzWyQoL15bYS16XSsvKV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIC8vIEEgRGltZW5zaW9uLCB0aGF0IGlzLCBhIG51bWJlciBhbmQgYSB1bml0LiBUaGUgb25seVxuICAgICAgICAgICAgICAgIC8vIHVuaXQgdGhhdCBoYXMgYW4gZWZmZWN0IGlzICVcbiAgICAgICAgICAgICAgICBkaW1lbnNpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IGlucHV0LmNoYXJDb2RlQXQoaSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoYyA+IDU3IHx8IGMgPCA0NSkgfHwgYyA9PT0gNDcpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gJCgvXigtP1xcZCpcXC4/XFxkKyg/OltlRV1bLStdP1xcZCspPykoXFwlfFxcdyspPy8pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5EaW1lbnNpb24odmFsdWVbMV0sIHZhbHVlWzJdLCBtZW1vKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gVGhlIHZhcmlhYmxlIHBhcnQgb2YgYSB2YXJpYWJsZSBkZWZpbml0aW9uLlxuICAgICAgICAgICAgLy8gVXNlZCBpbiB0aGUgYHJ1bGVgIHBhcnNlci4gTGlrZSBAZmluazpcbiAgICAgICAgICAgIHZhcmlhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZTtcblxuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQXQoaSkgPT09ICdAJyAmJiAobmFtZSA9ICQoL14oQFtcXHctXSspXFxzKjovKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5hbWVbMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gRW50aXRpZXMgYXJlIHRoZSBzbWFsbGVzdCByZWNvZ25pemVkIHRva2VuLFxuICAgICAgICAgICAgLy8gYW5kIGNhbiBiZSBmb3VuZCBpbnNpZGUgYSBydWxlJ3MgdmFsdWUuXG4gICAgICAgICAgICBlbnRpdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkKHRoaXMuZW50aXRpZXMuY2FsbCkgfHxcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLmxpdGVyYWwpIHx8XG4gICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy5maWVsZCkgfHxcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLnZhcmlhYmxlKSB8fFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMudXJsKSB8fFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMua2V5d29yZCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBBIFJ1bGUgdGVybWluYXRvci4gTm90ZSB0aGF0IHdlIHVzZSBgcGVlaygpYCB0byBjaGVjayBmb3IgJ30nLFxuICAgICAgICAgICAgLy8gYmVjYXVzZSB0aGUgYGJsb2NrYCBydWxlIHdpbGwgYmUgZXhwZWN0aW5nIGl0LCBidXQgd2Ugc3RpbGwgbmVlZCB0byBtYWtlIHN1cmVcbiAgICAgICAgICAgIC8vIGl0J3MgdGhlcmUsIGlmICc7JyB3YXMgb21taXR0ZWQuXG4gICAgICAgICAgICBlbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkKCc7JykgfHwgcGVlaygnfScpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gRWxlbWVudHMgYXJlIHRoZSBidWlsZGluZyBibG9ja3MgZm9yIFNlbGVjdG9ycy4gVGhleSBjb25zaXN0IG9mXG4gICAgICAgICAgICAvLyBhbiBlbGVtZW50IG5hbWUsIHN1Y2ggYXMgYSB0YWcgYSBjbGFzcywgb3IgYCpgLlxuICAgICAgICAgICAgZWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSAkKC9eKD86Wy4jXVtcXHdcXC1dK3xcXCp8TWFwKS8pO1xuICAgICAgICAgICAgICAgIGlmIChlKSByZXR1cm4gbmV3IHRyZWUuRWxlbWVudChlKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIEF0dGFjaG1lbnRzIGFsbG93IGFkZGluZyBtdWx0aXBsZSBsaW5lcywgcG9seWdvbnMgZXRjLiB0byBhblxuICAgICAgICAgICAgLy8gb2JqZWN0LiBUaGVyZSBjYW4gb25seSBiZSBvbmUgYXR0YWNobWVudCBwZXIgc2VsZWN0b3IuXG4gICAgICAgICAgICBhdHRhY2htZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgcyA9ICQoL146OihbXFx3XFwtXSsoPzpcXC9bXFx3XFwtXSspKikvKTtcbiAgICAgICAgICAgICAgICBpZiAocykgcmV0dXJuIHNbMV07XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBTZWxlY3RvcnMgYXJlIG1hZGUgb3V0IG9mIG9uZSBvciBtb3JlIEVsZW1lbnRzLCBzZWUgYWJvdmUuXG4gICAgICAgICAgICBzZWxlY3RvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEsIGF0dGFjaG1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGUsIGVsZW1lbnRzID0gW10sXG4gICAgICAgICAgICAgICAgICAgIGYsIGZpbHRlcnMgPSBuZXcgdHJlZS5GaWx0ZXJzZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgeiwgem9vbXMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgZnJhbWVfb2Zmc2V0ID0gdHJlZS5GcmFtZU9mZnNldC5ub25lO1xuICAgICAgICAgICAgICAgICAgICBzZWdtZW50cyA9IDAsIGNvbmRpdGlvbnMgPSAwO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKFxuICAgICAgICAgICAgICAgICAgICAgICAgKGUgPSAkKHRoaXMuZWxlbWVudCkpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoeiA9ICQodGhpcy56b29tKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChmbyA9ICQodGhpcy5mcmFtZV9vZmZzZXQpKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGYgPSAkKHRoaXMuZmlsdGVyKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChhID0gJCh0aGlzLmF0dGFjaG1lbnQpKVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VnbWVudHMrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2goZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeikge1xuICAgICAgICAgICAgICAgICAgICAgICAgem9vbXMucHVzaCh6KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbnMrKztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWVfb2Zmc2V0ID0gZm87XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25kaXRpb25zKys7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVyciA9IGZpbHRlcnMuYWRkKGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG1ha2VFcnJvcih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGkgLSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25kaXRpb25zKys7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXR0YWNobWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbWFrZUVycm9yKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRW5jb3VudGVyZWQgc2Vjb25kIGF0dGFjaG1lbnQgbmFtZS4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBpIC0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRhY2htZW50ID0gYTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gaW5wdXQuY2hhckF0KGkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJ3snIHx8IGMgPT09ICd9JyB8fCBjID09PSAnOycgfHwgYyA9PT0gJywnKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNlZ21lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5TZWxlY3RvcihmaWx0ZXJzLCB6b29tcywgZnJhbWVfb2Zmc2V0LCBlbGVtZW50cywgYXR0YWNobWVudCwgY29uZGl0aW9ucywgbWVtbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZmlsdGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzYXZlKCk7XG4gICAgICAgICAgICAgICAgdmFyIGtleSwgb3AsIHZhbDtcbiAgICAgICAgICAgICAgICBpZiAoISAkKCdbJykpIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoa2V5ID0gJCgvXlthLXpBLVowLTlcXC1fXSsvKSB8fFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMucXVvdGVkKSB8fFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMudmFyaWFibGUpIHx8XG4gICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy5rZXl3b3JkKSB8fFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMuZmllbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHJlbW92ZSBhdCAxLjAuMFxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5IGluc3RhbmNlb2YgdHJlZS5RdW90ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleSA9IG5ldyB0cmVlLkZpZWxkKGtleS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoKG9wID0gJCh0aGlzLmVudGl0aWVzLmNvbXBhcmlzb24pKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKHZhbCA9ICQodGhpcy5lbnRpdGllcy5xdW90ZWQpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy52YXJpYWJsZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLmRpbWVuc2lvbikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLmtleXdvcmQpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy5maWVsZCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISAkKCddJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBtYWtlRXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnTWlzc2luZyBjbG9zaW5nIF0gb2YgZmlsdGVyLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBtZW1vIC0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFrZXkuaXMpIGtleSA9IG5ldyB0cmVlLkZpZWxkKGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuRmlsdGVyKGtleSwgb3AsIHZhbCwgbWVtbywgZW52LmZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGZyYW1lX29mZnNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2F2ZSgpO1xuICAgICAgICAgICAgICAgIHZhciBvcCwgdmFsO1xuICAgICAgICAgICAgICAgIGlmICgkKC9eXFxbXFxzKmZyYW1lLW9mZnNldC9nKSAmJlxuICAgICAgICAgICAgICAgICAgICAob3AgPSAkKHRoaXMuZW50aXRpZXMuY29tcGFyaXNvbikpICYmXG4gICAgICAgICAgICAgICAgICAgICh2YWwgPSAkKC9eXFxkKy8pKSAmJlxuICAgICAgICAgICAgICAgICAgICAkKCddJykpICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJlZS5GcmFtZU9mZnNldChvcCwgdmFsLCBtZW1vKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB6b29tOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzYXZlKCk7XG4gICAgICAgICAgICAgICAgdmFyIG9wLCB2YWw7XG4gICAgICAgICAgICAgICAgaWYgKCQoL15cXFtcXHMqem9vbS9nKSAmJlxuICAgICAgICAgICAgICAgICAgICAob3AgPSAkKHRoaXMuZW50aXRpZXMuY29tcGFyaXNvbikpICYmXG4gICAgICAgICAgICAgICAgICAgICh2YWwgPSAkKHRoaXMuZW50aXRpZXMudmFyaWFibGUpIHx8ICQodGhpcy5lbnRpdGllcy5kaW1lbnNpb24pKSAmJiAkKCddJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5ab29tKG9wLCB2YWwsIG1lbW8pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGJhY2t0cmFja1xuICAgICAgICAgICAgICAgICAgICByZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gVGhlIGBibG9ja2AgcnVsZSBpcyB1c2VkIGJ5IGBydWxlc2V0YFxuICAgICAgICAgICAgLy8gSXQncyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBgcHJpbWFyeWAgcnVsZSwgd2l0aCBhZGRlZCBge31gLlxuICAgICAgICAgICAgYmxvY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50O1xuXG4gICAgICAgICAgICAgICAgaWYgKCQoJ3snKSAmJiAoY29udGVudCA9ICQodGhpcy5wcmltYXJ5KSkgJiYgJCgnfScpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIGRpdiwgLmNsYXNzLCBib2R5ID4gcCB7Li4ufVxuICAgICAgICAgICAgcnVsZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdG9ycyA9IFtdLCBzLCBmLCBsLCBydWxlcywgZmlsdGVycyA9IFtdO1xuICAgICAgICAgICAgICAgIHNhdmUoKTtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChzID0gJCh0aGlzLnNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcnMucHVzaChzKTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCQodGhpcy5jb21tZW50KSkge31cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgJCgnLCcpKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgkKHRoaXMuY29tbWVudCkpIHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgkKHRoaXMuY29tbWVudCkpIHt9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9ycy5sZW5ndGggPiAwICYmIChydWxlcyA9ICQodGhpcy5ibG9jaykpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RvcnMubGVuZ3RoID09PSAxICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcnNbMF0uZWxlbWVudHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcnNbMF0uZWxlbWVudHNbMF0udmFsdWUgPT09ICdNYXAnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcnMgPSBuZXcgdHJlZS5SdWxlc2V0KHNlbGVjdG9ycywgcnVsZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcnMuaXNNYXAgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5SdWxlc2V0KHNlbGVjdG9ycywgcnVsZXMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEJhY2t0cmFja1xuICAgICAgICAgICAgICAgICAgICByZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcnVsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWUsIHZhbHVlLCBjID0gaW5wdXQuY2hhckF0KGkpO1xuICAgICAgICAgICAgICAgIHNhdmUoKTtcblxuICAgICAgICAgICAgICAgIGlmIChjID09PSAnLicgfHwgYyA9PT0gJyMnKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgPSAkKHRoaXMudmFyaWFibGUpIHx8ICQodGhpcy5wcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAkKHRoaXMudmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiAkKHRoaXMuZW5kKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlJ1bGUobmFtZSwgdmFsdWUsIG1lbW8sIGVudi5maWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmdXJ0aGVzdCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBmb250OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBbXSwgZXhwcmVzc2lvbiA9IFtdLCB3ZWlnaHQsIGZvbnQsIGU7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoZSA9ICQodGhpcy5lbnRpdHkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cHJlc3Npb24ucHVzaChlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YWx1ZS5wdXNoKG5ldyB0cmVlLkV4cHJlc3Npb24oZXhwcmVzc2lvbikpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCQoJywnKSkge1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZSA9ICQodGhpcy5leHByZXNzaW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUucHVzaChlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghICQoJywnKSkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5WYWx1ZSh2YWx1ZSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBBIFZhbHVlIGlzIGEgY29tbWEtZGVsaW1pdGVkIGxpc3Qgb2YgRXhwcmVzc2lvbnNcbiAgICAgICAgICAgIC8vIEluIGEgUnVsZSwgYSBWYWx1ZSByZXByZXNlbnRzIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGA6YCxcbiAgICAgICAgICAgIC8vIGFuZCBiZWZvcmUgdGhlIGA7YC5cbiAgICAgICAgICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgZSwgZXhwcmVzc2lvbnMgPSBbXTtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChlID0gJCh0aGlzLmV4cHJlc3Npb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cHJlc3Npb25zLnB1c2goZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghICQoJywnKSkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChleHByZXNzaW9ucy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5WYWx1ZShleHByZXNzaW9ucy5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGUudmFsdWVbMF07XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV4cHJlc3Npb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuVmFsdWUoZXhwcmVzc2lvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBBIHN1Yi1leHByZXNzaW9uLCBjb250YWluZWQgYnkgcGFyZW50aGVuc2lzXG4gICAgICAgICAgICBzdWI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBlLCBleHByZXNzaW9ucyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgaWYgKCQoJygnKSkge1xuICAgICAgICAgICAgICAgICAgd2hpbGUgKGUgPSAkKHRoaXMuZXhwcmVzc2lvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICBleHByZXNzaW9ucy5wdXNoKGUpO1xuICAgICAgICAgICAgICAgICAgICAgIGlmICghICQoJywnKSkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgJCgnKScpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChleHByZXNzaW9ucy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5WYWx1ZShleHByZXNzaW9ucy5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGUudmFsdWVbMF07XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV4cHJlc3Npb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuVmFsdWUoZXhwcmVzc2lvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgbWlzbm9tZXIgYmVjYXVzZSBpdCBhY3R1YWxseSBoYW5kbGVzIG11bHRpcGxpY2F0aW9uXG4gICAgICAgICAgICAvLyBhbmQgZGl2aXNpb24uXG4gICAgICAgICAgICBtdWx0aXBsaWNhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG0sIGEsIG9wLCBvcGVyYXRpb247XG4gICAgICAgICAgICAgICAgaWYgKG0gPSAkKHRoaXMub3BlcmFuZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChvcCA9ICgkKCcvJykgfHwgJCgnKicpIHx8ICQoJyUnKSkpICYmIChhID0gJCh0aGlzLm9wZXJhbmQpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9uID0gbmV3IHRyZWUuT3BlcmF0aW9uKG9wLCBbb3BlcmF0aW9uIHx8IG0sIGFdLCBtZW1vKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3BlcmF0aW9uIHx8IG07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFkZGl0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbSwgYSwgb3AsIG9wZXJhdGlvbjtcbiAgICAgICAgICAgICAgICBpZiAobSA9ICQodGhpcy5tdWx0aXBsaWNhdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChvcCA9ICQoL15bLStdXFxzKy8pIHx8IChpbnB1dC5jaGFyQXQoaSAtIDEpICE9ICcgJyAmJiAoJCgnKycpIHx8ICQoJy0nKSkpKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgKGEgPSAkKHRoaXMubXVsdGlwbGljYXRpb24pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9uID0gbmV3IHRyZWUuT3BlcmF0aW9uKG9wLCBbb3BlcmF0aW9uIHx8IG0sIGFdLCBtZW1vKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3BlcmF0aW9uIHx8IG07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gQW4gb3BlcmFuZCBpcyBhbnl0aGluZyB0aGF0IGNhbiBiZSBwYXJ0IG9mIGFuIG9wZXJhdGlvbixcbiAgICAgICAgICAgIC8vIHN1Y2ggYXMgYSBDb2xvciwgb3IgYSBWYXJpYWJsZVxuICAgICAgICAgICAgb3BlcmFuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQodGhpcy5zdWIpIHx8ICQodGhpcy5lbnRpdHkpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gRXhwcmVzc2lvbnMgZWl0aGVyIHJlcHJlc2VudCBtYXRoZW1hdGljYWwgb3BlcmF0aW9ucyxcbiAgICAgICAgICAgIC8vIG9yIHdoaXRlLXNwYWNlIGRlbGltaXRlZCBFbnRpdGllcy4gIEB2YXIgKiAyXG4gICAgICAgICAgICBleHByZXNzaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgZSwgZGVsaW0sIGVudGl0aWVzID0gW10sIGQ7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoZSA9ICQodGhpcy5hZGRpdGlvbikgfHwgJCh0aGlzLmVudGl0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaChlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZW50aXRpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuRXhwcmVzc2lvbihlbnRpdGllcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb3BlcnR5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9ICQoL14oKFthLXpdWy1hLXpfMC05XSpcXC8pP1xcKj8tP1stYS16XzAtOV0rKVxccyo6Lyk7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWUpIHJldHVybiBuYW1lWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gcGFyc2VyO1xufTtcbiIsInZhciBfID0gZ2xvYmFsLl8gfHwgcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIGNhcnRvID0gcmVxdWlyZSgnLi9pbmRleCcpO1xuXG5jYXJ0by5SZW5kZXJlciA9IGZ1bmN0aW9uIFJlbmRlcmVyKGVudiwgb3B0aW9ucykge1xuICAgIHRoaXMuZW52ID0gZW52IHx8IHt9O1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uID0gdGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uIHx8ICczLjAuMCc7XG59O1xuXG4vKipcbiAqIFByZXBhcmUgYSBNU1MgZG9jdW1lbnQgKGdpdmVuIGFzIGFuIHN0cmluZykgaW50byBhXG4gKiBYTUwgU3R5bGUgZnJhZ21lbnQgKG1vc3RseSB1c2VmdWwgZm9yIGRlYnVnZ2luZylcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZGF0YSB0aGUgbXNzIGNvbnRlbnRzIGFzIGEgc3RyaW5nLlxuICovXG5jYXJ0by5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyTVNTID0gZnVuY3Rpb24gcmVuZGVyKGRhdGEpIHtcbiAgICAvLyBlZmZlY3RzIGlzIGEgY29udGFpbmVyIGZvciBzaWRlLWVmZmVjdHMsIHdoaWNoIGN1cnJlbnRseVxuICAgIC8vIGFyZSBsaW1pdGVkIHRvIEZvbnRTZXRzLlxuICAgIHZhciBlbnYgPSBfLmRlZmF1bHRzKHRoaXMuZW52LCB7XG4gICAgICAgIGJlbmNobWFyazogZmFsc2UsXG4gICAgICAgIHZhbGlkYXRpb25fZGF0YTogZmFsc2UsXG4gICAgICAgIGVmZmVjdHM6IFtdXG4gICAgfSk7XG5cbiAgICBpZiAoIWNhcnRvLnRyZWUuUmVmZXJlbmNlLnNldFZlcnNpb24odGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3Qgc2V0IG1hcG5payB2ZXJzaW9uIHRvIFwiICsgdGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uKTtcbiAgICB9XG5cbiAgICB2YXIgb3V0cHV0ID0gW107XG4gICAgdmFyIHN0eWxlcyA9IFtdO1xuXG4gICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZSgnUGFyc2luZyBNU1MnKTtcbiAgICB2YXIgcGFyc2VyID0gKGNhcnRvLlBhcnNlcihlbnYpKS5wYXJzZShkYXRhKTtcbiAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS50aW1lRW5kKCdQYXJzaW5nIE1TUycpO1xuXG4gICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZSgnUnVsZSBnZW5lcmF0aW9uJyk7XG4gICAgdmFyIHJ1bGVfbGlzdCA9IHBhcnNlci50b0xpc3QoZW52KTtcbiAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS50aW1lRW5kKCdSdWxlIGdlbmVyYXRpb24nKTtcblxuICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWUoJ1J1bGUgaW5oZXJpdGFuY2UnKTtcbiAgICB2YXIgcnVsZXMgPSBpbmhlcml0RGVmaW5pdGlvbnMocnVsZV9saXN0LCBlbnYpO1xuICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWVFbmQoJ1J1bGUgaW5oZXJpdGFuY2UnKTtcblxuICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWUoJ1N0eWxlIHNvcnQnKTtcbiAgICB2YXIgc29ydGVkID0gc29ydFN0eWxlcyhydWxlcyxlbnYpO1xuICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWVFbmQoJ1N0eWxlIHNvcnQnKTtcblxuICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWUoJ1RvdGFsIFN0eWxlIGdlbmVyYXRpb24nKTtcbiAgICBmb3IgKHZhciBrID0gMCwgcnVsZSwgc3R5bGVfbmFtZTsgayA8IHNvcnRlZC5sZW5ndGg7IGsrKykge1xuICAgICAgICBydWxlID0gc29ydGVkW2tdO1xuICAgICAgICBzdHlsZV9uYW1lID0gJ3N0eWxlJyArIChydWxlLmF0dGFjaG1lbnQgIT09ICdfX2RlZmF1bHRfXycgPyAnLScgKyBydWxlLmF0dGFjaG1lbnQgOiAnJyk7XG4gICAgICAgIHN0eWxlcy5wdXNoKHN0eWxlX25hbWUpO1xuICAgICAgICB2YXIgYmVuY2hfbmFtZSA9ICdcXHRTdHlsZSBcIicrc3R5bGVfbmFtZSsnXCIgKCMnK2srJykgdG9YTUwnO1xuICAgICAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS50aW1lKGJlbmNoX25hbWUpO1xuICAgICAgICAvLyBlbnYuZWZmZWN0cyBjYW4gYmUgbW9kaWZpZWQgYnkgdGhpcyBjYWxsXG4gICAgICAgIG91dHB1dC5wdXNoKGNhcnRvLnRyZWUuU3R5bGVYTUwoc3R5bGVfbmFtZSwgcnVsZS5hdHRhY2htZW50LCBydWxlLCBlbnYpKTtcbiAgICAgICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZUVuZChiZW5jaF9uYW1lKTtcbiAgICB9XG4gICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZUVuZCgnVG90YWwgU3R5bGUgZ2VuZXJhdGlvbicpO1xuICAgIGlmIChlbnYuZXJyb3JzKSB0aHJvdyBlbnYuZXJyb3JzO1xuICAgIHJldHVybiBvdXRwdXQuam9pbignXFxuJyk7XG59O1xuXG4vKipcbiAqIFByZXBhcmUgYSBNTUwgZG9jdW1lbnQgKGdpdmVuIGFzIGFuIG9iamVjdCkgaW50byBhXG4gKiBmdWxseS1sb2NhbGl6ZWQgWE1MIGZpbGUgcmVhZHkgZm9yIE1hcG5pazIgY29uc3VtcHRpb25cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbSAtIHRoZSBKU09OIGZpbGUgYXMgYSBzdHJpbmcuXG4gKi9cbmNhcnRvLlJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIobSkge1xuICAgIC8vIGVmZmVjdHMgaXMgYSBjb250YWluZXIgZm9yIHNpZGUtZWZmZWN0cywgd2hpY2ggY3VycmVudGx5XG4gICAgLy8gYXJlIGxpbWl0ZWQgdG8gRm9udFNldHMuXG4gICAgdmFyIGVudiA9IF8uZGVmYXVsdHModGhpcy5lbnYsIHtcbiAgICAgICAgYmVuY2htYXJrOiBmYWxzZSxcbiAgICAgICAgdmFsaWRhdGlvbl9kYXRhOiBmYWxzZSxcbiAgICAgICAgZWZmZWN0czogW10sXG4gICAgICAgIHBwaTogOTAuNzE0XG4gICAgfSk7XG5cbiAgICBpZiAoIWNhcnRvLnRyZWUuUmVmZXJlbmNlLnNldFZlcnNpb24odGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3Qgc2V0IG1hcG5payB2ZXJzaW9uIHRvIFwiICsgdGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uKTtcbiAgICB9XG5cbiAgICB2YXIgb3V0cHV0ID0gW107XG5cbiAgICAvLyBUcmFuc2Zvcm0gc3R5bGVzaGVldHMgaW50byBkZWZpbml0aW9ucy5cbiAgICB2YXIgZGVmaW5pdGlvbnMgPSBfLmNoYWluKG0uU3R5bGVzaGVldClcbiAgICAgICAgLm1hcChmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHMgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdHlsZXNoZWV0IG9iamVjdCBpcyBleHBlY3RlZCBub3QgYSBzdHJpbmc6ICdcIiArIHMgKyBcIidcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBQYXNzaW5nIHRoZSBlbnZpcm9ubWVudCBmcm9tIHN0eWxlc2hlZXQgdG8gc3R5bGVzaGVldCxcbiAgICAgICAgICAgIC8vIGFsbG93cyBmcmFtZXMgYW5kIGVmZmVjdHMgdG8gYmUgbWFpbnRhaW5lZC5cbiAgICAgICAgICAgIGVudiA9IF8uZXh0ZW5kKGVudiwge2ZpbGVuYW1lOnMuaWR9KTtcblxuICAgICAgICAgICAgdmFyIHRpbWUgPSArbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICByb290ID0gKGNhcnRvLlBhcnNlcihlbnYpKS5wYXJzZShzLmRhdGEpO1xuICAgICAgICAgICAgaWYgKGVudi5iZW5jaG1hcmspXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdQYXJzaW5nIHRpbWU6ICcgKyAobmV3IERhdGUoKSAtIHRpbWUpICsgJ21zJyk7XG4gICAgICAgICAgICByZXR1cm4gcm9vdC50b0xpc3QoZW52KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmZsYXR0ZW4oKVxuICAgICAgICAudmFsdWUoKTtcblxuICAgIGZ1bmN0aW9uIGFwcGxpZXNUbyhuYW1lLCBjbGFzc0luZGV4KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihkZWZpbml0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmaW5pdGlvbi5hcHBsaWVzVG8obC5uYW1lLCBjbGFzc0luZGV4KTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggbGF5ZXJzIGFuZCBjcmVhdGUgc3R5bGVzIGN1c3RvbS1idWlsdFxuICAgIC8vIGZvciBlYWNoIG9mIHRoZW0sIGFuZCBhcHBseSB0aG9zZSBzdHlsZXMgdG8gdGhlIGxheWVycy5cbiAgICB2YXIgc3R5bGVzLCBsLCBjbGFzc0luZGV4LCBydWxlcywgc29ydGVkLCBtYXRjaGluZztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG0uTGF5ZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbCA9IG0uTGF5ZXJbaV07XG4gICAgICAgIHN0eWxlcyA9IFtdO1xuICAgICAgICBjbGFzc0luZGV4ID0ge307XG5cbiAgICAgICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUud2FybigncHJvY2Vzc2luZyBsYXllcjogJyArIGwuaWQpO1xuICAgICAgICAvLyBDbGFzc2VzIGFyZSBnaXZlbiBhcyBzcGFjZS1zZXBhcmF0ZWQgYWxwaGFudW1lcmljIHN0cmluZ3MuXG4gICAgICAgIHZhciBjbGFzc2VzID0gKGxbJ2NsYXNzJ10gfHwgJycpLnNwbGl0KC9cXHMrL2cpO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNsYXNzZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGNsYXNzSW5kZXhbY2xhc3Nlc1tqXV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIG1hdGNoaW5nID0gZGVmaW5pdGlvbnMuZmlsdGVyKGFwcGxpZXNUbyhsLm5hbWUsIGNsYXNzSW5kZXgpKTtcbiAgICAgICAgcnVsZXMgPSBpbmhlcml0RGVmaW5pdGlvbnMobWF0Y2hpbmcsIGVudik7XG4gICAgICAgIHNvcnRlZCA9IHNvcnRTdHlsZXMocnVsZXMsIGVudik7XG5cbiAgICAgICAgZm9yICh2YXIgayA9IDAsIHJ1bGUsIHN0eWxlX25hbWU7IGsgPCBzb3J0ZWQubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgIHJ1bGUgPSBzb3J0ZWRba107XG4gICAgICAgICAgICBzdHlsZV9uYW1lID0gbC5uYW1lICsgKHJ1bGUuYXR0YWNobWVudCAhPT0gJ19fZGVmYXVsdF9fJyA/ICctJyArIHJ1bGUuYXR0YWNobWVudCA6ICcnKTtcblxuICAgICAgICAgICAgLy8gZW52LmVmZmVjdHMgY2FuIGJlIG1vZGlmaWVkIGJ5IHRoaXMgY2FsbFxuICAgICAgICAgICAgdmFyIHN0eWxlWE1MID0gY2FydG8udHJlZS5TdHlsZVhNTChzdHlsZV9uYW1lLCBydWxlLmF0dGFjaG1lbnQsIHJ1bGUsIGVudik7XG5cbiAgICAgICAgICAgIGlmIChzdHlsZVhNTCkge1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKHN0eWxlWE1MKTtcbiAgICAgICAgICAgICAgICBzdHlsZXMucHVzaChzdHlsZV9uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG91dHB1dC5wdXNoKGNhcnRvLnRyZWUuTGF5ZXJYTUwobCwgc3R5bGVzKSk7XG4gICAgfVxuXG4gICAgb3V0cHV0LnVuc2hpZnQoZW52LmVmZmVjdHMubWFwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgcmV0dXJuIGUudG9YTUwoZW52KTtcbiAgICB9KS5qb2luKCdcXG4nKSk7XG5cbiAgICB2YXIgbWFwX3Byb3BlcnRpZXMgPSBnZXRNYXBQcm9wZXJ0aWVzKG0sIGRlZmluaXRpb25zLCBlbnYpO1xuXG4gICAgLy8gRXhpdCBvbiBlcnJvcnMuXG4gICAgaWYgKGVudi5lcnJvcnMpIHRocm93IGVudi5lcnJvcnM7XG5cbiAgICAvLyBQYXNzIFRpbGVKU09OIGFuZCBvdGhlciBjdXN0b20gcGFyYW1ldGVycyB0aHJvdWdoIHRvIE1hcG5payBYTUwuXG4gICAgdmFyIHBhcmFtZXRlcnMgPSBfLnJlZHVjZShtLCBmdW5jdGlvbihtZW1vLCB2LCBrKSB7XG4gICAgICAgIGlmICghdiAmJiB2ICE9PSAwKSByZXR1cm4gbWVtbztcblxuICAgICAgICBzd2l0Y2ggKGspIHtcbiAgICAgICAgLy8gS25vd24gc2tpcHBhYmxlIHByb3BlcnRpZXMuXG4gICAgICAgIGNhc2UgJ3Nycyc6XG4gICAgICAgIGNhc2UgJ0xheWVyJzpcbiAgICAgICAgY2FzZSAnU3R5bGVzaGVldCc6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gTm9uIFVSTC1ib3VuZCBUaWxlSlNPTiBwcm9wZXJ0aWVzLlxuICAgICAgICBjYXNlICdib3VuZHMnOlxuICAgICAgICBjYXNlICdjZW50ZXInOlxuICAgICAgICBjYXNlICdtaW56b29tJzpcbiAgICAgICAgY2FzZSAnbWF4em9vbSc6XG4gICAgICAgIGNhc2UgJ3ZlcnNpb24nOlxuICAgICAgICAgICAgbWVtby5wdXNoKCcgIDxQYXJhbWV0ZXIgbmFtZT1cIicgKyBrICsgJ1wiPicgKyB2ICsgJzwvUGFyYW1ldGVyPicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIFByb3BlcnRpZXMgdGhhdCByZXF1aXJlIENEQVRBLlxuICAgICAgICBjYXNlICduYW1lJzpcbiAgICAgICAgY2FzZSAnZGVzY3JpcHRpb24nOlxuICAgICAgICBjYXNlICdsZWdlbmQnOlxuICAgICAgICBjYXNlICdhdHRyaWJ1dGlvbic6XG4gICAgICAgIGNhc2UgJ3RlbXBsYXRlJzpcbiAgICAgICAgICAgIG1lbW8ucHVzaCgnICA8UGFyYW1ldGVyIG5hbWU9XCInICsgayArICdcIj48IVtDREFUQVsnICsgdiArICddXT48L1BhcmFtZXRlcj4nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBNYXBuaWsgaW1hZ2UgZm9ybWF0LlxuICAgICAgICBjYXNlICdmb3JtYXQnOlxuICAgICAgICAgICAgbWVtby5wdXNoKCcgIDxQYXJhbWV0ZXIgbmFtZT1cIicgKyBrICsgJ1wiPicgKyB2ICsgJzwvUGFyYW1ldGVyPicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIE1hcG5payBpbnRlcmFjdGl2aXR5IHNldHRpbmdzLlxuICAgICAgICBjYXNlICdpbnRlcmFjdGl2aXR5JzpcbiAgICAgICAgICAgIG1lbW8ucHVzaCgnICA8UGFyYW1ldGVyIG5hbWU9XCJpbnRlcmFjdGl2aXR5X2xheWVyXCI+JyArIHYubGF5ZXIgKyAnPC9QYXJhbWV0ZXI+Jyk7XG4gICAgICAgICAgICBtZW1vLnB1c2goJyAgPFBhcmFtZXRlciBuYW1lPVwiaW50ZXJhY3Rpdml0eV9maWVsZHNcIj4nICsgdi5maWVsZHMgKyAnPC9QYXJhbWV0ZXI+Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gU3VwcG9ydCBhbnkgYWRkaXRpb25hbCBzY2FsYXIgcHJvcGVydGllcy5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIHYpIHtcbiAgICAgICAgICAgICAgICBtZW1vLnB1c2goJyAgPFBhcmFtZXRlciBuYW1lPVwiJyArIGsgKyAnXCI+PCFbQ0RBVEFbJyArIHYgKyAnXV0+PC9QYXJhbWV0ZXI+Jyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCdudW1iZXInID09PSB0eXBlb2Ygdikge1xuICAgICAgICAgICAgICAgIG1lbW8ucHVzaCgnICA8UGFyYW1ldGVyIG5hbWU9XCInICsgayArICdcIj4nICsgdiArICc8L1BhcmFtZXRlcj4nKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoJ2Jvb2xlYW4nID09PSB0eXBlb2Ygdikge1xuICAgICAgICAgICAgICAgIG1lbW8ucHVzaCgnICA8UGFyYW1ldGVyIG5hbWU9XCInICsgayArICdcIj4nICsgdiArICc8L1BhcmFtZXRlcj4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtZW1vO1xuICAgIH0sIFtdKTtcbiAgICBpZiAocGFyYW1ldGVycy5sZW5ndGgpIG91dHB1dC51bnNoaWZ0KFxuICAgICAgICAnPFBhcmFtZXRlcnM+XFxuJyArXG4gICAgICAgIHBhcmFtZXRlcnMuam9pbignXFxuJykgK1xuICAgICAgICAnXFxuPC9QYXJhbWV0ZXJzPlxcbidcbiAgICApO1xuXG4gICAgdmFyIHByb3BlcnRpZXMgPSBfLm1hcChtYXBfcHJvcGVydGllcywgZnVuY3Rpb24odikgeyByZXR1cm4gJyAnICsgdjsgfSkuam9pbignJyk7XG5cbiAgICBvdXRwdXQudW5zaGlmdChcbiAgICAgICAgJzw/eG1sIHZlcnNpb249XCIxLjBcIiAnICtcbiAgICAgICAgJ2VuY29kaW5nPVwidXRmLThcIj8+XFxuJyArXG4gICAgICAgICc8IURPQ1RZUEUgTWFwW10+XFxuJyArXG4gICAgICAgICc8TWFwJyArIHByb3BlcnRpZXMgKyc+XFxuJyk7XG4gICAgb3V0cHV0LnB1c2goJzwvTWFwPicpO1xuICAgIHJldHVybiBvdXRwdXQuam9pbignXFxuJyk7XG59O1xuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gY3VycmVudGx5IG1vZGlmaWVzICdjdXJyZW50J1xuICogQHBhcmFtIHtBcnJheX0gIGN1cnJlbnQgIGN1cnJlbnQgbGlzdCBvZiBydWxlc1xuICogQHBhcmFtIHtPYmplY3R9IGRlZmluaXRpb24gYSBEZWZpbml0aW9uIG9iamVjdCB0byBhZGQgdG8gdGhlIHJ1bGVzXG4gKiBAcGFyYW0ge09iamVjdH0gYnlGaWx0ZXIgYW4gb2JqZWN0L2RpY3Rpb25hcnkgb2YgZXhpc3RpbmcgZmlsdGVycy4gVGhpcyBpc1xuICogYWN0dWFsbHkga2V5ZWQgYGF0dGFjaG1lbnQtPmZpbHRlcmBcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbnYgdGhlIGN1cnJlbnQgZW52aXJvbm1lbnRcbiovXG5mdW5jdGlvbiBhZGRSdWxlcyhjdXJyZW50LCBkZWZpbml0aW9uLCBieUZpbHRlciwgZW52KSB7XG4gICAgdmFyIG5ld0ZpbHRlcnMgPSBkZWZpbml0aW9uLmZpbHRlcnMsXG4gICAgICAgIG5ld1J1bGVzID0gZGVmaW5pdGlvbi5ydWxlcyxcbiAgICAgICAgdXBkYXRlZEZpbHRlcnMsIGNsb25lLCBwcmV2aW91cztcblxuICAgIC8vIFRoZSBjdXJyZW50IGRlZmluaXRpb24gbWlnaHQgaGF2ZSBiZWVuIHNwbGl0IHVwIGludG9cbiAgICAvLyBtdWx0aXBsZSBkZWZpbml0aW9ucyBhbHJlYWR5LlxuICAgIGZvciAodmFyIGsgPSAwOyBrIDwgY3VycmVudC5sZW5ndGg7IGsrKykge1xuICAgICAgICB1cGRhdGVkRmlsdGVycyA9IGN1cnJlbnRba10uZmlsdGVycy5jbG9uZVdpdGgobmV3RmlsdGVycyk7XG4gICAgICAgIGlmICh1cGRhdGVkRmlsdGVycykge1xuICAgICAgICAgICAgcHJldmlvdXMgPSBieUZpbHRlclt1cGRhdGVkRmlsdGVyc107XG4gICAgICAgICAgICBpZiAocHJldmlvdXMpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGVyZSdzIGFscmVhZHkgYSBkZWZpbml0aW9uIHdpdGggdGhvc2UgZXhhY3RcbiAgICAgICAgICAgICAgICAvLyBmaWx0ZXJzLiBBZGQgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbnMnIHJ1bGVzXG4gICAgICAgICAgICAgICAgLy8gYW5kIHN0b3AgcHJvY2Vzc2luZyBpdCBhcyB0aGUgZXhpc3RpbmcgcnVsZVxuICAgICAgICAgICAgICAgIC8vIGhhcyBhbHJlYWR5IGdvbmUgZG93biB0aGUgaW5oZXJpdGFuY2UgY2hhaW4uXG4gICAgICAgICAgICAgICAgcHJldmlvdXMuYWRkUnVsZXMobmV3UnVsZXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9uZSA9IGN1cnJlbnRba10uY2xvbmUodXBkYXRlZEZpbHRlcnMpO1xuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHdlJ3JlIG9ubHkgbWFpbnRhaW5pbmcgdGhlIGNsb25lXG4gICAgICAgICAgICAgICAgLy8gd2hlbiB3ZSBkaWQgYWN0dWFsbHkgYWRkIHJ1bGVzLiBJZiBub3QsIHRoZXJlJ3NcbiAgICAgICAgICAgICAgICAvLyBubyBuZWVkIHRvIGtlZXAgdGhlIGNsb25lIGFyb3VuZC5cbiAgICAgICAgICAgICAgICBpZiAoY2xvbmUuYWRkUnVsZXMobmV3UnVsZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGluc2VydGVkIGFuIGVsZW1lbnQgYmVmb3JlIHRoaXMgb25lLCBzbyB3ZSBuZWVkXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIG1ha2Ugc3VyZSB0aGF0IGluIHRoZSBuZXh0IGxvb3AgaXRlcmF0aW9uLCB3ZSdyZVxuICAgICAgICAgICAgICAgICAgICAvLyBub3QgcGVyZm9ybWluZyB0aGUgc2FtZSB0YXNrIGZvciB0aGlzIGVsZW1lbnQgYWdhaW4sXG4gICAgICAgICAgICAgICAgICAgIC8vIGhlbmNlIHRoZSBrKysuXG4gICAgICAgICAgICAgICAgICAgIGJ5RmlsdGVyW3VwZGF0ZWRGaWx0ZXJzXSA9IGNsb25lO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50LnNwbGljZShrLCAwLCBjbG9uZSk7XG4gICAgICAgICAgICAgICAgICAgIGsrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodXBkYXRlZEZpbHRlcnMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIGlmIHVwZGF0ZWRGaWx0ZXJzIGlzIG51bGwsIHRoZW4gYWRkaW5nIHRoZSBmaWx0ZXJzIGRvZXNuJ3RcbiAgICAgICAgICAgIC8vIGludmFsaWRhdGUgb3Igc3BsaXQgdGhlIHNlbGVjdG9yLCBzbyB3ZSBhZGRSdWxlcyB0byB0aGVcbiAgICAgICAgICAgIC8vIGNvbWJpbmVkIHNlbGVjdG9yXG5cbiAgICAgICAgICAgIC8vIEZpbHRlcnMgY2FuIGJlIGFkZGVkLCBidXQgdGhleSBkb24ndCBjaGFuZ2UgdGhlXG4gICAgICAgICAgICAvLyBmaWx0ZXJzLiBUaGlzIG1lYW5zIHdlIGRvbid0IGhhdmUgdG8gc3BsaXQgdGhlXG4gICAgICAgICAgICAvLyBkZWZpbml0aW9uLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIHRoaXMgaXMgY2xvbmVkIGhlcmUgYmVjYXVzZSBvZiBzaGFyZWQgY2xhc3Nlcywgc2VlXG4gICAgICAgICAgICAvLyBzaGFyZWRjbGFzcy5tc3NcbiAgICAgICAgICAgIGN1cnJlbnRba10gPSBjdXJyZW50W2tdLmNsb25lKCk7XG4gICAgICAgICAgICBjdXJyZW50W2tdLmFkZFJ1bGVzKG5ld1J1bGVzKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiB1cGRhdGVkRmVhdHVyZXMgaXMgZmFsc2UsIHRoZW4gdGhlIGZpbHRlcnMgc3BsaXQgdGhlIHJ1bGUsXG4gICAgICAgIC8vIHNvIHRoZXkgYXJlbid0IHRoZSBzYW1lIGluaGVyaXRhbmNlIGNoYWluXG4gICAgfVxuICAgIHJldHVybiBjdXJyZW50O1xufVxuXG4vKipcbiAqIEFwcGx5IGluaGVyaXRlZCBzdHlsZXMgZnJvbSB0aGVpciBhbmNlc3RvcnMgdG8gdGhlbS5cbiAqXG4gKiBjYWxsZWQgZWl0aGVyIG9uY2UgcGVyIHJlbmRlciAoaW4gdGhlIGNhc2Ugb2YgbXNzKSBvciBwZXIgbGF5ZXJcbiAqIChmb3IgbW1sKVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZWZpbml0aW9ucyAtIGEgbGlzdCBvZiBkZWZpbml0aW9ucyBvYmplY3RzXG4gKiAgIHRoYXQgY29udGFpbiAucnVsZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbnYgLSB0aGUgZW52aXJvbm1lbnRcbiAqIEByZXR1cm4ge0FycmF5PEFycmF5Pn0gYW4gYXJyYXkgb2YgYXJyYXlzIGlzIHJldHVybmVkLFxuICogICBpbiB3aGljaCBlYWNoIGFycmF5IHJlZmVycyB0byBhIHNwZWNpZmljIGF0dGFjaG1lbnRcbiAqL1xuZnVuY3Rpb24gaW5oZXJpdERlZmluaXRpb25zKGRlZmluaXRpb25zLCBlbnYpIHtcbiAgICB2YXIgaW5oZXJpdFRpbWUgPSArbmV3IERhdGUoKTtcbiAgICAvLyBkZWZpbml0aW9ucyBhcmUgb3JkZXJlZCBieSBzcGVjaWZpY2l0eSxcbiAgICAvLyBoaWdoIChpbmRleCAwKSB0byBsb3dcbiAgICB2YXIgYnlBdHRhY2htZW50ID0ge30sXG4gICAgICAgIGJ5RmlsdGVyID0ge307XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIHZhciBjdXJyZW50LCBwcmV2aW91cywgYXR0YWNobWVudDtcblxuICAgIC8vIEV2YWx1YXRlIHRoZSBmaWx0ZXJzIHNwZWNpZmllZCBieSBlYWNoIGRlZmluaXRpb24gd2l0aCB0aGUgZ2l2ZW5cbiAgICAvLyBlbnZpcm9ubWVudCB0byBjb3JyZWN0bHkgcmVzb2x2ZSB2YXJpYWJsZSByZWZlcmVuY2VzXG4gICAgZGVmaW5pdGlvbnMuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgIGQuZmlsdGVycy5ldihlbnYpO1xuICAgIH0pO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWZpbml0aW9ucy5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgIGF0dGFjaG1lbnQgPSBkZWZpbml0aW9uc1tpXS5hdHRhY2htZW50O1xuICAgICAgICBjdXJyZW50ID0gW2RlZmluaXRpb25zW2ldXTtcblxuICAgICAgICBpZiAoIWJ5QXR0YWNobWVudFthdHRhY2htZW50XSkge1xuICAgICAgICAgICAgYnlBdHRhY2htZW50W2F0dGFjaG1lbnRdID0gW107XG4gICAgICAgICAgICBieUF0dGFjaG1lbnRbYXR0YWNobWVudF0uYXR0YWNobWVudCA9IGF0dGFjaG1lbnQ7XG4gICAgICAgICAgICBieUZpbHRlclthdHRhY2htZW50XSA9IHt9O1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goYnlBdHRhY2htZW50W2F0dGFjaG1lbnRdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgc3Vic2VxdWVudCBydWxlcy5cbiAgICAgICAgZm9yICh2YXIgaiA9IGkgKyAxOyBqIDwgZGVmaW5pdGlvbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChkZWZpbml0aW9uc1tqXS5hdHRhY2htZW50ID09PSBhdHRhY2htZW50KSB7XG4gICAgICAgICAgICAgICAgLy8gT25seSBpbmhlcml0IHJ1bGVzIGZyb20gdGhlIHNhbWUgYXR0YWNobWVudC5cbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gYWRkUnVsZXMoY3VycmVudCwgZGVmaW5pdGlvbnNbal0sIGJ5RmlsdGVyW2F0dGFjaG1lbnRdLCBlbnYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBjdXJyZW50Lmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICBieUZpbHRlclthdHRhY2htZW50XVtjdXJyZW50W2tdLmZpbHRlcnNdID0gY3VycmVudFtrXTtcbiAgICAgICAgICAgIGJ5QXR0YWNobWVudFthdHRhY2htZW50XS5wdXNoKGN1cnJlbnRba10pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUud2FybignSW5oZXJpdGFuY2UgdGltZTogJyArICgobmV3IERhdGUoKSAtIGluaGVyaXRUaW1lKSkgKyAnbXMnKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG5cbn1cblxuLy8gU29ydCBzdHlsZXMgYnkgdGhlIG1pbmltdW0gaW5kZXggb2YgdGhlaXIgcnVsZXMuXG4vLyBUaGlzIHNvcnRzIGEgc2xpY2Ugb2YgdGhlIHN0eWxlcywgc28gaXQgcmV0dXJucyBhIHNvcnRlZFxuLy8gYXJyYXkgYnV0IGRvZXMgbm90IGNoYW5nZSB0aGUgaW5wdXQuXG5mdW5jdGlvbiBzb3J0U3R5bGVzSW5kZXgoYSwgYikgeyByZXR1cm4gYi5pbmRleCAtIGEuaW5kZXg7IH1cbmZ1bmN0aW9uIHNvcnRTdHlsZXMoc3R5bGVzLCBlbnYpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0eWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc3R5bGUgPSBzdHlsZXNbaV07XG4gICAgICAgIHN0eWxlLmluZGV4ID0gSW5maW5pdHk7XG4gICAgICAgIGZvciAodmFyIGIgPSAwOyBiIDwgc3R5bGUubGVuZ3RoOyBiKyspIHtcbiAgICAgICAgICAgIHZhciBydWxlcyA9IHN0eWxlW2JdLnJ1bGVzO1xuICAgICAgICAgICAgZm9yICh2YXIgciA9IDA7IHIgPCBydWxlcy5sZW5ndGg7IHIrKykge1xuICAgICAgICAgICAgICAgIHZhciBydWxlID0gcnVsZXNbcl07XG4gICAgICAgICAgICAgICAgaWYgKHJ1bGUuaW5kZXggPCBzdHlsZS5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBzdHlsZS5pbmRleCA9IHJ1bGUuaW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdCA9IHN0eWxlcy5zbGljZSgpO1xuICAgIHJlc3VsdC5zb3J0KHNvcnRTdHlsZXNJbmRleCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBGaW5kIGEgcnVsZSBsaWtlIE1hcCB7IGJhY2tncm91bmQtY29sb3I6ICNmZmY7IH0sXG4gKiBpZiBhbnksIGFuZCByZXR1cm4gYSBsaXN0IG9mIHByb3BlcnRpZXMgdG8gYmUgaW5zZXJ0ZWRcbiAqIGludG8gdGhlIDxNYXAgZWxlbWVudCBvZiB0aGUgcmVzdWx0aW5nIFhNTC4gVHJhbnNsYXRlc1xuICogcHJvcGVydGllcyBvZiB0aGUgbW1sIG9iamVjdCBhdCBgbWAgZGlyZWN0bHkgaW50byBYTUxcbiAqIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG0gdGhlIG1tbCBvYmplY3QuXG4gKiBAcGFyYW0ge0FycmF5fSBkZWZpbml0aW9ucyB0aGUgb3V0cHV0IG9mIHRvTGlzdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBlbnZcbiAqIEByZXR1cm4ge1N0cmluZ30gcmVuZGVyZWQgcHJvcGVydGllcy5cbiAqL1xuZnVuY3Rpb24gZ2V0TWFwUHJvcGVydGllcyhtLCBkZWZpbml0aW9ucywgZW52KSB7XG4gICAgdmFyIHJ1bGVzID0ge307XG4gICAgdmFyIHN5bWJvbGl6ZXJzID0gY2FydG8udHJlZS5SZWZlcmVuY2UuZGF0YS5zeW1ib2xpemVycy5tYXA7XG5cbiAgICBfKG0pLmVhY2goZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICBpZiAoa2V5IGluIHN5bWJvbGl6ZXJzKSBydWxlc1trZXldID0ga2V5ICsgJz1cIicgKyB2YWx1ZSArICdcIic7XG4gICAgfSk7XG5cbiAgICBkZWZpbml0aW9ucy5maWx0ZXIoZnVuY3Rpb24ocikge1xuICAgICAgICByZXR1cm4gci5lbGVtZW50cy5qb2luKCcnKSA9PT0gJ01hcCc7XG4gICAgfSkuZm9yRWFjaChmdW5jdGlvbihyKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgci5ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IHIucnVsZXNbaV0ubmFtZTtcbiAgICAgICAgICAgIGlmICghKGtleSBpbiBzeW1ib2xpemVycykpIHtcbiAgICAgICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnUnVsZSAnICsga2V5ICsgJyBub3QgYWxsb3dlZCBmb3IgTWFwLicsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiByLnJ1bGVzW2ldLmluZGV4XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBydWxlc1trZXldID0gci5ydWxlc1tpXS5ldihlbnYpLnRvWE1MKGVudik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcnVsZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2FydG87XG5tb2R1bGUuZXhwb3J0cy5hZGRSdWxlcyA9IGFkZFJ1bGVzO1xubW9kdWxlLmV4cG9ydHMuaW5oZXJpdERlZmluaXRpb25zID0gaW5oZXJpdERlZmluaXRpb25zO1xubW9kdWxlLmV4cG9ydHMuc29ydFN0eWxlcyA9IHNvcnRTdHlsZXM7XG4iLCIoZnVuY3Rpb24oY2FydG8pIHtcbnZhciB0cmVlID0gcmVxdWlyZSgnLi90cmVlJyk7XG52YXIgXyA9IGdsb2JhbC5fIHx8IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuXG5mdW5jdGlvbiBDYXJ0b0NTUyhzdHlsZSwgb3B0aW9ucykge1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLmltYWdlVVJMcyA9IFtdO1xuICBpZihzdHlsZSkge1xuICAgIHRoaXMuc2V0U3R5bGUoc3R5bGUpO1xuICB9XG59XG5cbkNhcnRvQ1NTLkxheWVyID0gZnVuY3Rpb24oc2hhZGVyLCBvcHRpb25zKSB7XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gIHRoaXMuc2hhZGVyID0gc2hhZGVyO1xufTtcblxuXG5DYXJ0b0NTUy5MYXllci5wcm90b3R5cGUgPSB7XG5cbiAgZnVsbE5hbWU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNoYWRlci5hdHRhY2htZW50O1xuICB9LFxuXG4gIG5hbWU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmZ1bGxOYW1lKCkuc3BsaXQoJzo6JylbMF07XG4gIH0sXG5cbiAgLy8gZnJhbWVzIHRoaXMgbGF5ZXIgbmVlZCB0byBiZSByZW5kZXJlZFxuICBmcmFtZXM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNoYWRlci5mcmFtZXM7XG4gIH0sXG5cbiAgYXR0YWNobWVudDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZnVsbE5hbWUoKS5zcGxpdCgnOjonKVsxXTtcbiAgfSxcblxuICBldmFsOiBmdW5jdGlvbihwcm9wKSB7XG4gICAgdmFyIHAgPSB0aGlzLnNoYWRlcltwcm9wXTtcbiAgICBpZiAoIXAgfHwgIXAuc3R5bGUpIHJldHVybjtcbiAgICByZXR1cm4gcC5zdHlsZSh7fSwgeyB6b29tOiAwLCAnZnJhbWUtb2Zmc2V0JzogMCB9KTtcbiAgfSxcblxuICAvKlxuICAgKiBgcHJvcHNgOiBmZWF0dXJlIHByb3BlcnRpZXNcbiAgICogYGNvbnRleHRgOiByZW5kZXJpbmcgcHJvcGVydGllcywgaS5lIHpvb21cbiAgICovXG4gIGdldFN0eWxlOiBmdW5jdGlvbihwcm9wcywgY29udGV4dCkge1xuICAgIHZhciBzdHlsZSA9IHt9O1xuICAgIGZvcih2YXIgaSBpbiB0aGlzLnNoYWRlcikge1xuICAgICAgaWYoaSAhPT0gJ2F0dGFjaG1lbnQnICYmIGkgIT09ICd6b29tJyAmJiBpICE9PSAnZnJhbWVzJyAmJiBpICE9PSAnc3ltYm9saXplcnMnKSB7XG4gICAgICAgIHN0eWxlW2ldID0gdGhpcy5zaGFkZXJbaV0uc3R5bGUocHJvcHMsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3R5bGU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIHJldHVybiB0aGUgc3ltYm9saXplcnMgdGhhdCBuZWVkIHRvIGJlIHJlbmRlcmVkIHdpdGggXG4gICAqIHRoaXMgc3R5bGUuIFRoZSBvcmRlciBpcyB0aGUgcmVuZGVyaW5nIG9yZGVyLlxuICAgKiBAcmV0dXJucyBhIGxpc3Qgd2l0aCAzIHBvc3NpYmxlIHZhbHVlcyAnbGluZScsICdtYXJrZXInLCAncG9seWdvbidcbiAgICovXG4gIGdldFN5bWJvbGl6ZXJzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zaGFkZXIuc3ltYm9saXplcnM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIHJldHVybnMgaWYgdGhlIHN0eWxlIHZhcmllcyB3aXRoIHNvbWUgZmVhdHVyZSBwcm9wZXJ0eS5cbiAgICogVXNlZnVsIHRvIG9wdGltaXplIHJlbmRlcmluZ1xuICAgKi9cbiAgaXNWYXJpYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgZm9yKHZhciBpIGluIHRoaXMuc2hhZGVyKSB7XG4gICAgICBpZihpICE9PSAnYXR0YWNobWVudCcgJiYgaSAhPT0gJ3pvb20nICYmIGkgIT09ICdmcmFtZXMnICYmIGkgIT09ICdzeW1ib2xpemVycycpIHtcbiAgICAgICAgaWYgKCF0aGlzLnNoYWRlcltpXS5jb25zdGFudCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICBnZXRTaGFkZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNoYWRlcjtcbiAgfSxcblxuICAvKipcbiAgICogcmV0dXJucyB0cnVlIGlmIGEgZmVhdHVyZSBuZWVkcyB0byBiZSByZW5kZXJlZFxuICAgKi9cbiAgZmlsdGVyOiBmdW5jdGlvbihmZWF0dXJlVHlwZSwgcHJvcHMsIGNvbnRleHQpIHtcbiAgICBmb3IodmFyIGkgaW4gdGhpcy5zaGFkZXIpIHtcbiAgICAgdmFyIHMgPSB0aGlzLnNoYWRlcltpXShwcm9wcywgY29udGV4dCk7XG4gICAgIGlmKHMpIHtcbiAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLy9cbiAgLy8gZ2l2ZW4gYSBnZW9lbXRyeSB0eXBlIHJldHVybnMgdGhlIHRyYW5zZm9ybWVkIG9uZSBhY29yZGluZyB0aGUgQ2FydG9DU1NcbiAgLy8gRm9yIHBvaW50cyB0aGVyZSBhcmUgdHdvIGtpbmQgb2YgdHlwZXM6IHBvaW50IGFuZCBzcHJpdGUsIHRoZSBmaXJzdCBvbmUgXG4gIC8vIGlzIGEgY2lyY2xlLCBzZWNvbmQgb25lIGlzIGFuIGltYWdlIHNwcml0ZVxuICAvL1xuICAvLyB0aGUgb3RoZXIgZ2VvbWV0cnkgdHlwZXMgYXJlIHRoZSBzYW1lIHRoYW4gZ2VvanNvbiAocG9seWdvbiwgbGluZXN0cmluZy4uLilcbiAgLy9cbiAgdHJhbnNmb3JtR2VvbWV0cnk6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICByZXR1cm4gdHlwZTtcbiAgfSxcblxuICB0cmFuc2Zvcm1HZW9tZXRyaWVzOiBmdW5jdGlvbihnZW9qc29uKSB7XG4gICAgcmV0dXJuIGdlb2pzb247XG4gIH1cblxufTtcblxuQ2FydG9DU1MucHJvdG90eXBlID0ge1xuXG4gIHNldFN0eWxlOiBmdW5jdGlvbihzdHlsZSkge1xuICAgIHZhciBsYXllcnMgPSB0aGlzLnBhcnNlKHN0eWxlKTtcbiAgICBpZighbGF5ZXJzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5wYXJzZV9lbnYuZXJyb3JzKTtcbiAgICB9XG4gICAgdGhpcy5sYXllcnMgPSBsYXllcnMubWFwKGZ1bmN0aW9uKHNoYWRlcikge1xuICAgICAgICByZXR1cm4gbmV3IENhcnRvQ1NTLkxheWVyKHNoYWRlcik7XG4gICAgfSk7XG4gIH0sXG5cbiAgZ2V0TGF5ZXJzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5sYXllcnM7XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZmluZExheWVyKHsgYXR0YWNobWVudDogJ19fZGVmYXVsdF9fJyB9KTtcbiAgfSxcblxuICBmaW5kTGF5ZXI6IGZ1bmN0aW9uKHdoZXJlKSB7XG4gICAgcmV0dXJuIF8uZmluZCh0aGlzLmxheWVycywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiB3aGVyZSkge1xuICAgICAgICB2YXIgdiA9IHZhbHVlW2tleV07XG4gICAgICAgIGlmICh0eXBlb2YodikgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB2ID0gdi5jYWxsKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAod2hlcmVba2V5XSAhPT0gdikgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH0sXG5cbiAgX2NyZWF0ZUZuOiBmdW5jdGlvbihvcHMpIHtcbiAgICB2YXIgYm9keSA9IG9wcy5qb2luKCdcXG4nKTtcbiAgICBpZih0aGlzLm9wdGlvbnMuZGVidWcpIGNvbnNvbGUubG9nKGJvZHkpO1xuICAgIHJldHVybiBGdW5jdGlvbihcImRhdGFcIixcImN0eFwiLCBcInZhciBfdmFsdWUgPSBudWxsOyBcIiArICBib2R5ICsgXCI7IHJldHVybiBfdmFsdWU7IFwiKTtcbiAgfSxcblxuICBfY29tcGlsZTogZnVuY3Rpb24oc2hhZGVyKSB7XG4gICAgaWYodHlwZW9mIHNoYWRlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgc2hhZGVyID0gZXZhbChcIihmdW5jdGlvbigpIHsgcmV0dXJuIFwiICsgc2hhZGVyICtcIjsgfSkoKVwiKTtcbiAgICB9XG4gICAgdGhpcy5zaGFkZXJfc3JjID0gc2hhZGVyO1xuICAgIGZvcih2YXIgYXR0ciBpbiBzaGFkZXIpIHtcbiAgICAgICAgdmFyIGMgPSBtYXBwZXJbYXR0cl07XG4gICAgICAgIGlmKGMpIHtcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZWRbY10gPSBldmFsKFwiKGZ1bmN0aW9uKCkgeyByZXR1cm4gc2hhZGVyW2F0dHJdOyB9KSgpO1wiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZ2V0SW1hZ2VVUkxzOiBmdW5jdGlvbigpe1xuICAgIHJldHVybiB0aGlzLmltYWdlVVJMcztcbiAgfSxcblxuICBwYXJzZTogZnVuY3Rpb24oY2FydG9jc3MpIHtcbiAgICB2YXIgcGFyc2VfZW52ID0ge1xuICAgICAgZnJhbWVzOiBbXSxcbiAgICAgIGVycm9yczogW10sXG4gICAgICBlcnJvcjogZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHRoaXMuZXJyb3JzLnB1c2gob2JqKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMucGFyc2VfZW52ID0gcGFyc2VfZW52O1xuXG4gICAgdmFyIHJ1bGVzZXQgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICBydWxlc2V0ID0gKG5ldyBjYXJ0by5QYXJzZXIocGFyc2VfZW52KSkucGFyc2UoY2FydG9jc3MpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgLy8gYWRkIHRoZSBzdHlsZS5tc3Mgc3RyaW5nIHRvIG1hdGNoIHRoZSByZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXJcbiAgICAgIHBhcnNlX2Vudi5lcnJvcnMucHVzaChlLm1lc3NhZ2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZihydWxlc2V0KSB7XG5cbiAgICAgIGZ1bmN0aW9uIGRlZktleShkZWYpIHtcbiAgICAgICAgcmV0dXJuIGRlZi5lbGVtZW50c1swXSArIFwiOjpcIiArIGRlZi5hdHRhY2htZW50O1xuICAgICAgfVxuICAgICAgdmFyIGRlZnMgPSBydWxlc2V0LnRvTGlzdChwYXJzZV9lbnYpO1xuICAgICAgZGVmcy5yZXZlcnNlKCk7XG4gICAgICAvLyBncm91cCBieSBlbGVtZW50c1swXS52YWx1ZTo6YXR0YWNobWVudFxuICAgICAgdmFyIGxheWVycyA9IHt9O1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGRlZnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGRlZiA9IGRlZnNbaV07XG4gICAgICAgIHZhciBrZXkgPSBkZWZLZXkoZGVmKTtcbiAgICAgICAgdmFyIGxheWVyID0gbGF5ZXJzW2tleV0gPSAobGF5ZXJzW2tleV0gfHwge1xuICAgICAgICAgIHN5bWJvbGl6ZXJzOiBbXVxuICAgICAgICB9KTtcbiAgICAgICAgZm9yKHZhciB1ID0gMDsgdTxkZWYucnVsZXMubGVuZ3RoOyB1Kyspe1xuICAgICAgICAgICAgaWYoZGVmLnJ1bGVzW3VdLm5hbWUgPT09IFwibWFya2VyLWZpbGVcIiB8fCBkZWYucnVsZXNbdV0ubmFtZSA9PT0gXCJwb2ludC1maWxlXCIpe1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRlZi5ydWxlc1t1XS52YWx1ZS52YWx1ZVswXS52YWx1ZVswXS52YWx1ZS52YWx1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlVVJMcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBcbiAgICAgICAgbGF5ZXIuZnJhbWVzID0gW107XG4gICAgICAgIGxheWVyLnpvb20gPSB0cmVlLlpvb20uYWxsO1xuICAgICAgICB2YXIgcHJvcHMgPSBkZWYudG9KUyhwYXJzZV9lbnYpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRlYnVnKSBjb25zb2xlLmxvZyhcInByb3BzXCIsIHByb3BzKTtcbiAgICAgICAgZm9yKHZhciB2IGluIHByb3BzKSB7XG4gICAgICAgICAgdmFyIGx5ciA9IGxheWVyW3ZdID0gbGF5ZXJbdl0gfHwge1xuICAgICAgICAgICAgY29uc3RhbnQ6IGZhbHNlLFxuICAgICAgICAgICAgc3ltYm9saXplcjogbnVsbCxcbiAgICAgICAgICAgIGpzOiBbXSxcbiAgICAgICAgICAgIGluZGV4OiAwXG4gICAgICAgICAgfTtcbiAgICAgICAgICAvLyBidWlsZCBqYXZhc2NyaXB0IHN0YXRlbWVudHNcbiAgICAgICAgICBseXIuanMucHVzaChwcm9wc1t2XS5tYXAoZnVuY3Rpb24oYSkgeyByZXR1cm4gYS5qczsgfSkuam9pbignXFxuJykpO1xuICAgICAgICAgIC8vIGdldCBzeW1ib2xpemVyIGZvciBwcm9wXG4gICAgICAgICAgbHlyLnN5bWJvbGl6ZXIgPSBfLmZpcnN0KHByb3BzW3ZdLm1hcChmdW5jdGlvbihhKSB7IHJldHVybiBhLnN5bWJvbGl6ZXI7IH0pKTtcbiAgICAgICAgICAvLyBzZXJhY2ggdGhlIG1heCBpbmRleCB0byBrbm93IHJlbmRlcmluZyBvcmRlclxuICAgICAgICAgIGx5ci5pbmRleCA9IF8ubWF4KHByb3BzW3ZdLm1hcChmdW5jdGlvbihhKSB7IHJldHVybiBhLmluZGV4OyB9KS5jb25jYXQobHlyLmluZGV4KSk7XG4gICAgICAgICAgbHlyLmNvbnN0YW50ID0gIV8uYW55KHByb3BzW3ZdLm1hcChmdW5jdGlvbihhKSB7IHJldHVybiAhYS5jb25zdGFudDsgfSkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBvcmRlcmVkX2xheWVycyA9IFtdO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5kZWJ1ZykgY29uc29sZS5sb2cobGF5ZXJzKTtcblxuICAgICAgdmFyIGRvbmUgPSB7fTtcbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBkZWZzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBkZWYgPSBkZWZzW2ldO1xuICAgICAgICB2YXIgayA9IGRlZktleShkZWYpO1xuICAgICAgICB2YXIgbGF5ZXIgPSBsYXllcnNba107XG4gICAgICAgIGlmKCFkb25lW2tdKSB7XG4gICAgICAgICAgaWYodGhpcy5vcHRpb25zLmRlYnVnKSBjb25zb2xlLmxvZyhcIioqXCIsIGspO1xuICAgICAgICAgIGZvcih2YXIgcHJvcCBpbiBsYXllcikge1xuICAgICAgICAgICAgaWYgKHByb3AgIT09ICd6b29tJyAmJiBwcm9wICE9PSAnZnJhbWVzJyAmJiBwcm9wICE9PSAnc3ltYm9saXplcnMnKSB7XG4gICAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5kZWJ1ZykgY29uc29sZS5sb2coXCIqXCIsIHByb3ApO1xuICAgICAgICAgICAgICBsYXllcltwcm9wXS5zdHlsZSA9IHRoaXMuX2NyZWF0ZUZuKGxheWVyW3Byb3BdLmpzKTtcbiAgICAgICAgICAgICAgbGF5ZXIuc3ltYm9saXplcnMucHVzaChsYXllcltwcm9wXS5zeW1ib2xpemVyKTtcbiAgICAgICAgICAgICAgbGF5ZXIuc3ltYm9saXplcnMgPSBfLnVuaXEobGF5ZXIuc3ltYm9saXplcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBsYXllci5hdHRhY2htZW50ID0gaztcbiAgICAgICAgICBvcmRlcmVkX2xheWVycy5wdXNoKGxheWVyKTtcbiAgICAgICAgICBkb25lW2tdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBsYXllci56b29tIHw9IGRlZi56b29tO1xuICAgICAgICBsYXllci5mcmFtZXMucHVzaChkZWYuZnJhbWVfb2Zmc2V0KTtcbiAgICAgIH1cblxuICAgICAgLy8gdW5pcSB0aGUgZnJhbWVzXG4gICAgICBmb3IoaSA9IDA7IGkgPCBvcmRlcmVkX2xheWVycy5sZW5ndGg7ICsraSkge1xuICAgICAgICBvcmRlcmVkX2xheWVyc1tpXS5mcmFtZXMgPSBfLnVuaXEob3JkZXJlZF9sYXllcnNbaV0uZnJhbWVzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG9yZGVyZWRfbGF5ZXJzO1xuXG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuXG5cbmNhcnRvLlJlbmRlcmVySlMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uID0gdGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uIHx8ICdsYXRlc3QnO1xufTtcblxuLy8gUHJlcGFyZSBhIGphdmFzY3JpcHQgb2JqZWN0IHdoaWNoIGNvbnRhaW5zIHRoZSBsYXllcnNcbmNhcnRvLlJlbmRlcmVySlMucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcihjYXJ0b2NzcywgY2FsbGJhY2spIHtcbiAgICB2YXIgcmVmZXJlbmNlID0gcmVxdWlyZSgnLi90b3JxdWUtcmVmZXJlbmNlJyk7XG4gICAgdHJlZS5SZWZlcmVuY2Uuc2V0RGF0YShyZWZlcmVuY2UudmVyc2lvbi5sYXRlc3QpO1xuICAgIHJldHVybiBuZXcgQ2FydG9DU1MoY2FydG9jc3MsIHRoaXMub3B0aW9ucyk7XG59XG5cbmlmKHR5cGVvZihtb2R1bGUpICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IGNhcnRvLlJlbmRlcmVySlM7XG59XG5cblxufSkocmVxdWlyZSgnLi4vY2FydG8nKSk7XG4iLCJ2YXIgX21hcG5pa19yZWZlcmVuY2VfbGF0ZXN0ID0ge1xuICAgIFwidmVyc2lvblwiOiBcIjIuMS4xXCIsXG4gICAgXCJzdHlsZVwiOiB7XG4gICAgICAgIFwiZmlsdGVyLW1vZGVcIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICBcImFsbFwiLFxuICAgICAgICAgICAgICAgIFwiZmlyc3RcIlxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFwiZG9jXCI6IFwiQ29udHJvbCB0aGUgcHJvY2Vzc2luZyBiZWhhdmlvciBvZiBSdWxlIGZpbHRlcnMgd2l0aGluIGEgU3R5bGUuIElmICdhbGwnIGlzIHVzZWQgdGhlbiBhbGwgUnVsZXMgYXJlIHByb2Nlc3NlZCBzZXF1ZW50aWFsbHkgaW5kZXBlbmRlbnQgb2Ygd2hldGhlciBhbnkgcHJldmlvdXMgZmlsdGVycyBtYXRjaGVkLiBJZiAnZmlyc3QnIGlzIHVzZWQgdGhlbiBpdCBtZWFucyBwcm9jZXNzaW5nIGVuZHMgYWZ0ZXIgdGhlIGZpcnN0IG1hdGNoIChhIHBvc2l0aXZlIGZpbHRlciBldmFsdWF0aW9uKSBhbmQgbm8gZnVydGhlciBSdWxlcyBpbiB0aGUgU3R5bGUgYXJlIHByb2Nlc3NlZCAoJ2ZpcnN0JyBpcyB1c3VhbGx5IHRoZSBkZWZhdWx0IGZvciBDU1MgaW1wbGVtZW50YXRpb25zIG9uIHRvcCBvZiBNYXBuaWsgdG8gc2ltcGxpZnkgdHJhbnNsYXRpb24gZnJvbSBDU1MgdG8gTWFwbmlrIFhNTClcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImFsbFwiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJBbGwgUnVsZXMgaW4gYSBTdHlsZSBhcmUgcHJvY2Vzc2VkIHdoZXRoZXIgdGhleSBoYXZlIGZpbHRlcnMgb3Igbm90IGFuZCB3aGV0aGVyIG9yIG5vdCB0aGUgZmlsdGVyIGNvbmRpdGlvbnMgZXZhbHVhdGUgdG8gdHJ1ZS5cIlxuICAgICAgICB9LFxuICAgICAgICBcImltYWdlLWZpbHRlcnNcIjoge1xuICAgICAgICAgICAgXCJjc3NcIjogXCJpbWFnZS1maWx0ZXJzXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIGZpbHRlcnNcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcImZ1bmN0aW9uc1wiLFxuICAgICAgICAgICAgXCJmdW5jdGlvbnNcIjogW1xuICAgICAgICAgICAgICAgIFtcImFnZy1zdGFjay1ibHVyXCIsIDJdLFxuICAgICAgICAgICAgICAgIFtcImVtYm9zc1wiLCAwXSxcbiAgICAgICAgICAgICAgICBbXCJibHVyXCIsIDBdLFxuICAgICAgICAgICAgICAgIFtcImdyYXlcIiwgMF0sXG4gICAgICAgICAgICAgICAgW1wic29iZWxcIiwgMF0sXG4gICAgICAgICAgICAgICAgW1wiZWRnZS1kZXRlY3RcIiwgMF0sXG4gICAgICAgICAgICAgICAgW1wieC1ncmFkaWVudFwiLCAwXSxcbiAgICAgICAgICAgICAgICBbXCJ5LWdyYWRpZW50XCIsIDBdLFxuICAgICAgICAgICAgICAgIFtcImludmVydFwiLCAwXSxcbiAgICAgICAgICAgICAgICBbXCJzaGFycGVuXCIsIDBdLFxuICAgICAgICAgICAgICAgIFtcImNvbG9yaXplLWFscGhhXCIsIC0xXSxcbiAgICAgICAgICAgICAgICBbXCJjb2xvci10by1hbHBoYVwiLCAxXSxcbiAgICAgICAgICAgICAgICBbXCJzY2FsZS1oc2xhXCIsIDhdXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJBIGxpc3Qgb2YgaW1hZ2UgZmlsdGVycy5cIlxuICAgICAgICB9LFxuICAgICAgICBcImNvbXAtb3BcIjoge1xuICAgICAgICAgICAgXCJjc3NcIjogXCJjb21wLW9wXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJhZGQgdGhlIGN1cnJlbnQgbGF5ZXIgb24gdG9wIG9mIG90aGVyIGxheWVyc1wiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgbGF5ZXIgc2hvdWxkIGJlaGF2ZSByZWxhdGl2ZSB0byBsYXllcnMgYXRvcCBvciBiZWxvdyBpdC5cIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBbXCJjbGVhclwiLFxuICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgXCJkc3RcIixcbiAgICAgICAgICAgICAgICBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgXCJzb3VyY2Utb3ZlclwiLCAvLyBhZGRlZCBmb3IgdG9ycXVlXG4gICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgIFwic3JjLWluXCIsXG4gICAgICAgICAgICAgICAgXCJkc3QtaW5cIixcbiAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICBcImRzdC1vdXRcIixcbiAgICAgICAgICAgICAgICBcInNyYy1hdG9wXCIsXG4gICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgIFwieG9yXCIsXG4gICAgICAgICAgICAgICAgXCJwbHVzXCIsXG4gICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIixcbiAgICAgICAgICAgICAgICBcInNjcmVlblwiLFxuICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgIFwiZGFya2VuXCIsXG4gICAgICAgICAgICAgICAgXCJsaWdodGVuXCIsXG4gICAgICAgICAgICAgICAgXCJsaWdodGVyXCIsIC8vIGFkZGVkIGZvciB0b3JxdWVcbiAgICAgICAgICAgICAgICBcImNvbG9yLWRvZGdlXCIsXG4gICAgICAgICAgICAgICAgXCJjb2xvci1idXJuXCIsXG4gICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgXCJzb2Z0LWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgXCJkaWZmZXJlbmNlXCIsXG4gICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICBcImNvbnRyYXN0XCIsXG4gICAgICAgICAgICAgICAgXCJpbnZlcnRcIixcbiAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICBcImdyYWluLW1lcmdlXCIsXG4gICAgICAgICAgICAgICAgXCJncmFpbi1leHRyYWN0XCIsXG4gICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICBcInNhdHVyYXRpb25cIixcbiAgICAgICAgICAgICAgICBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIFwib3BhY2l0eVwiOiB7XG4gICAgICAgICAgICBcImNzc1wiOiBcIm9wYWNpdHlcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcIkFuIGFscGhhIHZhbHVlIGZvciB0aGUgc3R5bGUgKHdoaWNoIG1lYW5zIGFuIGFscGhhIGFwcGxpZWQgdG8gYWxsIGZlYXR1cmVzIGluIHNlcGFyYXRlIGJ1ZmZlciBhbmQgdGhlbiBjb21wb3NpdGVkIGJhY2sgdG8gbWFpbiBidWZmZXIpXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwibm8gc2VwYXJhdGUgYnVmZmVyIHdpbGwgYmUgdXNlZCBhbmQgbm8gYWxwaGEgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBzdHlsZSBhZnRlciByZW5kZXJpbmdcIlxuICAgICAgICB9XG4gICAgfSxcbiAgICBcImxheWVyXCIgOiB7XG4gICAgICAgIFwibmFtZVwiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJcIixcbiAgICAgICAgICAgIFwidHlwZVwiOlwic3RyaW5nXCIsXG4gICAgICAgICAgICBcInJlcXVpcmVkXCIgOiB0cnVlLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyBsYXllciBuYW1lIGhhcyBiZWVuIHByb3ZpZGVkXCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBuYW1lIG9mIGEgbGF5ZXIuIENhbiBiZSBhbnl0aGluZyB5b3Ugd2lzaCBhbmQgaXMgbm90IHN0cmljdGx5IHZhbGlkYXRlZCwgYnV0IGlkZWFsbHkgdW5pcXVlICBpbiB0aGUgbWFwXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzcnNcIjoge1xuICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiXCIsXG4gICAgICAgICAgICBcInR5cGVcIjpcInN0cmluZ1wiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyBzcnMgdmFsdWUgaXMgcHJvdmlkZWQgYW5kIHRoZSB2YWx1ZSB3aWxsIGJlIGluaGVyaXRlZCBmcm9tIHRoZSBNYXAncyBzcnNcIixcbiAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIHNwYXRpYWwgcmVmZXJlbmNlIHN5c3RlbSBkZWZpbml0aW9uIGZvciB0aGUgbGF5ZXIsIGFrYSB0aGUgcHJvamVjdGlvbi4gQ2FuIGVpdGhlciBiZSBhIHByb2o0IGxpdGVyYWwgc3RyaW5nIGxpa2UgJytwcm9qPWxvbmdsYXQgK2VsbHBzPVdHUzg0ICtkYXR1bT1XR1M4NCArbm9fZGVmcycgb3IsIGlmIHRoZSBwcm9wZXIgcHJvajQgZXBzZy9uYWQvZXRjIGlkZW50aWZpZXIgZmlsZXMgYXJlIGluc3RhbGxlZCwgYSBzdHJpbmcgdGhhdCB1c2VzIGFuIGlkIGxpa2U6ICcraW5pdD1lcHNnOjQzMjYnXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzdGF0dXNcIjoge1xuICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IHRydWUsXG4gICAgICAgICAgICBcInR5cGVcIjpcImJvb2xlYW5cIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiVGhpcyBsYXllciB3aWxsIGJlIG1hcmtlZCBhcyBhY3RpdmUgYW5kIGF2YWlsYWJsZSBmb3IgcHJvY2Vzc2luZ1wiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJBIHByb3BlcnR5IHRoYXQgY2FuIGJlIHNldCB0byBmYWxzZSB0byBkaXNhYmxlIHRoaXMgbGF5ZXIgZnJvbSBiZWluZyBwcm9jZXNzZWRcIlxuICAgICAgICB9LFxuICAgICAgICBcIm1pbnpvb21cIjoge1xuICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiMFwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6XCJmbG9hdFwiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJUaGUgbGF5ZXIgd2lsbCBiZSB2aXNpYmxlIGF0IHRoZSBtaW5pbXVtIHBvc3NpYmxlIHNjYWxlXCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBtaW5pbXVtIHNjYWxlIGRlbm9taW5hdG9yIHRoYXQgdGhpcyBsYXllciB3aWxsIGJlIHZpc2libGUgYXQuIEEgbGF5ZXIncyB2aXNpYmlsaXR5IGlzIGRldGVybWluZWQgYnkgd2hldGhlciBpdHMgc3RhdHVzIGlzIHRydWUgYW5kIGlmIHRoZSBNYXAgc2NhbGUgPj0gbWluem9vbSAtIDFlLTYgYW5kIHNjYWxlIDwgbWF4em9vbSArIDFlLTZcIlxuICAgICAgICB9LFxuICAgICAgICBcIm1heHpvb21cIjoge1xuICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiMS43OTc2OWUrMzA4XCIsXG4gICAgICAgICAgICBcInR5cGVcIjpcImZsb2F0XCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlRoZSBsYXllciB3aWxsIGJlIHZpc2libGUgYXQgdGhlIG1heGltdW0gcG9zc2libGUgc2NhbGVcIixcbiAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG1heGltdW0gc2NhbGUgZGVub21pbmF0b3IgdGhhdCB0aGlzIGxheWVyIHdpbGwgYmUgdmlzaWJsZSBhdC4gVGhlIGRlZmF1bHQgaXMgdGhlIG51bWVyaWMgbGltaXQgb2YgdGhlIEMrKyBkb3VibGUgdHlwZSwgd2hpY2ggbWF5IHZhcnkgc2xpZ2h0bHkgYnkgc3lzdGVtLCBidXQgaXMgbGlrZWx5IGEgbWFzc2l2ZSBudW1iZXIgbGlrZSAxLjc5NzY5ZSszMDggYW5kIGVuc3VyZXMgdGhhdCB0aGlzIGxheWVyIHdpbGwgYWx3YXlzIGJlIHZpc2libGUgdW5sZXNzIHRoZSB2YWx1ZSBpcyByZWR1Y2VkLiBBIGxheWVyJ3MgdmlzaWJpbGl0eSBpcyBkZXRlcm1pbmVkIGJ5IHdoZXRoZXIgaXRzIHN0YXR1cyBpcyB0cnVlIGFuZCBpZiB0aGUgTWFwIHNjYWxlID49IG1pbnpvb20gLSAxZS02IGFuZCBzY2FsZSA8IG1heHpvb20gKyAxZS02XCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJxdWVyeWFibGVcIjoge1xuICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlLFxuICAgICAgICAgICAgXCJ0eXBlXCI6XCJib29sZWFuXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlRoZSBsYXllciB3aWxsIG5vdCBiZSBhdmFpbGFibGUgZm9yIHRoZSBkaXJlY3QgcXVlcnlpbmcgb2YgZGF0YSB2YWx1ZXNcIixcbiAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhpcyBwcm9wZXJ0eSB3YXMgYWRkZWQgZm9yIEdldEZlYXR1cmVJbmZvL1dNUyBjb21wYXRpYmlsaXR5IGFuZCBpcyByYXJlbHkgdXNlZC4gSXQgaXMgb2ZmIGJ5IGRlZmF1bHQgbWVhbmluZyB0aGF0IGluIGEgV01TIGNvbnRleHQgdGhlIGxheWVyIHdpbGwgbm90IGJlIGFibGUgdG8gYmUgcXVlcmllZCB1bmxlc3MgdGhlIHByb3BlcnR5IGlzIGV4cGxpY2l0bHkgc2V0IHRvIHRydWVcIlxuICAgICAgICB9LFxuICAgICAgICBcImNsZWFyLWxhYmVsLWNhY2hlXCI6IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgIFwidHlwZVwiOlwiYm9vbGVhblwiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJUaGUgcmVuZGVyZXIncyBjb2xsaXNpb24gZGV0ZWN0b3IgY2FjaGUgKHVzZWQgZm9yIGF2b2lkaW5nIGR1cGxpY2F0ZSBsYWJlbHMgYW5kIG92ZXJsYXBwaW5nIG1hcmtlcnMpIHdpbGwgbm90IGJlIGNsZWFyZWQgaW1tZWRpYXRlbHkgYmVmb3JlIHByb2Nlc3NpbmcgdGhpcyBsYXllclwiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJUaGlzIHByb3BlcnR5LCBieSBkZWZhdWx0IG9mZiwgY2FuIGJlIGVuYWJsZWQgdG8gYWxsb3cgYSB1c2VyIHRvIGNsZWFyIHRoZSBjb2xsaXNpb24gZGV0ZWN0b3IgY2FjaGUgYmVmb3JlIGEgZ2l2ZW4gbGF5ZXIgaXMgcHJvY2Vzc2VkLiBUaGlzIG1heSBiZSBkZXNpcmFibGUgdG8gZW5zdXJlIHRoYXQgYSBnaXZlbiBsYXllcnMgZGF0YSBzaG93cyB1cCBvbiB0aGUgbWFwIGV2ZW4gaWYgaXQgbm9ybWFsbHkgd291bGQgbm90IGJlY2F1c2Ugb2YgY29sbGlzaW9ucyB3aXRoIHByZXZpb3VzbHkgcmVuZGVyZWQgbGFiZWxzIG9yIG1hcmtlcnNcIlxuICAgICAgICB9LFxuICAgICAgICBcImdyb3VwLWJ5XCI6IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIlwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6XCJzdHJpbmdcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiTm8gc3BlY2lhbCBsYXllciBncm91cGluZyB3aWxsIGJlIHVzZWQgZHVyaW5nIHJlbmRlcmluZ1wiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJodHRwczovL2dpdGh1Yi5jb20vbWFwbmlrL21hcG5pay93aWtpL0dyb3VwZWQtcmVuZGVyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJidWZmZXItc2l6ZVwiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIwXCIsXG4gICAgICAgICAgICBcInR5cGVcIjpcImZsb2F0XCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIk5vIGJ1ZmZlciB3aWxsIGJlIHVzZWRcIixcbiAgICAgICAgICAgIFwiZG9jXCI6IFwiRXh0cmEgdG9sZXJhbmNlIGFyb3VuZCB0aGUgTGF5ZXIgZXh0ZW50IChpbiBwaXhlbHMpIHVzZWQgdG8gd2hlbiBxdWVyeWluZyBhbmQgKHBvdGVudGlhbGx5KSBjbGlwcGluZyB0aGUgbGF5ZXIgZGF0YSBkdXJpbmcgcmVuZGVyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJtYXhpbXVtLWV4dGVudFwiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICBcInR5cGVcIjpcImJib3hcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiTm8gY2xpcHBpbmcgZXh0ZW50IHdpbGwgYmUgdXNlZFwiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJBbiBleHRlbnQgdG8gYmUgdXNlZCB0byBsaW1pdCB0aGUgYm91bmRzIHVzZWQgdG8gcXVlcnkgdGhpcyBzcGVjaWZpYyBsYXllciBkYXRhIGR1cmluZyByZW5kZXJpbmcuIFNob3VsZCBiZSBtaW54LCBtaW55LCBtYXh4LCBtYXh5IGluIHRoZSBjb29yZGluYXRlcyBvZiB0aGUgTGF5ZXIuXCJcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXCJzeW1ib2xpemVyc1wiIDoge1xuICAgICAgICBcIipcIjoge1xuICAgICAgICAgICAgXCJpbWFnZS1maWx0ZXJzXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImltYWdlLWZpbHRlcnNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJubyBmaWx0ZXJzXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZnVuY3Rpb25zXCIsXG4gICAgICAgICAgICAgICAgXCJmdW5jdGlvbnNcIjogW1xuICAgICAgICAgICAgICAgICAgICBbXCJhZ2ctc3RhY2stYmx1clwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wiZW1ib3NzXCIsIDBdLFxuICAgICAgICAgICAgICAgICAgICBbXCJibHVyXCIsIDBdLFxuICAgICAgICAgICAgICAgICAgICBbXCJncmF5XCIsIDBdLFxuICAgICAgICAgICAgICAgICAgICBbXCJzb2JlbFwiLCAwXSxcbiAgICAgICAgICAgICAgICAgICAgW1wiZWRnZS1kZXRlY3RcIiwgMF0sXG4gICAgICAgICAgICAgICAgICAgIFtcIngtZ3JhZGllbnRcIiwgMF0sXG4gICAgICAgICAgICAgICAgICAgIFtcInktZ3JhZGllbnRcIiwgMF0sXG4gICAgICAgICAgICAgICAgICAgIFtcImludmVydFwiLCAwXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2hhcnBlblwiLCAwXSxcbiAgICAgICAgICAgICAgICAgICAgW1wiY29sb3JpemUtYWxwaGFcIiwgLTFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJjb2xvci10by1hbHBoYVwiLCAxXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2NhbGUtaHNsYVwiLCA4XSxcbiAgICAgICAgICAgICAgICAgICAgW1wiYnVja2V0c1wiLCAtMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcImNhdGVnb3J5XCIsIC0xXSxcbiAgICAgICAgICAgICAgICAgICAgW1wiZXF1YWxcIiwgLTFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJoZWFkdGFpbHNcIiwgLTFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJqZW5rc1wiLCAtMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcInF1YW50aWxlc1wiLCAtMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcImNhcnRvY29sb3JcIiwgLTFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJjb2xvcmJyZXdlclwiLCAtMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcInJhbmdlXCIsIC0xXSxcbiAgICAgICAgICAgICAgICAgICAgW1wicmFtcFwiLCAtMV1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQSBsaXN0IG9mIGltYWdlIGZpbHRlcnMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNvbXAtb3BcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiY29tcC1vcFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJhZGQgdGhlIGN1cnJlbnQgbGF5ZXIgb24gdG9wIG9mIG90aGVyIGxheWVyc1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQ29tcG9zaXRlIG9wZXJhdGlvbi4gVGhpcyBkZWZpbmVzIGhvdyB0aGlzIGxheWVyIHNob3VsZCBiZWhhdmUgcmVsYXRpdmUgdG8gbGF5ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzb3VyY2Utb3ZlclwiLCAvLyBhZGRlZCBmb3IgdG9ycXVlXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtaW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtaW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ4b3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwbHVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibWludXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtdWx0aXBseVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNjcmVlblwiLFxuICAgICAgICAgICAgICAgICAgICBcIm92ZXJsYXlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkYXJrZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaWdodGVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGlnaHRlclwiLCAvLyBhZGRlZCBmb3IgdG9ycXVlXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItZG9kZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1idXJuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaGFyZC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNvZnQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkaWZmZXJlbmNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZXhjbHVzaW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29udHJhc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnQtcmdiXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tbWVyZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1leHRyYWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaHVlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2F0dXJhdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIlxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwib3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbiBhbHBoYSB2YWx1ZSBmb3IgdGhlIHN0eWxlICh3aGljaCBtZWFucyBhbiBhbHBoYSBhcHBsaWVkIHRvIGFsbCBmZWF0dXJlcyBpbiBzZXBhcmF0ZSBidWZmZXIgYW5kIHRoZW4gY29tcG9zaXRlZCBiYWNrIHRvIG1haW4gYnVmZmVyKVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwibm8gc2VwYXJhdGUgYnVmZmVyIHdpbGwgYmUgdXNlZCBhbmQgbm8gYWxwaGEgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBzdHlsZSBhZnRlciByZW5kZXJpbmdcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcIm1hcFwiOiB7XG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiYmFja2dyb3VuZC1jb2xvclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIk1hcCBCYWNrZ3JvdW5kIGNvbG9yXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImJhY2tncm91bmQtaW1hZ2VcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiYmFja2dyb3VuZC1pbWFnZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVyaVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkFuIGltYWdlIHRoYXQgaXMgcmVwZWF0ZWQgYmVsb3cgYWxsIGZlYXR1cmVzIG9uIGEgbWFwIGFzIGEgYmFja2dyb3VuZC5cIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiTWFwIEJhY2tncm91bmQgaW1hZ2VcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3JzXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNyc1wiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIitwcm9qPWxvbmdsYXQgK2VsbHBzPVdHUzg0ICtkYXR1bT1XR1M4NCArbm9fZGVmc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiVGhlIHByb2o0IGxpdGVyYWwgb2YgRVBTRzo0MzI2IGlzIGFzc3VtZWQgdG8gYmUgdGhlIE1hcCdzIHNwYXRpYWwgcmVmZXJlbmNlIGFuZCBhbGwgZGF0YSBmcm9tIGxheWVycyB3aXRoaW4gdGhpcyBtYXAgd2lsbCBiZSBwbG90dGVkIHVzaW5nIHRoaXMgY29vcmRpbmF0ZSBzeXN0ZW0uIElmIGFueSBsYXllcnMgZG8gbm90IGRlY2xhcmUgYW4gc3JzIHZhbHVlIHRoZW4gdGhleSB3aWxsIGJlIGFzc3VtZWQgdG8gYmUgaW4gdGhlIHNhbWUgc3JzIGFzIHRoZSBNYXAgYW5kIG5vdCB0cmFuc2Zvcm1hdGlvbnMgd2lsbCBiZSBuZWVkZWQgdG8gcGxvdCB0aGVtIGluIHRoZSBNYXAncyBjb29yZGluYXRlIHNwYWNlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJNYXAgc3BhdGlhbCByZWZlcmVuY2UgKHByb2o0IHN0cmluZylcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiYnVmZmVyLXNpemVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiYnVmZmVyLXNpemVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6XCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiTm8gYnVmZmVyIHdpbGwgYmUgdXNlZFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRXh0cmEgdG9sZXJhbmNlIGFyb3VuZCB0aGUgbWFwIChpbiBwaXhlbHMpIHVzZWQgdG8gZW5zdXJlIGxhYmVscyBjcm9zc2luZyB0aWxlIGJvdW5kYXJpZXMgYXJlIGVxdWFsbHkgcmVuZGVyZWQgaW4gZWFjaCB0aWxlIChlLmcuIGN1dCBpbiBlYWNoIHRpbGUpLiBOb3QgaW50ZW5kZWQgdG8gYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIFxcXCJhdm9pZC1lZGdlc1xcXCIuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm1heGltdW0tZXh0ZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjpcImJib3hcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIk5vIGNsaXBwaW5nIGV4dGVudCB3aWxsIGJlIHVzZWRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkFuIGV4dGVudCB0byBiZSB1c2VkIHRvIGxpbWl0IHRoZSBib3VuZHMgdXNlZCB0byBxdWVyeSBhbGwgbGF5ZXJzIGR1cmluZyByZW5kZXJpbmcuIFNob3VsZCBiZSBtaW54LCBtaW55LCBtYXh4LCBtYXh5IGluIHRoZSBjb29yZGluYXRlcyBvZiB0aGUgTWFwLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJiYXNlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImJhc2VcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlRoaXMgYmFzZSBwYXRoIGRlZmF1bHRzIHRvIGFuIGVtcHR5IHN0cmluZyBtZWFuaW5nIHRoYXQgYW55IHJlbGF0aXZlIHBhdGhzIHRvIGZpbGVzIHJlZmVyZW5jZWQgaW4gc3R5bGVzIG9yIGxheWVycyB3aWxsIGJlIGludGVycHJldGVkIHJlbGF0aXZlIHRvIHRoZSBhcHBsaWNhdGlvbiBwcm9jZXNzLlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQW55IHJlbGF0aXZlIHBhdGhzIHVzZWQgdG8gcmVmZXJlbmNlIGZpbGVzIHdpbGwgYmUgdW5kZXJzdG9vZCBhcyByZWxhdGl2ZSB0byB0aGlzIGRpcmVjdG9yeSBwYXRoIGlmIHRoZSBtYXAgaXMgbG9hZGVkIGZyb20gYW4gaW4gbWVtb3J5IG9iamVjdCByYXRoZXIgdGhhbiBmcm9tIHRoZSBmaWxlc3lzdGVtLiBJZiB0aGUgbWFwIGlzIGxvYWRlZCBmcm9tIHRoZSBmaWxlc3lzdGVtIGFuZCB0aGlzIG9wdGlvbiBpcyBub3QgcHJvdmlkZWQgaXQgd2lsbCBiZSBzZXQgdG8gdGhlIGRpcmVjdG9yeSBvZiB0aGUgc3R5bGVzaGVldC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicGF0aHMtZnJvbS14bWxcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJQYXRocyByZWFkIGZyb20gWE1MIHdpbGwgYmUgaW50ZXJwcmV0ZWQgZnJvbSB0aGUgbG9jYXRpb24gb2YgdGhlIFhNTFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcInZhbHVlIHRvIGNvbnRyb2wgd2hldGhlciBwYXRocyBpbiB0aGUgWE1MIHdpbGwgYmUgaW50ZXJwcmV0ZWQgZnJvbSB0aGUgbG9jYXRpb24gb2YgdGhlIFhNTCBvciBmcm9tIHRoZSB3b3JraW5nIGRpcmVjdG9yeSBvZiB0aGUgcHJvZ3JhbSB0aGF0IGNhbGxzIGxvYWRfbWFwKClcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibWluaW11bS12ZXJzaW9uXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIk1hcG5payB2ZXJzaW9uIHdpbGwgbm90IGJlIGRldGVjdGVkIGFuZCBubyBlcnJvciB3aWxsIGJlIHRocm93biBhYm91dCBjb21wYXRpYmlsaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgbWludW11bSBNYXBuaWsgdmVyc2lvbiAoZS5nLiAwLjcuMikgbmVlZGVkIHRvIHVzZSBjZXJ0YWluIGZ1bmN0aW9uYWxpdHkgaW4gdGhlIHN0eWxlc2hlZXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZm9udC1kaXJlY3RvcnlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiZm9udC1kaXJlY3RvcnlcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1cmlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyBtYXAtc3BlY2lmaWMgZm9udHMgd2lsbCBiZSByZWdpc3RlcmVkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJQYXRoIHRvIGEgZGlyZWN0b3J5IHdoaWNoIGhvbGRzIGZvbnRzIHdoaWNoIHNob3VsZCBiZSByZWdpc3RlcmVkIHdoZW4gdGhlIE1hcCBpcyBsb2FkZWQgKGluIGFkZGl0aW9uIHRvIGFueSBmb250cyB0aGF0IG1heSBiZSBhdXRvbWF0aWNhbGx5IHJlZ2lzdGVyZWQpLlwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwicG9seWdvblwiOiB7XG4gICAgICAgICAgICBcImZpbGxcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1maWxsXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJyZ2JhKDEyOCwxMjgsMTI4LDEpXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJncmF5IGFuZCBmdWxseSBvcGFxdWUgKGFscGhhID0gMSksIHNhbWUgYXMgcmdiKDEyOCwxMjgsMTI4KVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRmlsbCBjb2xvciB0byBhc3NpZ24gdG8gYSBwb2x5Z29uXCIsXG4gICAgICAgICAgICAgICAgXCJleHByZXNzaW9uXCI6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZpbGwtb3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2x5Z29uLW9wYWNpdHlcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG9wYWNpdHkgb2YgdGhlIHBvbHlnb25cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm9wYXF1ZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnYW1tYVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2x5Z29uLWdhbW1hXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImZ1bGx5IGFudGlhbGlhc2VkXCIsXG4gICAgICAgICAgICAgICAgXCJyYW5nZVwiOiBcIjAtMVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiTGV2ZWwgb2YgYW50aWFsaWFzaW5nIG9mIHBvbHlnb24gZWRnZXNcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZ2FtbWEtbWV0aG9kXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tZ2FtbWEtbWV0aG9kXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJwb3dlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpbmVhclwiLFxuICAgICAgICAgICAgICAgICAgICBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ0aHJlc2hvbGRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtdWx0aXBseVwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJwb3dlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwicG93KHgsZ2FtbWEpIGlzIHVzZWQgdG8gY2FsY3VsYXRlIHBpeGVsIGdhbW1hLCB3aGljaCBwcm9kdWNlcyBzbGlnaHRseSBzbW9vdGhlciBsaW5lIGFuZCBwb2x5Z29uIGFudGlhbGlhc2luZyB0aGFuIHRoZSAnbGluZWFyJyBtZXRob2QsIHdoaWxlIG90aGVyIG1ldGhvZHMgYXJlIHVzdWFsbHkgb25seSB1c2VkIHRvIGRpc2FibGUgQUFcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkFuIEFudGlncmFpbiBHZW9tZXRyeSBzcGVjaWZpYyByZW5kZXJpbmcgaGludCB0byBjb250cm9sIHRoZSBxdWFsaXR5IG9mIGFudGlhbGlhc2luZy4gVW5kZXIgdGhlIGhvb2QgaW4gTWFwbmlrIHRoaXMgbWV0aG9kIGlzIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCB0aGUgJ2dhbW1hJyB2YWx1ZSAod2hpY2ggZGVmYXVsdHMgdG8gMSkuIFRoZSBtZXRob2RzIGFyZSBpbiB0aGUgQUdHIHNvdXJjZSBhdCBodHRwczovL2dpdGh1Yi5jb20vbWFwbmlrL21hcG5pay9ibG9iL21hc3Rlci9kZXBzL2FnZy9pbmNsdWRlL2FnZ19nYW1tYV9mdW5jdGlvbnMuaFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjbGlwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tY2xpcFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImdlb21ldHJ5IHdpbGwgYmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJlZm9yZSByZW5kZXJpbmdcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcImdlb21ldHJpZXMgYXJlIGNsaXBwZWQgdG8gbWFwIGJvdW5kcyBieSBkZWZhdWx0IGZvciBiZXN0IHJlbmRlcmluZyBwZXJmb3JtYW5jZS4gSW4gc29tZSBjYXNlcyB1c2VycyBtYXkgd2lzaCB0byBkaXNhYmxlIHRoaXMgdG8gYXZvaWQgcmVuZGVyaW5nIGFydGlmYWN0cy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic21vb3RoXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tc21vb3RoXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIHNtb290aGluZ1wiLFxuICAgICAgICAgICAgICAgIFwicmFuZ2VcIjogXCIwLTFcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNtb290aHMgb3V0IGdlb21ldHJ5IGFuZ2xlcy4gMCBpcyBubyBzbW9vdGhpbmcsIDEgaXMgZnVsbHkgc21vb3RoZWQuIFZhbHVlcyBncmVhdGVyIHRoYW4gMSB3aWxsIHByb2R1Y2Ugd2lsZCwgbG9vcGluZyBnZW9tZXRyaWVzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnZW9tZXRyeS10cmFuc2Zvcm1cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1nZW9tZXRyeS10cmFuc2Zvcm1cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmdW5jdGlvbnNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJnZW9tZXRyeSB3aWxsIG5vdCBiZSB0cmFuc2Zvcm1lZFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQWxsb3dzIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9ucyB0byBiZSBhcHBsaWVkIHRvIHRoZSBnZW9tZXRyeS5cIixcbiAgICAgICAgICAgICAgICBcImZ1bmN0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIFtcIm1hdHJpeFwiLCA2XSxcbiAgICAgICAgICAgICAgICAgICAgW1widHJhbnNsYXRlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJzY2FsZVwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wicm90YXRlXCIsIDNdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WFwiLCAxXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2tld1lcIiwgMV1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tY29tcC1vcFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJhZGQgdGhlIGN1cnJlbnQgc3ltYm9saXplciBvbiB0b3Agb2Ygb3RoZXIgc3ltYm9saXplclwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQ29tcG9zaXRlIG9wZXJhdGlvbi4gVGhpcyBkZWZpbmVzIGhvdyB0aGlzIHN5bWJvbGl6ZXIgc2hvdWxkIGJlaGF2ZSByZWxhdGl2ZSB0byBzeW1ib2xpemVycyBhdG9wIG9yIGJlbG93IGl0LlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXCJjbGVhclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyY1wiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtaW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtaW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ4b3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwbHVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibWludXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtdWx0aXBseVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNjcmVlblwiLFxuICAgICAgICAgICAgICAgICAgICBcIm92ZXJsYXlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkYXJrZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaWdodGVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItZG9kZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1idXJuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaGFyZC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNvZnQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkaWZmZXJlbmNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZXhjbHVzaW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29udHJhc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnQtcmdiXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tbWVyZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1leHRyYWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaHVlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2F0dXJhdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIlxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJsaW5lXCI6IHtcbiAgICAgICAgICAgIFwic3Ryb2tlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtY29sb3JcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJyZ2JhKDAsMCwwLDEpXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImJsYWNrIGFuZCBmdWxseSBvcGFxdWUgKGFscGhhID0gMSksIHNhbWUgYXMgcmdiKDAsMCwwKVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIGNvbG9yIG9mIGEgZHJhd24gbGluZVwiLFxuICAgICAgICAgICAgICAgIFwiZXhwcmVzc2lvblwiOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzdHJva2Utd2lkdGhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS13aWR0aFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgd2lkdGggb2YgYSBsaW5lIGluIHBpeGVsc1wiLFxuICAgICAgICAgICAgICAgIFwiZXhwcmVzc2lvblwiOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzdHJva2Utb3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLW9wYWNpdHlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwib3BhcXVlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgb3BhY2l0eSBvZiBhIGxpbmVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3Ryb2tlLWxpbmVqb2luXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtam9pblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm1pdGVyXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJtaXRlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInJvdW5kXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYmV2ZWxcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgYmVoYXZpb3Igb2YgbGluZXMgd2hlbiBqb2luaW5nXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInN0cm9rZS1saW5lY2FwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtY2FwXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYnV0dFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiYnV0dFwiLFxuICAgICAgICAgICAgICAgICAgICBcInJvdW5kXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3F1YXJlXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIGRpc3BsYXkgb2YgbGluZSBlbmRpbmdzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInN0cm9rZS1nYW1tYVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLWdhbW1hXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImZ1bGx5IGFudGlhbGlhc2VkXCIsXG4gICAgICAgICAgICAgICAgXCJyYW5nZVwiOiBcIjAtMVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiTGV2ZWwgb2YgYW50aWFsaWFzaW5nIG9mIHN0cm9rZSBsaW5lXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInN0cm9rZS1nYW1tYS1tZXRob2RcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1nYW1tYS1tZXRob2RcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcInBvd2VyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInRocmVzaG9sZFwiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInBvd2VyXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJwb3coeCxnYW1tYSkgaXMgdXNlZCB0byBjYWxjdWxhdGUgcGl4ZWwgZ2FtbWEsIHdoaWNoIHByb2R1Y2VzIHNsaWdodGx5IHNtb290aGVyIGxpbmUgYW5kIHBvbHlnb24gYW50aWFsaWFzaW5nIHRoYW4gdGhlICdsaW5lYXInIG1ldGhvZCwgd2hpbGUgb3RoZXIgbWV0aG9kcyBhcmUgdXN1YWxseSBvbmx5IHVzZWQgdG8gZGlzYWJsZSBBQVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQW4gQW50aWdyYWluIEdlb21ldHJ5IHNwZWNpZmljIHJlbmRlcmluZyBoaW50IHRvIGNvbnRyb2wgdGhlIHF1YWxpdHkgb2YgYW50aWFsaWFzaW5nLiBVbmRlciB0aGUgaG9vZCBpbiBNYXBuaWsgdGhpcyBtZXRob2QgaXMgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIHRoZSAnZ2FtbWEnIHZhbHVlICh3aGljaCBkZWZhdWx0cyB0byAxKS4gVGhlIG1ldGhvZHMgYXJlIGluIHRoZSBBR0cgc291cmNlIGF0IGh0dHBzOi8vZ2l0aHViLmNvbS9tYXBuaWsvbWFwbmlrL2Jsb2IvbWFzdGVyL2RlcHMvYWdnL2luY2x1ZGUvYWdnX2dhbW1hX2Z1bmN0aW9ucy5oXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInN0cm9rZS1kYXNoYXJyYXlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1kYXNoYXJyYXlcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJzXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBIHBhaXIgb2YgbGVuZ3RoIHZhbHVlcyBbYSxiXSwgd2hlcmUgKGEpIGlzIHRoZSBkYXNoIGxlbmd0aCBhbmQgKGIpIGlzIHRoZSBnYXAgbGVuZ3RoIHJlc3BlY3RpdmVseS4gTW9yZSB0aGFuIHR3byB2YWx1ZXMgYXJlIHN1cHBvcnRlZCBmb3IgbW9yZSBjb21wbGV4IHBhdHRlcm5zLlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcInNvbGlkIGxpbmVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3Ryb2tlLWRhc2hvZmZzZXRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1kYXNoLW9mZnNldFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlcnNcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcInZhbGlkIHBhcmFtZXRlciBidXQgbm90IGN1cnJlbnRseSB1c2VkIGluIHJlbmRlcmVycyAob25seSBleGlzdHMgZm9yIGV4cGVyaW1lbnRhbCBzdmcgc3VwcG9ydCBpbiBNYXBuaWsgd2hpY2ggaXMgbm90IHlldCBlbmFibGVkKVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcInNvbGlkIGxpbmVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3Ryb2tlLW1pdGVybGltaXRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1taXRlcmxpbWl0XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBsaW1pdCBvbiB0aGUgcmF0aW8gb2YgdGhlIG1pdGVyIGxlbmd0aCB0byB0aGUgc3Ryb2tlLXdpZHRoLiBVc2VkIHRvIGF1dG9tYXRpY2FsbHkgY29udmVydCBtaXRlciBqb2lucyB0byBiZXZlbCBqb2lucyBmb3Igc2hhcnAgYW5nbGVzIHRvIGF2b2lkIHRoZSBtaXRlciBleHRlbmRpbmcgYmV5b25kIHRoZSB0aGlja25lc3Mgb2YgdGhlIHN0cm9raW5nIHBhdGguIE5vcm1hbGx5IHdpbGwgbm90IG5lZWQgdG8gYmUgc2V0LCBidXQgYSBsYXJnZXIgdmFsdWUgY2FuIHNvbWV0aW1lcyBoZWxwIGF2b2lkIGphZ2d5IGFydGlmYWN0cy5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogNC4wLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiV2lsbCBhdXRvLWNvbnZlcnQgbWl0ZXJzIHRvIGJldmVsIGxpbmUgam9pbnMgd2hlbiB0aGV0YSBpcyBsZXNzIHRoYW4gMjkgZGVncmVlcyBhcyBwZXIgdGhlIFNWRyBzcGVjOiAnbWl0ZXJMZW5ndGggLyBzdHJva2Utd2lkdGggPSAxIC8gc2luICggdGhldGEgLyAyICknXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNsaXBcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1jbGlwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBiZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYmVmb3JlIHJlbmRlcmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiZ2VvbWV0cmllcyBhcmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJ5IGRlZmF1bHQgZm9yIGJlc3QgcmVuZGVyaW5nIHBlcmZvcm1hbmNlLiBJbiBzb21lIGNhc2VzIHVzZXJzIG1heSB3aXNoIHRvIGRpc2FibGUgdGhpcyB0byBhdm9pZCByZW5kZXJpbmcgYXJ0aWZhY3RzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzbW9vdGhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1zbW9vdGhcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwibm8gc21vb3RoaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJyYW5nZVwiOiBcIjAtMVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU21vb3RocyBvdXQgZ2VvbWV0cnkgYW5nbGVzLiAwIGlzIG5vIHNtb290aGluZywgMSBpcyBmdWxseSBzbW9vdGhlZC4gVmFsdWVzIGdyZWF0ZXIgdGhhbiAxIHdpbGwgcHJvZHVjZSB3aWxkLCBsb29waW5nIGdlb21ldHJpZXMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm9mZnNldFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLW9mZnNldFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJubyBvZmZzZXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIk9mZnNldHMgYSBsaW5lIGEgbnVtYmVyIG9mIHBpeGVscyBwYXJhbGxlbCB0byBpdHMgYWN0dWFsIHBhdGguIFBvc3RpdmUgdmFsdWVzIG1vdmUgdGhlIGxpbmUgbGVmdCwgbmVnYXRpdmUgdmFsdWVzIG1vdmUgaXQgcmlnaHQgKHJlbGF0aXZlIHRvIHRoZSBkaXJlY3Rpb25hbGl0eSBvZiB0aGUgbGluZSkuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInJhc3Rlcml6ZXJcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1yYXN0ZXJpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJmdWxsXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZmFzdFwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJmdWxsXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJFeHBvc2VzIGFuIGFsdGVybmF0ZSBBR0cgcmVuZGVyaW5nIG1ldGhvZCB0aGF0IHNhY3JpZmljZXMgc29tZSBhY2N1cmFjeSBmb3Igc3BlZWQuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImdlb21ldHJ5LXRyYW5zZm9ybVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLWdlb21ldHJ5LXRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZ1bmN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImdlb21ldHJ5IHdpbGwgbm90IGJlIHRyYW5zZm9ybWVkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbGxvd3MgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb25zIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGdlb21ldHJ5LlwiLFxuICAgICAgICAgICAgICAgIFwiZnVuY3Rpb25zXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgW1wibWF0cml4XCIsIDZdLFxuICAgICAgICAgICAgICAgICAgICBbXCJ0cmFuc2xhdGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNjYWxlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJyb3RhdGVcIiwgM10sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdYXCIsIDFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WVwiLCAxXVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNvbXAtb3BcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1jb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBzeW1ib2xpemVyIG9uIHRvcCBvZiBvdGhlciBzeW1ib2xpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgc3ltYm9saXplciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIHN5bWJvbGl6ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcIm1hcmtlcnNcIjoge1xuICAgICAgICAgICAgXCJmaWxlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1maWxlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbiBTVkcgZmlsZSB0aGF0IHRoaXMgbWFya2VyIHNob3dzIGF0IGVhY2ggcGxhY2VtZW50LiBJZiBubyBmaWxlIGlzIGdpdmVuLCB0aGUgbWFya2VyIHdpbGwgc2hvdyBhbiBlbGxpcHNlLlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiQW4gZWxsaXBzZSBvciBjaXJjbGUsIGlmIHdpZHRoIGVxdWFscyBoZWlnaHRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1cmlcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwib3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG92ZXJhbGwgb3BhY2l0eSBvZiB0aGUgbWFya2VyLCBpZiBzZXQsIG92ZXJyaWRlcyBib3RoIHRoZSBvcGFjaXR5IG9mIGJvdGggdGhlIGZpbGwgYW5kIHN0cm9rZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiVGhlIHN0cm9rZS1vcGFjaXR5IGFuZCBmaWxsLW9wYWNpdHkgd2lsbCBiZSB1c2VkXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZmlsbC1vcGFjaXR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1maWxsLW9wYWNpdHlcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBmaWxsIG9wYWNpdHkgb2YgdGhlIG1hcmtlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwib3BhcXVlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3Ryb2tlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1saW5lLWNvbG9yXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgY29sb3Igb2YgdGhlIHN0cm9rZSBhcm91bmQgYSBtYXJrZXIgc2hhcGUuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYmxhY2tcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJjb2xvclwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzdHJva2Utd2lkdGhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLWxpbmUtd2lkdGhcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSB3aWR0aCBvZiB0aGUgc3Ryb2tlIGFyb3VuZCBhIG1hcmtlciBzaGFwZSwgaW4gcGl4ZWxzLiBUaGlzIGlzIHBvc2l0aW9uZWQgb24gdGhlIGJvdW5kYXJ5LCBzbyBoaWdoIHZhbHVlcyBjYW4gY292ZXIgdGhlIGFyZWEgaXRzZWxmLlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInN0cm9rZS1vcGFjaXR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1saW5lLW9wYWNpdHlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm9wYXF1ZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG9wYWNpdHkgb2YgYSBsaW5lXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicGxhY2VtZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1wbGFjZW1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcInBvaW50XCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImludGVyaW9yXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInBvaW50XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJQbGFjZSBtYXJrZXJzIGF0IHRoZSBjZW50ZXIgcG9pbnQgKGNlbnRyb2lkKSBvZiB0aGUgZ2VvbWV0cnlcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkF0dGVtcHQgdG8gcGxhY2UgbWFya2VycyBvbiBhIHBvaW50LCBpbiB0aGUgY2VudGVyIG9mIGEgcG9seWdvbiwgb3IgaWYgbWFya2Vycy1wbGFjZW1lbnQ6bGluZSwgdGhlbiBtdWx0aXBsZSB0aW1lcyBhbG9uZyBhIGxpbmUuICdpbnRlcmlvcicgcGxhY2VtZW50IGNhbiBiZSB1c2VkIHRvIGVuc3VyZSB0aGF0IHBvaW50cyBwbGFjZWQgb24gcG9seWdvbnMgYXJlIGZvcmNlZCB0byBiZSBpbnNpZGUgdGhlIHBvbHlnb24gaW50ZXJpb3JcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibXVsdGktcG9saWN5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1tdWx0aS1wb2xpY3lcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcImVhY2hcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3aG9sZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImxhcmdlc3RcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiZWFjaFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiSWYgYSBmZWF0dXJlIGNvbnRhaW5zIG11bHRpcGxlIGdlb21ldHJpZXMgYW5kIHRoZSBwbGFjZW1lbnQgdHlwZSBpcyBlaXRoZXIgcG9pbnQgb3IgaW50ZXJpb3IgdGhlbiBhIG1hcmtlciB3aWxsIGJlIHJlbmRlcmVkIGZvciBlYWNoXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBIHNwZWNpYWwgc2V0dGluZyB0byBhbGxvdyB0aGUgdXNlciB0byBjb250cm9sIHJlbmRlcmluZyBiZWhhdmlvciBmb3IgJ211bHRpLWdlb21ldHJpZXMnICh3aGVuIGEgZmVhdHVyZSBjb250YWlucyBtdWx0aXBsZSBnZW9tZXRyaWVzKS4gVGhpcyBzZXR0aW5nIGRvZXMgbm90IGFwcGx5IHRvIG1hcmtlcnMgcGxhY2VkIGFsb25nIGxpbmVzLiBUaGUgJ2VhY2gnIHBvbGljeSBpcyBkZWZhdWx0IGFuZCBtZWFucyBhbGwgZ2VvbWV0cmllcyB3aWxsIGdldCBhIG1hcmtlci4gVGhlICd3aG9sZScgcG9saWN5IG1lYW5zIHRoYXQgdGhlIGFnZ3JlZ2F0ZSBjZW50cm9pZCBiZXR3ZWVuIGFsbCBnZW9tZXRyaWVzIHdpbGwgYmUgdXNlZC4gVGhlICdsYXJnZXN0JyBwb2xpY3kgbWVhbnMgdGhhdCBvbmx5IHRoZSBsYXJnZXN0IChieSBib3VuZGluZyBib3ggYXJlYXMpIGZlYXR1cmUgd2lsbCBnZXQgYSByZW5kZXJlZCBtYXJrZXIgKHRoaXMgaXMgaG93IHRleHQgbGFiZWxpbmcgYmVoYXZlcyBieSBkZWZhdWx0KS5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibWFya2VyLXR5cGVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLXR5cGVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcImFycm93XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZWxsaXBzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInJlY3RhbmdsZVwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJlbGxpcHNlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgZGVmYXVsdCBtYXJrZXItdHlwZS4gSWYgYSBTVkcgZmlsZSBpcyBub3QgZ2l2ZW4gYXMgdGhlIG1hcmtlci1maWxlIHBhcmFtZXRlciwgdGhlIHJlbmRlcmVyIHByb3ZpZGVzIGVpdGhlciBhbiBhcnJvdyBvciBhbiBlbGxpcHNlIChhIGNpcmNsZSBpZiBoZWlnaHQgaXMgZXF1YWwgdG8gd2lkdGgpXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIndpZHRoXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci13aWR0aFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxMCxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSB3aWR0aCBvZiB0aGUgbWFya2VyLCBpZiB1c2luZyBvbmUgb2YgdGhlIGRlZmF1bHQgdHlwZXMuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImV4cHJlc3Npb25cIjogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiaGVpZ2h0XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1oZWlnaHRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMTAsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgaGVpZ2h0IG9mIHRoZSBtYXJrZXIsIGlmIHVzaW5nIG9uZSBvZiB0aGUgZGVmYXVsdCB0eXBlcy5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZXhwcmVzc2lvblwiOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmaWxsXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1maWxsXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYmx1ZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIGNvbG9yIG9mIHRoZSBhcmVhIG9mIHRoZSBtYXJrZXIuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICBcImV4cHJlc3Npb25cIjogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiYWxsb3ctb3ZlcmxhcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItYWxsb3ctb3ZlcmxhcFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb250cm9sIHdoZXRoZXIgb3ZlcmxhcHBpbmcgbWFya2VycyBhcmUgc2hvd24gb3IgaGlkZGVuLlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiRG8gbm90IGFsbG93IG1ha2VycyB0byBvdmVybGFwIHdpdGggZWFjaCBvdGhlciAtIG92ZXJsYXBwaW5nIG1hcmtlcnMgd2lsbCBub3QgYmUgc2hvd24uXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImlnbm9yZS1wbGFjZW1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLWlnbm9yZS1wbGFjZW1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZG8gbm90IHN0b3JlIHRoZSBiYm94IG9mIHRoaXMgZ2VvbWV0cnkgaW4gdGhlIGNvbGxpc2lvbiBkZXRlY3RvciBjYWNoZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwidmFsdWUgdG8gY29udHJvbCB3aGV0aGVyIHRoZSBwbGFjZW1lbnQgb2YgdGhlIGZlYXR1cmUgd2lsbCBwcmV2ZW50IHRoZSBwbGFjZW1lbnQgb2Ygb3RoZXIgZmVhdHVyZXNcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3BhY2luZ1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItc3BhY2luZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU3BhY2UgYmV0d2VlbiByZXBlYXRlZCBsYWJlbHNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMTAwLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm1heC1lcnJvclwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItbWF4LWVycm9yXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMC4yLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG1heGltdW0gZGlmZmVyZW5jZSBiZXR3ZWVuIGFjdHVhbCBtYXJrZXIgcGxhY2VtZW50IGFuZCB0aGUgbWFya2VyLXNwYWNpbmcgcGFyYW1ldGVyLiBTZXR0aW5nIGEgaGlnaCB2YWx1ZSBjYW4gYWxsb3cgdGhlIHJlbmRlcmVyIHRvIHRyeSB0byByZXNvbHZlIHBsYWNlbWVudCBjb25mbGljdHMgd2l0aCBvdGhlciBzeW1ib2xpemVycy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidHJhbnNmb3JtXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci10cmFuc2Zvcm1cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmdW5jdGlvbnNcIixcbiAgICAgICAgICAgICAgICBcImZ1bmN0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIFtcIm1hdHJpeFwiLCA2XSxcbiAgICAgICAgICAgICAgICAgICAgW1widHJhbnNsYXRlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJzY2FsZVwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wicm90YXRlXCIsIDNdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WFwiLCAxXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2tld1lcIiwgMV1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiTm8gdHJhbnNmb3JtYXRpb25cIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNWRyB0cmFuc2Zvcm1hdGlvbiBkZWZpbml0aW9uXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNsaXBcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLWNsaXBcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJnZW9tZXRyeSB3aWxsIGJlIGNsaXBwZWQgdG8gbWFwIGJvdW5kcyBiZWZvcmUgcmVuZGVyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJnZW9tZXRyaWVzIGFyZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYnkgZGVmYXVsdCBmb3IgYmVzdCByZW5kZXJpbmcgcGVyZm9ybWFuY2UuIEluIHNvbWUgY2FzZXMgdXNlcnMgbWF5IHdpc2ggdG8gZGlzYWJsZSB0aGlzIHRvIGF2b2lkIHJlbmRlcmluZyBhcnRpZmFjdHMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNtb290aFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItc21vb3RoXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIHNtb290aGluZ1wiLFxuICAgICAgICAgICAgICAgIFwicmFuZ2VcIjogXCIwLTFcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNtb290aHMgb3V0IGdlb21ldHJ5IGFuZ2xlcy4gMCBpcyBubyBzbW9vdGhpbmcsIDEgaXMgZnVsbHkgc21vb3RoZWQuIFZhbHVlcyBncmVhdGVyIHRoYW4gMSB3aWxsIHByb2R1Y2Ugd2lsZCwgbG9vcGluZyBnZW9tZXRyaWVzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnZW9tZXRyeS10cmFuc2Zvcm1cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLWdlb21ldHJ5LXRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZ1bmN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImdlb21ldHJ5IHdpbGwgbm90IGJlIHRyYW5zZm9ybWVkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbGxvd3MgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb25zIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGdlb21ldHJ5LlwiLFxuICAgICAgICAgICAgICAgIFwiZnVuY3Rpb25zXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgW1wibWF0cml4XCIsIDZdLFxuICAgICAgICAgICAgICAgICAgICBbXCJ0cmFuc2xhdGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNjYWxlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJyb3RhdGVcIiwgM10sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdYXCIsIDFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WVwiLCAxXVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNvbXAtb3BcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLWNvbXAtb3BcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiYWRkIHRoZSBjdXJyZW50IHN5bWJvbGl6ZXIgb24gdG9wIG9mIG90aGVyIHN5bWJvbGl6ZXJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBzeW1ib2xpemVyIHNob3VsZCBiZWhhdmUgcmVsYXRpdmUgdG8gc3ltYm9saXplcnMgYXRvcCBvciBiZWxvdyBpdC5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1wiY2xlYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGx1c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzY3JlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGFya2VuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGlnaHRlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWRvZGdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItYnVyblwiLFxuICAgICAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzb2Z0LWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlmZmVyZW5jZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnRyYXN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLW1lcmdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tZXh0cmFjdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNhdHVyYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwic2hpZWxkXCI6IHtcbiAgICAgICAgICAgIFwibmFtZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtbmFtZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZXhwcmVzc2lvblwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwic2VyaWFsaXphdGlvblwiOiBcImNvbnRlbnRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlZhbHVlIHRvIHVzZSBmb3IgYSBzaGllbGRcXFwicyB0ZXh0IGxhYmVsLiBEYXRhIGNvbHVtbnMgYXJlIHNwZWNpZmllZCB1c2luZyBicmFja2V0cyBsaWtlIFtjb2x1bW5fbmFtZV1cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZmlsZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtZmlsZVwiLFxuICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1cmlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJJbWFnZSBmaWxlIHRvIHJlbmRlciBiZWhpbmQgdGhlIHNoaWVsZCB0ZXh0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZhY2UtbmFtZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtZmFjZS1uYW1lXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJ2YWxpZGF0ZVwiOiBcImZvbnRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkZvbnQgbmFtZSBhbmQgc3R5bGUgdG8gdXNlIGZvciB0aGUgc2hpZWxkIHRleHRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInVubG9jay1pbWFnZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtdW5sb2NrLWltYWdlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhpcyBwYXJhbWV0ZXIgc2hvdWxkIGJlIHNldCB0byB0cnVlIGlmIHlvdSBhcmUgdHJ5aW5nIHRvIHBvc2l0aW9uIHRleHQgYmVzaWRlIHJhdGhlciB0aGFuIG9uIHRvcCBvZiB0aGUgc2hpZWxkIGltYWdlXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwidGV4dCBhbGlnbm1lbnQgcmVsYXRpdmUgdG8gdGhlIHNoaWVsZCBpbWFnZSB1c2VzIHRoZSBjZW50ZXIgb2YgdGhlIGltYWdlIGFzIHRoZSBhbmNob3IgZm9yIHRleHQgcG9zaXRpb25pbmcuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNpemVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXNpemVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIHNpemUgb2YgdGhlIHNoaWVsZCB0ZXh0IGluIHBpeGVsc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmaWxsXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1maWxsXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBjb2xvciBvZiB0aGUgc2hpZWxkIHRleHRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicGxhY2VtZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1wbGFjZW1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcInBvaW50XCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInZlcnRleFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludGVyaW9yXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInBvaW50XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJIb3cgdGhpcyBzaGllbGQgc2hvdWxkIGJlIHBsYWNlZC4gUG9pbnQgcGxhY2VtZW50IGF0dGVtcHRzIHRvIHBsYWNlIGl0IG9uIHRvcCBvZiBwb2ludHMsIGxpbmUgcGxhY2VzIGFsb25nIGxpbmVzIG11bHRpcGxlIHRpbWVzIHBlciBmZWF0dXJlLCB2ZXJ0ZXggcGxhY2VzIG9uIHRoZSB2ZXJ0ZXhlcyBvZiBwb2x5Z29ucywgYW5kIGludGVyaW9yIGF0dGVtcHRzIHRvIHBsYWNlIGluc2lkZSBvZiBwb2x5Z29ucy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiYXZvaWQtZWRnZXNcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWF2b2lkLWVkZ2VzXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUZWxsIHBvc2l0aW9uaW5nIGFsZ29yaXRobSB0byBhdm9pZCBsYWJlbGluZyBuZWFyIGludGVyc2VjdGlvbiBlZGdlcy5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJhbGxvdy1vdmVybGFwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1hbGxvdy1vdmVybGFwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbnRyb2wgd2hldGhlciBvdmVybGFwcGluZyBzaGllbGRzIGFyZSBzaG93biBvciBoaWRkZW4uXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJEbyBub3QgYWxsb3cgc2hpZWxkcyB0byBvdmVybGFwIHdpdGggb3RoZXIgbWFwIGVsZW1lbnRzIGFscmVhZHkgcGxhY2VkLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtaW5pbXVtLWRpc3RhbmNlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1taW4tZGlzdGFuY2VcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiTWluaW11bSBkaXN0YW5jZSB0byB0aGUgbmV4dCBzaGllbGQgc3ltYm9sLCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgc2hpZWxkLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzcGFjaW5nXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1zcGFjaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBzcGFjaW5nIGJldHdlZW4gcmVwZWF0ZWQgb2NjdXJyZW5jZXMgb2YgdGhlIHNhbWUgc2hpZWxkIG9uIGEgbGluZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtaW5pbXVtLXBhZGRpbmdcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLW1pbi1wYWRkaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEZXRlcm1pbmVzIHRoZSBtaW5pbXVtIGFtb3VudCBvZiBwYWRkaW5nIHRoYXQgYSBzaGllbGQgZ2V0cyByZWxhdGl2ZSB0byBvdGhlciBzaGllbGRzXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwid3JhcC13aWR0aFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtd3JhcC13aWR0aFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVuc2lnbmVkXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJMZW5ndGggb2YgYSBjaHVuayBvZiB0ZXh0IGluIGNoYXJhY3RlcnMgYmVmb3JlIHdyYXBwaW5nIHRleHRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwid3JhcC1iZWZvcmVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXdyYXAtYmVmb3JlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIldyYXAgdGV4dCBiZWZvcmUgd3JhcC13aWR0aCBpcyByZWFjaGVkLiBJZiBmYWxzZSwgd3JhcHBlZCBsaW5lcyB3aWxsIGJlIGEgYml0IGxvbmdlciB0aGFuIHdyYXAtd2lkdGguXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIndyYXAtY2hhcmFjdGVyXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC13cmFwLWNoYXJhY3RlclwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIiBcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlVzZSB0aGlzIGNoYXJhY3RlciBpbnN0ZWFkIG9mIGEgc3BhY2UgdG8gd3JhcCBsb25nIG5hbWVzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJoYWxvLWZpbGxcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWhhbG8tZmlsbFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiI0ZGRkZGRlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwid2hpdGVcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNwZWNpZmllcyB0aGUgY29sb3Igb2YgdGhlIGhhbG8gYXJvdW5kIHRoZSB0ZXh0LlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJoYWxvLXJhZGl1c1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtaGFsby1yYWRpdXNcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNwZWNpZnkgdGhlIHJhZGl1cyBvZiB0aGUgaGFsbyBpbiBwaXhlbHNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIGhhbG9cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjaGFyYWN0ZXItc3BhY2luZ1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtY2hhcmFjdGVyLXNwYWNpbmdcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1bnNpZ25lZFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiSG9yaXpvbnRhbCBzcGFjaW5nIGJldHdlZW4gY2hhcmFjdGVycyAoaW4gcGl4ZWxzKS4gQ3VycmVudGx5IHdvcmtzIGZvciBwb2ludCBwbGFjZW1lbnQgb25seSwgbm90IGxpbmUgcGxhY2VtZW50LlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJsaW5lLXNwYWNpbmdcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWxpbmUtc3BhY2luZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVmVydGljYWwgc3BhY2luZyBiZXR3ZWVuIGxpbmVzIG9mIG11bHRpbGluZSBsYWJlbHMgKGluIHBpeGVscylcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1bnNpZ25lZFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJkeFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtdGV4dC1keFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEaXNwbGFjZSB0ZXh0IHdpdGhpbiBzaGllbGQgYnkgZml4ZWQgYW1vdW50LCBpbiBwaXhlbHMsICsvLSBhbG9uZyB0aGUgWCBheGlzLiAgQSBwb3NpdGl2ZSB2YWx1ZSB3aWxsIHNoaWZ0IHRoZSB0ZXh0IHJpZ2h0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC10ZXh0LWR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkRpc3BsYWNlIHRleHQgd2l0aGluIHNoaWVsZCBieSBmaXhlZCBhbW91bnQsIGluIHBpeGVscywgKy8tIGFsb25nIHRoZSBZIGF4aXMuICBBIHBvc2l0aXZlIHZhbHVlIHdpbGwgc2hpZnQgdGhlIHRleHQgZG93blwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzaGllbGQtZHhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWR4XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkRpc3BsYWNlIHNoaWVsZCBieSBmaXhlZCBhbW91bnQsIGluIHBpeGVscywgKy8tIGFsb25nIHRoZSBYIGF4aXMuICBBIHBvc2l0aXZlIHZhbHVlIHdpbGwgc2hpZnQgdGhlIHRleHQgcmlnaHRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic2hpZWxkLWR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1keVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEaXNwbGFjZSBzaGllbGQgYnkgZml4ZWQgYW1vdW50LCBpbiBwaXhlbHMsICsvLSBhbG9uZyB0aGUgWSBheGlzLiAgQSBwb3NpdGl2ZSB2YWx1ZSB3aWxsIHNoaWZ0IHRoZSB0ZXh0IGRvd25cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwib3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCIoRGVmYXVsdCAxLjApIC0gb3BhY2l0eSBvZiB0aGUgaW1hZ2UgdXNlZCBmb3IgdGhlIHNoaWVsZFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ0ZXh0LW9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXRleHQtb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCIoRGVmYXVsdCAxLjApIC0gb3BhY2l0eSBvZiB0aGUgdGV4dCBwbGFjZWQgb24gdG9wIG9mIHRoZSBzaGllbGRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiaG9yaXpvbnRhbC1hbGlnbm1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWhvcml6b250YWwtYWxpZ25tZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwibWlkZGxlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhdXRvXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIHNoaWVsZCdzIGhvcml6b250YWwgYWxpZ25tZW50IGZyb20gaXRzIGNlbnRlcnBvaW50XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYXV0b1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ2ZXJ0aWNhbC1hbGlnbm1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXZlcnRpY2FsLWFsaWdubWVudFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwidG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibWlkZGxlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYm90dG9tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXV0b1wiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBzaGllbGQncyB2ZXJ0aWNhbCBhbGlnbm1lbnQgZnJvbSBpdHMgY2VudGVycG9pbnRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJtaWRkbGVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidGV4dC10cmFuc2Zvcm1cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXRleHQtdHJhbnNmb3JtXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJub25lXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidXBwZXJjYXNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibG93ZXJjYXNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY2FwaXRhbGl6ZVwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRyYW5zZm9ybSB0aGUgY2FzZSBvZiB0aGUgY2hhcmFjdGVyc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwianVzdGlmeS1hbGlnbm1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWp1c3RpZnktYWxpZ25tZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhdXRvXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRGVmaW5lIGhvdyB0ZXh0IGluIGEgc2hpZWxkJ3MgbGFiZWwgaXMganVzdGlmaWVkXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYXV0b1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjbGlwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1jbGlwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBiZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYmVmb3JlIHJlbmRlcmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiZ2VvbWV0cmllcyBhcmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJ5IGRlZmF1bHQgZm9yIGJlc3QgcmVuZGVyaW5nIHBlcmZvcm1hbmNlLiBJbiBzb21lIGNhc2VzIHVzZXJzIG1heSB3aXNoIHRvIGRpc2FibGUgdGhpcyB0byBhdm9pZCByZW5kZXJpbmcgYXJ0aWZhY3RzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1jb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBzeW1ib2xpemVyIG9uIHRvcCBvZiBvdGhlciBzeW1ib2xpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgc3ltYm9saXplciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIHN5bWJvbGl6ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImxpbmUtcGF0dGVyblwiOiB7XG4gICAgICAgICAgICBcImZpbGVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1wYXR0ZXJuLWZpbGVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1cmlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQW4gaW1hZ2UgZmlsZSB0byBiZSByZXBlYXRlZCBhbmQgd2FycGVkIGFsb25nIGEgbGluZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjbGlwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtcGF0dGVybi1jbGlwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBiZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYmVmb3JlIHJlbmRlcmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiZ2VvbWV0cmllcyBhcmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJ5IGRlZmF1bHQgZm9yIGJlc3QgcmVuZGVyaW5nIHBlcmZvcm1hbmNlLiBJbiBzb21lIGNhc2VzIHVzZXJzIG1heSB3aXNoIHRvIGRpc2FibGUgdGhpcyB0byBhdm9pZCByZW5kZXJpbmcgYXJ0aWZhY3RzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzbW9vdGhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1wYXR0ZXJuLXNtb290aFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJubyBzbW9vdGhpbmdcIixcbiAgICAgICAgICAgICAgICBcInJhbmdlXCI6IFwiMC0xXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTbW9vdGhzIG91dCBnZW9tZXRyeSBhbmdsZXMuIDAgaXMgbm8gc21vb3RoaW5nLCAxIGlzIGZ1bGx5IHNtb290aGVkLiBWYWx1ZXMgZ3JlYXRlciB0aGFuIDEgd2lsbCBwcm9kdWNlIHdpbGQsIGxvb3BpbmcgZ2VvbWV0cmllcy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZ2VvbWV0cnktdHJhbnNmb3JtXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtcGF0dGVybi1nZW9tZXRyeS10cmFuc2Zvcm1cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmdW5jdGlvbnNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJnZW9tZXRyeSB3aWxsIG5vdCBiZSB0cmFuc2Zvcm1lZFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQWxsb3dzIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9ucyB0byBiZSBhcHBsaWVkIHRvIHRoZSBnZW9tZXRyeS5cIixcbiAgICAgICAgICAgICAgICBcImZ1bmN0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIFtcIm1hdHJpeFwiLCA2XSxcbiAgICAgICAgICAgICAgICAgICAgW1widHJhbnNsYXRlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJzY2FsZVwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wicm90YXRlXCIsIDNdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WFwiLCAxXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2tld1lcIiwgMV1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtcGF0dGVybi1jb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBzeW1ib2xpemVyIG9uIHRvcCBvZiBvdGhlciBzeW1ib2xpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgc3ltYm9saXplciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIHN5bWJvbGl6ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInBvbHlnb24tcGF0dGVyblwiOiB7XG4gICAgICAgICAgICBcImZpbGVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1wYXR0ZXJuLWZpbGVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1cmlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiSW1hZ2UgdG8gdXNlIGFzIGEgcmVwZWF0ZWQgcGF0dGVybiBmaWxsIHdpdGhpbiBhIHBvbHlnb25cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiYWxpZ25tZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tcGF0dGVybi1hbGlnbm1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcImxvY2FsXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ2xvYmFsXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImxvY2FsXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTcGVjaWZ5IHdoZXRoZXIgdG8gYWxpZ24gcGF0dGVybiBmaWxscyB0byB0aGUgbGF5ZXIgb3IgdG8gdGhlIG1hcC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZ2FtbWFcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1wYXR0ZXJuLWdhbW1hXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImZ1bGx5IGFudGlhbGlhc2VkXCIsXG4gICAgICAgICAgICAgICAgXCJyYW5nZVwiOiBcIjAtMVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiTGV2ZWwgb2YgYW50aWFsaWFzaW5nIG9mIHBvbHlnb24gcGF0dGVybiBlZGdlc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJvcGFjaXR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tcGF0dGVybi1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIihEZWZhdWx0IDEuMCkgLSBBcHBseSBhbiBvcGFjaXR5IGxldmVsIHRvIHRoZSBpbWFnZSB1c2VkIGZvciB0aGUgcGF0dGVyblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiVGhlIGltYWdlIGlzIHJlbmRlcmVkIHdpdGhvdXQgbW9kaWZpY2F0aW9uc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjbGlwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tcGF0dGVybi1jbGlwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBiZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYmVmb3JlIHJlbmRlcmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiZ2VvbWV0cmllcyBhcmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJ5IGRlZmF1bHQgZm9yIGJlc3QgcmVuZGVyaW5nIHBlcmZvcm1hbmNlLiBJbiBzb21lIGNhc2VzIHVzZXJzIG1heSB3aXNoIHRvIGRpc2FibGUgdGhpcyB0byBhdm9pZCByZW5kZXJpbmcgYXJ0aWZhY3RzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzbW9vdGhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1wYXR0ZXJuLXNtb290aFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJubyBzbW9vdGhpbmdcIixcbiAgICAgICAgICAgICAgICBcInJhbmdlXCI6IFwiMC0xXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTbW9vdGhzIG91dCBnZW9tZXRyeSBhbmdsZXMuIDAgaXMgbm8gc21vb3RoaW5nLCAxIGlzIGZ1bGx5IHNtb290aGVkLiBWYWx1ZXMgZ3JlYXRlciB0aGFuIDEgd2lsbCBwcm9kdWNlIHdpbGQsIGxvb3BpbmcgZ2VvbWV0cmllcy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZ2VvbWV0cnktdHJhbnNmb3JtXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tcGF0dGVybi1nZW9tZXRyeS10cmFuc2Zvcm1cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmdW5jdGlvbnNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJnZW9tZXRyeSB3aWxsIG5vdCBiZSB0cmFuc2Zvcm1lZFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQWxsb3dzIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9ucyB0byBiZSBhcHBsaWVkIHRvIHRoZSBnZW9tZXRyeS5cIixcbiAgICAgICAgICAgICAgICBcImZ1bmN0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIFtcIm1hdHJpeFwiLCA2XSxcbiAgICAgICAgICAgICAgICAgICAgW1widHJhbnNsYXRlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJzY2FsZVwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wicm90YXRlXCIsIDNdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WFwiLCAxXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2tld1lcIiwgMV1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tcGF0dGVybi1jb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBzeW1ib2xpemVyIG9uIHRvcCBvZiBvdGhlciBzeW1ib2xpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgc3ltYm9saXplciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIHN5bWJvbGl6ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInJhc3RlclwiOiB7XG4gICAgICAgICAgICBcIm9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicmFzdGVyLW9wYWNpdHlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm9wYXF1ZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgb3BhY2l0eSBvZiB0aGUgcmFzdGVyIHN5bWJvbGl6ZXIgb24gdG9wIG9mIG90aGVyIHN5bWJvbGl6ZXJzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmaWx0ZXItZmFjdG9yXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInJhc3Rlci1maWx0ZXItZmFjdG9yXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IC0xLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiQWxsb3cgdGhlIGRhdGFzb3VyY2UgdG8gY2hvb3NlIGFwcHJvcHJpYXRlIGRvd25zY2FsaW5nLlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGlzIGlzIHVzZWQgYnkgdGhlIFJhc3RlciBvciBHZGFsIGRhdGFzb3VyY2VzIHRvIHByZS1kb3duc2NhbGUgaW1hZ2VzIHVzaW5nIG92ZXJ2aWV3cy4gSGlnaGVyIG51bWJlcnMgY2FuIHNvbWV0aW1lcyBjYXVzZSBtdWNoIGJldHRlciBzY2FsZWQgaW1hZ2Ugb3V0cHV0LCBhdCB0aGUgY29zdCBvZiBzcGVlZC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic2NhbGluZ1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJyYXN0ZXItc2NhbGluZ1wiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwibmVhclwiLFxuICAgICAgICAgICAgICAgICAgICBcImZhc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJiaWxpbmVhclwiLFxuICAgICAgICAgICAgICAgICAgICBcImJpbGluZWFyOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImJpY3ViaWNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcGxpbmUxNlwiLFxuICAgICAgICAgICAgICAgICAgICBcInNwbGluZTM2XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaGFubmluZ1wiLFxuICAgICAgICAgICAgICAgICAgICBcImhhbW1pbmdcIixcbiAgICAgICAgICAgICAgICAgICAgXCJoZXJtaXRlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwia2Fpc2VyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicXVhZHJpY1wiLFxuICAgICAgICAgICAgICAgICAgICBcImNhdHJvbVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdhdXNzaWFuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYmVzc2VsXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibWl0Y2hlbGxcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzaW5jXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGFuY3pvc1wiLFxuICAgICAgICAgICAgICAgICAgICBcImJsYWNrbWFuXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5lYXJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBzY2FsaW5nIGFsZ29yaXRobSB1c2VkIHRvIG1ha2luZyBkaWZmZXJlbnQgcmVzb2x1dGlvbiB2ZXJzaW9ucyBvZiB0aGlzIHJhc3RlciBsYXllci4gQmlsaW5lYXIgaXMgYSBnb29kIGNvbXByb21pc2UgYmV0d2VlbiBzcGVlZCBhbmQgYWNjdXJhY3ksIHdoaWxlIGxhbmN6b3MgZ2l2ZXMgdGhlIGhpZ2hlc3QgcXVhbGl0eS5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibWVzaC1zaXplXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInJhc3Rlci1tZXNoLXNpemVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMTYsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJSZXByb2plY3Rpb24gbWVzaCB3aWxsIGJlIDEvMTYgb2YgdGhlIHJlc29sdXRpb24gb2YgdGhlIHNvdXJjZSBpbWFnZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVuc2lnbmVkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBIHJlZHVjZWQgcmVzb2x1dGlvbiBtZXNoIGlzIHVzZWQgZm9yIHJhc3RlciByZXByb2plY3Rpb24sIGFuZCB0aGUgdG90YWwgaW1hZ2Ugc2l6ZSBpcyBkaXZpZGVkIGJ5IHRoZSBtZXNoLXNpemUgdG8gZGV0ZXJtaW5lIHRoZSBxdWFsaXR5IG9mIHRoYXQgbWVzaC4gVmFsdWVzIGZvciBtZXNoLXNpemUgbGFyZ2VyIHRoYW4gdGhlIGRlZmF1bHQgd2lsbCByZXN1bHQgaW4gZmFzdGVyIHJlcHJvamVjdGlvbiBidXQgbWlnaHQgbGVhZCB0byBkaXN0b3J0aW9uLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInJhc3Rlci1jb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBzeW1ib2xpemVyIG9uIHRvcCBvZiBvdGhlciBzeW1ib2xpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgc3ltYm9saXplciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIHN5bWJvbGl6ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInBvaW50XCI6IHtcbiAgICAgICAgICAgIFwiZmlsZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2ludC1maWxlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwidXJpXCIsXG4gICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJJbWFnZSBmaWxlIHRvIHJlcHJlc2VudCBhIHBvaW50XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImFsbG93LW92ZXJsYXBcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9pbnQtYWxsb3ctb3ZlcmxhcFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb250cm9sIHdoZXRoZXIgb3ZlcmxhcHBpbmcgcG9pbnRzIGFyZSBzaG93biBvciBoaWRkZW4uXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJEbyBub3QgYWxsb3cgcG9pbnRzIHRvIG92ZXJsYXAgd2l0aCBlYWNoIG90aGVyIC0gb3ZlcmxhcHBpbmcgbWFya2VycyB3aWxsIG5vdCBiZSBzaG93bi5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiaWdub3JlLXBsYWNlbWVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2ludC1pZ25vcmUtcGxhY2VtZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImRvIG5vdCBzdG9yZSB0aGUgYmJveCBvZiB0aGlzIGdlb21ldHJ5IGluIHRoZSBjb2xsaXNpb24gZGV0ZWN0b3IgY2FjaGVcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcInZhbHVlIHRvIGNvbnRyb2wgd2hldGhlciB0aGUgcGxhY2VtZW50IG9mIHRoZSBmZWF0dXJlIHdpbGwgcHJldmVudCB0aGUgcGxhY2VtZW50IG9mIG90aGVyIGZlYXR1cmVzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9pbnQtb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEuMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIkZ1bGx5IG9wYXF1ZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQSB2YWx1ZSBmcm9tIDAgdG8gMSB0byBjb250cm9sIHRoZSBvcGFjaXR5IG9mIHRoZSBwb2ludFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJwbGFjZW1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9pbnQtcGxhY2VtZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJjZW50cm9pZFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludGVyaW9yXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiSG93IHRoaXMgcG9pbnQgc2hvdWxkIGJlIHBsYWNlZC4gQ2VudHJvaWQgY2FsY3VsYXRlcyB0aGUgZ2VvbWV0cmljIGNlbnRlciBvZiBhIHBvbHlnb24sIHdoaWNoIGNhbiBiZSBvdXRzaWRlIG9mIGl0LCB3aGlsZSBpbnRlcmlvciBhbHdheXMgcGxhY2VzIGluc2lkZSBvZiBhIHBvbHlnb24uXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiY2VudHJvaWRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidHJhbnNmb3JtXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvaW50LXRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZ1bmN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIFwiZnVuY3Rpb25zXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgW1wibWF0cml4XCIsIDZdLFxuICAgICAgICAgICAgICAgICAgICBbXCJ0cmFuc2xhdGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNjYWxlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJyb3RhdGVcIiwgM10sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdYXCIsIDFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WVwiLCAxXVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyB0cmFuc2Zvcm1hdGlvblwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU1ZHIHRyYW5zZm9ybWF0aW9uIGRlZmluaXRpb25cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY29tcC1vcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2ludC1jb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBzeW1ib2xpemVyIG9uIHRvcCBvZiBvdGhlciBzeW1ib2xpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgc3ltYm9saXplciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIHN5bWJvbGl6ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInRleHRcIjoge1xuICAgICAgICAgICAgXCJuYW1lXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtbmFtZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZXhwcmVzc2lvblwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcInNlcmlhbGl6YXRpb25cIjogXCJjb250ZW50XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJWYWx1ZSB0byB1c2UgZm9yIGEgdGV4dCBsYWJlbC4gRGF0YSBjb2x1bW5zIGFyZSBzcGVjaWZpZWQgdXNpbmcgYnJhY2tldHMgbGlrZSBbY29sdW1uX25hbWVdXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZhY2UtbmFtZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWZhY2UtbmFtZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIFwidmFsaWRhdGVcIjogXCJmb250XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJGb250IG5hbWUgYW5kIHN0eWxlIHRvIHJlbmRlciBhIGxhYmVsIGluXCIsXG4gICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzaXplXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtc2l6ZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEwLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGV4dCBzaXplIGluIHBpeGVsc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ0ZXh0LXJhdGlvXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtcmF0aW9cIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkRlZmluZSB0aGUgYW1vdW50IG9mIHRleHQgKG9mIHRoZSB0b3RhbCkgcHJlc2VudCBvbiBzdWNjZXNzaXZlIGxpbmVzIHdoZW4gd3JhcHBpbmcgb2NjdXJzXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwidW5zaWduZWRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwid3JhcC13aWR0aFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LXdyYXAtd2lkdGhcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkxlbmd0aCBvZiBhIGNodW5rIG9mIHRleHQgaW4gY2hhcmFjdGVycyBiZWZvcmUgd3JhcHBpbmcgdGV4dFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVuc2lnbmVkXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIndyYXAtYmVmb3JlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtd3JhcC1iZWZvcmVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiV3JhcCB0ZXh0IGJlZm9yZSB3cmFwLXdpZHRoIGlzIHJlYWNoZWQuIElmIGZhbHNlLCB3cmFwcGVkIGxpbmVzIHdpbGwgYmUgYSBiaXQgbG9uZ2VyIHRoYW4gd3JhcC13aWR0aC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwid3JhcC1jaGFyYWN0ZXJcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC13cmFwLWNoYXJhY3RlclwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIiBcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlVzZSB0aGlzIGNoYXJhY3RlciBpbnN0ZWFkIG9mIGEgc3BhY2UgdG8gd3JhcCBsb25nIHRleHQuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNwYWNpbmdcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1zcGFjaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwidW5zaWduZWRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkRpc3RhbmNlIGJldHdlZW4gcmVwZWF0ZWQgdGV4dCBsYWJlbHMgb24gYSBsaW5lIChha2EuIGxhYmVsLXNwYWNpbmcpXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNoYXJhY3Rlci1zcGFjaW5nXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtY2hhcmFjdGVyLXNwYWNpbmdcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiSG9yaXpvbnRhbCBzcGFjaW5nIGFkanVzdG1lbnQgYmV0d2VlbiBjaGFyYWN0ZXJzIGluIHBpeGVsc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJsaW5lLXNwYWNpbmdcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1saW5lLXNwYWNpbmdcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1bnNpZ25lZFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVmVydGljYWwgc3BhY2luZyBhZGp1c3RtZW50IGJldHdlZW4gbGluZXMgaW4gcGl4ZWxzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImxhYmVsLXBvc2l0aW9uLXRvbGVyYW5jZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWxhYmVsLXBvc2l0aW9uLXRvbGVyYW5jZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVuc2lnbmVkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbGxvd3MgdGhlIGxhYmVsIHRvIGJlIGRpc3BsYWNlZCBmcm9tIGl0cyBpZGVhbCBwb3NpdGlvbiBieSBhIG51bWJlciBvZiBwaXhlbHMgKG9ubHkgd29ya3Mgd2l0aCBwbGFjZW1lbnQ6bGluZSlcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibWF4LWNoYXItYW5nbGUtZGVsdGFcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1tYXgtY2hhci1hbmdsZS1kZWx0YVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiMjIuNVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG1heGltdW0gYW5nbGUgY2hhbmdlLCBpbiBkZWdyZWVzLCBhbGxvd2VkIGJldHdlZW4gYWRqYWNlbnQgY2hhcmFjdGVycyBpbiBhIGxhYmVsLiBUaGlzIHZhbHVlIGludGVybmFsbHkgaXMgY29udmVydGVkIHRvIHJhZGlhbnMgdG8gdGhlIGRlZmF1bHQgaXMgMjIuNSptYXRoLnBpLzE4MC4wLiBUaGUgaGlnaGVyIHRoZSB2YWx1ZSB0aGUgZmV3ZXIgbGFiZWxzIHdpbGwgYmUgcGxhY2VkIGFyb3VuZCBhcm91bmQgc2hhcnAgY29ybmVycy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZmlsbFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWZpbGxcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNwZWNpZmllcyB0aGUgY29sb3IgZm9yIHRoZSB0ZXh0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiIzAwMDAwMFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImNvbG9yXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBIG51bWJlciBmcm9tIDAgdG8gMSBzcGVjaWZ5aW5nIHRoZSBvcGFjaXR5IGZvciB0aGUgdGV4dFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLjAsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJGdWxseSBvcGFxdWVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJoYWxvLWZpbGxcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1oYWxvLWZpbGxcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIiNGRkZGRkZcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIndoaXRlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTcGVjaWZpZXMgdGhlIGNvbG9yIG9mIHRoZSBoYWxvIGFyb3VuZCB0aGUgdGV4dC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiaGFsby1yYWRpdXNcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1oYWxvLXJhZGl1c1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU3BlY2lmeSB0aGUgcmFkaXVzIG9mIHRoZSBoYWxvIGluIHBpeGVsc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwibm8gaGFsb1wiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImR4XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtZHhcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRGlzcGxhY2UgdGV4dCBieSBmaXhlZCBhbW91bnQsIGluIHBpeGVscywgKy8tIGFsb25nIHRoZSBYIGF4aXMuICBBIHBvc2l0aXZlIHZhbHVlIHdpbGwgc2hpZnQgdGhlIHRleHQgcmlnaHRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1keVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEaXNwbGFjZSB0ZXh0IGJ5IGZpeGVkIGFtb3VudCwgaW4gcGl4ZWxzLCArLy0gYWxvbmcgdGhlIFkgYXhpcy4gIEEgcG9zaXRpdmUgdmFsdWUgd2lsbCBzaGlmdCB0aGUgdGV4dCBkb3duXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInZlcnRpY2FsLWFsaWdubWVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LXZlcnRpY2FsLWFsaWdubWVudFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICBcInRvcFwiLFxuICAgICAgICAgICAgICAgICAgXCJtaWRkbGVcIixcbiAgICAgICAgICAgICAgICAgIFwiYm90dG9tXCIsXG4gICAgICAgICAgICAgICAgICBcImF1dG9cIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJQb3NpdGlvbiBvZiBsYWJlbCByZWxhdGl2ZSB0byBwb2ludCBwb3NpdGlvbi5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJhdXRvXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJEZWZhdWx0IGFmZmVjdGVkIGJ5IHZhbHVlIG9mIGR5OyBcXFwiYm90dG9tXFxcIiBmb3IgZHk+MCwgXFxcInRvcFxcXCIgZm9yIGR5PDAuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImF2b2lkLWVkZ2VzXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtYXZvaWQtZWRnZXNcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRlbGwgcG9zaXRpb25pbmcgYWxnb3JpdGhtIHRvIGF2b2lkIGxhYmVsaW5nIG5lYXIgaW50ZXJzZWN0aW9uIGVkZ2VzLlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm1pbmltdW0tZGlzdGFuY2VcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1taW4tZGlzdGFuY2VcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIk1pbmltdW0gcGVybWl0dGVkIGRpc3RhbmNlIHRvIHRoZSBuZXh0IHRleHQgc3ltYm9saXplci5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtaW5pbXVtLXBhZGRpbmdcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1taW4tcGFkZGluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRGV0ZXJtaW5lcyB0aGUgbWluaW11bSBhbW91bnQgb2YgcGFkZGluZyB0aGF0IGEgdGV4dCBzeW1ib2xpemVyIGdldHMgcmVsYXRpdmUgdG8gb3RoZXIgdGV4dFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm1pbmltdW0tcGF0aC1sZW5ndGhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1taW4tcGF0aC1sZW5ndGhcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwicGxhY2UgbGFiZWxzIG9uIGFsbCBwYXRoc1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiUGxhY2UgbGFiZWxzIG9ubHkgb24gcGF0aHMgbG9uZ2VyIHRoYW4gdGhpcyB2YWx1ZS5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiYWxsb3ctb3ZlcmxhcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWFsbG93LW92ZXJsYXBcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQ29udHJvbCB3aGV0aGVyIG92ZXJsYXBwaW5nIHRleHQgaXMgc2hvd24gb3IgaGlkZGVuLlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiRG8gbm90IGFsbG93IHRleHQgdG8gb3ZlcmxhcCB3aXRoIG90aGVyIHRleHQgLSBvdmVybGFwcGluZyBtYXJrZXJzIHdpbGwgbm90IGJlIHNob3duLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJvcmllbnRhdGlvblwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LW9yaWVudGF0aW9uXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImV4cHJlc3Npb25cIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlJvdGF0ZSB0aGUgdGV4dC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicGxhY2VtZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtcGxhY2VtZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJwb2ludFwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpbmVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2ZXJ0ZXhcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnRlcmlvclwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJwb2ludFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQ29udHJvbCB0aGUgc3R5bGUgb2YgcGxhY2VtZW50IG9mIGEgcG9pbnQgdmVyc3VzIHRoZSBnZW9tZXRyeSBpdCBpcyBhdHRhY2hlZCB0by5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicGxhY2VtZW50LXR5cGVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1wbGFjZW1lbnQtdHlwZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiUmUtcG9zaXRpb24gYW5kL29yIHJlLXNpemUgdGV4dCB0byBhdm9pZCBvdmVybGFwcy4gXFxcInNpbXBsZVxcXCIgZm9yIGJhc2ljIGFsZ29yaXRobSAodXNpbmcgdGV4dC1wbGFjZW1lbnRzIHN0cmluZywpIFxcXCJkdW1teVxcXCIgdG8gdHVybiB0aGlzIGZlYXR1cmUgb2ZmLlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiZHVtbXlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzaW1wbGVcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiZHVtbXlcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicGxhY2VtZW50c1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LXBsYWNlbWVudHNcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIklmIFxcXCJwbGFjZW1lbnQtdHlwZVxcXCIgaXMgc2V0IHRvIFxcXCJzaW1wbGVcXFwiLCB1c2UgdGhpcyBcXFwiUE9TSVRJT05TLFtTSVpFU11cXFwiIHN0cmluZy4gQW4gZXhhbXBsZSBpcyBgdGV4dC1wbGFjZW1lbnRzOiBcXFwiRSxORSxTRSxXLE5XLFNXXFxcIjtgIFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ0ZXh0LXRyYW5zZm9ybVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LXRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwibm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInVwcGVyY2FzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImxvd2VyY2FzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNhcGl0YWxpemVcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUcmFuc2Zvcm0gdGhlIGNhc2Ugb2YgdGhlIGNoYXJhY3RlcnNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImhvcml6b250YWwtYWxpZ25tZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtaG9yaXpvbnRhbC1hbGlnbm1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcImxlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaWRkbGVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyaWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImF1dG9cIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgdGV4dCdzIGhvcml6b250YWwgYWxpZ25tZW50IGZyb20gaXRzIGNlbnRlcnBvaW50XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYXV0b1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJqdXN0aWZ5LWFsaWdubWVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWFsaWduXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhdXRvXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRGVmaW5lIGhvdyB0ZXh0IGlzIGp1c3RpZmllZFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImF1dG9cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIkF1dG8gYWxpZ25tZW50IG1lYW5zIHRoYXQgdGV4dCB3aWxsIGJlIGNlbnRlcmVkIGJ5IGRlZmF1bHQgZXhjZXB0IHdoZW4gdXNpbmcgdGhlIGBwbGFjZW1lbnQtdHlwZWAgcGFyYW1ldGVyIC0gaW4gdGhhdCBjYXNlIGVpdGhlciByaWdodCBvciBsZWZ0IGp1c3RpZmljYXRpb24gd2lsbCBiZSB1c2VkIGF1dG9tYXRpY2FsbHkgZGVwZW5kaW5nIG9uIHdoZXJlIHRoZSB0ZXh0IGNvdWxkIGJlIGZpdCBnaXZlbiB0aGUgYHRleHQtcGxhY2VtZW50c2AgZGlyZWN0aXZlc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjbGlwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtY2xpcFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImdlb21ldHJ5IHdpbGwgYmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJlZm9yZSByZW5kZXJpbmdcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcImdlb21ldHJpZXMgYXJlIGNsaXBwZWQgdG8gbWFwIGJvdW5kcyBieSBkZWZhdWx0IGZvciBiZXN0IHJlbmRlcmluZyBwZXJmb3JtYW5jZS4gSW4gc29tZSBjYXNlcyB1c2VycyBtYXkgd2lzaCB0byBkaXNhYmxlIHRoaXMgdG8gYXZvaWQgcmVuZGVyaW5nIGFydGlmYWN0cy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY29tcC1vcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWNvbXAtb3BcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiYWRkIHRoZSBjdXJyZW50IHN5bWJvbGl6ZXIgb24gdG9wIG9mIG90aGVyIHN5bWJvbGl6ZXJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBzeW1ib2xpemVyIHNob3VsZCBiZWhhdmUgcmVsYXRpdmUgdG8gc3ltYm9saXplcnMgYXRvcCBvciBiZWxvdyBpdC5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1wiY2xlYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGx1c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzY3JlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGFya2VuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGlnaHRlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWRvZGdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItYnVyblwiLFxuICAgICAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzb2Z0LWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlmZmVyZW5jZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnRyYXN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLW1lcmdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tZXh0cmFjdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNhdHVyYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYnVpbGRpbmdcIjoge1xuICAgICAgICAgICAgXCJmaWxsXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImJ1aWxkaW5nLWZpbGxcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIjRkZGRkZGXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgY29sb3Igb2YgdGhlIGJ1aWxkaW5ncyB3YWxscy5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJjb2xvclwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmaWxsLW9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiYnVpbGRpbmctZmlsbC1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBvcGFjaXR5IG9mIHRoZSBidWlsZGluZyBhcyBhIHdob2xlLCBpbmNsdWRpbmcgYWxsIHdhbGxzLlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJoZWlnaHRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiYnVpbGRpbmctaGVpZ2h0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgaGVpZ2h0IG9mIHRoZSBidWlsZGluZyBpbiBwaXhlbHMuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImV4cHJlc3Npb25cIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIwXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJ0b3JxdWVcIjoge1xuICAgICAgICAgIFwiLXRvcnF1ZS1jbGVhci1jb2xvclwiOiB7XG4gICAgICAgICAgICAgIFwiY3NzXCI6IFwiLXRvcnF1ZS1jbGVhci1jb2xvclwiLFxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJjb2xvclwiLFxuICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDApXCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZnVsbCBjbGVhclwiLFxuICAgICAgICAgICAgICBcImRvY1wiOiBcImNvbG9yIHVzZWQgdG8gY2xlYXIgY2FudmFzIG9uIGVhY2ggZnJhbWVcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCItdG9ycXVlLWZyYW1lLWNvdW50XCI6IHtcbiAgICAgICAgICAgICAgXCJjc3NcIjogXCItdG9ycXVlLWZyYW1lLWNvdW50XCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIjEyOFwiLFxuICAgICAgICAgICAgICBcInR5cGVcIjpcImZsb2F0XCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwidGhlIGRhdGEgaXMgYnJva2VuIGludG8gMTI4IHRpbWUgZnJhbWVzXCIsXG4gICAgICAgICAgICAgIFwiZG9jXCI6IFwiTnVtYmVyIG9mIGFuaW1hdGlvbiBzdGVwcy9mcmFtZXMgdXNlZCBpbiB0aGUgYW5pbWF0aW9uLiBJZiB0aGUgZGF0YSBjb250YWlucyBhIGZld2VyZSBudW1iZXIgb2YgdG90YWwgZnJhbWVzLCB0aGUgbGVzc2VyIHZhbHVlIHdpbGwgYmUgdXNlZC5cIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCItdG9ycXVlLXJlc29sdXRpb25cIjoge1xuICAgICAgICAgICAgICBcImNzc1wiOiBcIi10b3JxdWUtcmVzb2x1dGlvblwiLFxuICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIyXCIsXG4gICAgICAgICAgICAgIFwidHlwZVwiOlwiZmxvYXRcIixcbiAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJcIixcbiAgICAgICAgICAgICAgXCJkb2NcIjogXCJTcGF0aWFsIHJlc29sdXRpb24gaW4gcGl4ZWxzLiBBIHJlc29sdXRpb24gb2YgMSBtZWFucyBubyBzcGF0aWFsIGFnZ3JlZ2F0aW9uIG9mIHRoZSBkYXRhLiBBbnkgb3RoZXIgcmVzb2x1dGlvbiBvZiBOIHJlc3VsdHMgaW4gc3BhdGlhbCBhZ2dyZWdhdGlvbiBpbnRvIGNlbGxzIG9mIE54TiBwaXhlbHMuIFRoZSB2YWx1ZSBOIG11c3QgYmUgcG93ZXIgb2YgMlwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIi10b3JxdWUtYW5pbWF0aW9uLWR1cmF0aW9uXCI6IHtcbiAgICAgICAgICAgICAgXCJjc3NcIjogXCItdG9ycXVlLWFuaW1hdGlvbi1kdXJhdGlvblwiLFxuICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIzMFwiLFxuICAgICAgICAgICAgICBcInR5cGVcIjpcImZsb2F0XCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwidGhlIGFuaW1hdGlvbiBsYXN0cyAzMCBzZWNvbmRzXCIsXG4gICAgICAgICAgICAgIFwiZG9jXCI6IFwiQW5pbWF0aW9uIGR1cmF0aW9uIGluIHNlY29uZHNcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCItdG9ycXVlLWFnZ3JlZ2F0aW9uLWZ1bmN0aW9uXCI6IHtcbiAgICAgICAgICAgICAgXCJjc3NcIjogXCItdG9ycXVlLWFnZ3JlZ2F0aW9uLWZ1bmN0aW9uXCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImNvdW50KGNhcnRvZGJfaWQpXCIsXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcInRoZSB2YWx1ZSBmb3IgZWFjaCBjZWxsIGlzIHRoZSBjb3VudCBvZiBwb2ludHMgaW4gdGhhdCBjZWxsXCIsXG4gICAgICAgICAgICAgIFwiZG9jXCI6IFwiQSBmdW5jdGlvbiB1c2VkIHRvIGNhbGN1bGF0ZSBhIHZhbHVlIGZyb20gdGhlIGFnZ3JlZ2F0ZSBkYXRhIGZvciBlYWNoIGNlbGwuIFNlZSAtdG9ycXVlLXJlc29sdXRpb25cIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCItdG9ycXVlLXRpbWUtYXR0cmlidXRlXCI6IHtcbiAgICAgICAgICAgICAgXCJjc3NcIjogXCItdG9ycXVlLXRpbWUtYXR0cmlidXRlXCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInRpbWVcIixcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwidGhlIGRhdGEgY29sdW1uIGluIHlvdXIgdGFibGUgdGhhdCBpcyBvZiBhIHRpbWUgYmFzZWQgdHlwZVwiLFxuICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSB0YWJsZSBjb2x1bW4gdGhhdCBjb250YWlucyB0aGUgdGltZSBpbmZvcm1hdGlvbiB1c2VkIGNyZWF0ZSB0aGUgYW5pbWF0aW9uXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiLXRvcnF1ZS1kYXRhLWFnZ3JlZ2F0aW9uXCI6IHtcbiAgICAgICAgICAgICAgXCJjc3NcIjogXCItdG9ycXVlLWRhdGEtYWdncmVnYXRpb25cIixcbiAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibGluZWFyXCIsXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgXCJsaW5lYXJcIixcbiAgICAgICAgICAgICAgICBcImN1bXVsYXRpdmVcIlxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcInByZXZpb3VzIHZhbHVlcyBhcmUgZGlzY2FyZGVkXCIsXG4gICAgICAgICAgICAgIFwiZG9jXCI6IFwiQSBsaW5lYXIgYW5pbWF0aW9uIHdpbGwgZGlzY2FyZCBwcmV2aW91cyB2YWx1ZXMgd2hpbGUgYSBjdW11bGF0aXZlIGFuaW1hdGlvbiB3aWxsIGFjY3VtdWxhdGUgdGhlbSB1bnRpbCBpdCByZXN0YXJ0c1wiXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcImNvbG9yc1wiOiB7XG4gICAgICAgIFwiYWxpY2VibHVlXCI6ICBbMjQwLCAyNDgsIDI1NV0sXG4gICAgICAgIFwiYW50aXF1ZXdoaXRlXCI6ICBbMjUwLCAyMzUsIDIxNV0sXG4gICAgICAgIFwiYXF1YVwiOiAgWzAsIDI1NSwgMjU1XSxcbiAgICAgICAgXCJhcXVhbWFyaW5lXCI6ICBbMTI3LCAyNTUsIDIxMl0sXG4gICAgICAgIFwiYXp1cmVcIjogIFsyNDAsIDI1NSwgMjU1XSxcbiAgICAgICAgXCJiZWlnZVwiOiAgWzI0NSwgMjQ1LCAyMjBdLFxuICAgICAgICBcImJpc3F1ZVwiOiAgWzI1NSwgMjI4LCAxOTZdLFxuICAgICAgICBcImJsYWNrXCI6ICBbMCwgMCwgMF0sXG4gICAgICAgIFwiYmxhbmNoZWRhbG1vbmRcIjogIFsyNTUsMjM1LDIwNV0sXG4gICAgICAgIFwiYmx1ZVwiOiAgWzAsIDAsIDI1NV0sXG4gICAgICAgIFwiYmx1ZXZpb2xldFwiOiAgWzEzOCwgNDMsIDIyNl0sXG4gICAgICAgIFwiYnJvd25cIjogIFsxNjUsIDQyLCA0Ml0sXG4gICAgICAgIFwiYnVybHl3b29kXCI6ICBbMjIyLCAxODQsIDEzNV0sXG4gICAgICAgIFwiY2FkZXRibHVlXCI6ICBbOTUsIDE1OCwgMTYwXSxcbiAgICAgICAgXCJjaGFydHJldXNlXCI6ICBbMTI3LCAyNTUsIDBdLFxuICAgICAgICBcImNob2NvbGF0ZVwiOiAgWzIxMCwgMTA1LCAzMF0sXG4gICAgICAgIFwiY29yYWxcIjogIFsyNTUsIDEyNywgODBdLFxuICAgICAgICBcImNvcm5mbG93ZXJibHVlXCI6ICBbMTAwLCAxNDksIDIzN10sXG4gICAgICAgIFwiY29ybnNpbGtcIjogIFsyNTUsIDI0OCwgMjIwXSxcbiAgICAgICAgXCJjcmltc29uXCI6ICBbMjIwLCAyMCwgNjBdLFxuICAgICAgICBcImN5YW5cIjogIFswLCAyNTUsIDI1NV0sXG4gICAgICAgIFwiZGFya2JsdWVcIjogIFswLCAwLCAxMzldLFxuICAgICAgICBcImRhcmtjeWFuXCI6ICBbMCwgMTM5LCAxMzldLFxuICAgICAgICBcImRhcmtnb2xkZW5yb2RcIjogIFsxODQsIDEzNCwgMTFdLFxuICAgICAgICBcImRhcmtncmF5XCI6ICBbMTY5LCAxNjksIDE2OV0sXG4gICAgICAgIFwiZGFya2dyZWVuXCI6ICBbMCwgMTAwLCAwXSxcbiAgICAgICAgXCJkYXJrZ3JleVwiOiAgWzE2OSwgMTY5LCAxNjldLFxuICAgICAgICBcImRhcmtraGFraVwiOiAgWzE4OSwgMTgzLCAxMDddLFxuICAgICAgICBcImRhcmttYWdlbnRhXCI6ICBbMTM5LCAwLCAxMzldLFxuICAgICAgICBcImRhcmtvbGl2ZWdyZWVuXCI6ICBbODUsIDEwNywgNDddLFxuICAgICAgICBcImRhcmtvcmFuZ2VcIjogIFsyNTUsIDE0MCwgMF0sXG4gICAgICAgIFwiZGFya29yY2hpZFwiOiAgWzE1MywgNTAsIDIwNF0sXG4gICAgICAgIFwiZGFya3JlZFwiOiAgWzEzOSwgMCwgMF0sXG4gICAgICAgIFwiZGFya3NhbG1vblwiOiAgWzIzMywgMTUwLCAxMjJdLFxuICAgICAgICBcImRhcmtzZWFncmVlblwiOiAgWzE0MywgMTg4LCAxNDNdLFxuICAgICAgICBcImRhcmtzbGF0ZWJsdWVcIjogIFs3MiwgNjEsIDEzOV0sXG4gICAgICAgIFwiZGFya3NsYXRlZ3JleVwiOiAgWzQ3LCA3OSwgNzldLFxuICAgICAgICBcImRhcmt0dXJxdW9pc2VcIjogIFswLCAyMDYsIDIwOV0sXG4gICAgICAgIFwiZGFya3Zpb2xldFwiOiAgWzE0OCwgMCwgMjExXSxcbiAgICAgICAgXCJkZWVwcGlua1wiOiAgWzI1NSwgMjAsIDE0N10sXG4gICAgICAgIFwiZGVlcHNreWJsdWVcIjogIFswLCAxOTEsIDI1NV0sXG4gICAgICAgIFwiZGltZ3JheVwiOiAgWzEwNSwgMTA1LCAxMDVdLFxuICAgICAgICBcImRpbWdyZXlcIjogIFsxMDUsIDEwNSwgMTA1XSxcbiAgICAgICAgXCJkb2RnZXJibHVlXCI6ICBbMzAsIDE0NCwgMjU1XSxcbiAgICAgICAgXCJmaXJlYnJpY2tcIjogIFsxNzgsIDM0LCAzNF0sXG4gICAgICAgIFwiZmxvcmFsd2hpdGVcIjogIFsyNTUsIDI1MCwgMjQwXSxcbiAgICAgICAgXCJmb3Jlc3RncmVlblwiOiAgWzM0LCAxMzksIDM0XSxcbiAgICAgICAgXCJmdWNoc2lhXCI6ICBbMjU1LCAwLCAyNTVdLFxuICAgICAgICBcImdhaW5zYm9yb1wiOiAgWzIyMCwgMjIwLCAyMjBdLFxuICAgICAgICBcImdob3N0d2hpdGVcIjogIFsyNDgsIDI0OCwgMjU1XSxcbiAgICAgICAgXCJnb2xkXCI6ICBbMjU1LCAyMTUsIDBdLFxuICAgICAgICBcImdvbGRlbnJvZFwiOiAgWzIxOCwgMTY1LCAzMl0sXG4gICAgICAgIFwiZ3JheVwiOiAgWzEyOCwgMTI4LCAxMjhdLFxuICAgICAgICBcImdyZXlcIjogIFsxMjgsIDEyOCwgMTI4XSxcbiAgICAgICAgXCJncmVlblwiOiAgWzAsIDEyOCwgMF0sXG4gICAgICAgIFwiZ3JlZW55ZWxsb3dcIjogIFsxNzMsIDI1NSwgNDddLFxuICAgICAgICBcImhvbmV5ZGV3XCI6ICBbMjQwLCAyNTUsIDI0MF0sXG4gICAgICAgIFwiaG90cGlua1wiOiAgWzI1NSwgMTA1LCAxODBdLFxuICAgICAgICBcImluZGlhbnJlZFwiOiAgWzIwNSwgOTIsIDkyXSxcbiAgICAgICAgXCJpbmRpZ29cIjogIFs3NSwgMCwgMTMwXSxcbiAgICAgICAgXCJpdm9yeVwiOiAgWzI1NSwgMjU1LCAyNDBdLFxuICAgICAgICBcImtoYWtpXCI6ICBbMjQwLCAyMzAsIDE0MF0sXG4gICAgICAgIFwibGF2ZW5kZXJcIjogIFsyMzAsIDIzMCwgMjUwXSxcbiAgICAgICAgXCJsYXZlbmRlcmJsdXNoXCI6ICBbMjU1LCAyNDAsIDI0NV0sXG4gICAgICAgIFwibGF3bmdyZWVuXCI6ICBbMTI0LCAyNTIsIDBdLFxuICAgICAgICBcImxlbW9uY2hpZmZvblwiOiAgWzI1NSwgMjUwLCAyMDVdLFxuICAgICAgICBcImxpZ2h0Ymx1ZVwiOiAgWzE3MywgMjE2LCAyMzBdLFxuICAgICAgICBcImxpZ2h0Y29yYWxcIjogIFsyNDAsIDEyOCwgMTI4XSxcbiAgICAgICAgXCJsaWdodGN5YW5cIjogIFsyMjQsIDI1NSwgMjU1XSxcbiAgICAgICAgXCJsaWdodGdvbGRlbnJvZHllbGxvd1wiOiAgWzI1MCwgMjUwLCAyMTBdLFxuICAgICAgICBcImxpZ2h0Z3JheVwiOiAgWzIxMSwgMjExLCAyMTFdLFxuICAgICAgICBcImxpZ2h0Z3JlZW5cIjogIFsxNDQsIDIzOCwgMTQ0XSxcbiAgICAgICAgXCJsaWdodGdyZXlcIjogIFsyMTEsIDIxMSwgMjExXSxcbiAgICAgICAgXCJsaWdodHBpbmtcIjogIFsyNTUsIDE4MiwgMTkzXSxcbiAgICAgICAgXCJsaWdodHNhbG1vblwiOiAgWzI1NSwgMTYwLCAxMjJdLFxuICAgICAgICBcImxpZ2h0c2VhZ3JlZW5cIjogIFszMiwgMTc4LCAxNzBdLFxuICAgICAgICBcImxpZ2h0c2t5Ymx1ZVwiOiAgWzEzNSwgMjA2LCAyNTBdLFxuICAgICAgICBcImxpZ2h0c2xhdGVncmF5XCI6ICBbMTE5LCAxMzYsIDE1M10sXG4gICAgICAgIFwibGlnaHRzbGF0ZWdyZXlcIjogIFsxMTksIDEzNiwgMTUzXSxcbiAgICAgICAgXCJsaWdodHN0ZWVsYmx1ZVwiOiAgWzE3NiwgMTk2LCAyMjJdLFxuICAgICAgICBcImxpZ2h0eWVsbG93XCI6ICBbMjU1LCAyNTUsIDIyNF0sXG4gICAgICAgIFwibGltZVwiOiAgWzAsIDI1NSwgMF0sXG4gICAgICAgIFwibGltZWdyZWVuXCI6ICBbNTAsIDIwNSwgNTBdLFxuICAgICAgICBcImxpbmVuXCI6ICBbMjUwLCAyNDAsIDIzMF0sXG4gICAgICAgIFwibWFnZW50YVwiOiAgWzI1NSwgMCwgMjU1XSxcbiAgICAgICAgXCJtYXJvb25cIjogIFsxMjgsIDAsIDBdLFxuICAgICAgICBcIm1lZGl1bWFxdWFtYXJpbmVcIjogIFsxMDIsIDIwNSwgMTcwXSxcbiAgICAgICAgXCJtZWRpdW1ibHVlXCI6ICBbMCwgMCwgMjA1XSxcbiAgICAgICAgXCJtZWRpdW1vcmNoaWRcIjogIFsxODYsIDg1LCAyMTFdLFxuICAgICAgICBcIm1lZGl1bXB1cnBsZVwiOiAgWzE0NywgMTEyLCAyMTldLFxuICAgICAgICBcIm1lZGl1bXNlYWdyZWVuXCI6ICBbNjAsIDE3OSwgMTEzXSxcbiAgICAgICAgXCJtZWRpdW1zbGF0ZWJsdWVcIjogIFsxMjMsIDEwNCwgMjM4XSxcbiAgICAgICAgXCJtZWRpdW1zcHJpbmdncmVlblwiOiAgWzAsIDI1MCwgMTU0XSxcbiAgICAgICAgXCJtZWRpdW10dXJxdW9pc2VcIjogIFs3MiwgMjA5LCAyMDRdLFxuICAgICAgICBcIm1lZGl1bXZpb2xldHJlZFwiOiAgWzE5OSwgMjEsIDEzM10sXG4gICAgICAgIFwibWlkbmlnaHRibHVlXCI6ICBbMjUsIDI1LCAxMTJdLFxuICAgICAgICBcIm1pbnRjcmVhbVwiOiAgWzI0NSwgMjU1LCAyNTBdLFxuICAgICAgICBcIm1pc3R5cm9zZVwiOiAgWzI1NSwgMjI4LCAyMjVdLFxuICAgICAgICBcIm1vY2Nhc2luXCI6ICBbMjU1LCAyMjgsIDE4MV0sXG4gICAgICAgIFwibmF2YWpvd2hpdGVcIjogIFsyNTUsIDIyMiwgMTczXSxcbiAgICAgICAgXCJuYXZ5XCI6ICBbMCwgMCwgMTI4XSxcbiAgICAgICAgXCJvbGRsYWNlXCI6ICBbMjUzLCAyNDUsIDIzMF0sXG4gICAgICAgIFwib2xpdmVcIjogIFsxMjgsIDEyOCwgMF0sXG4gICAgICAgIFwib2xpdmVkcmFiXCI6ICBbMTA3LCAxNDIsIDM1XSxcbiAgICAgICAgXCJvcmFuZ2VcIjogIFsyNTUsIDE2NSwgMF0sXG4gICAgICAgIFwib3JhbmdlcmVkXCI6ICBbMjU1LCA2OSwgMF0sXG4gICAgICAgIFwib3JjaGlkXCI6ICBbMjE4LCAxMTIsIDIxNF0sXG4gICAgICAgIFwicGFsZWdvbGRlbnJvZFwiOiAgWzIzOCwgMjMyLCAxNzBdLFxuICAgICAgICBcInBhbGVncmVlblwiOiAgWzE1MiwgMjUxLCAxNTJdLFxuICAgICAgICBcInBhbGV0dXJxdW9pc2VcIjogIFsxNzUsIDIzOCwgMjM4XSxcbiAgICAgICAgXCJwYWxldmlvbGV0cmVkXCI6ICBbMjE5LCAxMTIsIDE0N10sXG4gICAgICAgIFwicGFwYXlhd2hpcFwiOiAgWzI1NSwgMjM5LCAyMTNdLFxuICAgICAgICBcInBlYWNocHVmZlwiOiAgWzI1NSwgMjE4LCAxODVdLFxuICAgICAgICBcInBlcnVcIjogIFsyMDUsIDEzMywgNjNdLFxuICAgICAgICBcInBpbmtcIjogIFsyNTUsIDE5MiwgMjAzXSxcbiAgICAgICAgXCJwbHVtXCI6ICBbMjIxLCAxNjAsIDIyMV0sXG4gICAgICAgIFwicG93ZGVyYmx1ZVwiOiAgWzE3NiwgMjI0LCAyMzBdLFxuICAgICAgICBcInB1cnBsZVwiOiAgWzEyOCwgMCwgMTI4XSxcbiAgICAgICAgXCJyZWRcIjogIFsyNTUsIDAsIDBdLFxuICAgICAgICBcInJvc3licm93blwiOiAgWzE4OCwgMTQzLCAxNDNdLFxuICAgICAgICBcInJveWFsYmx1ZVwiOiAgWzY1LCAxMDUsIDIyNV0sXG4gICAgICAgIFwic2FkZGxlYnJvd25cIjogIFsxMzksIDY5LCAxOV0sXG4gICAgICAgIFwic2FsbW9uXCI6ICBbMjUwLCAxMjgsIDExNF0sXG4gICAgICAgIFwic2FuZHlicm93blwiOiAgWzI0NCwgMTY0LCA5Nl0sXG4gICAgICAgIFwic2VhZ3JlZW5cIjogIFs0NiwgMTM5LCA4N10sXG4gICAgICAgIFwic2Vhc2hlbGxcIjogIFsyNTUsIDI0NSwgMjM4XSxcbiAgICAgICAgXCJzaWVubmFcIjogIFsxNjAsIDgyLCA0NV0sXG4gICAgICAgIFwic2lsdmVyXCI6ICBbMTkyLCAxOTIsIDE5Ml0sXG4gICAgICAgIFwic2t5Ymx1ZVwiOiAgWzEzNSwgMjA2LCAyMzVdLFxuICAgICAgICBcInNsYXRlYmx1ZVwiOiAgWzEwNiwgOTAsIDIwNV0sXG4gICAgICAgIFwic2xhdGVncmF5XCI6ICBbMTEyLCAxMjgsIDE0NF0sXG4gICAgICAgIFwic2xhdGVncmV5XCI6ICBbMTEyLCAxMjgsIDE0NF0sXG4gICAgICAgIFwic25vd1wiOiAgWzI1NSwgMjUwLCAyNTBdLFxuICAgICAgICBcInNwcmluZ2dyZWVuXCI6ICBbMCwgMjU1LCAxMjddLFxuICAgICAgICBcInN0ZWVsYmx1ZVwiOiAgWzcwLCAxMzAsIDE4MF0sXG4gICAgICAgIFwidGFuXCI6ICBbMjEwLCAxODAsIDE0MF0sXG4gICAgICAgIFwidGVhbFwiOiAgWzAsIDEyOCwgMTI4XSxcbiAgICAgICAgXCJ0aGlzdGxlXCI6ICBbMjE2LCAxOTEsIDIxNl0sXG4gICAgICAgIFwidG9tYXRvXCI6ICBbMjU1LCA5OSwgNzFdLFxuICAgICAgICBcInR1cnF1b2lzZVwiOiAgWzY0LCAyMjQsIDIwOF0sXG4gICAgICAgIFwidmlvbGV0XCI6ICBbMjM4LCAxMzAsIDIzOF0sXG4gICAgICAgIFwid2hlYXRcIjogIFsyNDUsIDIyMiwgMTc5XSxcbiAgICAgICAgXCJ3aGl0ZVwiOiAgWzI1NSwgMjU1LCAyNTVdLFxuICAgICAgICBcIndoaXRlc21va2VcIjogIFsyNDUsIDI0NSwgMjQ1XSxcbiAgICAgICAgXCJ5ZWxsb3dcIjogIFsyNTUsIDI1NSwgMF0sXG4gICAgICAgIFwieWVsbG93Z3JlZW5cIjogIFsxNTQsIDIwNSwgNTBdLFxuICAgICAgICBcInRyYW5zcGFyZW50XCI6ICBbMCwgMCwgMCwgMF1cbiAgICB9LFxuICAgIFwiZmlsdGVyXCI6IHtcbiAgICAgICAgXCJ2YWx1ZVwiOiBbXG4gICAgICAgICAgICBcInRydWVcIixcbiAgICAgICAgICAgIFwiZmFsc2VcIixcbiAgICAgICAgICAgIFwibnVsbFwiLFxuICAgICAgICAgICAgXCJwb2ludFwiLFxuICAgICAgICAgICAgXCJsaW5lc3RyaW5nXCIsXG4gICAgICAgICAgICBcInBvbHlnb25cIixcbiAgICAgICAgICAgIFwiY29sbGVjdGlvblwiXG4gICAgICAgIF1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB2ZXJzaW9uOiB7XG4gICAgbGF0ZXN0OiBfbWFwbmlrX3JlZmVyZW5jZV9sYXRlc3QsXG4gICAgJzIuMS4xJzogX21hcG5pa19yZWZlcmVuY2VfbGF0ZXN0XG4gIH1cbn07XG4iLCIvKipcbiAqIFRPRE86IGRvY3VtZW50IHRoaXMuIFdoYXQgZG9lcyB0aGlzIGRvP1xuICovXG5pZih0eXBlb2YobW9kdWxlKSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICBtb2R1bGUuZXhwb3J0cy5maW5kID0gZnVuY3Rpb24gKG9iaiwgZnVuKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IG9iai5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChyID0gZnVuLmNhbGwob2JqLCBvYmpbaV0pKSB7IHJldHVybiByOyB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgfTtcbn1cbiIsIihmdW5jdGlvbih0cmVlKSB7XG52YXIgXyA9IGdsb2JhbC5fIHx8IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbnRyZWUuQ2FsbCA9IGZ1bmN0aW9uIENhbGwobmFtZSwgYXJncywgaW5kZXgpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMuYXJncyA9IGFyZ3M7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xufTtcblxudHJlZS5DYWxsLnByb3RvdHlwZSA9IHtcbiAgICBpczogJ2NhbGwnLFxuICAgIC8vIFdoZW4gZXZ1YXRpbmcgYSBmdW5jdGlvbiBjYWxsLFxuICAgIC8vIHdlIGVpdGhlciBmaW5kIHRoZSBmdW5jdGlvbiBpbiBgdHJlZS5mdW5jdGlvbnNgIFsxXSxcbiAgICAvLyBpbiB3aGljaCBjYXNlIHdlIGNhbGwgaXQsIHBhc3NpbmcgdGhlICBldmFsdWF0ZWQgYXJndW1lbnRzLFxuICAgIC8vIG9yIHdlIHNpbXBseSBwcmludCBpdCBvdXQgYXMgaXQgYXBwZWFyZWQgb3JpZ2luYWxseSBbMl0uXG4gICAgLy8gVGhlICpmdW5jdGlvbnMuanMqIGZpbGUgY29udGFpbnMgdGhlIGJ1aWx0LWluIGZ1bmN0aW9ucy5cbiAgICAvLyBUaGUgcmVhc29uIHdoeSB3ZSBldmFsdWF0ZSB0aGUgYXJndW1lbnRzLCBpcyBpbiB0aGUgY2FzZSB3aGVyZVxuICAgIC8vIHdlIHRyeSB0byBwYXNzIGEgdmFyaWFibGUgdG8gYSBmdW5jdGlvbiwgbGlrZTogYHNhdHVyYXRlKEBjb2xvcilgLlxuICAgIC8vIFRoZSBmdW5jdGlvbiBzaG91bGQgcmVjZWl2ZSB0aGUgdmFsdWUsIG5vdCB0aGUgdmFyaWFibGUuXG4gICAgJ2V2JzogZnVuY3Rpb24oZW52KSB7XG4gICAgICAgIHZhciBhcmdzID0gdGhpcy5hcmdzLm1hcChmdW5jdGlvbihhKSB7IHJldHVybiBhLmV2KGVudik7IH0pO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGFyZ3NbaV0uaXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgaXM6ICd1bmRlZmluZWQnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubmFtZSBpbiB0cmVlLmZ1bmN0aW9ucykge1xuICAgICAgICAgICAgaWYgKHRyZWUuZnVuY3Rpb25zW3RoaXMubmFtZV0ubGVuZ3RoIDw9IGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IHRyZWUuZnVuY3Rpb25zW3RoaXMubmFtZV0uYXBwbHkodHJlZS5mdW5jdGlvbnMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGlmICh2YWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdpbmNvcnJlY3QgYXJndW1lbnRzIGdpdmVuIHRvICcgKyB0aGlzLm5hbWUgKyAnKCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAncnVudGltZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgaXM6ICd1bmRlZmluZWQnLCB2YWx1ZTogJ3VuZGVmaW5lZCcgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ2luY29ycmVjdCBudW1iZXIgb2YgYXJndW1lbnRzIGZvciAnICsgdGhpcy5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgICAgICcoKS4gJyArIHRyZWUuZnVuY3Rpb25zW3RoaXMubmFtZV0ubGVuZ3RoICsgJyBleHBlY3RlZC4nLFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3J1bnRpbWUnLFxuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBmbiA9IHRyZWUuUmVmZXJlbmNlLm1hcG5pa0Z1bmN0aW9uc1t0aGlzLm5hbWVdO1xuICAgICAgICAgICAgaWYgKGZuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25zID0gXy5wYWlycyh0cmVlLlJlZmVyZW5jZS5tYXBuaWtGdW5jdGlvbnMpO1xuICAgICAgICAgICAgICAgIC8vIGNoZWFwIGNsb3Nlc3QsIG5lZWRzIGltcHJvdmVtZW50LlxuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy5uYW1lO1xuICAgICAgICAgICAgICAgIHZhciBtZWFuID0gZnVuY3Rpb25zLm1hcChmdW5jdGlvbihmKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbZlswXSwgdHJlZS5SZWZlcmVuY2UuZWRpdERpc3RhbmNlKG5hbWUsIGZbMF0pLCBmWzFdXTtcbiAgICAgICAgICAgICAgICB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFbMV0gLSBiWzFdO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICd1bmtub3duIGZ1bmN0aW9uICcgKyB0aGlzLm5hbWUgKyAnKCksIGRpZCB5b3UgbWVhbiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lYW5bMF1bMF0gKyAnKCcgKyBtZWFuWzBdWzJdICsgJyknLFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3J1bnRpbWUnLFxuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmbiAhPT0gYXJncy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICAhKEFycmF5LmlzQXJyYXkoZm4pICYmIF8uaW5jbHVkZShmbiwgYXJncy5sZW5ndGgpKSAmJlxuICAgICAgICAgICAgICAgIC8vIHN1cHBvcnQgdmFyaWFibGUtYXJnIGZ1bmN0aW9ucyBsaWtlIGBjb2xvcml6ZS1hbHBoYWBcbiAgICAgICAgICAgICAgICBmbiAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnZnVuY3Rpb24gJyArIHRoaXMubmFtZSArICcoKSB0YWtlcyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuICsgJyBhcmd1bWVudHMgYW5kIHdhcyBnaXZlbiAnICsgYXJncy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAncnVudGltZScsXG4gICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgaXM6ICd1bmRlZmluZWQnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBTYXZlIHRoZSBldmFsdWF0ZWQgdmVyc2lvbnMgb2YgYXJndW1lbnRzXG4gICAgICAgICAgICAgICAgdGhpcy5hcmdzID0gYXJncztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB0b1N0cmluZzogZnVuY3Rpb24oZW52LCBmb3JtYXQpIHtcbiAgICAgICAgaWYgKHRoaXMuYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5hbWUgKyAnKCcgKyB0aGlzLmFyZ3Muam9pbignLCcpICsgJyknO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmFtZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuLy8gUkdCIENvbG9ycyAtICNmZjAwMTQsICNlZWVcbi8vIGNhbiBiZSBpbml0aWFsaXplZCB3aXRoIGEgMyBvciA2IGNoYXIgc3RyaW5nIG9yIGEgMyBvciA0IGVsZW1lbnRcbi8vIG51bWVyaWNhbCBhcnJheVxudHJlZS5Db2xvciA9IGZ1bmN0aW9uIENvbG9yKHJnYiwgYSkge1xuICAgIC8vIFRoZSBlbmQgZ29hbCBoZXJlLCBpcyB0byBwYXJzZSB0aGUgYXJndW1lbnRzXG4gICAgLy8gaW50byBhbiBpbnRlZ2VyIHRyaXBsZXQsIHN1Y2ggYXMgYDEyOCwgMjU1LCAwYFxuICAgIC8vXG4gICAgLy8gVGhpcyBmYWNpbGl0YXRlcyBvcGVyYXRpb25zIGFuZCBjb252ZXJzaW9ucy5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShyZ2IpKSB7XG4gICAgICAgIHRoaXMucmdiID0gcmdiLnNsaWNlKDAsIDMpO1xuICAgIH0gZWxzZSBpZiAocmdiLmxlbmd0aCA9PSA2KSB7XG4gICAgICAgIHRoaXMucmdiID0gcmdiLm1hdGNoKC8uezJ9L2cpLm1hcChmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoYywgMTYpO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJnYiA9IHJnYi5zcGxpdCgnJykubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUludChjICsgYywgMTYpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mKGEpID09PSAnbnVtYmVyJykge1xuICAgICAgICB0aGlzLmFscGhhID0gYTtcbiAgICB9IGVsc2UgaWYgKHJnYi5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgdGhpcy5hbHBoYSA9IHJnYlszXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFscGhhID0gMTtcbiAgICB9XG59O1xuXG50cmVlLkNvbG9yLnByb3RvdHlwZSA9IHtcbiAgICBpczogJ2NvbG9yJyxcbiAgICAnZXYnOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0sXG5cbiAgICAvLyBJZiB3ZSBoYXZlIHNvbWUgdHJhbnNwYXJlbmN5LCB0aGUgb25seSB3YXkgdG8gcmVwcmVzZW50IGl0XG4gICAgLy8gaXMgdmlhIGByZ2JhYC4gT3RoZXJ3aXNlLCB3ZSB1c2UgdGhlIGhleCByZXByZXNlbnRhdGlvbixcbiAgICAvLyB3aGljaCBoYXMgYmV0dGVyIGNvbXBhdGliaWxpdHkgd2l0aCBvbGRlciBicm93c2Vycy5cbiAgICAvLyBWYWx1ZXMgYXJlIGNhcHBlZCBiZXR3ZWVuIGAwYCBhbmQgYDI1NWAsIHJvdW5kZWQgYW5kIHplcm8tcGFkZGVkLlxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuYWxwaGEgPCAxLjApIHtcbiAgICAgICAgICAgIHJldHVybiAncmdiYSgnICsgdGhpcy5yZ2IubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChjKTtcbiAgICAgICAgICAgIH0pLmNvbmNhdCh0aGlzLmFscGhhKS5qb2luKCcsICcpICsgJyknO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICcjJyArIHRoaXMucmdiLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICAgICAgICAgICAgaSA9IE1hdGgucm91bmQoaSk7XG4gICAgICAgICAgICAgICAgaSA9IChpID4gMjU1ID8gMjU1IDogKGkgPCAwID8gMCA6IGkpKS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkubGVuZ3RoID09PSAxID8gJzAnICsgaSA6IGk7XG4gICAgICAgICAgICB9KS5qb2luKCcnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBPcGVyYXRpb25zIGhhdmUgdG8gYmUgZG9uZSBwZXItY2hhbm5lbCwgaWYgbm90LFxuICAgIC8vIGNoYW5uZWxzIHdpbGwgc3BpbGwgb250byBlYWNoIG90aGVyLiBPbmNlIHdlIGhhdmVcbiAgICAvLyBvdXIgcmVzdWx0LCBpbiB0aGUgZm9ybSBvZiBhbiBpbnRlZ2VyIHRyaXBsZXQsXG4gICAgLy8gd2UgY3JlYXRlIGEgbmV3IENvbG9yIG5vZGUgdG8gaG9sZCB0aGUgcmVzdWx0LlxuICAgIG9wZXJhdGU6IGZ1bmN0aW9uKGVudiwgb3AsIG90aGVyKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICBpZiAoISAob3RoZXIgaW5zdGFuY2VvZiB0cmVlLkNvbG9yKSkge1xuICAgICAgICAgICAgb3RoZXIgPSBvdGhlci50b0NvbG9yKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBjID0gMDsgYyA8IDM7IGMrKykge1xuICAgICAgICAgICAgcmVzdWx0W2NdID0gdHJlZS5vcGVyYXRlKG9wLCB0aGlzLnJnYltjXSwgb3RoZXIucmdiW2NdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IHRyZWUuQ29sb3IocmVzdWx0KTtcbiAgICB9LFxuXG4gICAgdG9IU0w6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgciA9IHRoaXMucmdiWzBdIC8gMjU1LFxuICAgICAgICAgICAgZyA9IHRoaXMucmdiWzFdIC8gMjU1LFxuICAgICAgICAgICAgYiA9IHRoaXMucmdiWzJdIC8gMjU1LFxuICAgICAgICAgICAgYSA9IHRoaXMuYWxwaGE7XG5cbiAgICAgICAgdmFyIG1heCA9IE1hdGgubWF4KHIsIGcsIGIpLCBtaW4gPSBNYXRoLm1pbihyLCBnLCBiKTtcbiAgICAgICAgdmFyIGgsIHMsIGwgPSAobWF4ICsgbWluKSAvIDIsIGQgPSBtYXggLSBtaW47XG5cbiAgICAgICAgaWYgKG1heCA9PT0gbWluKSB7XG4gICAgICAgICAgICBoID0gcyA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzID0gbCA+IDAuNSA/IGQgLyAoMiAtIG1heCAtIG1pbikgOiBkIC8gKG1heCArIG1pbik7XG5cbiAgICAgICAgICAgIHN3aXRjaCAobWF4KSB7XG4gICAgICAgICAgICAgICAgY2FzZSByOiBoID0gKGcgLSBiKSAvIGQgKyAoZyA8IGIgPyA2IDogMCk7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgZzogaCA9IChiIC0gcikgLyBkICsgMjsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBiOiBoID0gKHIgLSBnKSAvIGQgKyA0OyBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGggLz0gNjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBoOiBoICogMzYwLCBzOiBzLCBsOiBsLCBhOiBhIH07XG4gICAgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuQ29tbWVudCA9IGZ1bmN0aW9uIENvbW1lbnQodmFsdWUsIHNpbGVudCkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLnNpbGVudCA9ICEhc2lsZW50O1xufTtcblxudHJlZS5Db21tZW50LnByb3RvdHlwZSA9IHtcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oZW52KSB7XG4gICAgICAgIHJldHVybiAnPCEtLScgKyB0aGlzLnZhbHVlICsgJy0tPic7XG4gICAgfSxcbiAgICAnZXYnOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH1cbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpLFxuICAgIF8gPSBnbG9iYWwuXyB8fCByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbi8vIEEgZGVmaW5pdGlvbiBpcyB0aGUgY29tYmluYXRpb24gb2YgYSBzZWxlY3RvciBhbmQgcnVsZXMsIGxpa2Vcbi8vICNmb28ge1xuLy8gICAgIHBvbHlnb24tb3BhY2l0eToxLjA7XG4vLyB9XG4vL1xuLy8gVGhlIHNlbGVjdG9yIGNhbiBoYXZlIGZpbHRlcnNcbnRyZWUuRGVmaW5pdGlvbiA9IGZ1bmN0aW9uIERlZmluaXRpb24oc2VsZWN0b3IsIHJ1bGVzKSB7XG4gICAgdGhpcy5lbGVtZW50cyA9IHNlbGVjdG9yLmVsZW1lbnRzO1xuICAgIGFzc2VydC5vayhzZWxlY3Rvci5maWx0ZXJzIGluc3RhbmNlb2YgdHJlZS5GaWx0ZXJzZXQpO1xuICAgIHRoaXMucnVsZXMgPSBydWxlcztcbiAgICB0aGlzLnJ1bGVJbmRleCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoJ3pvb20nIGluIHRoaXMucnVsZXNbaV0pIHRoaXMucnVsZXNbaV0gPSB0aGlzLnJ1bGVzW2ldLmNsb25lKCk7XG4gICAgICAgIHRoaXMucnVsZXNbaV0uem9vbSA9IHNlbGVjdG9yLnpvb207XG4gICAgICAgIHRoaXMucnVsZUluZGV4W3RoaXMucnVsZXNbaV0udXBkYXRlSUQoKV0gPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLmZpbHRlcnMgPSBzZWxlY3Rvci5maWx0ZXJzO1xuICAgIHRoaXMuem9vbSA9IHNlbGVjdG9yLnpvb207XG4gICAgdGhpcy5mcmFtZV9vZmZzZXQgPSBzZWxlY3Rvci5mcmFtZV9vZmZzZXQ7XG4gICAgdGhpcy5hdHRhY2htZW50ID0gc2VsZWN0b3IuYXR0YWNobWVudCB8fCAnX19kZWZhdWx0X18nO1xuICAgIHRoaXMuc3BlY2lmaWNpdHkgPSBzZWxlY3Rvci5zcGVjaWZpY2l0eSgpO1xufTtcblxudHJlZS5EZWZpbml0aW9uLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdHIgPSB0aGlzLmZpbHRlcnMudG9TdHJpbmcoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc3RyICs9ICdcXG4gICAgJyArIHRoaXMucnVsZXNbaV07XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59O1xuXG50cmVlLkRlZmluaXRpb24ucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oZmlsdGVycykge1xuICAgIGlmIChmaWx0ZXJzKSBhc3NlcnQub2soZmlsdGVycyBpbnN0YW5jZW9mIHRyZWUuRmlsdGVyc2V0KTtcbiAgICB2YXIgY2xvbmUgPSBPYmplY3QuY3JlYXRlKHRyZWUuRGVmaW5pdGlvbi5wcm90b3R5cGUpO1xuICAgIGNsb25lLnJ1bGVzID0gdGhpcy5ydWxlcy5zbGljZSgpO1xuICAgIGNsb25lLnJ1bGVJbmRleCA9IF8uY2xvbmUodGhpcy5ydWxlSW5kZXgpO1xuICAgIGNsb25lLmZpbHRlcnMgPSBmaWx0ZXJzID8gZmlsdGVycyA6IHRoaXMuZmlsdGVycy5jbG9uZSgpO1xuICAgIGNsb25lLmF0dGFjaG1lbnQgPSB0aGlzLmF0dGFjaG1lbnQ7XG4gICAgcmV0dXJuIGNsb25lO1xufTtcblxudHJlZS5EZWZpbml0aW9uLnByb3RvdHlwZS5hZGRSdWxlcyA9IGZ1bmN0aW9uKHJ1bGVzKSB7XG4gICAgdmFyIGFkZGVkID0gMDtcblxuICAgIC8vIEFkZCBvbmx5IHVuaXF1ZSBydWxlcy5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghdGhpcy5ydWxlSW5kZXhbcnVsZXNbaV0uaWRdKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bGVzLnB1c2gocnVsZXNbaV0pO1xuICAgICAgICAgICAgdGhpcy5ydWxlSW5kZXhbcnVsZXNbaV0uaWRdID0gdHJ1ZTtcbiAgICAgICAgICAgIGFkZGVkKys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYWRkZWQ7XG59O1xuXG4vLyBEZXRlcm1pbmUgd2hldGhlciB0aGlzIHNlbGVjdG9yIG1hdGNoZXMgYSBnaXZlbiBpZFxuLy8gYW5kIGFycmF5IG9mIGNsYXNzZXMsIGJ5IGRldGVybWluaW5nIHdoZXRoZXJcbi8vIGFsbCBlbGVtZW50cyBpdCBjb250YWlucyBtYXRjaC5cbnRyZWUuRGVmaW5pdGlvbi5wcm90b3R5cGUuYXBwbGllc1RvID0gZnVuY3Rpb24oaWQsIGNsYXNzZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuZWxlbWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBlbGVtID0gdGhpcy5lbGVtZW50c1tpXTtcbiAgICAgICAgaWYgKCEoZWxlbS53aWxkY2FyZCB8fFxuICAgICAgICAgICAgKGVsZW0udHlwZSA9PT0gJ2NsYXNzJyAmJiBjbGFzc2VzW2VsZW0uY2xlYW5dKSB8fFxuICAgICAgICAgICAgKGVsZW0udHlwZSA9PT0gJ2lkJyAmJiBpZCA9PT0gZWxlbS5jbGVhbikpKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcblxuZnVuY3Rpb24gc3ltYm9saXplck5hbWUoc3ltYm9saXplcikge1xuICAgIGZ1bmN0aW9uIGNhcGl0YWxpemUoc3RyKSB7IHJldHVybiBzdHJbMV0udG9VcHBlckNhc2UoKTsgfVxuICAgIHJldHVybiBzeW1ib2xpemVyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICtcbiAgICAgICAgICAgc3ltYm9saXplci5zbGljZSgxKS5yZXBsYWNlKC9cXC0uLywgY2FwaXRhbGl6ZSkgKyAnU3ltYm9saXplcic7XG59XG5cbi8vIEdldCBhIHNpbXBsZSBsaXN0IG9mIHRoZSBzeW1ib2xpemVycywgaW4gb3JkZXJcbmZ1bmN0aW9uIHN5bWJvbGl6ZXJMaXN0KHN5bV9vcmRlcikge1xuICAgIHJldHVybiBzeW1fb3JkZXIuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhWzFdIC0gYlsxXTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbih2KSB7IHJldHVybiB2WzBdOyB9KTtcbn1cblxudHJlZS5EZWZpbml0aW9uLnByb3RvdHlwZS5zeW1ib2xpemVyc1RvWE1MID0gZnVuY3Rpb24oZW52LCBzeW1ib2xpemVycywgem9vbSkge1xuICAgIHZhciB4bWwgPSB6b29tLnRvWE1MKGVudikuam9pbignJykgKyB0aGlzLmZpbHRlcnMudG9YTUwoZW52KTtcblxuICAgIC8vIFNvcnQgc3ltYm9saXplcnMgYnkgdGhlIGluZGV4IG9mIHRoZWlyIGZpcnN0IHByb3BlcnR5IGRlZmluaXRpb25cbiAgICB2YXIgc3ltX29yZGVyID0gW10sIGluZGV4ZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gc3ltYm9saXplcnMpIHtcbiAgICAgICAgaW5kZXhlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHN5bWJvbGl6ZXJzW2tleV0pIHtcbiAgICAgICAgICAgIGluZGV4ZXMucHVzaChzeW1ib2xpemVyc1trZXldW3Byb3BdLmluZGV4KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbWluX2lkeCA9IE1hdGgubWluLmFwcGx5KE1hdGgsIGluZGV4ZXMpO1xuICAgICAgICBzeW1fb3JkZXIucHVzaChba2V5LCBtaW5faWR4XSk7XG4gICAgfVxuXG4gICAgc3ltX29yZGVyID0gc3ltYm9saXplckxpc3Qoc3ltX29yZGVyKTtcbiAgICB2YXIgc3ltX2NvdW50ID0gMDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3ltX29yZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBhdHRyaWJ1dGVzID0gc3ltYm9saXplcnNbc3ltX29yZGVyW2ldXTtcbiAgICAgICAgdmFyIHN5bWJvbGl6ZXIgPSBzeW1fb3JkZXJbaV0uc3BsaXQoJy8nKS5wb3AoKTtcblxuICAgICAgICAvLyBTa2lwIHRoZSBtYWdpY2FsICogc3ltYm9saXplciB3aGljaCBpcyB1c2VkIGZvciB1bml2ZXJzYWwgcHJvcGVydGllc1xuICAgICAgICAvLyB3aGljaCBhcmUgYnViYmxlZCB1cCB0byBTdHlsZSBlbGVtZW50cyBpbnRlYWQgb2YgU3ltYm9saXplciBlbGVtZW50cy5cbiAgICAgICAgaWYgKHN5bWJvbGl6ZXIgPT09ICcqJykgY29udGludWU7XG4gICAgICAgIHN5bV9jb3VudCsrO1xuXG4gICAgICAgIHZhciBmYWlsID0gdHJlZS5SZWZlcmVuY2UucmVxdWlyZWRQcm9wZXJ0aWVzKHN5bWJvbGl6ZXIsIGF0dHJpYnV0ZXMpO1xuICAgICAgICBpZiAoZmFpbCkge1xuICAgICAgICAgICAgdmFyIHJ1bGUgPSBhdHRyaWJ1dGVzW09iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLnNoaWZ0KCldO1xuICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBmYWlsLFxuICAgICAgICAgICAgICAgIGluZGV4OiBydWxlLmluZGV4LFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBydWxlLmZpbGVuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBuYW1lID0gc3ltYm9saXplck5hbWUoc3ltYm9saXplcik7XG5cbiAgICAgICAgdmFyIHNlbGZjbG9zaW5nID0gdHJ1ZSwgdGFnY29udGVudDtcbiAgICAgICAgeG1sICs9ICcgICAgPCcgKyBuYW1lICsgJyAnO1xuICAgICAgICBmb3IgKHZhciBqIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIGlmIChzeW1ib2xpemVyID09PSAnbWFwJykgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnTWFwIHByb3BlcnRpZXMgYXJlIG5vdCBwZXJtaXR0ZWQgaW4gb3RoZXIgcnVsZXMnLFxuICAgICAgICAgICAgICAgIGluZGV4OiBhdHRyaWJ1dGVzW2pdLmluZGV4LFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBhdHRyaWJ1dGVzW2pdLmZpbGVuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciB4ID0gdHJlZS5SZWZlcmVuY2Uuc2VsZWN0b3IoYXR0cmlidXRlc1tqXS5uYW1lKTtcbiAgICAgICAgICAgIGlmICh4ICYmIHguc2VyaWFsaXphdGlvbiAmJiB4LnNlcmlhbGl6YXRpb24gPT09ICdjb250ZW50Jykge1xuICAgICAgICAgICAgICAgIHNlbGZjbG9zaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGFnY29udGVudCA9IGF0dHJpYnV0ZXNbal0uZXYoZW52KS50b1hNTChlbnYsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4ICYmIHguc2VyaWFsaXphdGlvbiAmJiB4LnNlcmlhbGl6YXRpb24gPT09ICd0YWcnKSB7XG4gICAgICAgICAgICAgICAgc2VsZmNsb3NpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0YWdjb250ZW50ID0gYXR0cmlidXRlc1tqXS5ldihlbnYpLnRvWE1MKGVudiwgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHhtbCArPSBhdHRyaWJ1dGVzW2pdLmV2KGVudikudG9YTUwoZW52KSArICcgJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VsZmNsb3NpbmcpIHtcbiAgICAgICAgICAgIHhtbCArPSAnLz5cXG4nO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0YWdjb250ZW50ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBpZiAodGFnY29udGVudC5pbmRleE9mKCc8JykgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICB4bWwgKz0gJz4nICsgdGFnY29udGVudCArICc8LycgKyBuYW1lICsgJz5cXG4nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB4bWwgKz0gJz48IVtDREFUQVsnICsgdGFnY29udGVudCArICddXT48LycgKyBuYW1lICsgJz5cXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghc3ltX2NvdW50IHx8ICF4bWwpIHJldHVybiAnJztcbiAgICByZXR1cm4gJyAgPFJ1bGU+XFxuJyArIHhtbCArICcgIDwvUnVsZT5cXG4nO1xufTtcblxuLy8gVGFrZSBhIHpvb20gcmFuZ2Ugb2Ygem9vbXMgYW5kICdpJywgdGhlIGluZGV4IG9mIGEgcnVsZSBpbiB0aGlzLnJ1bGVzLFxuLy8gYW5kIGZpbmRzIGFsbCBhcHBsaWNhYmxlIHN5bWJvbGl6ZXJzXG50cmVlLkRlZmluaXRpb24ucHJvdG90eXBlLmNvbGxlY3RTeW1ib2xpemVycyA9IGZ1bmN0aW9uKHpvb21zLCBpKSB7XG4gICAgdmFyIHN5bWJvbGl6ZXJzID0ge30sIGNoaWxkO1xuXG4gICAgZm9yICh2YXIgaiA9IGk7IGogPCB0aGlzLnJ1bGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNoaWxkID0gdGhpcy5ydWxlc1tqXTtcbiAgICAgICAgdmFyIGtleSA9IGNoaWxkLmluc3RhbmNlICsgJy8nICsgY2hpbGQuc3ltYm9saXplcjtcbiAgICAgICAgaWYgKHpvb21zLmN1cnJlbnQgJiBjaGlsZC56b29tICYmXG4gICAgICAgICAgICghKGtleSBpbiBzeW1ib2xpemVycykgfHxcbiAgICAgICAgICAgKCEoY2hpbGQubmFtZSBpbiBzeW1ib2xpemVyc1trZXldKSkpKSB7XG4gICAgICAgICAgICB6b29tcy5jdXJyZW50ICY9IGNoaWxkLnpvb207XG4gICAgICAgICAgICBpZiAoIShrZXkgaW4gc3ltYm9saXplcnMpKSB7XG4gICAgICAgICAgICAgICAgc3ltYm9saXplcnNba2V5XSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3ltYm9saXplcnNba2V5XVtjaGlsZC5uYW1lXSA9IGNoaWxkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKE9iamVjdC5rZXlzKHN5bWJvbGl6ZXJzKS5sZW5ndGgpIHtcbiAgICAgICAgem9vbXMucnVsZSAmPSAoem9vbXMuYXZhaWxhYmxlICY9IH56b29tcy5jdXJyZW50KTtcbiAgICAgICAgcmV0dXJuIHN5bWJvbGl6ZXJzO1xuICAgIH1cbn07XG5cbi8vIFRoZSB0cmVlLlpvb20udG9TdHJpbmcgZnVuY3Rpb24gaWdub3JlcyB0aGUgaG9sZXMgaW4gem9vbSByYW5nZXMgYW5kIG91dHB1dHNcbi8vIHNjYWxlZGVub21pbmF0b3JzIHRoYXQgY292ZXIgdGhlIHdob2xlIHJhbmdlIGZyb20gdGhlIGZpcnN0IHRvIGxhc3QgYml0IHNldC5cbi8vIFRoaXMgYWxnb3JpdGhtIGNhbiBwcm9kdWNlcyB6b29tIHJhbmdlcyB0aGF0IG1heSBoYXZlIGhvbGVzLiBIb3dldmVyLFxuLy8gd2hlbiB1c2luZyB0aGUgZmlsdGVyLW1vZGU9XCJmaXJzdFwiLCBtb3JlIHNwZWNpZmljIHpvb20gZmlsdGVycyB3aWxsIGFsd2F5c1xuLy8gZW5kIHVwIGJlZm9yZSBicm9hZGVyIHJhbmdlcy4gVGhlIGZpbHRlci1tb2RlIHdpbGwgcGljayB0aG9zZSBmaXJzdCBiZWZvcmVcbi8vIHJlc29ydGluZyB0byB0aGUgem9vbSByYW5nZSB3aXRoIHRoZSBob2xlIGFuZCBzdG9wIHByb2Nlc3NpbmcgZnVydGhlciBydWxlcy5cbnRyZWUuRGVmaW5pdGlvbi5wcm90b3R5cGUudG9YTUwgPSBmdW5jdGlvbihlbnYsIGV4aXN0aW5nKSB7XG4gICAgdmFyIGZpbHRlciA9IHRoaXMuZmlsdGVycy50b1N0cmluZygpO1xuICAgIGlmICghKGZpbHRlciBpbiBleGlzdGluZykpIGV4aXN0aW5nW2ZpbHRlcl0gPSB0cmVlLlpvb20uYWxsO1xuXG4gICAgdmFyIGF2YWlsYWJsZSA9IHRyZWUuWm9vbS5hbGwsIHhtbCA9ICcnLCB6b29tLCBzeW1ib2xpemVycyxcbiAgICAgICAgem9vbXMgPSB7IGF2YWlsYWJsZTogdHJlZS5ab29tLmFsbCB9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ydWxlcy5sZW5ndGggJiYgYXZhaWxhYmxlOyBpKyspIHtcbiAgICAgICAgem9vbXMucnVsZSA9IHRoaXMucnVsZXNbaV0uem9vbTtcbiAgICAgICAgaWYgKCEoZXhpc3RpbmdbZmlsdGVyXSAmIHpvb21zLnJ1bGUpKSBjb250aW51ZTtcblxuICAgICAgICB3aGlsZSAoem9vbXMuY3VycmVudCA9IHpvb21zLnJ1bGUgJiBhdmFpbGFibGUpIHtcbiAgICAgICAgICAgIGlmIChzeW1ib2xpemVycyA9IHRoaXMuY29sbGVjdFN5bWJvbGl6ZXJzKHpvb21zLCBpKSkge1xuICAgICAgICAgICAgICAgIGlmICghKGV4aXN0aW5nW2ZpbHRlcl0gJiB6b29tcy5jdXJyZW50KSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgeG1sICs9IHRoaXMuc3ltYm9saXplcnNUb1hNTChlbnYsIHN5bWJvbGl6ZXJzLFxuICAgICAgICAgICAgICAgICAgICAobmV3IHRyZWUuWm9vbSgpKS5zZXRab29tKGV4aXN0aW5nW2ZpbHRlcl0gJiB6b29tcy5jdXJyZW50KSk7XG4gICAgICAgICAgICAgICAgZXhpc3RpbmdbZmlsdGVyXSAmPSB+em9vbXMuY3VycmVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB4bWw7XG59O1xuXG50cmVlLkRlZmluaXRpb24ucHJvdG90eXBlLnRvSlMgPSBmdW5jdGlvbihlbnYpIHtcbiAgdmFyIHNoYWRlckF0dHJzID0ge307XG5cbiAgLy8gbWVyZ2UgY29uZGl0aW9ucyBmcm9tIGZpbHRlcnMgd2l0aCB6b29tIGNvbmRpdGlvbiBvZiB0aGVcbiAgLy8gZGVmaW5pdGlvblxuICB2YXIgem9vbSA9IFwiKFwiICsgdGhpcy56b29tICsgXCIgJiAoMSA8PCBjdHguem9vbSkpXCI7XG4gIHZhciBmcmFtZV9vZmZzZXQgPSB0aGlzLmZyYW1lX29mZnNldDtcbiAgdmFyIF9pZiA9IHRoaXMuZmlsdGVycy50b0pTKGVudik7XG4gIHZhciBmaWx0ZXJzID0gW3pvb21dO1xuICBpZihfaWYpIGZpbHRlcnMucHVzaChfaWYpO1xuICBpZihmcmFtZV9vZmZzZXQpIGZpbHRlcnMucHVzaCgnY3R4W1wiZnJhbWUtb2Zmc2V0XCJdID09PSAnICsgZnJhbWVfb2Zmc2V0KTtcbiAgX2lmID0gZmlsdGVycy5qb2luKFwiICYmIFwiKTtcbiAgXy5lYWNoKHRoaXMucnVsZXMsIGZ1bmN0aW9uKHJ1bGUpIHtcbiAgICAgIGlmKHJ1bGUgaW5zdGFuY2VvZiB0cmVlLlJ1bGUpIHtcbiAgICAgICAgc2hhZGVyQXR0cnNbcnVsZS5uYW1lXSA9IHNoYWRlckF0dHJzW3J1bGUubmFtZV0gfHwgW107XG5cbiAgICAgICAgdmFyIHIgPSB7XG4gICAgICAgICAgaW5kZXg6IHJ1bGUuaW5kZXgsXG4gICAgICAgICAgc3ltYm9saXplcjogcnVsZS5zeW1ib2xpemVyXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKF9pZikge1xuICAgICAgICAgIHIuanMgPSBcImlmKFwiICsgX2lmICsgXCIpe1wiICsgcnVsZS52YWx1ZS50b0pTKGVudikgKyBcIn1cIlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHIuanMgPSBydWxlLnZhbHVlLnRvSlMoZW52KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHIuY29uc3RhbnQgPSBydWxlLnZhbHVlLmV2KGVudikuaXMgIT09ICdmaWVsZCc7XG4gICAgICAgIHIuZmlsdGVyZWQgPSAhIV9pZjtcblxuICAgICAgICBzaGFkZXJBdHRyc1tydWxlLm5hbWVdLnB1c2gocik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSdWxlc2V0IG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgICAgIC8vaWYgKHJ1bGUgaW5zdGFuY2VvZiB0cmVlLlJ1bGVzZXQpIHtcbiAgICAgICAgICAvL3ZhciBzaCA9IHJ1bGUudG9KUyhlbnYpO1xuICAgICAgICAgIC8vZm9yKHZhciB2IGluIHNoKSB7XG4gICAgICAgICAgICAvL3NoYWRlckF0dHJzW3ZdID0gc2hhZGVyQXR0cnNbdl0gfHwgW107XG4gICAgICAgICAgICAvL2Zvcih2YXIgYXR0ciBpbiBzaFt2XSkge1xuICAgICAgICAgICAgICAvL3NoYWRlckF0dHJzW3ZdLnB1c2goc2hbdl1bYXR0cl0pO1xuICAgICAgICAgICAgLy99XG4gICAgICAgICAgLy99XG4gICAgICAgIC8vfVxuICAgICAgfVxuICB9KTtcbiAgcmV0dXJuIHNoYWRlckF0dHJzO1xufTtcblxuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcbnZhciBfID0gZ2xvYmFsLl8gfHwgcmVxdWlyZSgndW5kZXJzY29yZScpO1xuLy9cbi8vIEEgbnVtYmVyIHdpdGggYSB1bml0XG4vL1xudHJlZS5EaW1lbnNpb24gPSBmdW5jdGlvbiBEaW1lbnNpb24odmFsdWUsIHVuaXQsIGluZGV4KSB7XG4gICAgdGhpcy52YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpO1xuICAgIHRoaXMudW5pdCA9IHVuaXQgfHwgbnVsbDtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG59O1xuXG50cmVlLkRpbWVuc2lvbi5wcm90b3R5cGUgPSB7XG4gICAgaXM6ICdmbG9hdCcsXG4gICAgcGh5c2ljYWxfdW5pdHM6IFsnbScsICdjbScsICdpbicsICdtbScsICdwdCcsICdwYyddLFxuICAgIHNjcmVlbl91bml0czogWydweCcsICclJ10sXG4gICAgYWxsX3VuaXRzOiBbJ20nLCAnY20nLCAnaW4nLCAnbW0nLCAncHQnLCAncGMnLCAncHgnLCAnJSddLFxuICAgIGRlbnNpdGllczoge1xuICAgICAgICBtOiAwLjAyNTQsXG4gICAgICAgIG1tOiAyNS40LFxuICAgICAgICBjbTogMi41NCxcbiAgICAgICAgcHQ6IDcyLFxuICAgICAgICBwYzogNlxuICAgIH0sXG4gICAgZXY6IGZ1bmN0aW9uIChlbnYpIHtcbiAgICAgICAgaWYgKHRoaXMudW5pdCAmJiAhXy5jb250YWlucyh0aGlzLmFsbF91bml0cywgdGhpcy51bml0KSkge1xuICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIkludmFsaWQgdW5pdDogJ1wiICsgdGhpcy51bml0ICsgXCInXCIsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHsgaXM6ICd1bmRlZmluZWQnLCB2YWx1ZTogJ3VuZGVmaW5lZCcgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5vcm1hbGl6ZSB1bml0cyB3aGljaCBhcmUgbm90IHB4IG9yICVcbiAgICAgICAgaWYgKHRoaXMudW5pdCAmJiBfLmNvbnRhaW5zKHRoaXMucGh5c2ljYWxfdW5pdHMsIHRoaXMudW5pdCkpIHtcbiAgICAgICAgICAgIGlmICghZW52LnBwaSkge1xuICAgICAgICAgICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwicHBpIGlzIG5vdCBzZXQsIHNvIG1ldHJpYyB1bml0cyBjYW4ndCBiZSB1c2VkXCIsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgaXM6ICd1bmRlZmluZWQnLCB2YWx1ZTogJ3VuZGVmaW5lZCcgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnZlcnQgYWxsIHVuaXRzIHRvIGluY2hcbiAgICAgICAgICAgIC8vIGNvbnZlcnQgaW5jaCB0byBweCB1c2luZyBwcGlcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSAodGhpcy52YWx1ZSAvIHRoaXMuZGVuc2l0aWVzW3RoaXMudW5pdF0pICogZW52LnBwaTtcbiAgICAgICAgICAgIHRoaXMudW5pdCA9ICdweCc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJvdW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IE1hdGgucm91bmQodGhpcy52YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgdG9Db2xvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5Db2xvcihbdGhpcy52YWx1ZSwgdGhpcy52YWx1ZSwgdGhpcy52YWx1ZV0pO1xuICAgIH0sXG4gICAgcm91bmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gTWF0aC5yb3VuZCh0aGlzLnZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfSxcbiAgICBvcGVyYXRlOiBmdW5jdGlvbihlbnYsIG9wLCBvdGhlcikge1xuICAgICAgICBpZiAodGhpcy51bml0ID09PSAnJScgJiYgb3RoZXIudW5pdCAhPT0gJyUnKSB7XG4gICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJZiB0d28gb3BlcmFuZHMgZGlmZmVyLCB0aGUgZmlyc3QgbXVzdCBub3QgYmUgJScsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpczogJ3VuZGVmaW5lZCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudW5pdCAhPT0gJyUnICYmIG90aGVyLnVuaXQgPT09ICclJykge1xuICAgICAgICAgICAgaWYgKG9wID09PSAnKicgfHwgb3AgPT09ICcvJyB8fCBvcCA9PT0gJyUnKSB7XG4gICAgICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1BlcmNlbnQgdmFsdWVzIGNhbiBvbmx5IGJlIGFkZGVkIG9yIHN1YnRyYWN0ZWQgZnJvbSBvdGhlciB2YWx1ZXMnLFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkRpbWVuc2lvbih0cmVlLm9wZXJhdGUob3AsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUsIHRoaXMudmFsdWUgKiBvdGhlci52YWx1ZSAqIDAuMDEpLFxuICAgICAgICAgICAgICAgIHRoaXMudW5pdCk7XG4gICAgICAgIH1cblxuICAgICAgICAvL2hlcmUgdGhlIG9wZXJhbmRzIGFyZSBlaXRoZXIgdGhlIHNhbWUgKCUgb3IgdW5kZWZpbmVkIG9yIHB4KSwgb3Igb25lIGlzIHVuZGVmaW5lZCBhbmQgdGhlIG90aGVyIGlzIHB4XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5EaW1lbnNpb24odHJlZS5vcGVyYXRlKG9wLCB0aGlzLnZhbHVlLCBvdGhlci52YWx1ZSksXG4gICAgICAgICAgICB0aGlzLnVuaXQgfHwgb3RoZXIudW5pdCk7XG4gICAgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbi8vIEFuIGVsZW1lbnQgaXMgYW4gaWQgb3IgY2xhc3Mgc2VsZWN0b3JcbnRyZWUuRWxlbWVudCA9IGZ1bmN0aW9uIEVsZW1lbnQodmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWUudHJpbSgpO1xuICAgIGlmICh0aGlzLnZhbHVlWzBdID09PSAnIycpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2lkJztcbiAgICAgICAgdGhpcy5jbGVhbiA9IHRoaXMudmFsdWUucmVwbGFjZSgvXiMvLCAnJyk7XG4gICAgfVxuICAgIGlmICh0aGlzLnZhbHVlWzBdID09PSAnLicpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2NsYXNzJztcbiAgICAgICAgdGhpcy5jbGVhbiA9IHRoaXMudmFsdWUucmVwbGFjZSgvXlxcLi8sICcnKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudmFsdWUuaW5kZXhPZignKicpICE9PSAtMSkge1xuICAgICAgICB0aGlzLnR5cGUgPSAnd2lsZGNhcmQnO1xuICAgIH1cbn07XG5cbi8vIERldGVybWluZSB0aGUgJ3NwZWNpZmljaXR5IG1hdHJpeCcgb2YgdGhpc1xuLy8gc3BlY2lmaWMgc2VsZWN0b3JcbnRyZWUuRWxlbWVudC5wcm90b3R5cGUuc3BlY2lmaWNpdHkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAodGhpcy50eXBlID09PSAnaWQnKSA/IDEgOiAwLCAvLyBhXG4gICAgICAgICh0aGlzLnR5cGUgPT09ICdjbGFzcycpID8gMSA6IDAgIC8vIGJcbiAgICBdO1xufTtcblxudHJlZS5FbGVtZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy52YWx1ZTsgfTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuRXhwcmVzc2lvbiA9IGZ1bmN0aW9uIEV4cHJlc3Npb24odmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG59O1xuXG50cmVlLkV4cHJlc3Npb24ucHJvdG90eXBlID0ge1xuICAgIGlzOiAnZXhwcmVzc2lvbicsXG4gICAgZXY6IGZ1bmN0aW9uKGVudikge1xuICAgICAgICBpZiAodGhpcy52YWx1ZS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuRXhwcmVzc2lvbih0aGlzLnZhbHVlLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGUuZXYoZW52KTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlWzBdLmV2KGVudik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKGVudikge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZS5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgcmV0dXJuIGUudG9TdHJpbmcoZW52KTtcbiAgICAgICAgfSkuam9pbignICcpO1xuICAgIH1cbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLkZpZWxkID0gZnVuY3Rpb24gRmllbGQoY29udGVudCkge1xuICAgIHRoaXMudmFsdWUgPSBjb250ZW50IHx8ICcnO1xufTtcblxudHJlZS5GaWVsZC5wcm90b3R5cGUgPSB7XG4gICAgaXM6ICdmaWVsZCcsXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ1snICsgdGhpcy52YWx1ZSArICddJztcbiAgICB9LFxuICAgICdldic6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5GaWx0ZXIgPSBmdW5jdGlvbiBGaWx0ZXIoa2V5LCBvcCwgdmFsLCBpbmRleCwgZmlsZW5hbWUpIHtcbiAgICB0aGlzLmtleSA9IGtleTtcbiAgICB0aGlzLm9wID0gb3A7XG4gICAgdGhpcy52YWwgPSB2YWw7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMuZmlsZW5hbWUgPSBmaWxlbmFtZTtcblxuICAgIHRoaXMuaWQgPSB0aGlzLmtleSArIHRoaXMub3AgKyB0aGlzLnZhbDtcbn07XG5cbi8vIHhtbHNhZmUsIG51bWVyaWMsIHN1ZmZpeFxudmFyIG9wcyA9IHtcbiAgICAnPCc6IFsnICZsdDsgJywgJ251bWVyaWMnXSxcbiAgICAnPic6IFsnICZndDsgJywgJ251bWVyaWMnXSxcbiAgICAnPSc6IFsnID0gJywgJ2JvdGgnXSxcbiAgICAnIT0nOiBbJyAhPSAnLCAnYm90aCddLFxuICAgICc8PSc6IFsnICZsdDs9ICcsICdudW1lcmljJ10sXG4gICAgJz49JzogWycgJmd0Oz0gJywgJ251bWVyaWMnXSxcbiAgICAnPX4nOiBbJy5tYXRjaCgnLCAnc3RyaW5nJywgJyknXVxufTtcblxudHJlZS5GaWx0ZXIucHJvdG90eXBlLmV2ID0gZnVuY3Rpb24oZW52KSB7XG4gICAgdGhpcy5rZXkgPSB0aGlzLmtleS5ldihlbnYpO1xuICAgIHRoaXMudmFsID0gdGhpcy52YWwuZXYoZW52KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbnRyZWUuRmlsdGVyLnByb3RvdHlwZS50b1hNTCA9IGZ1bmN0aW9uKGVudikge1xuICAgIGlmICh0cmVlLlJlZmVyZW5jZS5kYXRhLmZpbHRlcikge1xuICAgICAgICBpZiAodGhpcy5rZXkuaXMgPT09ICdrZXl3b3JkJyAmJiAtMSA9PT0gdHJlZS5SZWZlcmVuY2UuZGF0YS5maWx0ZXIudmFsdWUuaW5kZXhPZih0aGlzLmtleS50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiB0aGlzLmtleS50b1N0cmluZygpICsgJyBpcyBub3QgYSB2YWxpZCBrZXl3b3JkIGluIGEgZmlsdGVyIGV4cHJlc3Npb24nLFxuICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy52YWwuaXMgPT09ICdrZXl3b3JkJyAmJiAtMSA9PT0gdHJlZS5SZWZlcmVuY2UuZGF0YS5maWx0ZXIudmFsdWUuaW5kZXhPZih0aGlzLnZhbC50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiB0aGlzLnZhbC50b1N0cmluZygpICsgJyBpcyBub3QgYSB2YWxpZCBrZXl3b3JkIGluIGEgZmlsdGVyIGV4cHJlc3Npb24nLFxuICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIga2V5ID0gdGhpcy5rZXkudG9TdHJpbmcoZmFsc2UpO1xuICAgIHZhciB2YWwgPSB0aGlzLnZhbC50b1N0cmluZyh0aGlzLnZhbC5pcyA9PSAnc3RyaW5nJyk7XG5cbiAgICBpZiAoXG4gICAgICAgIChvcHNbdGhpcy5vcF1bMV0gPT0gJ251bWVyaWMnICYmIGlzTmFOKHZhbCkgJiYgdGhpcy52YWwuaXMgIT09ICdmaWVsZCcpIHx8XG4gICAgICAgIChvcHNbdGhpcy5vcF1bMV0gPT0gJ3N0cmluZycgJiYgKHZhbClbMF0gIT0gXCInXCIpXG4gICAgKSB7XG4gICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICBtZXNzYWdlOiAnQ2Fubm90IHVzZSBvcGVyYXRvciBcIicgKyB0aGlzLm9wICsgJ1wiIHdpdGggdmFsdWUgJyArIHRoaXMudmFsLFxuICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4ga2V5ICsgb3BzW3RoaXMub3BdWzBdICsgdmFsICsgKG9wc1t0aGlzLm9wXVsyXSB8fCAnJyk7XG59O1xuXG50cmVlLkZpbHRlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJ1snICsgdGhpcy5pZCArICddJztcbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCJ2YXIgdHJlZSA9IHJlcXVpcmUoJy4uL3RyZWUnKTtcbnZhciBfID0gZ2xvYmFsLl8gfHwgcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG50cmVlLkZpbHRlcnNldCA9IGZ1bmN0aW9uIEZpbHRlcnNldCgpIHtcbiAgICB0aGlzLmZpbHRlcnMgPSB7fTtcbn07XG5cbnRyZWUuRmlsdGVyc2V0LnByb3RvdHlwZS50b1hNTCA9IGZ1bmN0aW9uKGVudikge1xuICAgIHZhciBmaWx0ZXJzID0gW107XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgIGZpbHRlcnMucHVzaCgnKCcgKyB0aGlzLmZpbHRlcnNbaWRdLnRvWE1MKGVudikudHJpbSgpICsgJyknKTtcbiAgICB9XG4gICAgaWYgKGZpbHRlcnMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAnICAgIDxGaWx0ZXI+JyArIGZpbHRlcnMuam9pbignIGFuZCAnKSArICc8L0ZpbHRlcj5cXG4nO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59O1xuXG50cmVlLkZpbHRlcnNldC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJyID0gW107XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5maWx0ZXJzKSBhcnIucHVzaCh0aGlzLmZpbHRlcnNbaWRdLmlkKTtcbiAgICByZXR1cm4gYXJyLnNvcnQoKS5qb2luKCdcXHQnKTtcbn07XG5cbnRyZWUuRmlsdGVyc2V0LnByb3RvdHlwZS5ldiA9IGZ1bmN0aW9uKGVudikge1xuICAgIGZvciAodmFyIGkgaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgIHRoaXMuZmlsdGVyc1tpXS5ldihlbnYpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbnRyZWUuRmlsdGVyc2V0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjbG9uZSA9IG5ldyB0cmVlLkZpbHRlcnNldCgpO1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMuZmlsdGVycykge1xuICAgICAgICBjbG9uZS5maWx0ZXJzW2lkXSA9IHRoaXMuZmlsdGVyc1tpZF07XG4gICAgfVxuICAgIHJldHVybiBjbG9uZTtcbn07XG5cbi8vIE5vdGU6IG90aGVyIGhhcyB0byBiZSBhIHRyZWUuRmlsdGVyc2V0LlxudHJlZS5GaWx0ZXJzZXQucHJvdG90eXBlLmNsb25lV2l0aCA9IGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgdmFyIGFkZGl0aW9ucyA9IFtdO1xuICAgIGZvciAodmFyIGlkIGluIG90aGVyLmZpbHRlcnMpIHtcbiAgICAgICAgdmFyIHN0YXR1cyA9IHRoaXMuYWRkYWJsZShvdGhlci5maWx0ZXJzW2lkXSk7XG4gICAgICAgIC8vIHN0YXR1cyBpcyB0cnVlLCBmYWxzZSBvciBudWxsLiBpZiBpdCdzIG51bGwgd2UgZG9uJ3QgZmFpbCB0aGlzXG4gICAgICAgIC8vIGNsb25lIG5vciBkbyB3ZSBhZGQgdGhlIGZpbHRlci5cbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhdHVzID09PSB0cnVlKSB7XG4gICAgICAgICAgICAvLyBBZGRpbmcgdGhlIGZpbHRlciB3aWxsIG92ZXJyaWRlIGFub3RoZXIgdmFsdWUuXG4gICAgICAgICAgICBhZGRpdGlvbnMucHVzaChvdGhlci5maWx0ZXJzW2lkXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBZGRpbmcgdGhlIG90aGVyIGZpbHRlcnMgZG9lc24ndCBtYWtlIHRoaXMgZmlsdGVyc2V0IGludmFsaWQsIGJ1dCBpdFxuICAgIC8vIGRvZXNuJ3QgYWRkIGFueXRoaW5nIHRvIGl0IGVpdGhlci5cbiAgICBpZiAoIWFkZGl0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gV2UgY2FuIHN1Y2Nlc3NmdWxseSBhZGQgYWxsIGZpbHRlcnMuIE5vdyBjbG9uZSB0aGUgZmlsdGVyc2V0IGFuZCBhZGQgdGhlXG4gICAgLy8gbmV3IHJ1bGVzLlxuICAgIHZhciBjbG9uZSA9IG5ldyB0cmVlLkZpbHRlcnNldCgpO1xuXG4gICAgLy8gV2UgY2FuIGFkZCB0aGUgcnVsZXMgdGhhdCBhcmUgYWxyZWFkeSBwcmVzZW50IHdpdGhvdXQgZ29pbmcgdGhyb3VnaCB0aGVcbiAgICAvLyBhZGQgZnVuY3Rpb24gYXMgYSBGaWx0ZXJzZXQgaXMgYWx3YXlzIGluIGl0J3Mgc2ltcGxlc3QgY2Fub25pY2FsIGZvcm0uXG4gICAgZm9yIChpZCBpbiB0aGlzLmZpbHRlcnMpIHtcbiAgICAgICAgY2xvbmUuZmlsdGVyc1tpZF0gPSB0aGlzLmZpbHRlcnNbaWRdO1xuICAgIH1cblxuICAgIC8vIE9ubHkgYWRkIG5ldyBmaWx0ZXJzIHRoYXQgYWN0dWFsbHkgY2hhbmdlIHRoZSBmaWx0ZXIuXG4gICAgd2hpbGUgKGlkID0gYWRkaXRpb25zLnNoaWZ0KCkpIHtcbiAgICAgICAgY2xvbmUuYWRkKGlkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmU7XG59O1xuXG50cmVlLkZpbHRlcnNldC5wcm90b3R5cGUudG9KUyA9IGZ1bmN0aW9uKGVudikge1xuICB2YXIgb3BNYXAgPSB7XG4gICAgJz0nOiAnPT09J1xuICB9O1xuICByZXR1cm4gXy5tYXAodGhpcy5maWx0ZXJzLCBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICB2YXIgb3AgPSBmaWx0ZXIub3A7XG4gICAgaWYob3AgaW4gb3BNYXApIHtcbiAgICAgIG9wID0gb3BNYXBbb3BdO1xuICAgIH1cbiAgICB2YXIgdmFsID0gZmlsdGVyLnZhbDtcbiAgICBpZihmaWx0ZXIuX3ZhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB2YWwgPSBmaWx0ZXIuX3ZhbC50b1N0cmluZyh0cnVlKTtcbiAgICB9XG4gICAgdmFyIGF0dHJzID0gXCJkYXRhXCI7XG4gICAgcmV0dXJuIGF0dHJzICsgXCJbJ1wiICsgZmlsdGVyLmtleS52YWx1ZSAgKyBcIiddIFwiICsgb3AgKyBcIiBcIiArICh2YWwuaXMgPT09ICdzdHJpbmcnID8gXCInXCIgKyB2YWwudG9TdHJpbmcoKS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIikgKyBcIidcIiA6IHZhbCk7XG4gIH0pLmpvaW4oJyAmJiAnKTtcbn07XG5cbi8vIFJldHVybnMgdHJ1ZSB3aGVuIHRoZSBuZXcgZmlsdGVyIGNhbiBiZSBhZGRlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuLy8gSXQgY2FuIGFsc28gcmV0dXJuIG51bGwsIGFuZCBvbiB0aGUgb3RoZXIgc2lkZSB3ZSB0ZXN0IGZvciA9PT0gdHJ1ZSBvclxuLy8gZmFsc2VcbnRyZWUuRmlsdGVyc2V0LnByb3RvdHlwZS5hZGRhYmxlID0gZnVuY3Rpb24oZmlsdGVyKSB7XG4gICAgdmFyIGtleSA9IGZpbHRlci5rZXkudG9TdHJpbmcoKSxcbiAgICAgICAgdmFsdWUgPSBmaWx0ZXIudmFsLnRvU3RyaW5nKCk7XG5cbiAgICBpZiAodmFsdWUubWF0Y2goL15bMC05XSsoXFwuWzAtOV0qKT8kLykpIHZhbHVlID0gcGFyc2VGbG9hdCh2YWx1ZSk7XG5cbiAgICBzd2l0Y2ggKGZpbHRlci5vcCkge1xuICAgICAgICBjYXNlICc9JzpcbiAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIGFscmVhZHkgZm9vPSBhbmQgd2UncmUgYWRkaW5nIGZvbz1cbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz0nXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPSddLnZhbC50b1N0cmluZygpICE9IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICchPScgKyB2YWx1ZV0gIT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPiddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc+J10udmFsID49IHZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc8J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJzwnXS52YWwgPD0gdmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz49J10gIT09IHVuZGVmaW5lZCAgJiYgdGhpcy5maWx0ZXJzW2tleSArICc+PSddLnZhbCA+IHZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc8PSddICE9PSB1bmRlZmluZWQgICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXS52YWwgPCB2YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgY2FzZSAnPX4nOlxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgY2FzZSAnIT0nOlxuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPSddICE9PSB1bmRlZmluZWQpIHJldHVybiAodGhpcy5maWx0ZXJzW2tleSArICc9J10udmFsID09IHZhbHVlKSA/IGZhbHNlIDogbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJyE9JyArIHZhbHVlXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz4nXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPiddLnZhbCA+PSB2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc8J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJzwnXS52YWwgPD0gdmFsdWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXS52YWwgPiB2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc8PSddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc8PSddLnZhbCA8IHZhbHVlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGNhc2UgJz4nOlxuICAgICAgICAgICAgaWYgKGtleSArICc9JyBpbiB0aGlzLmZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc9J10udmFsIDw9IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc8J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJzwnXS52YWwgPD0gdmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10gIT09IHVuZGVmaW5lZCAgJiYgdGhpcy5maWx0ZXJzW2tleSArICc8PSddLnZhbCA8PSB2YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPiddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc+J10udmFsID49IHZhbHVlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz49J10gIT09IHVuZGVmaW5lZCAgJiYgdGhpcy5maWx0ZXJzW2tleSArICc+PSddLnZhbCA+IHZhbHVlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGNhc2UgJz49JzpcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz0nIF0gIT09IHVuZGVmaW5lZCkgcmV0dXJuICh0aGlzLmZpbHRlcnNba2V5ICsgJz0nXS52YWwgPCB2YWx1ZSkgPyBmYWxzZSA6IG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc8JyBdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc8J10udmFsIDw9IHZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc8PSddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc8PSddLnZhbCA8IHZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc+JyBdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc+J10udmFsID49IHZhbHVlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz49J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz49J10udmFsID49IHZhbHVlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGNhc2UgJzwnOlxuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPScgXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gKHRoaXMuZmlsdGVyc1trZXkgKyAnPSddLnZhbCA+PSB2YWx1ZSkgPyBmYWxzZSA6IG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc+JyBdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc+J10udmFsID49IHZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc+PSddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc+PSddLnZhbCA+PSB2YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPCcgXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPCddLnZhbCA8PSB2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc8PSddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc8PSddLnZhbCA8IHZhbHVlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGNhc2UgJzw9JzpcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz0nIF0gIT09IHVuZGVmaW5lZCkgcmV0dXJuICh0aGlzLmZpbHRlcnNba2V5ICsgJz0nXS52YWwgPiB2YWx1ZSkgPyBmYWxzZSA6IG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc+JyBdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc+J10udmFsID49IHZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc+PSddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc+PSddLnZhbCA+IHZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc8JyBdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc8J10udmFsIDw9IHZhbHVlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10udmFsIDw9IHZhbHVlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn07XG5cbi8vIERvZXMgdGhlIG5ldyBmaWx0ZXIgY29uc3RpdHV0ZSBhIGNvbmZsaWN0P1xudHJlZS5GaWx0ZXJzZXQucHJvdG90eXBlLmNvbmZsaWN0ID0gZnVuY3Rpb24oZmlsdGVyKSB7XG4gICAgdmFyIGtleSA9IGZpbHRlci5rZXkudG9TdHJpbmcoKSxcbiAgICAgICAgdmFsdWUgPSBmaWx0ZXIudmFsLnRvU3RyaW5nKCk7XG5cbiAgICBpZiAoIWlzTmFOKHBhcnNlRmxvYXQodmFsdWUpKSkgdmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKTtcblxuICAgIC8vIGlmIChhPWIpICYmIChhPWMpXG4gICAgLy8gaWYgKGE9YikgJiYgKGEhPWIpXG4gICAgLy8gb3IgKGEhPWIpICYmIChhPWIpXG4gICAgaWYgKChmaWx0ZXIub3AgPT09ICc9JyAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz0nXSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIHZhbHVlICE9IHRoaXMuZmlsdGVyc1trZXkgKyAnPSddLnZhbC50b1N0cmluZygpKSB8fFxuICAgICAgICAoZmlsdGVyLm9wID09PSAnIT0nICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPSddICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgdmFsdWUgPT0gdGhpcy5maWx0ZXJzW2tleSArICc9J10udmFsLnRvU3RyaW5nKCkpIHx8XG4gICAgICAgIChmaWx0ZXIub3AgPT09ICc9JyAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJyE9J10gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICB2YWx1ZSA9PSB0aGlzLmZpbHRlcnNba2V5ICsgJyE9J10udmFsLnRvU3RyaW5nKCkpKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXIudG9TdHJpbmcoKSArICcgYWRkZWQgdG8gJyArIHRoaXMudG9TdHJpbmcoKSArICcgcHJvZHVjZXMgYW4gaW52YWxpZCBmaWx0ZXInO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn07XG5cbi8vIE9ubHkgY2FsbCB0aGlzIGZ1bmN0aW9uIGZvciBmaWx0ZXJzIHRoYXQgaGF2ZSBiZWVuIGNsZWFyZWQgYnkgLmFkZGFibGUoKS5cbnRyZWUuRmlsdGVyc2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihmaWx0ZXIsIGVudikge1xuICAgIHZhciBrZXkgPSBmaWx0ZXIua2V5LnRvU3RyaW5nKCksXG4gICAgICAgIGlkLFxuICAgICAgICBvcCA9IGZpbHRlci5vcCxcbiAgICAgICAgY29uZmxpY3QgPSB0aGlzLmNvbmZsaWN0KGZpbHRlciksXG4gICAgICAgIG51bXZhbDtcblxuICAgIGlmIChjb25mbGljdCkgcmV0dXJuIGNvbmZsaWN0O1xuXG4gICAgaWYgKG9wID09PSAnPScpIHtcbiAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLmZpbHRlcnMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNbaV0ua2V5ID09IGtleSkgZGVsZXRlIHRoaXMuZmlsdGVyc1tpXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpbHRlcnNba2V5ICsgJz0nXSA9IGZpbHRlcjtcbiAgICB9IGVsc2UgaWYgKG9wID09PSAnIT0nKSB7XG4gICAgICAgIHRoaXMuZmlsdGVyc1trZXkgKyAnIT0nICsgZmlsdGVyLnZhbF0gPSBmaWx0ZXI7XG4gICAgfSBlbHNlIGlmIChvcCA9PT0gJz1+Jykge1xuICAgICAgICB0aGlzLmZpbHRlcnNba2V5ICsgJz1+JyArIGZpbHRlci52YWxdID0gZmlsdGVyO1xuICAgIH0gZWxzZSBpZiAob3AgPT09ICc+Jykge1xuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgb3RoZXIgZmlsdGVycyB0aGF0IGFyZSBhbHNvID5cbiAgICAgICAgLy8gYnV0IGFyZSBsZXNzIHRoYW4gdGhpcyBvbmUsIHRoZXkgZG9uJ3QgbWF0dGVyLCBzb1xuICAgICAgICAvLyByZW1vdmUgdGhlbS5cbiAgICAgICAgZm9yICh2YXIgaiBpbiB0aGlzLmZpbHRlcnMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNbal0ua2V5ID09IGtleSAmJiB0aGlzLmZpbHRlcnNbal0udmFsIDw9IGZpbHRlci52YWwpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5maWx0ZXJzW2pdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmlsdGVyc1trZXkgKyAnPiddID0gZmlsdGVyO1xuICAgIH0gZWxzZSBpZiAob3AgPT09ICc+PScpIHtcbiAgICAgICAgZm9yICh2YXIgayBpbiB0aGlzLmZpbHRlcnMpIHtcbiAgICAgICAgICAgIG51bXZhbCA9ICgrdGhpcy5maWx0ZXJzW2tdLnZhbC50b1N0cmluZygpKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba10ua2V5ID09IGtleSAmJiBudW12YWwgPCBmaWx0ZXIudmFsKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsdGVyc1trXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICchPScgKyBmaWx0ZXIudmFsXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5maWx0ZXJzW2tleSArICchPScgKyBmaWx0ZXIudmFsXTtcbiAgICAgICAgICAgIGZpbHRlci5vcCA9ICc+JztcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyc1trZXkgKyAnPiddID0gZmlsdGVyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJzW2tleSArICc+PSddID0gZmlsdGVyO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChvcCA9PT0gJzwnKSB7XG4gICAgICAgIGZvciAodmFyIGwgaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgICAgICBudW12YWwgPSAoK3RoaXMuZmlsdGVyc1tsXS52YWwudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2xdLmtleSA9PSBrZXkgJiYgbnVtdmFsID49IGZpbHRlci52YWwpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5maWx0ZXJzW2xdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmlsdGVyc1trZXkgKyAnPCddID0gZmlsdGVyO1xuICAgIH0gZWxzZSBpZiAob3AgPT09ICc8PScpIHtcbiAgICAgICAgZm9yICh2YXIgbSBpbiB0aGlzLmZpbHRlcnMpIHtcbiAgICAgICAgICAgIG51bXZhbCA9ICgrdGhpcy5maWx0ZXJzW21dLnZhbC50b1N0cmluZygpKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNbbV0ua2V5ID09IGtleSAmJiBudW12YWwgPiBmaWx0ZXIudmFsKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsdGVyc1ttXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICchPScgKyBmaWx0ZXIudmFsXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5maWx0ZXJzW2tleSArICchPScgKyBmaWx0ZXIudmFsXTtcbiAgICAgICAgICAgIGZpbHRlci5vcCA9ICc8JztcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyc1trZXkgKyAnPCddID0gZmlsdGVyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJzW2tleSArICc8PSddID0gZmlsdGVyO1xuICAgICAgICB9XG4gICAgfVxufTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuX2dldEZvbnRTZXQgPSBmdW5jdGlvbihlbnYsIGZvbnRzKSB7XG4gICAgdmFyIGZvbnRLZXkgPSBmb250cy5qb2luKCcnKTtcbiAgICBpZiAoZW52Ll9mb250TWFwICYmIGVudi5fZm9udE1hcFtmb250S2V5XSkge1xuICAgICAgICByZXR1cm4gZW52Ll9mb250TWFwW2ZvbnRLZXldO1xuICAgIH1cblxuICAgIHZhciBuZXdfZm9udHNldCA9IG5ldyB0cmVlLkZvbnRTZXQoZW52LCBmb250cyk7XG4gICAgZW52LmVmZmVjdHMucHVzaChuZXdfZm9udHNldCk7XG4gICAgaWYgKCFlbnYuX2ZvbnRNYXApIGVudi5fZm9udE1hcCA9IHt9O1xuICAgIGVudi5fZm9udE1hcFtmb250S2V5XSA9IG5ld19mb250c2V0O1xuICAgIHJldHVybiBuZXdfZm9udHNldDtcbn07XG5cbnRyZWUuRm9udFNldCA9IGZ1bmN0aW9uIEZvbnRTZXQoZW52LCBmb250cykge1xuICAgIHRoaXMuZm9udHMgPSBmb250cztcbiAgICB0aGlzLm5hbWUgPSAnZm9udHNldC0nICsgZW52LmVmZmVjdHMubGVuZ3RoO1xufTtcblxudHJlZS5Gb250U2V0LnByb3RvdHlwZS50b1hNTCA9IGZ1bmN0aW9uKGVudikge1xuICAgIHJldHVybiAnPEZvbnRTZXQgbmFtZT1cIicgK1xuICAgICAgICB0aGlzLm5hbWUgK1xuICAgICAgICAnXCI+XFxuJyArXG4gICAgICAgIHRoaXMuZm9udHMubWFwKGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgICAgIHJldHVybiAnICA8Rm9udCBmYWNlLW5hbWU9XCInICsgZiArJ1wiLz4nO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSArXG4gICAgICAgICdcXG48L0ZvbnRTZXQ+Jztcbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCJ2YXIgdHJlZSA9IHJlcXVpcmUoJy4uL3RyZWUnKTtcblxuLy8gU3RvcmFnZSBmb3IgRnJhbWUgb2Zmc2V0IHZhbHVlXG4vLyBhbmQgc3RvcmVzIHRoZW0gYXMgYml0LXNlcXVlbmNlcyBzbyB0aGF0IHRoZXkgY2FuIGJlIGNvbWJpbmVkLFxuLy8gaW52ZXJ0ZWQsIGFuZCBjb21wYXJlZCBxdWlja2x5LlxudHJlZS5GcmFtZU9mZnNldCA9IGZ1bmN0aW9uKG9wLCB2YWx1ZSwgaW5kZXgpIHtcbiAgICB2YWx1ZSA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgaWYgKHZhbHVlID4gdHJlZS5GcmFtZU9mZnNldC5tYXggfHwgdmFsdWUgPD0gMCkge1xuICAgICAgICB0aHJvdyB7XG4gICAgICAgICAgICBtZXNzYWdlOiAnT25seSBmcmFtZS1vZmZzZXQgbGV2ZWxzIGJldHdlZW4gMSBhbmQgJyArXG4gICAgICAgICAgICAgICAgdHJlZS5GcmFtZU9mZnNldC5tYXggKyAnIHN1cHBvcnRlZC4nLFxuICAgICAgICAgICAgaW5kZXg6IGluZGV4XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKG9wICE9PSAnPScpIHtcbiAgICAgICAgdGhyb3cge1xuICAgICAgICAgICAgbWVzc2FnZTogJ29ubHkgPSBvcGVyYXRvciBpcyBzdXBwb3J0ZWQgZm9yIGZyYW1lLW9mZnNldCcsXG4gICAgICAgICAgICBpbmRleDogaW5kZXhcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufTtcblxudHJlZS5GcmFtZU9mZnNldC5tYXggPSAzMjtcbnRyZWUuRnJhbWVPZmZzZXQubm9uZSA9IDA7XG5cbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuSW1hZ2VGaWx0ZXIgPSBmdW5jdGlvbiBJbWFnZUZpbHRlcihmaWx0ZXIsIGFyZ3MpIHtcbiAgICB0aGlzLmZpbHRlciA9IGZpbHRlcjtcbiAgICB0aGlzLmFyZ3MgPSBhcmdzIHx8IG51bGw7XG59O1xuXG50cmVlLkltYWdlRmlsdGVyLnByb3RvdHlwZSA9IHtcbiAgICBpczogJ2ltYWdlZmlsdGVyJyxcbiAgICBldjogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9LFxuXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5hcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXIgKyAnKCcgKyB0aGlzLmFyZ3Muam9pbignLCcpICsgJyknO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uICh0cmVlKSB7XG50cmVlLkludmFsaWQgPSBmdW5jdGlvbiBJbnZhbGlkKGNodW5rLCBpbmRleCwgbWVzc2FnZSkge1xuICAgIHRoaXMuY2h1bmsgPSBjaHVuaztcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy50eXBlID0gJ3N5bnRheCc7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSB8fCBcIkludmFsaWQgY29kZTogXCIgKyB0aGlzLmNodW5rO1xufTtcblxudHJlZS5JbnZhbGlkLnByb3RvdHlwZS5pcyA9ICdpbnZhbGlkJztcblxudHJlZS5JbnZhbGlkLnByb3RvdHlwZS5ldiA9IGZ1bmN0aW9uKGVudikge1xuICAgIGVudi5lcnJvcih7XG4gICAgICAgIGNodW5rOiB0aGlzLmNodW5rLFxuICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgdHlwZTogJ3N5bnRheCcsXG4gICAgICAgIG1lc3NhZ2U6IHRoaXMubWVzc2FnZSB8fCBcIkludmFsaWQgY29kZTogXCIgKyB0aGlzLmNodW5rXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaXM6ICd1bmRlZmluZWQnXG4gICAgfTtcbn07XG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5LZXl3b3JkID0gZnVuY3Rpb24gS2V5d29yZCh2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB2YXIgc3BlY2lhbCA9IHtcbiAgICAgICAgJ3RyYW5zcGFyZW50JzogJ2NvbG9yJyxcbiAgICAgICAgJ3RydWUnOiAnYm9vbGVhbicsXG4gICAgICAgICdmYWxzZSc6ICdib29sZWFuJ1xuICAgIH07XG4gICAgdGhpcy5pcyA9IHNwZWNpYWxbdmFsdWVdID8gc3BlY2lhbFt2YWx1ZV0gOiAna2V5d29yZCc7XG59O1xudHJlZS5LZXl3b3JkLnByb3RvdHlwZSA9IHtcbiAgICBldjogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9LFxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMudmFsdWU7IH1cbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLkxheWVyWE1MID0gZnVuY3Rpb24ob2JqLCBzdHlsZXMpIHtcbiAgICB2YXIgZHNvcHRpb25zID0gW107XG4gICAgZm9yICh2YXIgaSBpbiBvYmouRGF0YXNvdXJjZSkge1xuICAgICAgICBkc29wdGlvbnMucHVzaCgnPFBhcmFtZXRlciBuYW1lPVwiJyArIGkgKyAnXCI+PCFbQ0RBVEFbJyArXG4gICAgICAgICAgICBvYmouRGF0YXNvdXJjZVtpXSArICddXT48L1BhcmFtZXRlcj4nKTtcbiAgICB9XG5cbiAgICB2YXIgcHJvcF9zdHJpbmcgPSAnJztcbiAgICBmb3IgKHZhciBwcm9wIGluIG9iai5wcm9wZXJ0aWVzKSB7XG4gICAgICAgIGlmIChwcm9wID09PSAnbWluem9vbScpIHtcbiAgICAgICAgICAgIHByb3Bfc3RyaW5nICs9ICcgIG1heHpvb209XCInICsgdHJlZS5ab29tLnJhbmdlc1tvYmoucHJvcGVydGllc1twcm9wXV0gKyAnXCJcXG4nO1xuICAgICAgICB9IGVsc2UgaWYgKHByb3AgPT09ICdtYXh6b29tJykge1xuICAgICAgICAgICAgcHJvcF9zdHJpbmcgKz0gJyAgbWluem9vbT1cIicgKyB0cmVlLlpvb20ucmFuZ2VzW29iai5wcm9wZXJ0aWVzW3Byb3BdKzFdICsgJ1wiXFxuJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb3Bfc3RyaW5nICs9ICcgICcgKyBwcm9wICsgJz1cIicgKyBvYmoucHJvcGVydGllc1twcm9wXSArICdcIlxcbic7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gJzxMYXllcicgK1xuICAgICAgICAnIG5hbWU9XCInICsgb2JqLm5hbWUgKyAnXCJcXG4nICtcbiAgICAgICAgcHJvcF9zdHJpbmcgK1xuICAgICAgICAoKHR5cGVvZiBvYmouc3RhdHVzID09PSAndW5kZWZpbmVkJykgPyAnJyA6ICcgIHN0YXR1cz1cIicgKyBvYmouc3RhdHVzICsgJ1wiXFxuJykgK1xuICAgICAgICAoKHR5cGVvZiBvYmouc3JzID09PSAndW5kZWZpbmVkJykgPyAnJyA6ICcgIHNycz1cIicgKyBvYmouc3JzICsgJ1wiJykgKyAnPlxcbiAgICAnICtcbiAgICAgICAgc3R5bGVzLnJldmVyc2UoKS5tYXAoZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgcmV0dXJuICc8U3R5bGVOYW1lPicgKyBzICsgJzwvU3R5bGVOYW1lPic7XG4gICAgICAgIH0pLmpvaW4oJ1xcbiAgICAnKSArXG4gICAgICAgIChkc29wdGlvbnMubGVuZ3RoID9cbiAgICAgICAgJ1xcbiAgICA8RGF0YXNvdXJjZT5cXG4gICAgICAgJyArXG4gICAgICAgIGRzb3B0aW9ucy5qb2luKCdcXG4gICAgICAgJykgK1xuICAgICAgICAnXFxuICAgIDwvRGF0YXNvdXJjZT5cXG4nXG4gICAgICAgIDogJycpICtcbiAgICAgICAgJyAgPC9MYXllcj5cXG4nO1xufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIi8vIEEgbGl0ZXJhbCBpcyBhIGxpdGVyYWwgc3RyaW5nIGZvciBNYXBuaWsgLSB0aGVcbi8vIHJlc3VsdCBvZiB0aGUgY29tYmluYXRpb24gb2YgYSBgdHJlZS5GaWVsZGAgd2l0aCBhbnlcbi8vIG90aGVyIHR5cGUuXG4oZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLkxpdGVyYWwgPSBmdW5jdGlvbiBGaWVsZChjb250ZW50KSB7XG4gICAgdGhpcy52YWx1ZSA9IGNvbnRlbnQgfHwgJyc7XG4gICAgdGhpcy5pcyA9ICdmaWVsZCc7XG59O1xuXG50cmVlLkxpdGVyYWwucHJvdG90eXBlID0ge1xuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfSxcbiAgICAnZXYnOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIi8vIEFuIG9wZXJhdGlvbiBpcyBhbiBleHByZXNzaW9uIHdpdGggYW4gb3AgaW4gYmV0d2VlbiB0d28gb3BlcmFuZHMsXG4vLyBsaWtlIDIgKyAxLlxuKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5PcGVyYXRpb24gPSBmdW5jdGlvbiBPcGVyYXRpb24ob3AsIG9wZXJhbmRzLCBpbmRleCkge1xuICAgIHRoaXMub3AgPSBvcC50cmltKCk7XG4gICAgdGhpcy5vcGVyYW5kcyA9IG9wZXJhbmRzO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbn07XG5cbnRyZWUuT3BlcmF0aW9uLnByb3RvdHlwZS5pcyA9ICdvcGVyYXRpb24nO1xuXG50cmVlLk9wZXJhdGlvbi5wcm90b3R5cGUuZXYgPSBmdW5jdGlvbihlbnYpIHtcbiAgICB2YXIgYSA9IHRoaXMub3BlcmFuZHNbMF0uZXYoZW52KSxcbiAgICAgICAgYiA9IHRoaXMub3BlcmFuZHNbMV0uZXYoZW52KSxcbiAgICAgICAgdGVtcDtcblxuICAgIGlmIChhLmlzID09PSAndW5kZWZpbmVkJyB8fCBiLmlzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXM6ICd1bmRlZmluZWQnLFxuICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGEgaW5zdGFuY2VvZiB0cmVlLkRpbWVuc2lvbiAmJiBiIGluc3RhbmNlb2YgdHJlZS5Db2xvcikge1xuICAgICAgICBpZiAodGhpcy5vcCA9PT0gJyonIHx8IHRoaXMub3AgPT09ICcrJykge1xuICAgICAgICAgICAgdGVtcCA9IGIsIGIgPSBhLCBhID0gdGVtcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJPcGVyYXRpb25FcnJvclwiLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiQ2FuJ3Qgc3Vic3RyYWN0IG9yIGRpdmlkZSBhIGNvbG9yIGZyb20gYSBudW1iZXJcIixcbiAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPbmx5IGNvbmNhdGVuYXRlIHBsYWluIHN0cmluZ3MsIGJlY2F1c2UgdGhpcyBpcyBlYXNpbHlcbiAgICAvLyBwcmUtcHJvY2Vzc2VkXG4gICAgaWYgKGEgaW5zdGFuY2VvZiB0cmVlLlF1b3RlZCAmJiBiIGluc3RhbmNlb2YgdHJlZS5RdW90ZWQgJiYgdGhpcy5vcCAhPT0gJysnKSB7XG4gICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgIG1lc3NhZ2U6IFwiQ2FuJ3Qgc3VidHJhY3QsIGRpdmlkZSwgb3IgbXVsdGlwbHkgc3RyaW5ncy5cIixcbiAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgIHR5cGU6ICdydW50aW1lJyxcbiAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMuZmlsZW5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpczogJ3VuZGVmaW5lZCcsXG4gICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBGaWVsZHMsIGxpdGVyYWxzLCBkaW1lbnNpb25zLCBhbmQgcXVvdGVkIHN0cmluZ3MgY2FuIGJlIGNvbWJpbmVkLlxuICAgIGlmIChhIGluc3RhbmNlb2YgdHJlZS5GaWVsZCB8fCBiIGluc3RhbmNlb2YgdHJlZS5GaWVsZCB8fFxuICAgICAgICBhIGluc3RhbmNlb2YgdHJlZS5MaXRlcmFsIHx8IGIgaW5zdGFuY2VvZiB0cmVlLkxpdGVyYWwpIHtcbiAgICAgICAgaWYgKGEuaXMgPT09ICdjb2xvcicgfHwgYi5pcyA9PT0gJ2NvbG9yJykge1xuICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiQ2FuJ3Qgc3VidHJhY3QsIGRpdmlkZSwgb3IgbXVsdGlwbHkgY29sb3JzIGluIGV4cHJlc3Npb25zLlwiLFxuICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICAgICB0eXBlOiAncnVudGltZScsXG4gICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuTGl0ZXJhbChhLmV2KGVudikudG9TdHJpbmcodHJ1ZSkgKyB0aGlzLm9wICsgYi5ldihlbnYpLnRvU3RyaW5nKHRydWUpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChhLm9wZXJhdGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICBtZXNzYWdlOiAnQ2Fubm90IGRvIG1hdGggd2l0aCB0eXBlICcgKyBhLmlzICsgJy4nLFxuICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgdHlwZTogJ3J1bnRpbWUnLFxuICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgIHZhbHVlOiAndW5kZWZpbmVkJ1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBhLm9wZXJhdGUoZW52LCB0aGlzLm9wLCBiKTtcbn07XG5cbnRyZWUub3BlcmF0ZSA9IGZ1bmN0aW9uKG9wLCBhLCBiKSB7XG4gICAgc3dpdGNoIChvcCkge1xuICAgICAgICBjYXNlICcrJzogcmV0dXJuIGEgKyBiO1xuICAgICAgICBjYXNlICctJzogcmV0dXJuIGEgLSBiO1xuICAgICAgICBjYXNlICcqJzogcmV0dXJuIGEgKiBiO1xuICAgICAgICBjYXNlICclJzogcmV0dXJuIGEgJSBiO1xuICAgICAgICBjYXNlICcvJzogcmV0dXJuIGEgLyBiO1xuICAgIH1cbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLlF1b3RlZCA9IGZ1bmN0aW9uIFF1b3RlZChjb250ZW50KSB7XG4gICAgdGhpcy52YWx1ZSA9IGNvbnRlbnQgfHwgJyc7XG59O1xuXG50cmVlLlF1b3RlZC5wcm90b3R5cGUgPSB7XG4gICAgaXM6ICdzdHJpbmcnLFxuXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKHF1b3Rlcykge1xuICAgICAgICB2YXIgZXNjYXBlZFZhbHVlID0gdGhpcy52YWx1ZVxuICAgICAgICAgICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAgICAgdmFyIHhtbHZhbHVlID0gZXNjYXBlZFZhbHVlXG4gICAgICAgICAgICAucmVwbGFjZSgvXFwnL2csICdcXFxcXFwnJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXFwiL2csICcmcXVvdDsnKVxuICAgICAgICAgICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcPi9nLCAnJmd0OycpO1xuICAgICAgICByZXR1cm4gKHF1b3RlcyA9PT0gdHJ1ZSkgPyBcIidcIiArIHhtbHZhbHVlICsgXCInXCIgOiBlc2NhcGVkVmFsdWU7XG4gICAgfSxcblxuICAgICdldic6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgb3BlcmF0ZTogZnVuY3Rpb24oZW52LCBvcCwgb3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlF1b3RlZCh0cmVlLm9wZXJhdGUob3AsIHRoaXMudG9TdHJpbmcoKSwgb3RoZXIudG9TdHJpbmcodGhpcy5jb250YWluc19maWVsZCkpKTtcbiAgICB9XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiLy8gQ2FydG8gcHVsbHMgaW4gYSByZWZlcmVuY2UgZnJvbSB0aGUgYG1hcG5pay1yZWZlcmVuY2VgXG4vLyBtb2R1bGUuIFRoaXMgZmlsZSBidWlsZHMgaW5kZXhlcyBmcm9tIHRoYXQgZmlsZSBmb3IgaXRzIHZhcmlvdXNcbi8vIG9wdGlvbnMsIGFuZCBwcm92aWRlcyB2YWxpZGF0aW9uIG1ldGhvZHMgZm9yIHByb3BlcnR5OiB2YWx1ZVxuLy8gY29tYmluYXRpb25zLlxuKGZ1bmN0aW9uKHRyZWUpIHtcblxudmFyIF8gPSBnbG9iYWwuXyB8fCByZXF1aXJlKCd1bmRlcnNjb3JlJyksXG4gICAgcmVmID0ge307XG5cbnJlZi5zZXREYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHJlZi5kYXRhID0gZGF0YTtcbiAgICByZWYuc2VsZWN0b3JfY2FjaGUgPSBnZW5lcmF0ZVNlbGVjdG9yQ2FjaGUoZGF0YSk7XG4gICAgcmVmLm1hcG5pa0Z1bmN0aW9ucyA9IGdlbmVyYXRlTWFwbmlrRnVuY3Rpb25zKGRhdGEpO1xuXG4gICAgcmVmLm1hcG5pa0Z1bmN0aW9ucy5tYXRyaXggPSBbNl07XG4gICAgcmVmLm1hcG5pa0Z1bmN0aW9ucy50cmFuc2xhdGUgPSBbMSwgMl07XG4gICAgcmVmLm1hcG5pa0Z1bmN0aW9ucy5zY2FsZSA9IFsxLCAyXTtcbiAgICByZWYubWFwbmlrRnVuY3Rpb25zLnJvdGF0ZSA9IFsxLCAzXTtcbiAgICByZWYubWFwbmlrRnVuY3Rpb25zLnNrZXdYID0gWzFdO1xuICAgIHJlZi5tYXBuaWtGdW5jdGlvbnMuc2tld1kgPSBbMV07XG5cbiAgICByZWYucmVxdWlyZWRfY2FjaGUgPSBnZW5lcmF0ZVJlcXVpcmVkUHJvcGVydGllcyhkYXRhKTtcbn07XG5cbnJlZi5zZXRWZXJzaW9uID0gZnVuY3Rpb24odmVyc2lvbikge1xuICAgIHZhciBtYXBuaWtfcmVmZXJlbmNlID0gcmVxdWlyZSgnbWFwbmlrLXJlZmVyZW5jZScpO1xuICAgIGlmIChtYXBuaWtfcmVmZXJlbmNlLnZlcnNpb24uaGFzT3duUHJvcGVydHkodmVyc2lvbikpIHtcbiAgICAgICAgcmVmLnNldERhdGEobWFwbmlrX3JlZmVyZW5jZS52ZXJzaW9uW3ZlcnNpb25dKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn07XG5cbnJlZi5zZWxlY3RvckRhdGEgPSBmdW5jdGlvbihzZWxlY3RvciwgaSkge1xuICAgIGlmIChyZWYuc2VsZWN0b3JfY2FjaGVbc2VsZWN0b3JdKSByZXR1cm4gcmVmLnNlbGVjdG9yX2NhY2hlW3NlbGVjdG9yXVtpXTtcbn07XG5cbnJlZi52YWxpZFNlbGVjdG9yID0gZnVuY3Rpb24oc2VsZWN0b3IpIHsgcmV0dXJuICEhcmVmLnNlbGVjdG9yX2NhY2hlW3NlbGVjdG9yXTsgfTtcbnJlZi5zZWxlY3Rvck5hbWUgPSBmdW5jdGlvbihzZWxlY3RvcikgeyByZXR1cm4gcmVmLnNlbGVjdG9yRGF0YShzZWxlY3RvciwgMik7IH07XG5yZWYuc2VsZWN0b3IgPSBmdW5jdGlvbihzZWxlY3RvcikgeyByZXR1cm4gcmVmLnNlbGVjdG9yRGF0YShzZWxlY3RvciwgMCk7IH07XG5yZWYuc3ltYm9saXplciA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7IHJldHVybiByZWYuc2VsZWN0b3JEYXRhKHNlbGVjdG9yLCAxKTsgfTtcblxuZnVuY3Rpb24gZ2VuZXJhdGVTZWxlY3RvckNhY2hlKGRhdGEpIHtcbiAgICB2YXIgaW5kZXggPSB7fTtcbiAgICBmb3IgKHZhciBpIGluIGRhdGEuc3ltYm9saXplcnMpIHtcbiAgICAgICAgZm9yICh2YXIgaiBpbiBkYXRhLnN5bWJvbGl6ZXJzW2ldKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5zeW1ib2xpemVyc1tpXVtqXS5oYXNPd25Qcm9wZXJ0eSgnY3NzJykpIHtcbiAgICAgICAgICAgICAgICBpbmRleFtkYXRhLnN5bWJvbGl6ZXJzW2ldW2pdLmNzc10gPSBbZGF0YS5zeW1ib2xpemVyc1tpXVtqXSwgaSwgal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZU1hcG5pa0Z1bmN0aW9ucyhkYXRhKSB7XG4gICAgdmFyIGZ1bmN0aW9ucyA9IHt9O1xuICAgIGZvciAodmFyIGkgaW4gZGF0YS5zeW1ib2xpemVycykge1xuICAgICAgICBmb3IgKHZhciBqIGluIGRhdGEuc3ltYm9saXplcnNbaV0pIHtcbiAgICAgICAgICAgIGlmIChkYXRhLnN5bWJvbGl6ZXJzW2ldW2pdLnR5cGUgPT09ICdmdW5jdGlvbnMnKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBkYXRhLnN5bWJvbGl6ZXJzW2ldW2pdLmZ1bmN0aW9ucy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBkYXRhLnN5bWJvbGl6ZXJzW2ldW2pdLmZ1bmN0aW9uc1trXTtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25zW2ZuWzBdXSA9IGZuWzFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb25zO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVJlcXVpcmVkUHJvcGVydGllcyhkYXRhKSB7XG4gICAgdmFyIGNhY2hlID0ge307XG4gICAgZm9yICh2YXIgc3ltYm9saXplcl9uYW1lIGluIGRhdGEuc3ltYm9saXplcnMpIHtcbiAgICAgICAgY2FjaGVbc3ltYm9saXplcl9uYW1lXSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBqIGluIGRhdGEuc3ltYm9saXplcnNbc3ltYm9saXplcl9uYW1lXSkge1xuICAgICAgICAgICAgaWYgKGRhdGEuc3ltYm9saXplcnNbc3ltYm9saXplcl9uYW1lXVtqXS5yZXF1aXJlZCkge1xuICAgICAgICAgICAgICAgIGNhY2hlW3N5bWJvbGl6ZXJfbmFtZV0ucHVzaChkYXRhLnN5bWJvbGl6ZXJzW3N5bWJvbGl6ZXJfbmFtZV1bal0uY3NzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2FjaGU7XG59XG5cbnJlZi5yZXF1aXJlZFByb3BlcnRpZXMgPSBmdW5jdGlvbihzeW1ib2xpemVyX25hbWUsIHJ1bGVzKSB7XG4gICAgdmFyIHJlcSA9IHJlZi5yZXF1aXJlZF9jYWNoZVtzeW1ib2xpemVyX25hbWVdO1xuICAgIGZvciAodmFyIGkgaW4gcmVxKSB7XG4gICAgICAgIGlmICghKHJlcVtpXSBpbiBydWxlcykpIHtcbiAgICAgICAgICAgIHJldHVybiAnUHJvcGVydHkgJyArIHJlcVtpXSArICcgcmVxdWlyZWQgZm9yIGRlZmluaW5nICcgK1xuICAgICAgICAgICAgICAgIHN5bWJvbGl6ZXJfbmFtZSArICcgc3R5bGVzLic7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vLyBUT0RPOiBmaW5pc2ggaW1wbGVtZW50YXRpb24gLSB0aGlzIGlzIGRlYWQgY29kZVxucmVmLl92YWxpZGF0ZVZhbHVlID0ge1xuICAgICdmb250JzogZnVuY3Rpb24oZW52LCB2YWx1ZSkge1xuICAgICAgICBpZiAoZW52LnZhbGlkYXRpb25fZGF0YSAmJiBlbnYudmFsaWRhdGlvbl9kYXRhLmZvbnRzKSB7XG4gICAgICAgICAgICByZXR1cm4gZW52LnZhbGlkYXRpb25fZGF0YS5mb250cy5pbmRleE9mKHZhbHVlKSAhPSAtMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxufTtcblxucmVmLmlzRm9udCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIHJlZi5zZWxlY3RvcihzZWxlY3RvcikudmFsaWRhdGUgPT0gJ2ZvbnQnO1xufTtcblxuLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vOTgyOTI3XG5yZWYuZWRpdERpc3RhbmNlID0gZnVuY3Rpb24oYSwgYil7XG4gICAgaWYgKGEubGVuZ3RoID09PSAwKSByZXR1cm4gYi5sZW5ndGg7XG4gICAgaWYgKGIubGVuZ3RoID09PSAwKSByZXR1cm4gYS5sZW5ndGg7XG4gICAgdmFyIG1hdHJpeCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IGIubGVuZ3RoOyBpKyspIHsgbWF0cml4W2ldID0gW2ldOyB9XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPD0gYS5sZW5ndGg7IGorKykgeyBtYXRyaXhbMF1bal0gPSBqOyB9XG4gICAgZm9yIChpID0gMTsgaSA8PSBiLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZvciAoaiA9IDE7IGogPD0gYS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKGIuY2hhckF0KGktMSkgPT0gYS5jaGFyQXQoai0xKSkge1xuICAgICAgICAgICAgICAgIG1hdHJpeFtpXVtqXSA9IG1hdHJpeFtpLTFdW2otMV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hdHJpeFtpXVtqXSA9IE1hdGgubWluKG1hdHJpeFtpLTFdW2otMV0gKyAxLCAvLyBzdWJzdGl0dXRpb25cbiAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4obWF0cml4W2ldW2otMV0gKyAxLCAvLyBpbnNlcnRpb25cbiAgICAgICAgICAgICAgICAgICAgbWF0cml4W2ktMV1bal0gKyAxKSk7IC8vIGRlbGV0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hdHJpeFtiLmxlbmd0aF1bYS5sZW5ndGhdO1xufTtcblxuZnVuY3Rpb24gdmFsaWRhdGVGdW5jdGlvbnModmFsdWUsIHNlbGVjdG9yKSB7XG4gICAgaWYgKHZhbHVlLnZhbHVlWzBdLmlzID09PSAnc3RyaW5nJykgcmV0dXJuIHRydWU7XG4gICAgZm9yICh2YXIgaSBpbiB2YWx1ZS52YWx1ZSkge1xuICAgICAgICBmb3IgKHZhciBqIGluIHZhbHVlLnZhbHVlW2ldLnZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUudmFsdWVbaV0udmFsdWVbal0uaXMgIT09ICdjYWxsJykgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgdmFyIGYgPSBfLmZpbmQocmVmXG4gICAgICAgICAgICAgICAgLnNlbGVjdG9yKHNlbGVjdG9yKS5mdW5jdGlvbnMsIGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHhbMF0gPT0gdmFsdWUudmFsdWVbaV0udmFsdWVbal0ubmFtZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghKGYgJiYgZlsxXSA9PSAtMSkpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGZpbHRlciBpcyB1bmtub3duIG9yIGdpdmVuIGFuIGluY29ycmVjdCBudW1iZXIgb2YgYXJndW1lbnRzXG4gICAgICAgICAgICAgICAgaWYgKCFmIHx8IGZbMV0gIT09IHZhbHVlLnZhbHVlW2ldLnZhbHVlW2pdLmFyZ3MubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlS2V5d29yZCh2YWx1ZSwgc2VsZWN0b3IpIHtcbiAgICBpZiAodHlwZW9mIHJlZi5zZWxlY3RvcihzZWxlY3RvcikudHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIHJlZi5zZWxlY3RvcihzZWxlY3RvcikudHlwZVxuICAgICAgICAgICAgLmluZGV4T2YodmFsdWUudmFsdWVbMF0udmFsdWUpICE9PSAtMTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhbGxvdyB1bnF1b3RlZCBrZXl3b3JkcyBhcyBzdHJpbmdzXG4gICAgICAgIHJldHVybiByZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLnR5cGUgPT09ICdzdHJpbmcnO1xuICAgIH1cbn1cblxucmVmLnZhbGlkVmFsdWUgPSBmdW5jdGlvbihlbnYsIHNlbGVjdG9yLCB2YWx1ZSkge1xuICAgIHZhciBpLCBqO1xuICAgIC8vIFRPRE86IGhhbmRsZSBpbiByZXVzYWJsZSB3YXlcbiAgICBpZiAoIXJlZi5zZWxlY3RvcihzZWxlY3RvcikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAodmFsdWUudmFsdWVbMF0uaXMgPT0gJ2tleXdvcmQnKSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUtleXdvcmQodmFsdWUsIHNlbGVjdG9yKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlLnZhbHVlWzBdLmlzID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIGNhdWdodCBlYXJsaWVyIGluIHRoZSBjaGFpbiAtIGlnbm9yZSBoZXJlIHNvIHRoYXRcbiAgICAgICAgLy8gZXJyb3IgaXMgbm90IG92ZXJyaWRkZW5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmIChyZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLnR5cGUgPT0gJ251bWJlcnMnKSB7XG4gICAgICAgIGZvciAoaSBpbiB2YWx1ZS52YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlLnZhbHVlW2ldLmlzICE9PSAnZmxvYXQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAocmVmLnNlbGVjdG9yKHNlbGVjdG9yKS50eXBlID09ICd0YWdzJykge1xuICAgICAgICBpZiAoIXZhbHVlLnZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghdmFsdWUudmFsdWVbMF0udmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS52YWx1ZVswXS5pcyA9PT0gJ3RhZyc7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHZhbHVlLnZhbHVlWzBdLnZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUudmFsdWVbMF0udmFsdWVbaV0uaXMgIT09ICd0YWcnKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmIChyZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLnR5cGUgPT0gJ2Z1bmN0aW9ucycpIHtcbiAgICAgICAgLy8gRm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LCB5b3UgY2FuIHNwZWNpZnkgYSBzdHJpbmcgZm9yIGBmdW5jdGlvbnNgLWNvbXBhdGlibGVcbiAgICAgICAgLy8gdmFsdWVzLCB0aG91Z2ggdGhleSB3aWxsIG5vdCBiZSB2YWxpZGF0ZWQuXG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUZ1bmN0aW9ucyh2YWx1ZSwgc2VsZWN0b3IpO1xuICAgIH0gZWxzZSBpZiAocmVmLnNlbGVjdG9yKHNlbGVjdG9yKS50eXBlID09PSAndW5zaWduZWQnKSB7XG4gICAgICAgIGlmICh2YWx1ZS52YWx1ZVswXS5pcyA9PT0gJ2Zsb2F0Jykge1xuICAgICAgICAgICAgdmFsdWUudmFsdWVbMF0ucm91bmQoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICgocmVmLnNlbGVjdG9yKHNlbGVjdG9yKS5leHByZXNzaW9uKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocmVmLnNlbGVjdG9yKHNlbGVjdG9yKS52YWxpZGF0ZSkge1xuICAgICAgICAgICAgdmFyIHZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdmFsdWUudmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocmVmLnNlbGVjdG9yKHNlbGVjdG9yKS50eXBlID09IHZhbHVlLnZhbHVlW2ldLmlzICYmXG4gICAgICAgICAgICAgICAgICAgIHJlZlxuICAgICAgICAgICAgICAgICAgICAgICAgLl92YWxpZGF0ZVZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW3JlZi5zZWxlY3RvcihzZWxlY3RvcikudmFsaWRhdGVdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVudiwgdmFsdWUudmFsdWVbaV0udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWxpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiByZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLnR5cGUgPT0gdmFsdWUudmFsdWVbMF0uaXM7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG50cmVlLlJlZmVyZW5jZSA9IHJlZjtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG4vLyBhIHJ1bGUgaXMgYSBzaW5nbGUgcHJvcGVydHkgYW5kIHZhbHVlIGNvbWJpbmF0aW9uLCBvciB2YXJpYWJsZVxuLy8gbmFtZSBhbmQgdmFsdWUgY29tYmluYXRpb24sIGxpa2Vcbi8vIHBvbHlnb24tb3BhY2l0eTogMS4wOyBvciBAb3BhY2l0eTogMS4wO1xudHJlZS5SdWxlID0gZnVuY3Rpb24gUnVsZShuYW1lLCB2YWx1ZSwgaW5kZXgsIGZpbGVuYW1lKSB7XG4gICAgdmFyIHBhcnRzID0gbmFtZS5zcGxpdCgnLycpO1xuICAgIHRoaXMubmFtZSA9IHBhcnRzLnBvcCgpO1xuICAgIHRoaXMuaW5zdGFuY2UgPSBwYXJ0cy5sZW5ndGggPyBwYXJ0c1swXSA6ICdfX2RlZmF1bHRfXyc7XG4gICAgdGhpcy52YWx1ZSA9ICh2YWx1ZSBpbnN0YW5jZW9mIHRyZWUuVmFsdWUpID9cbiAgICAgICAgdmFsdWUgOiBuZXcgdHJlZS5WYWx1ZShbdmFsdWVdKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5zeW1ib2xpemVyID0gdHJlZS5SZWZlcmVuY2Uuc3ltYm9saXplcih0aGlzLm5hbWUpO1xuICAgIHRoaXMuZmlsZW5hbWUgPSBmaWxlbmFtZTtcbiAgICB0aGlzLnZhcmlhYmxlID0gKG5hbWUuY2hhckF0KDApID09PSAnQCcpO1xufTtcblxudHJlZS5SdWxlLnByb3RvdHlwZS5pcyA9ICdydWxlJztcblxudHJlZS5SdWxlLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjbG9uZSA9IE9iamVjdC5jcmVhdGUodHJlZS5SdWxlLnByb3RvdHlwZSk7XG4gICAgY2xvbmUubmFtZSA9IHRoaXMubmFtZTtcbiAgICBjbG9uZS52YWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgY2xvbmUuaW5kZXggPSB0aGlzLmluZGV4O1xuICAgIGNsb25lLmluc3RhbmNlID0gdGhpcy5pbnN0YW5jZTtcbiAgICBjbG9uZS5zeW1ib2xpemVyID0gdGhpcy5zeW1ib2xpemVyO1xuICAgIGNsb25lLmZpbGVuYW1lID0gdGhpcy5maWxlbmFtZTtcbiAgICBjbG9uZS52YXJpYWJsZSA9IHRoaXMudmFyaWFibGU7XG4gICAgcmV0dXJuIGNsb25lO1xufTtcblxudHJlZS5SdWxlLnByb3RvdHlwZS51cGRhdGVJRCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmlkID0gdGhpcy56b29tICsgJyMnICsgdGhpcy5pbnN0YW5jZSArICcjJyArIHRoaXMubmFtZTtcbn07XG5cbnRyZWUuUnVsZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJ1snICsgdHJlZS5ab29tLnRvU3RyaW5nKHRoaXMuem9vbSkgKyAnXSAnICsgdGhpcy5uYW1lICsgJzogJyArIHRoaXMudmFsdWU7XG59O1xuXG5mdW5jdGlvbiBnZXRNZWFuKG5hbWUpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModHJlZS5SZWZlcmVuY2Uuc2VsZWN0b3JfY2FjaGUpLm1hcChmdW5jdGlvbihmKSB7XG4gICAgICAgIHJldHVybiBbZiwgdHJlZS5SZWZlcmVuY2UuZWRpdERpc3RhbmNlKG5hbWUsIGYpXTtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGFbMV0gLSBiWzFdOyB9KTtcbn1cblxuLy8gc2Vjb25kIGFyZ3VtZW50LCBpZiB0cnVlLCBvdXRwdXRzIHRoZSB2YWx1ZSBvZiB0aGlzXG4vLyBydWxlIHdpdGhvdXQgdGhlIHVzdWFsIGF0dHJpYnV0ZT1cImNvbnRlbnRcIiB3cmFwcGluZy4gUmlnaHRcbi8vIG5vdyB0aGlzIGlzIGp1c3QgZm9yIHRoZSBUZXh0U3ltYm9saXplciwgYnV0IGFwcGxpZXMgdG8gb3RoZXJcbi8vIHByb3BlcnRpZXMgaW4gcmVmZXJlbmNlLmpzb24gd2hpY2ggc3BlY2lmeSBzZXJpYWxpemF0aW9uPWNvbnRlbnRcbnRyZWUuUnVsZS5wcm90b3R5cGUudG9YTUwgPSBmdW5jdGlvbihlbnYsIGNvbnRlbnQsIHNlcCwgZm9ybWF0KSB7XG4gICAgaWYgKCF0cmVlLlJlZmVyZW5jZS52YWxpZFNlbGVjdG9yKHRoaXMubmFtZSkpIHtcbiAgICAgICAgdmFyIG1lYW4gPSBnZXRNZWFuKHRoaXMubmFtZSk7XG4gICAgICAgIHZhciBtZWFuX21lc3NhZ2UgPSAnJztcbiAgICAgICAgaWYgKG1lYW5bMF1bMV0gPCAzKSB7XG4gICAgICAgICAgICBtZWFuX21lc3NhZ2UgPSAnLiBEaWQgeW91IG1lYW4gJyArIG1lYW5bMF1bMF0gKyAnPyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVudi5lcnJvcih7XG4gICAgICAgICAgICBtZXNzYWdlOiBcIlVucmVjb2duaXplZCBydWxlOiBcIiArIHRoaXMubmFtZSArIG1lYW5fbWVzc2FnZSxcbiAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgdHlwZTogJ3N5bnRheCcsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoKHRoaXMudmFsdWUgaW5zdGFuY2VvZiB0cmVlLlZhbHVlKSAmJlxuICAgICAgICAhdHJlZS5SZWZlcmVuY2UudmFsaWRWYWx1ZShlbnYsIHRoaXMubmFtZSwgdGhpcy52YWx1ZSkpIHtcbiAgICAgICAgaWYgKCF0cmVlLlJlZmVyZW5jZS5zZWxlY3Rvcih0aGlzLm5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnVW5yZWNvZ25pemVkIHByb3BlcnR5OiAnICtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgIHR5cGU6ICdzeW50YXgnLFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB0eXBlbmFtZTtcbiAgICAgICAgICAgIGlmICh0cmVlLlJlZmVyZW5jZS5zZWxlY3Rvcih0aGlzLm5hbWUpLnZhbGlkYXRlKSB7XG4gICAgICAgICAgICAgICAgdHlwZW5hbWUgPSB0cmVlLlJlZmVyZW5jZS5zZWxlY3Rvcih0aGlzLm5hbWUpLnZhbGlkYXRlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdHJlZS5SZWZlcmVuY2Uuc2VsZWN0b3IodGhpcy5uYW1lKS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHR5cGVuYW1lID0gJ2tleXdvcmQgKG9wdGlvbnM6ICcgKyB0cmVlLlJlZmVyZW5jZS5zZWxlY3Rvcih0aGlzLm5hbWUpLnR5cGUuam9pbignLCAnKSArICcpJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdHlwZW5hbWUgPSB0cmVlLlJlZmVyZW5jZS5zZWxlY3Rvcih0aGlzLm5hbWUpLnR5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnSW52YWxpZCB2YWx1ZSBmb3IgJyArXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICcsIHRoZSB0eXBlICcgKyB0eXBlbmFtZSArXG4gICAgICAgICAgICAgICAgICAgICcgaXMgZXhwZWN0ZWQuICcgKyB0aGlzLnZhbHVlICtcbiAgICAgICAgICAgICAgICAgICAgJyAob2YgdHlwZSAnICsgdGhpcy52YWx1ZS52YWx1ZVswXS5pcyArICcpICcgK1xuICAgICAgICAgICAgICAgICAgICAnIHdhcyBnaXZlbi4nLFxuICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgIHR5cGU6ICdzeW50YXgnLFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLnZhcmlhYmxlKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9IGVsc2UgaWYgKHRyZWUuUmVmZXJlbmNlLmlzRm9udCh0aGlzLm5hbWUpICYmIHRoaXMudmFsdWUudmFsdWUubGVuZ3RoID4gMSkge1xuICAgICAgICB2YXIgZiA9IHRyZWUuX2dldEZvbnRTZXQoZW52LCB0aGlzLnZhbHVlLnZhbHVlKTtcbiAgICAgICAgcmV0dXJuICdmb250c2V0LW5hbWU9XCInICsgZi5uYW1lICsgJ1wiJztcbiAgICB9IGVsc2UgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUudG9TdHJpbmcoZW52LCB0aGlzLm5hbWUsIHNlcCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRyZWUuUmVmZXJlbmNlLnNlbGVjdG9yTmFtZSh0aGlzLm5hbWUpICtcbiAgICAgICAgICAgICc9XCInICtcbiAgICAgICAgICAgIHRoaXMudmFsdWUudG9TdHJpbmcoZW52LCB0aGlzLm5hbWUpICtcbiAgICAgICAgICAgICdcIic7XG4gICAgfVxufTtcblxuLy8gVE9ETzogUnVsZSBldiBjaGFpbiBzaG91bGQgYWRkIGZvbnRzZXRzIHRvIGVudi5mcmFtZXNcbnRyZWUuUnVsZS5wcm90b3R5cGUuZXYgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgcmV0dXJuIG5ldyB0cmVlLlJ1bGUodGhpcy5uYW1lLFxuICAgICAgICB0aGlzLnZhbHVlLmV2KGNvbnRleHQpLFxuICAgICAgICB0aGlzLmluZGV4LFxuICAgICAgICB0aGlzLmZpbGVuYW1lKTtcbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLlJ1bGVzZXQgPSBmdW5jdGlvbiBSdWxlc2V0KHNlbGVjdG9ycywgcnVsZXMpIHtcbiAgICB0aGlzLnNlbGVjdG9ycyA9IHNlbGVjdG9ycztcbiAgICB0aGlzLnJ1bGVzID0gcnVsZXM7XG4gICAgLy8gc3RhdGljIGNhY2hlIG9mIGZpbmQoKSBmdW5jdGlvblxuICAgIHRoaXMuX2xvb2t1cHMgPSB7fTtcbn07XG50cmVlLlJ1bGVzZXQucHJvdG90eXBlID0ge1xuICAgIGlzOiAncnVsZXNldCcsXG4gICAgJ2V2JzogZnVuY3Rpb24oZW52KSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgcnVsZXNldCA9IG5ldyB0cmVlLlJ1bGVzZXQodGhpcy5zZWxlY3RvcnMsIHRoaXMucnVsZXMuc2xpY2UoMCkpO1xuICAgICAgICBydWxlc2V0LnJvb3QgPSB0aGlzLnJvb3Q7XG5cbiAgICAgICAgLy8gcHVzaCB0aGUgY3VycmVudCBydWxlc2V0IHRvIHRoZSBmcmFtZXMgc3RhY2tcbiAgICAgICAgZW52LmZyYW1lcy51bnNoaWZ0KHJ1bGVzZXQpO1xuXG4gICAgICAgIC8vIEV2YWx1YXRlIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBmb3IgKGkgPSAwLCBydWxlOyBpIDwgcnVsZXNldC5ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcnVsZSA9IHJ1bGVzZXQucnVsZXNbaV07XG4gICAgICAgICAgICBydWxlc2V0LnJ1bGVzW2ldID0gcnVsZS5ldiA/IHJ1bGUuZXYoZW52KSA6IHJ1bGU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQb3AgdGhlIHN0YWNrXG4gICAgICAgIGVudi5mcmFtZXMuc2hpZnQoKTtcblxuICAgICAgICByZXR1cm4gcnVsZXNldDtcbiAgICB9LFxuICAgIG1hdGNoOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiAhYXJncyB8fCBhcmdzLmxlbmd0aCA9PT0gMDtcbiAgICB9LFxuICAgIHZhcmlhYmxlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl92YXJpYWJsZXMpIHsgcmV0dXJuIHRoaXMuX3ZhcmlhYmxlczsgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92YXJpYWJsZXMgPSB0aGlzLnJ1bGVzLnJlZHVjZShmdW5jdGlvbihoYXNoLCByKSB7XG4gICAgICAgICAgICAgICAgaWYgKHIgaW5zdGFuY2VvZiB0cmVlLlJ1bGUgJiYgci52YXJpYWJsZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBoYXNoW3IubmFtZV0gPSByO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzaDtcbiAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgdmFyaWFibGU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFyaWFibGVzKClbbmFtZV07XG4gICAgfSxcbiAgICBydWxlc2V0czogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9ydWxlc2V0cykgeyByZXR1cm4gdGhpcy5fcnVsZXNldHM7IH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcnVsZXNldHMgPSB0aGlzLnJ1bGVzLmZpbHRlcihmdW5jdGlvbihyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChyIGluc3RhbmNlb2YgdHJlZS5SdWxlc2V0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBmaW5kOiBmdW5jdGlvbihzZWxlY3Rvciwgc2VsZikge1xuICAgICAgICBzZWxmID0gc2VsZiB8fCB0aGlzO1xuICAgICAgICB2YXIgcnVsZXMgPSBbXSwgcnVsZSwgbWF0Y2gsXG4gICAgICAgICAgICBrZXkgPSBzZWxlY3Rvci50b1N0cmluZygpO1xuXG4gICAgICAgIGlmIChrZXkgaW4gdGhpcy5fbG9va3VwcykgeyByZXR1cm4gdGhpcy5fbG9va3Vwc1trZXldOyB9XG5cbiAgICAgICAgdGhpcy5ydWxlc2V0cygpLmZvckVhY2goZnVuY3Rpb24ocnVsZSkge1xuICAgICAgICAgICAgaWYgKHJ1bGUgIT09IHNlbGYpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJ1bGUuc2VsZWN0b3JzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoID0gc2VsZWN0b3IubWF0Y2gocnVsZS5zZWxlY3RvcnNbal0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3Rvci5lbGVtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkocnVsZXMsIHJ1bGUuZmluZChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IHRyZWUuU2VsZWN0b3IobnVsbCwgbnVsbCwgbnVsbCwgc2VsZWN0b3IuZWxlbWVudHMuc2xpY2UoMSkpLCBzZWxmKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGVzLnB1c2gocnVsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb29rdXBzW2tleV0gPSBydWxlcztcbiAgICB9LFxuICAgIC8vIFpvb21zIGNhbiB1c2UgdmFyaWFibGVzLiBUaGlzIHJlcGxhY2VzIHRyZWUuWm9vbSBvYmplY3RzIG9uIHNlbGVjdG9yc1xuICAgIC8vIHdpdGggc2ltcGxlIGJpdC1hcnJheXMgdGhhdCB3ZSBjYW4gY29tcGFyZSBlYXNpbHkuXG4gICAgZXZab29tczogZnVuY3Rpb24oZW52KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB6dmFsID0gdHJlZS5ab29tLmFsbDtcbiAgICAgICAgICAgIGZvciAodmFyIHogPSAwOyB6IDwgdGhpcy5zZWxlY3RvcnNbaV0uem9vbS5sZW5ndGg7IHorKykge1xuICAgICAgICAgICAgICAgIHp2YWwgPSB6dmFsICYgdGhpcy5zZWxlY3RvcnNbaV0uem9vbVt6XS5ldihlbnYpLnpvb207XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNlbGVjdG9yc1tpXS56b29tID0genZhbDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZmxhdHRlbjogZnVuY3Rpb24ocmVzdWx0LCBwYXJlbnRzLCBlbnYpIHtcbiAgICAgICAgdmFyIHNlbGVjdG9ycyA9IFtdLCBpLCBqO1xuICAgICAgICBpZiAodGhpcy5zZWxlY3RvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBlbnYuZnJhbWVzID0gZW52LmZyYW1lcy5jb25jYXQodGhpcy5ydWxlcyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZXZhbHVhdGUgem9vbSB2YXJpYWJsZXMgb24gdGhpcyBvYmplY3QuXG4gICAgICAgIHRoaXMuZXZab29tcyhlbnYpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IHRoaXMuc2VsZWN0b3JzW2ldO1xuXG4gICAgICAgICAgICBpZiAoIWNoaWxkLmZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBpcyB0aGlzIGludGVybmFsIGluY29uc2lzdGVuY3k/XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhbiBpbnZhbGlkIGZpbHRlcnNldC5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHBhcmVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHBhcmVudHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IHBhcmVudHNbal07XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG1lcmdlZEZpbHRlcnMgPSBwYXJlbnQuZmlsdGVycy5jbG9uZVdpdGgoY2hpbGQuZmlsdGVycyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXJnZWRGaWx0ZXJzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaWx0ZXJzIGNvdWxkIGJlIGFkZGVkLCBidXQgdGhleSBkaWRuJ3QgY2hhbmdlIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmlsdGVycy4gVGhpcyBtZWFucyB0aGF0IHdlIG9ubHkgaGF2ZSB0byBjbG9uZSB3aGVuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgem9vbSBsZXZlbHMgb3IgdGhlIGF0dGFjaG1lbnQgaXMgZGlmZmVyZW50IHRvby5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnQuem9vbSA9PT0gKHBhcmVudC56b29tICYgY2hpbGQuem9vbSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuZnJhbWVfb2Zmc2V0ID09PSBjaGlsZC5mcmFtZV9vZmZzZXQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuYXR0YWNobWVudCA9PT0gY2hpbGQuYXR0YWNobWVudCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5lbGVtZW50cy5qb2luKCkgPT09IGNoaWxkLmVsZW1lbnRzLmpvaW4oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdG9ycy5wdXNoKHBhcmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlZEZpbHRlcnMgPSBwYXJlbnQuZmlsdGVycztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghbWVyZ2VkRmlsdGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIG1lcmdlZCBmaWx0ZXJzIGFyZSBpbnZhbGlkLCB0aGF0IG1lYW5zIHdlIGRvbid0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBoYXZlIHRvIGNsb25lLlxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgY2xvbmUgPSBPYmplY3QuY3JlYXRlKHRyZWUuU2VsZWN0b3IucHJvdG90eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgY2xvbmUuZmlsdGVycyA9IG1lcmdlZEZpbHRlcnM7XG4gICAgICAgICAgICAgICAgICAgIGNsb25lLnpvb20gPSBwYXJlbnQuem9vbSAmIGNoaWxkLnpvb207XG4gICAgICAgICAgICAgICAgICAgIGNsb25lLmZyYW1lX29mZnNldCA9IGNoaWxkLmZyYW1lX29mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgY2xvbmUuZWxlbWVudHMgPSBwYXJlbnQuZWxlbWVudHMuY29uY2F0KGNoaWxkLmVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudC5hdHRhY2htZW50ICYmIGNoaWxkLmF0dGFjaG1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lLmF0dGFjaG1lbnQgPSBwYXJlbnQuYXR0YWNobWVudCArICcvJyArIGNoaWxkLmF0dGFjaG1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBjbG9uZS5hdHRhY2htZW50ID0gY2hpbGQuYXR0YWNobWVudCB8fCBwYXJlbnQuYXR0YWNobWVudDtcbiAgICAgICAgICAgICAgICAgICAgY2xvbmUuY29uZGl0aW9ucyA9IHBhcmVudC5jb25kaXRpb25zICsgY2hpbGQuY29uZGl0aW9ucztcbiAgICAgICAgICAgICAgICAgICAgY2xvbmUuaW5kZXggPSBjaGlsZC5pbmRleDtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0b3JzLnB1c2goY2xvbmUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3JzLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJ1bGVzID0gW107XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcnVsZSA9IHRoaXMucnVsZXNbaV07XG5cbiAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IGZsYXR0ZW4gYW55IG5lc3RlZCBydWxlc2V0c1xuICAgICAgICAgICAgaWYgKHJ1bGUgaW5zdGFuY2VvZiB0cmVlLlJ1bGVzZXQpIHtcbiAgICAgICAgICAgICAgICBydWxlLmZsYXR0ZW4ocmVzdWx0LCBzZWxlY3RvcnMsIGVudik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJ1bGUgaW5zdGFuY2VvZiB0cmVlLlJ1bGUpIHtcbiAgICAgICAgICAgICAgICBydWxlcy5wdXNoKHJ1bGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChydWxlIGluc3RhbmNlb2YgdHJlZS5JbnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgZW52LmVycm9yKHJ1bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGluZGV4ID0gcnVsZXMubGVuZ3RoID8gcnVsZXNbMF0uaW5kZXggOiBmYWxzZTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgLy8gRm9yIHNwZWNpZmljaXR5IHNvcnQsIHVzZSB0aGUgcG9zaXRpb24gb2YgdGhlIGZpcnN0IHJ1bGUgdG8gYWxsb3dcbiAgICAgICAgICAgIC8vIGRlZmluaW5nIGF0dGFjaG1lbnRzIHRoYXQgYXJlIHVuZGVyIGN1cnJlbnQgZWxlbWVudCBhcyBhIGRlc2NlbmRhbnRcbiAgICAgICAgICAgIC8vIHNlbGVjdG9yLlxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yc1tpXS5pbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IHRyZWUuRGVmaW5pdGlvbihzZWxlY3RvcnNbaV0sIHJ1bGVzLnNsaWNlKCkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufTtcbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLlNlbGVjdG9yID0gZnVuY3Rpb24gU2VsZWN0b3IoZmlsdGVycywgem9vbSwgZnJhbWVfb2Zmc2V0LCBlbGVtZW50cywgYXR0YWNobWVudCwgY29uZGl0aW9ucywgaW5kZXgpIHtcbiAgICB0aGlzLmVsZW1lbnRzID0gZWxlbWVudHMgfHwgW107XG4gICAgdGhpcy5hdHRhY2htZW50ID0gYXR0YWNobWVudDtcbiAgICB0aGlzLmZpbHRlcnMgPSBmaWx0ZXJzIHx8IHt9O1xuICAgIHRoaXMuZnJhbWVfb2Zmc2V0ID0gZnJhbWVfb2Zmc2V0O1xuICAgIHRoaXMuem9vbSA9IHR5cGVvZiB6b29tICE9PSAndW5kZWZpbmVkJyA/IHpvb20gOiB0cmVlLlpvb20uYWxsO1xuICAgIHRoaXMuY29uZGl0aW9ucyA9IGNvbmRpdGlvbnM7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xufTtcblxuLy8gRGV0ZXJtaW5lIHRoZSBzcGVjaWZpY2l0eSBvZiB0aGlzIHNlbGVjdG9yXG4vLyBiYXNlZCBvbiB0aGUgc3BlY2lmaWNpdHkgb2YgaXRzIGVsZW1lbnRzIC0gY2FsbGluZ1xuLy8gRWxlbWVudC5zcGVjaWZpY2l0eSgpIGluIG9yZGVyIHRvIGRvIHNvXG4vL1xuLy8gW0lELCBDbGFzcywgRmlsdGVycywgUG9zaXRpb24gaW4gZG9jdW1lbnRdXG50cmVlLlNlbGVjdG9yLnByb3RvdHlwZS5zcGVjaWZpY2l0eSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnRzLnJlZHVjZShmdW5jdGlvbihtZW1vLCBlKSB7XG4gICAgICAgIHZhciBzcGVjID0gZS5zcGVjaWZpY2l0eSgpO1xuICAgICAgICBtZW1vWzBdICs9IHNwZWNbMF07XG4gICAgICAgIG1lbW9bMV0gKz0gc3BlY1sxXTtcbiAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgfSwgWzAsIDAsIHRoaXMuY29uZGl0aW9ucywgdGhpcy5pbmRleF0pO1xufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG52YXIgXyA9IGdsb2JhbC5fIHx8IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuLy8gR2l2ZW4gYSBzdHlsZSdzIG5hbWUsIGF0dGFjaG1lbnQsIGRlZmluaXRpb25zLCBhbmQgYW4gZW52aXJvbm1lbnQgb2JqZWN0LFxuLy8gcmV0dXJuIGEgc3RyaW5naWZpZWQgc3R5bGUgZm9yIE1hcG5pa1xudHJlZS5TdHlsZVhNTCA9IGZ1bmN0aW9uKG5hbWUsIGF0dGFjaG1lbnQsIGRlZmluaXRpb25zLCBlbnYpIHtcbiAgICB2YXIgZXhpc3RpbmcgPSB7fTtcbiAgICB2YXIgaW1hZ2VfZmlsdGVycyA9IFtdLCBpbWFnZV9maWx0ZXJzX2luZmxhdGUgPSBbXSwgZGlyZWN0X2ltYWdlX2ZpbHRlcnMgPSBbXSwgY29tcF9vcCA9IFtdLCBvcGFjaXR5ID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlZmluaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGVmaW5pdGlvbnNbaV0ucnVsZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChkZWZpbml0aW9uc1tpXS5ydWxlc1tqXS5uYW1lID09PSAnaW1hZ2UtZmlsdGVycycpIHtcbiAgICAgICAgICAgICAgICBpbWFnZV9maWx0ZXJzLnB1c2goZGVmaW5pdGlvbnNbaV0ucnVsZXNbal0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRlZmluaXRpb25zW2ldLnJ1bGVzW2pdLm5hbWUgPT09ICdpbWFnZS1maWx0ZXJzLWluZmxhdGUnKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VfZmlsdGVyc19pbmZsYXRlLnB1c2goZGVmaW5pdGlvbnNbaV0ucnVsZXNbal0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRlZmluaXRpb25zW2ldLnJ1bGVzW2pdLm5hbWUgPT09ICdkaXJlY3QtaW1hZ2UtZmlsdGVycycpIHtcbiAgICAgICAgICAgICAgICBkaXJlY3RfaW1hZ2VfZmlsdGVycy5wdXNoKGRlZmluaXRpb25zW2ldLnJ1bGVzW2pdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkZWZpbml0aW9uc1tpXS5ydWxlc1tqXS5uYW1lID09PSAnY29tcC1vcCcpIHtcbiAgICAgICAgICAgICAgICBjb21wX29wLnB1c2goZGVmaW5pdGlvbnNbaV0ucnVsZXNbal0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRlZmluaXRpb25zW2ldLnJ1bGVzW2pdLm5hbWUgPT09ICdvcGFjaXR5Jykge1xuICAgICAgICAgICAgICAgIG9wYWNpdHkucHVzaChkZWZpbml0aW9uc1tpXS5ydWxlc1tqXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgcnVsZXMgPSBkZWZpbml0aW9ucy5tYXAoZnVuY3Rpb24oZGVmaW5pdGlvbikge1xuICAgICAgICByZXR1cm4gZGVmaW5pdGlvbi50b1hNTChlbnYsIGV4aXN0aW5nKTtcbiAgICB9KTtcblxuICAgIHZhciBhdHRyc194bWwgPSAnJztcblxuICAgIGlmIChpbWFnZV9maWx0ZXJzLmxlbmd0aCkge1xuICAgICAgICBhdHRyc194bWwgKz0gJyBpbWFnZS1maWx0ZXJzPVwiJyArIF8uY2hhaW4oaW1hZ2VfZmlsdGVycylcbiAgICAgICAgICAgIC8vIHByZXZlbnQgaWRlbnRpY2FsIGZpbHRlcnMgZnJvbSBiZWluZyBkdXBsaWNhdGVkIGluIHRoZSBzdHlsZVxuICAgICAgICAgICAgLnVuaXEoZnVuY3Rpb24oaSkgeyByZXR1cm4gaS5pZDsgfSkubWFwKGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgICAgIHJldHVybiBmLmV2KGVudikudG9YTUwoZW52LCB0cnVlLCAnLCcsICdpbWFnZS1maWx0ZXInKTtcbiAgICAgICAgfSkudmFsdWUoKS5qb2luKCcsJykgKyAnXCInO1xuICAgIH1cblxuICAgIGlmIChpbWFnZV9maWx0ZXJzX2luZmxhdGUubGVuZ3RoKSB7XG4gICAgICAgIGF0dHJzX3htbCArPSAnIGltYWdlLWZpbHRlcnMtaW5mbGF0ZT1cIicgKyBpbWFnZV9maWx0ZXJzX2luZmxhdGVbMF0udmFsdWUuZXYoZW52KS50b1N0cmluZygpICsgJ1wiJztcbiAgICB9XG5cbiAgICBpZiAoZGlyZWN0X2ltYWdlX2ZpbHRlcnMubGVuZ3RoKSB7XG4gICAgICAgIGF0dHJzX3htbCArPSAnIGRpcmVjdC1pbWFnZS1maWx0ZXJzPVwiJyArIF8uY2hhaW4oZGlyZWN0X2ltYWdlX2ZpbHRlcnMpXG4gICAgICAgICAgICAvLyBwcmV2ZW50IGlkZW50aWNhbCBmaWx0ZXJzIGZyb20gYmVpbmcgZHVwbGljYXRlZCBpbiB0aGUgc3R5bGVcbiAgICAgICAgICAgIC51bmlxKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIGkuaWQ7IH0pLm1hcChmdW5jdGlvbihmKSB7XG4gICAgICAgICAgICByZXR1cm4gZi5ldihlbnYpLnRvWE1MKGVudiwgdHJ1ZSwgJywnLCAnZGlyZWN0LWltYWdlLWZpbHRlcicpO1xuICAgICAgICB9KS52YWx1ZSgpLmpvaW4oJywnKSArICdcIic7XG4gICAgfVxuXG4gICAgaWYgKGNvbXBfb3AubGVuZ3RoICYmIGNvbXBfb3BbMF0udmFsdWUuZXYoZW52KS52YWx1ZSAhPSAnc3JjLW92ZXInKSB7XG4gICAgICAgIGF0dHJzX3htbCArPSAnIGNvbXAtb3A9XCInICsgY29tcF9vcFswXS52YWx1ZS5ldihlbnYpLnRvU3RyaW5nKCkgKyAnXCInO1xuICAgIH1cblxuICAgIGlmIChvcGFjaXR5Lmxlbmd0aCAmJiBvcGFjaXR5WzBdLnZhbHVlLmV2KGVudikudmFsdWUgIT0gMSkge1xuICAgICAgICBhdHRyc194bWwgKz0gJyBvcGFjaXR5PVwiJyArIG9wYWNpdHlbMF0udmFsdWUuZXYoZW52KS50b1N0cmluZygpICsgJ1wiJztcbiAgICB9XG4gICAgdmFyIHJ1bGVfc3RyaW5nID0gcnVsZXMuam9pbignJyk7XG4gICAgaWYgKCFhdHRyc194bWwgJiYgIXJ1bGVfc3RyaW5nKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuICc8U3R5bGUgbmFtZT1cIicgKyBuYW1lICsgJ1wiIGZpbHRlci1tb2RlPVwiZmlyc3RcIicgKyBhdHRyc194bWwgKyAnPlxcbicgKyBydWxlX3N0cmluZyArICc8L1N0eWxlPic7XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5VUkwgPSBmdW5jdGlvbiBVUkwodmFsLCBwYXRocykge1xuICAgIHRoaXMudmFsdWUgPSB2YWw7XG4gICAgdGhpcy5wYXRocyA9IHBhdGhzO1xufTtcblxudHJlZS5VUkwucHJvdG90eXBlID0ge1xuICAgIGlzOiAndXJpJyxcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfSxcbiAgICBldjogZnVuY3Rpb24oY3R4KSB7XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5VUkwodGhpcy52YWx1ZS5ldihjdHgpLCB0aGlzLnBhdGhzKTtcbiAgICB9XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5WYWx1ZSA9IGZ1bmN0aW9uIFZhbHVlKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xufTtcblxudHJlZS5WYWx1ZS5wcm90b3R5cGUgPSB7XG4gICAgaXM6ICd2YWx1ZScsXG4gICAgZXY6IGZ1bmN0aW9uKGVudikge1xuICAgICAgICBpZiAodGhpcy52YWx1ZS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlWzBdLmV2KGVudik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuVmFsdWUodGhpcy52YWx1ZS5tYXAoZnVuY3Rpb24odikge1xuICAgICAgICAgICAgICAgIHJldHVybiB2LmV2KGVudik7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbihlbnYsIHNlbGVjdG9yLCBzZXAsIGZvcm1hdCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZS5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgcmV0dXJuIGUudG9TdHJpbmcoZW52LCBmb3JtYXQpO1xuICAgICAgICB9KS5qb2luKHNlcCB8fCAnLCAnKTtcbiAgICB9LFxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG9iaiA9IE9iamVjdC5jcmVhdGUodHJlZS5WYWx1ZS5wcm90b3R5cGUpO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSBvYmoudmFsdWUgPSB0aGlzLnZhbHVlLnNsaWNlKCk7XG4gICAgICAgIGVsc2Ugb2JqLnZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICAgICAgb2JqLmlzID0gdGhpcy5pcztcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9LFxuXG4gICAgdG9KUzogZnVuY3Rpb24oZW52KSB7XG4gICAgICAvL3ZhciB2ID0gdGhpcy52YWx1ZVswXS52YWx1ZVswXTtcbiAgICAgIHZhciB2YWwgPSB0aGlzLmV2KGVudik7XG4gICAgICB2YXIgdiA9IHZhbC50b1N0cmluZygpO1xuICAgICAgaWYodmFsLmlzID09PSBcImNvbG9yXCIgfHwgdmFsLmlzID09PSAndXJpJyB8fCB2YWwuaXMgPT09ICdzdHJpbmcnIHx8IHZhbC5pcyA9PT0gJ2tleXdvcmQnKSB7XG4gICAgICAgIHYgPSBcIidcIiArIHYgKyBcIidcIjtcbiAgICAgIH0gZWxzZSBpZiAodmFsLmlzID09PSAnZmllbGQnKSB7XG4gICAgICAgIC8vIHJlcGxhY2UgW3ZhcmlhYmxlXSBieSBjdHhbJ3ZhcmlhYmxlJ11cbiAgICAgICAgdiA9IHYucmVwbGFjZSgvXFxbKC4qKVxcXS9nLCBcImRhdGFbJyQxJ11cIik7XG4gICAgICB9ZWxzZSBpZiAodmFsLmlzID09PSAnY2FsbCcpIHtcbiAgICAgICAgdiA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIG5hbWU6IHZhbC5uYW1lLFxuICAgICAgICAgICAgYXJnczogdmFsLmFyZ3NcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIHJldHVybiBcIl92YWx1ZSA9IFwiICsgdiArIFwiO1wiO1xuICAgIH1cblxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuVmFyaWFibGUgPSBmdW5jdGlvbiBWYXJpYWJsZShuYW1lLCBpbmRleCwgZmlsZW5hbWUpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLmZpbGVuYW1lID0gZmlsZW5hbWU7XG59O1xuXG50cmVlLlZhcmlhYmxlLnByb3RvdHlwZSA9IHtcbiAgICBpczogJ3ZhcmlhYmxlJyxcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWU7XG4gICAgfSxcbiAgICBldjogZnVuY3Rpb24oZW52KSB7XG4gICAgICAgIHZhciB2YXJpYWJsZSxcbiAgICAgICAgICAgIHYsXG4gICAgICAgICAgICBuYW1lID0gdGhpcy5uYW1lO1xuXG4gICAgICAgIGlmICh0aGlzLl9jc3MpIHJldHVybiB0aGlzLl9jc3M7XG5cbiAgICAgICAgdmFyIHRoaXNmcmFtZSA9IGVudi5mcmFtZXMuZmlsdGVyKGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgICAgIHJldHVybiBmLm5hbWUgPT0gdGhpcy5uYW1lO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICBpZiAodGhpc2ZyYW1lLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNmcmFtZVswXS52YWx1ZS5ldihlbnYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAndmFyaWFibGUgJyArIHRoaXMubmFtZSArICcgaXMgdW5kZWZpbmVkJyxcbiAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgICAgICB0eXBlOiAncnVudGltZScsXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMuZmlsZW5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpczogJ3VuZGVmaW5lZCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsInZhciB0cmVlID0gcmVxdWlyZSgnLi4vdHJlZScpO1xuXG4vLyBTdG9yYWdlIGZvciB6b29tIHJhbmdlcy4gT25seSBzdXBwb3J0cyBjb250aW51b3VzIHJhbmdlcyxcbi8vIGFuZCBzdG9yZXMgdGhlbSBhcyBiaXQtc2VxdWVuY2VzIHNvIHRoYXQgdGhleSBjYW4gYmUgY29tYmluZWQsXG4vLyBpbnZlcnRlZCwgYW5kIGNvbXBhcmVkIHF1aWNrbHkuXG50cmVlLlpvb20gPSBmdW5jdGlvbihvcCwgdmFsdWUsIGluZGV4KSB7XG4gICAgdGhpcy5vcCA9IG9wO1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG59O1xuXG50cmVlLlpvb20ucHJvdG90eXBlLnNldFpvb20gPSBmdW5jdGlvbih6b29tKSB7XG4gICAgdGhpcy56b29tID0gem9vbTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbnRyZWUuWm9vbS5wcm90b3R5cGUuZXYgPSBmdW5jdGlvbihlbnYpIHtcbiAgICB2YXIgc3RhcnQgPSAwLFxuICAgICAgICBlbmQgPSBJbmZpbml0eSxcbiAgICAgICAgdmFsdWUgPSBwYXJzZUludCh0aGlzLnZhbHVlLmV2KGVudikudG9TdHJpbmcoKSwgMTApLFxuICAgICAgICB6b29tID0gMDtcblxuICAgIGlmICh2YWx1ZSA+IHRyZWUuWm9vbS5tYXhab29tIHx8IHZhbHVlIDwgMCkge1xuICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgbWVzc2FnZTogJ09ubHkgem9vbSBsZXZlbHMgYmV0d2VlbiAwIGFuZCAnICtcbiAgICAgICAgICAgICAgICB0cmVlLlpvb20ubWF4Wm9vbSArICcgc3VwcG9ydGVkLicsXG4gICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHRoaXMub3ApIHtcbiAgICAgICAgY2FzZSAnPSc6XG4gICAgICAgICAgICB0aGlzLnpvb20gPSAxIDw8IHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIGNhc2UgJz4nOlxuICAgICAgICAgICAgc3RhcnQgPSB2YWx1ZSArIDE7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnPj0nOlxuICAgICAgICAgICAgc3RhcnQgPSB2YWx1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc8JzpcbiAgICAgICAgICAgIGVuZCA9IHZhbHVlIC0gMTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc8PSc6XG4gICAgICAgICAgICBlbmQgPSB2YWx1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSB0cmVlLlpvb20ubWF4Wm9vbTsgaSsrKSB7XG4gICAgICAgIGlmIChpID49IHN0YXJ0ICYmIGkgPD0gZW5kKSB7XG4gICAgICAgICAgICB6b29tIHw9ICgxIDw8IGkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMuem9vbSA9IHpvb207XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG50cmVlLlpvb20ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuem9vbTtcbn07XG5cbi8vIENvdmVycyBhbGwgem9vbWxldmVscyBmcm9tIDAgdG8gMjJcbnRyZWUuWm9vbS5hbGwgPSAweDdGRkZGRjtcblxudHJlZS5ab29tLm1heFpvb20gPSAyMjtcblxudHJlZS5ab29tLnJhbmdlcyA9IHtcbiAgICAgMDogMTAwMDAwMDAwMCxcbiAgICAgMTogNTAwMDAwMDAwLFxuICAgICAyOiAyMDAwMDAwMDAsXG4gICAgIDM6IDEwMDAwMDAwMCxcbiAgICAgNDogNTAwMDAwMDAsXG4gICAgIDU6IDI1MDAwMDAwLFxuICAgICA2OiAxMjUwMDAwMCxcbiAgICAgNzogNjUwMDAwMCxcbiAgICAgODogMzAwMDAwMCxcbiAgICAgOTogMTUwMDAwMCxcbiAgICAxMDogNzUwMDAwLFxuICAgIDExOiA0MDAwMDAsXG4gICAgMTI6IDIwMDAwMCxcbiAgICAxMzogMTAwMDAwLFxuICAgIDE0OiA1MDAwMCxcbiAgICAxNTogMjUwMDAsXG4gICAgMTY6IDEyNTAwLFxuICAgIDE3OiA1MDAwLFxuICAgIDE4OiAyNTAwLFxuICAgIDE5OiAxNTAwLFxuICAgIDIwOiA3NTAsXG4gICAgMjE6IDUwMCxcbiAgICAyMjogMjUwLFxuICAgIDIzOiAxMDBcbn07XG5cbi8vIE9ubHkgd29ya3MgZm9yIHNpbmdsZSByYW5nZSB6b29tcy4gYFtYWFguLi4uWFhYWFguLi4uLi4uLi5dYCBpcyBpbnZhbGlkLlxudHJlZS5ab29tLnByb3RvdHlwZS50b1hNTCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb25kaXRpb25zID0gW107XG4gICAgaWYgKHRoaXMuem9vbSAhPSB0cmVlLlpvb20uYWxsKSB7XG4gICAgICAgIHZhciBzdGFydCA9IG51bGwsIGVuZCA9IG51bGw7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHRyZWUuWm9vbS5tYXhab29tOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnpvb20gJiAoMSA8PCBpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGFydCA9PT0gbnVsbCkgc3RhcnQgPSBpO1xuICAgICAgICAgICAgICAgIGVuZCA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ID4gMCkgY29uZGl0aW9ucy5wdXNoKCcgICAgPE1heFNjYWxlRGVub21pbmF0b3I+JyArXG4gICAgICAgICAgICB0cmVlLlpvb20ucmFuZ2VzW3N0YXJ0XSArICc8L01heFNjYWxlRGVub21pbmF0b3I+XFxuJyk7XG4gICAgICAgIGlmIChlbmQgPCAyMikgY29uZGl0aW9ucy5wdXNoKCcgICAgPE1pblNjYWxlRGVub21pbmF0b3I+JyArXG4gICAgICAgICAgICB0cmVlLlpvb20ucmFuZ2VzW2VuZCArIDFdICsgJzwvTWluU2NhbGVEZW5vbWluYXRvcj5cXG4nKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbmRpdGlvbnM7XG59O1xuXG50cmVlLlpvb20ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0ciA9ICcnO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHRyZWUuWm9vbS5tYXhab29tOyBpKyspIHtcbiAgICAgICAgc3RyICs9ICh0aGlzLnpvb20gJiAoMSA8PCBpKSkgPyAnWCcgOiAnLic7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59O1xuIiwibW9kdWxlLmV4cG9ydHM9e1xuICBcIm5hbWVcIjogXCJjYXJ0b1wiLFxuICBcInZlcnNpb25cIjogXCIwLjE1LjEtY2RiMVwiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiQ2FydG9DU1MgU3R5bGVzaGVldCBDb21waWxlclwiLFxuICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9jYXJ0b2RiL2NhcnRvXCIsXG4gIFwicmVwb3NpdG9yeVwiOiB7XG4gICAgXCJ0eXBlXCI6IFwiZ2l0XCIsXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vZ2l0aHViLmNvbS9jYXJ0b2RiL2NhcnRvLmdpdFwiXG4gIH0sXG4gIFwiYXV0aG9yXCI6IHtcbiAgICBcIm5hbWVcIjogXCJDYXJ0b0RCXCIsXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vY2FydG9kYi5jb20vXCJcbiAgfSxcbiAgXCJrZXl3b3Jkc1wiOiBbXG4gICAgXCJtYXBzXCIsXG4gICAgXCJjc3NcIixcbiAgICBcInN0eWxlc2hlZXRzXCJcbiAgXSxcbiAgXCJjb250cmlidXRvcnNcIjogW1xuICAgIFwiVG9tIE1hY1dyaWdodCA8bWFjd3JpZ2h0QGdtYWlsLmNvbT5cIixcbiAgICBcIktvbnN0YW50aW4gS8OkZmVyXCIsXG4gICAgXCJBbGV4aXMgU2VsbGllciA8c2VsZkBjbG91ZGhlYWQubmV0PlwiLFxuICAgIFwiUmF1bCBPY2hvYSA8cm9jaG9hQGNhcnRvZGIuY29tPlwiLFxuICAgIFwiSmF2aSBTYW50YW5hIDxqc2FudGFuYUBjYXJ0b2RiLmNvbT5cIlxuICBdLFxuICBcImxpY2Vuc2VzXCI6IFtcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJBcGFjaGVcIlxuICAgIH1cbiAgXSxcbiAgXCJiaW5cIjoge1xuICAgIFwiY2FydG9cIjogXCIuL2Jpbi9jYXJ0b1wiXG4gIH0sXG4gIFwibWFuXCI6IFwiLi9tYW4vY2FydG8uMVwiLFxuICBcIm1haW5cIjogXCIuL2xpYi9jYXJ0by9pbmRleFwiLFxuICBcImVuZ2luZXNcIjoge1xuICAgIFwibm9kZVwiOiBcIj49MC40LnhcIlxuICB9LFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJ1bmRlcnNjb3JlXCI6IFwiMS44LjNcIixcbiAgICBcIm1hcG5pay1yZWZlcmVuY2VcIjogXCJ+Ni4wLjJcIixcbiAgICBcIm9wdGltaXN0XCI6IFwifjAuNi4wXCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwibW9jaGFcIjogXCIxLjEyLnhcIixcbiAgICBcImpzaGludFwiOiBcIjAuMi54XCIsXG4gICAgXCJzYXhcIjogXCIwLjEueFwiLFxuICAgIFwiaXN0YW5idWxcIjogXCJ+MC4yLjE0XCIsXG4gICAgXCJjb3ZlcmFsbHNcIjogXCJ+Mi4xMC4xXCIsXG4gICAgXCJicm93c2VyaWZ5XCI6IFwifjcuMC4wXCIsXG4gICAgXCJ1Z2xpZnktanNcIjogXCIxLjMuM1wiXG4gIH0sXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJwcmV0ZXN0XCI6IFwibnBtIGluc3RhbGxcIixcbiAgICBcInRlc3RcIjogXCJtb2NoYSAtUiBzcGVjXCIsXG4gICAgXCJjb3ZlcmFnZVwiOiBcImlzdGFuYnVsIGNvdmVyIC4vbm9kZV9tb2R1bGVzLy5iaW4vX21vY2hhICYmIGNvdmVyYWxscyA8IC4vY292ZXJhZ2UvbGNvdi5pbmZvXCJcbiAgfVxufVxuIiwidmFyIGZzID0gcmVxdWlyZSgnZnMnKSxcbiAgICBwYXRoID0gcmVxdWlyZSgncGF0aCcpLFxuICAgIGV4aXN0c1N5bmMgPSByZXF1aXJlKCdmcycpLmV4aXN0c1N5bmMgfHwgcmVxdWlyZSgncGF0aCcpLmV4aXN0c1N5bmM7XG5cbi8vIExvYWQgYWxsIHN0YXRlZCB2ZXJzaW9ucyBpbnRvIHRoZSBtb2R1bGUgZXhwb3J0c1xubW9kdWxlLmV4cG9ydHMudmVyc2lvbiA9IHt9O1xuXG52YXIgcmVmcyA9IFtcbiAnMi4wLjAnLFxuICcyLjAuMScsXG4gJzIuMC4yJyxcbiAnMi4xLjAnLFxuICcyLjEuMScsXG4gJzIuMi4wJyxcbiAnMi4zLjAnLFxuICczLjAuMCdcbl07XG5cbnJlZnMubWFwKGZ1bmN0aW9uKHZlcnNpb24pIHtcbiAgICBtb2R1bGUuZXhwb3J0cy52ZXJzaW9uW3ZlcnNpb25dID0gcmVxdWlyZShwYXRoLmpvaW4oX19kaXJuYW1lLCB2ZXJzaW9uLCAncmVmZXJlbmNlLmpzb24nKSk7XG4gICAgdmFyIGRzX3BhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCB2ZXJzaW9uLCAnZGF0YXNvdXJjZXMuanNvbicpO1xuICAgIGlmIChleGlzdHNTeW5jKGRzX3BhdGgpKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLnZlcnNpb25bdmVyc2lvbl0uZGF0YXNvdXJjZXMgPSByZXF1aXJlKGRzX3BhdGgpLmRhdGFzb3VyY2VzO1xuICAgIH1cbn0pO1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gU3BsaXQgYSBmaWxlbmFtZSBpbnRvIFtyb290LCBkaXIsIGJhc2VuYW1lLCBleHRdLCB1bml4IHZlcnNpb25cbi8vICdyb290JyBpcyBqdXN0IGEgc2xhc2gsIG9yIG5vdGhpbmcuXG52YXIgc3BsaXRQYXRoUmUgPVxuICAgIC9eKFxcLz98KShbXFxzXFxTXSo/KSgoPzpcXC57MSwyfXxbXlxcL10rP3wpKFxcLlteLlxcL10qfCkpKD86W1xcL10qKSQvO1xudmFyIHNwbGl0UGF0aCA9IGZ1bmN0aW9uKGZpbGVuYW1lKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKGZpbGVuYW1lKS5zbGljZSgxKTtcbn07XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICB2YXIgcGF0aCA9IChpID49IDApID8gYXJndW1lbnRzW2ldIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfSBlbHNlIGlmICghcGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGlzQWJzb2x1dGUgPSBleHBvcnRzLmlzQWJzb2x1dGUocGF0aCksXG4gICAgICB0cmFpbGluZ1NsYXNoID0gc3Vic3RyKHBhdGgsIC0xKSA9PT0gJy8nO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG5cbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLyc7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIHAgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuZXhwb3J0cy5kZWxpbWl0ZXIgPSAnOic7XG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIHJlc3VsdCA9IHNwbGl0UGF0aChwYXRoKSxcbiAgICAgIHJvb3QgPSByZXN1bHRbMF0sXG4gICAgICBkaXIgPSByZXN1bHRbMV07XG5cbiAgaWYgKCFyb290ICYmICFkaXIpIHtcbiAgICAvLyBObyBkaXJuYW1lIHdoYXRzb2V2ZXJcbiAgICByZXR1cm4gJy4nO1xuICB9XG5cbiAgaWYgKGRpcikge1xuICAgIC8vIEl0IGhhcyBhIGRpcm5hbWUsIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgZGlyID0gZGlyLnN1YnN0cigwLCBkaXIubGVuZ3RoIC0gMSk7XG4gIH1cblxuICByZXR1cm4gcm9vdCArIGRpcjtcbn07XG5cblxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IHNwbGl0UGF0aChwYXRoKVsyXTtcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGgocGF0aClbM107XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXIgKHhzLCBmKSB7XG4gICAgaWYgKHhzLmZpbHRlcikgcmV0dXJuIHhzLmZpbHRlcihmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFN0cmluZy5wcm90b3R5cGUuc3Vic3RyIC0gbmVnYXRpdmUgaW5kZXggZG9uJ3Qgd29yayBpbiBJRThcbnZhciBzdWJzdHIgPSAnYWInLnN1YnN0cigtMSkgPT09ICdiJ1xuICAgID8gZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikgeyByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKSB9XG4gICAgOiBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7XG4gICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gc3RyLmxlbmd0aCArIHN0YXJ0O1xuICAgICAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKTtcbiAgICB9XG47XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLy8gICAgIFVuZGVyc2NvcmUuanMgMS44LjNcbi8vICAgICBodHRwOi8vdW5kZXJzY29yZWpzLm9yZ1xuLy8gICAgIChjKSAyMDA5LTIwMTUgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbi8vICAgICBVbmRlcnNjb3JlIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG4oZnVuY3Rpb24oKSB7XG5cbiAgLy8gQmFzZWxpbmUgc2V0dXBcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGV4cG9ydHNgIG9uIHRoZSBzZXJ2ZXIuXG4gIHZhciByb290ID0gdGhpcztcblxuICAvLyBTYXZlIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYF9gIHZhcmlhYmxlLlxuICB2YXIgcHJldmlvdXNVbmRlcnNjb3JlID0gcm9vdC5fO1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyXG4gICAgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICB0b1N0cmluZyAgICAgICAgID0gT2JqUHJvdG8udG9TdHJpbmcsXG4gICAgaGFzT3duUHJvcGVydHkgICA9IE9ialByb3RvLmhhc093blByb3BlcnR5O1xuXG4gIC8vIEFsbCAqKkVDTUFTY3JpcHQgNSoqIG5hdGl2ZSBmdW5jdGlvbiBpbXBsZW1lbnRhdGlvbnMgdGhhdCB3ZSBob3BlIHRvIHVzZVxuICAvLyBhcmUgZGVjbGFyZWQgaGVyZS5cbiAgdmFyXG4gICAgbmF0aXZlSXNBcnJheSAgICAgID0gQXJyYXkuaXNBcnJheSxcbiAgICBuYXRpdmVLZXlzICAgICAgICAgPSBPYmplY3Qua2V5cyxcbiAgICBuYXRpdmVCaW5kICAgICAgICAgPSBGdW5jUHJvdG8uYmluZCxcbiAgICBuYXRpdmVDcmVhdGUgICAgICAgPSBPYmplY3QuY3JlYXRlO1xuXG4gIC8vIE5ha2VkIGZ1bmN0aW9uIHJlZmVyZW5jZSBmb3Igc3Vycm9nYXRlLXByb3RvdHlwZS1zd2FwcGluZy5cbiAgdmFyIEN0b3IgPSBmdW5jdGlvbigpe307XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0LlxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBfO1xuICAgIH1cbiAgICBleHBvcnRzLl8gPSBfO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuXyA9IF87XG4gIH1cblxuICAvLyBDdXJyZW50IHZlcnNpb24uXG4gIF8uVkVSU0lPTiA9ICcxLjguMyc7XG5cbiAgLy8gSW50ZXJuYWwgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFuIGVmZmljaWVudCAoZm9yIGN1cnJlbnQgZW5naW5lcykgdmVyc2lvblxuICAvLyBvZiB0aGUgcGFzc2VkLWluIGNhbGxiYWNrLCB0byBiZSByZXBlYXRlZGx5IGFwcGxpZWQgaW4gb3RoZXIgVW5kZXJzY29yZVxuICAvLyBmdW5jdGlvbnMuXG4gIHZhciBvcHRpbWl6ZUNiID0gZnVuY3Rpb24oZnVuYywgY29udGV4dCwgYXJnQ291bnQpIHtcbiAgICBpZiAoY29udGV4dCA9PT0gdm9pZCAwKSByZXR1cm4gZnVuYztcbiAgICBzd2l0Y2ggKGFyZ0NvdW50ID09IG51bGwgPyAzIDogYXJnQ291bnQpIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwoY29udGV4dCwgdmFsdWUpO1xuICAgICAgfTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBvdGhlcikge1xuICAgICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIHZhbHVlLCBvdGhlcik7XG4gICAgICB9O1xuICAgICAgY2FzZSAzOiByZXR1cm4gZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICAgIH07XG4gICAgICBjYXNlIDQ6IHJldHVybiBmdW5jdGlvbihhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwoY29udGV4dCwgYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gQSBtb3N0bHktaW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgY2FsbGJhY2tzIHRoYXQgY2FuIGJlIGFwcGxpZWRcbiAgLy8gdG8gZWFjaCBlbGVtZW50IGluIGEgY29sbGVjdGlvbiwgcmV0dXJuaW5nIHRoZSBkZXNpcmVkIHJlc3VsdCDigJQgZWl0aGVyXG4gIC8vIGlkZW50aXR5LCBhbiBhcmJpdHJhcnkgY2FsbGJhY2ssIGEgcHJvcGVydHkgbWF0Y2hlciwgb3IgYSBwcm9wZXJ0eSBhY2Nlc3Nvci5cbiAgdmFyIGNiID0gZnVuY3Rpb24odmFsdWUsIGNvbnRleHQsIGFyZ0NvdW50KSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBfLmlkZW50aXR5O1xuICAgIGlmIChfLmlzRnVuY3Rpb24odmFsdWUpKSByZXR1cm4gb3B0aW1pemVDYih2YWx1ZSwgY29udGV4dCwgYXJnQ291bnQpO1xuICAgIGlmIChfLmlzT2JqZWN0KHZhbHVlKSkgcmV0dXJuIF8ubWF0Y2hlcih2YWx1ZSk7XG4gICAgcmV0dXJuIF8ucHJvcGVydHkodmFsdWUpO1xuICB9O1xuICBfLml0ZXJhdGVlID0gZnVuY3Rpb24odmFsdWUsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gY2IodmFsdWUsIGNvbnRleHQsIEluZmluaXR5KTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiBmb3IgY3JlYXRpbmcgYXNzaWduZXIgZnVuY3Rpb25zLlxuICB2YXIgY3JlYXRlQXNzaWduZXIgPSBmdW5jdGlvbihrZXlzRnVuYywgdW5kZWZpbmVkT25seSkge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgaWYgKGxlbmd0aCA8IDIgfHwgb2JqID09IG51bGwpIHJldHVybiBvYmo7XG4gICAgICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaW5kZXhdLFxuICAgICAgICAgICAga2V5cyA9IGtleXNGdW5jKHNvdXJjZSksXG4gICAgICAgICAgICBsID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgaWYgKCF1bmRlZmluZWRPbmx5IHx8IG9ialtrZXldID09PSB2b2lkIDApIG9ialtrZXldID0gc291cmNlW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmo7XG4gICAgfTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiBmb3IgY3JlYXRpbmcgYSBuZXcgb2JqZWN0IHRoYXQgaW5oZXJpdHMgZnJvbSBhbm90aGVyLlxuICB2YXIgYmFzZUNyZWF0ZSA9IGZ1bmN0aW9uKHByb3RvdHlwZSkge1xuICAgIGlmICghXy5pc09iamVjdChwcm90b3R5cGUpKSByZXR1cm4ge307XG4gICAgaWYgKG5hdGl2ZUNyZWF0ZSkgcmV0dXJuIG5hdGl2ZUNyZWF0ZShwcm90b3R5cGUpO1xuICAgIEN0b3IucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIHZhciByZXN1bHQgPSBuZXcgQ3RvcjtcbiAgICBDdG9yLnByb3RvdHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICB2YXIgcHJvcGVydHkgPSBmdW5jdGlvbihrZXkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb2JqID09IG51bGwgPyB2b2lkIDAgOiBvYmpba2V5XTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEhlbHBlciBmb3IgY29sbGVjdGlvbiBtZXRob2RzIHRvIGRldGVybWluZSB3aGV0aGVyIGEgY29sbGVjdGlvblxuICAvLyBzaG91bGQgYmUgaXRlcmF0ZWQgYXMgYW4gYXJyYXkgb3IgYXMgYW4gb2JqZWN0XG4gIC8vIFJlbGF0ZWQ6IGh0dHA6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLXRvbGVuZ3RoXG4gIC8vIEF2b2lkcyBhIHZlcnkgbmFzdHkgaU9TIDggSklUIGJ1ZyBvbiBBUk0tNjQuICMyMDk0XG4gIHZhciBNQVhfQVJSQVlfSU5ERVggPSBNYXRoLnBvdygyLCA1MykgLSAxO1xuICB2YXIgZ2V0TGVuZ3RoID0gcHJvcGVydHkoJ2xlbmd0aCcpO1xuICB2YXIgaXNBcnJheUxpa2UgPSBmdW5jdGlvbihjb2xsZWN0aW9uKSB7XG4gICAgdmFyIGxlbmd0aCA9IGdldExlbmd0aChjb2xsZWN0aW9uKTtcbiAgICByZXR1cm4gdHlwZW9mIGxlbmd0aCA9PSAnbnVtYmVyJyAmJiBsZW5ndGggPj0gMCAmJiBsZW5ndGggPD0gTUFYX0FSUkFZX0lOREVYO1xuICB9O1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgcmF3IG9iamVjdHMgaW4gYWRkaXRpb24gdG8gYXJyYXktbGlrZXMuIFRyZWF0cyBhbGxcbiAgLy8gc3BhcnNlIGFycmF5LWxpa2VzIGFzIGlmIHRoZXkgd2VyZSBkZW5zZS5cbiAgXy5lYWNoID0gXy5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGl0ZXJhdGVlID0gb3B0aW1pemVDYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgdmFyIGksIGxlbmd0aDtcbiAgICBpZiAoaXNBcnJheUxpa2Uob2JqKSkge1xuICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGl0ZXJhdGVlKG9ialtpXSwgaSwgb2JqKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaXRlcmF0ZWUob2JqW2tleXNbaV1dLCBrZXlzW2ldLCBvYmopO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgcmVzdWx0cyBvZiBhcHBseWluZyB0aGUgaXRlcmF0ZWUgdG8gZWFjaCBlbGVtZW50LlxuICBfLm1hcCA9IF8uY29sbGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9ICFpc0FycmF5TGlrZShvYmopICYmIF8ua2V5cyhvYmopLFxuICAgICAgICBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aCxcbiAgICAgICAgcmVzdWx0cyA9IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgIHJlc3VsdHNbaW5kZXhdID0gaXRlcmF0ZWUob2JqW2N1cnJlbnRLZXldLCBjdXJyZW50S2V5LCBvYmopO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBDcmVhdGUgYSByZWR1Y2luZyBmdW5jdGlvbiBpdGVyYXRpbmcgbGVmdCBvciByaWdodC5cbiAgZnVuY3Rpb24gY3JlYXRlUmVkdWNlKGRpcikge1xuICAgIC8vIE9wdGltaXplZCBpdGVyYXRvciBmdW5jdGlvbiBhcyB1c2luZyBhcmd1bWVudHMubGVuZ3RoXG4gICAgLy8gaW4gdGhlIG1haW4gZnVuY3Rpb24gd2lsbCBkZW9wdGltaXplIHRoZSwgc2VlICMxOTkxLlxuICAgIGZ1bmN0aW9uIGl0ZXJhdG9yKG9iaiwgaXRlcmF0ZWUsIG1lbW8sIGtleXMsIGluZGV4LCBsZW5ndGgpIHtcbiAgICAgIGZvciAoOyBpbmRleCA+PSAwICYmIGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSBkaXIpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdGVlKG1lbW8sIG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtZW1vO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgICBpdGVyYXRlZSA9IG9wdGltaXplQ2IoaXRlcmF0ZWUsIGNvbnRleHQsIDQpO1xuICAgICAgdmFyIGtleXMgPSAhaXNBcnJheUxpa2Uob2JqKSAmJiBfLmtleXMob2JqKSxcbiAgICAgICAgICBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aCxcbiAgICAgICAgICBpbmRleCA9IGRpciA+IDAgPyAwIDogbGVuZ3RoIC0gMTtcbiAgICAgIC8vIERldGVybWluZSB0aGUgaW5pdGlhbCB2YWx1ZSBpZiBub25lIGlzIHByb3ZpZGVkLlxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgICAgIG1lbW8gPSBvYmpba2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXhdO1xuICAgICAgICBpbmRleCArPSBkaXI7XG4gICAgICB9XG4gICAgICByZXR1cm4gaXRlcmF0b3Iob2JqLCBpdGVyYXRlZSwgbWVtbywga2V5cywgaW5kZXgsIGxlbmd0aCk7XG4gICAgfTtcbiAgfVxuXG4gIC8vICoqUmVkdWNlKiogYnVpbGRzIHVwIGEgc2luZ2xlIHJlc3VsdCBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMsIGFrYSBgaW5qZWN0YCxcbiAgLy8gb3IgYGZvbGRsYC5cbiAgXy5yZWR1Y2UgPSBfLmZvbGRsID0gXy5pbmplY3QgPSBjcmVhdGVSZWR1Y2UoMSk7XG5cbiAgLy8gVGhlIHJpZ2h0LWFzc29jaWF0aXZlIHZlcnNpb24gb2YgcmVkdWNlLCBhbHNvIGtub3duIGFzIGBmb2xkcmAuXG4gIF8ucmVkdWNlUmlnaHQgPSBfLmZvbGRyID0gY3JlYXRlUmVkdWNlKC0xKTtcblxuICAvLyBSZXR1cm4gdGhlIGZpcnN0IHZhbHVlIHdoaWNoIHBhc3NlcyBhIHRydXRoIHRlc3QuIEFsaWFzZWQgYXMgYGRldGVjdGAuXG4gIF8uZmluZCA9IF8uZGV0ZWN0ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICB2YXIga2V5O1xuICAgIGlmIChpc0FycmF5TGlrZShvYmopKSB7XG4gICAgICBrZXkgPSBfLmZpbmRJbmRleChvYmosIHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleSA9IF8uZmluZEtleShvYmosIHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgfVxuICAgIGlmIChrZXkgIT09IHZvaWQgMCAmJiBrZXkgIT09IC0xKSByZXR1cm4gb2JqW2tleV07XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBwYXNzIGEgdHJ1dGggdGVzdC5cbiAgLy8gQWxpYXNlZCBhcyBgc2VsZWN0YC5cbiAgXy5maWx0ZXIgPSBfLnNlbGVjdCA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBwcmVkaWNhdGUgPSBjYihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKHByZWRpY2F0ZSh2YWx1ZSwgaW5kZXgsIGxpc3QpKSByZXN1bHRzLnB1c2godmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCBhIHRydXRoIHRlc3QgZmFpbHMuXG4gIF8ucmVqZWN0ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIob2JqLCBfLm5lZ2F0ZShjYihwcmVkaWNhdGUpKSwgY29udGV4dCk7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgYWxsIG9mIHRoZSBlbGVtZW50cyBtYXRjaCBhIHRydXRoIHRlc3QuXG4gIC8vIEFsaWFzZWQgYXMgYGFsbGAuXG4gIF8uZXZlcnkgPSBfLmFsbCA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcHJlZGljYXRlID0gY2IocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9ICFpc0FycmF5TGlrZShvYmopICYmIF8ua2V5cyhvYmopLFxuICAgICAgICBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgY3VycmVudEtleSA9IGtleXMgPyBrZXlzW2luZGV4XSA6IGluZGV4O1xuICAgICAgaWYgKCFwcmVkaWNhdGUob2JqW2N1cnJlbnRLZXldLCBjdXJyZW50S2V5LCBvYmopKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiBhdCBsZWFzdCBvbmUgZWxlbWVudCBpbiB0aGUgb2JqZWN0IG1hdGNoZXMgYSB0cnV0aCB0ZXN0LlxuICAvLyBBbGlhc2VkIGFzIGBhbnlgLlxuICBfLnNvbWUgPSBfLmFueSA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcHJlZGljYXRlID0gY2IocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9ICFpc0FycmF5TGlrZShvYmopICYmIF8ua2V5cyhvYmopLFxuICAgICAgICBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgY3VycmVudEtleSA9IGtleXMgPyBrZXlzW2luZGV4XSA6IGluZGV4O1xuICAgICAgaWYgKHByZWRpY2F0ZShvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaikpIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIHRoZSBhcnJheSBvciBvYmplY3QgY29udGFpbnMgYSBnaXZlbiBpdGVtICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVzYCBhbmQgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlcyA9IF8uaW5jbHVkZSA9IGZ1bmN0aW9uKG9iaiwgaXRlbSwgZnJvbUluZGV4LCBndWFyZCkge1xuICAgIGlmICghaXNBcnJheUxpa2Uob2JqKSkgb2JqID0gXy52YWx1ZXMob2JqKTtcbiAgICBpZiAodHlwZW9mIGZyb21JbmRleCAhPSAnbnVtYmVyJyB8fCBndWFyZCkgZnJvbUluZGV4ID0gMDtcbiAgICByZXR1cm4gXy5pbmRleE9mKG9iaiwgaXRlbSwgZnJvbUluZGV4KSA+PSAwO1xuICB9O1xuXG4gIC8vIEludm9rZSBhIG1ldGhvZCAod2l0aCBhcmd1bWVudHMpIG9uIGV2ZXJ5IGl0ZW0gaW4gYSBjb2xsZWN0aW9uLlxuICBfLmludm9rZSA9IGZ1bmN0aW9uKG9iaiwgbWV0aG9kKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGlzRnVuYyA9IF8uaXNGdW5jdGlvbihtZXRob2QpO1xuICAgIHJldHVybiBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICB2YXIgZnVuYyA9IGlzRnVuYyA/IG1ldGhvZCA6IHZhbHVlW21ldGhvZF07XG4gICAgICByZXR1cm4gZnVuYyA9PSBudWxsID8gZnVuYyA6IGZ1bmMuYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYG1hcGA6IGZldGNoaW5nIGEgcHJvcGVydHkuXG4gIF8ucGx1Y2sgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBfLm1hcChvYmosIF8ucHJvcGVydHkoa2V5KSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmlsdGVyYDogc2VsZWN0aW5nIG9ubHkgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLndoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIF8ubWF0Y2hlcihhdHRycykpO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbmRgOiBnZXR0aW5nIHRoZSBmaXJzdCBvYmplY3RcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5maW5kV2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8uZmluZChvYmosIF8ubWF0Y2hlcihhdHRycykpO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWF4aW11bSBlbGVtZW50IChvciBlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgXy5tYXggPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdCA9IC1JbmZpbml0eSwgbGFzdENvbXB1dGVkID0gLUluZmluaXR5LFxuICAgICAgICB2YWx1ZSwgY29tcHV0ZWQ7XG4gICAgaWYgKGl0ZXJhdGVlID09IG51bGwgJiYgb2JqICE9IG51bGwpIHtcbiAgICAgIG9iaiA9IGlzQXJyYXlMaWtlKG9iaikgPyBvYmogOiBfLnZhbHVlcyhvYmopO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YWx1ZSA9IG9ialtpXTtcbiAgICAgICAgaWYgKHZhbHVlID4gcmVzdWx0KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgICAgY29tcHV0ZWQgPSBpdGVyYXRlZSh2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgICAgICBpZiAoY29tcHV0ZWQgPiBsYXN0Q29tcHV0ZWQgfHwgY29tcHV0ZWQgPT09IC1JbmZpbml0eSAmJiByZXN1bHQgPT09IC1JbmZpbml0eSkge1xuICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgIGxhc3RDb21wdXRlZCA9IGNvbXB1dGVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1pbmltdW0gZWxlbWVudCAob3IgZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIF8ubWluID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHQgPSBJbmZpbml0eSwgbGFzdENvbXB1dGVkID0gSW5maW5pdHksXG4gICAgICAgIHZhbHVlLCBjb21wdXRlZDtcbiAgICBpZiAoaXRlcmF0ZWUgPT0gbnVsbCAmJiBvYmogIT0gbnVsbCkge1xuICAgICAgb2JqID0gaXNBcnJheUxpa2Uob2JqKSA/IG9iaiA6IF8udmFsdWVzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhbHVlID0gb2JqW2ldO1xuICAgICAgICBpZiAodmFsdWUgPCByZXN1bHQpIHtcbiAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgICBjb21wdXRlZCA9IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgICAgIGlmIChjb21wdXRlZCA8IGxhc3RDb21wdXRlZCB8fCBjb21wdXRlZCA9PT0gSW5maW5pdHkgJiYgcmVzdWx0ID09PSBJbmZpbml0eSkge1xuICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgIGxhc3RDb21wdXRlZCA9IGNvbXB1dGVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBTaHVmZmxlIGEgY29sbGVjdGlvbiwgdXNpbmcgdGhlIG1vZGVybiB2ZXJzaW9uIG9mIHRoZVxuICAvLyBbRmlzaGVyLVlhdGVzIHNodWZmbGVdKGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmlzaGVy4oCTWWF0ZXNfc2h1ZmZsZSkuXG4gIF8uc2h1ZmZsZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBzZXQgPSBpc0FycmF5TGlrZShvYmopID8gb2JqIDogXy52YWx1ZXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0gc2V0Lmxlbmd0aDtcbiAgICB2YXIgc2h1ZmZsZWQgPSBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMCwgcmFuZDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHJhbmQgPSBfLnJhbmRvbSgwLCBpbmRleCk7XG4gICAgICBpZiAocmFuZCAhPT0gaW5kZXgpIHNodWZmbGVkW2luZGV4XSA9IHNodWZmbGVkW3JhbmRdO1xuICAgICAgc2h1ZmZsZWRbcmFuZF0gPSBzZXRbaW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gc2h1ZmZsZWQ7XG4gIH07XG5cbiAgLy8gU2FtcGxlICoqbioqIHJhbmRvbSB2YWx1ZXMgZnJvbSBhIGNvbGxlY3Rpb24uXG4gIC8vIElmICoqbioqIGlzIG5vdCBzcGVjaWZpZWQsIHJldHVybnMgYSBzaW5nbGUgcmFuZG9tIGVsZW1lbnQuXG4gIC8vIFRoZSBpbnRlcm5hbCBgZ3VhcmRgIGFyZ3VtZW50IGFsbG93cyBpdCB0byB3b3JrIHdpdGggYG1hcGAuXG4gIF8uc2FtcGxlID0gZnVuY3Rpb24ob2JqLCBuLCBndWFyZCkge1xuICAgIGlmIChuID09IG51bGwgfHwgZ3VhcmQpIHtcbiAgICAgIGlmICghaXNBcnJheUxpa2Uob2JqKSkgb2JqID0gXy52YWx1ZXMob2JqKTtcbiAgICAgIHJldHVybiBvYmpbXy5yYW5kb20ob2JqLmxlbmd0aCAtIDEpXTtcbiAgICB9XG4gICAgcmV0dXJuIF8uc2h1ZmZsZShvYmopLnNsaWNlKDAsIE1hdGgubWF4KDAsIG4pKTtcbiAgfTtcblxuICAvLyBTb3J0IHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24gcHJvZHVjZWQgYnkgYW4gaXRlcmF0ZWUuXG4gIF8uc29ydEJ5ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgY3JpdGVyaWE6IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgbGlzdClcbiAgICAgIH07XG4gICAgfSkuc29ydChmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICAgICAgdmFyIGEgPSBsZWZ0LmNyaXRlcmlhO1xuICAgICAgdmFyIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgIGlmIChhICE9PSBiKSB7XG4gICAgICAgIGlmIChhID4gYiB8fCBhID09PSB2b2lkIDApIHJldHVybiAxO1xuICAgICAgICBpZiAoYSA8IGIgfHwgYiA9PT0gdm9pZCAwKSByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGVmdC5pbmRleCAtIHJpZ2h0LmluZGV4O1xuICAgIH0pLCAndmFsdWUnKTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiB1c2VkIGZvciBhZ2dyZWdhdGUgXCJncm91cCBieVwiIG9wZXJhdGlvbnMuXG4gIHZhciBncm91cCA9IGZ1bmN0aW9uKGJlaGF2aW9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICAgIHZhciBrZXkgPSBpdGVyYXRlZSh2YWx1ZSwgaW5kZXgsIG9iaik7XG4gICAgICAgIGJlaGF2aW9yKHJlc3VsdCwgdmFsdWUsIGtleSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBHcm91cHMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbi4gUGFzcyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlXG4gIC8vIHRvIGdyb3VwIGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgY3JpdGVyaW9uLlxuICBfLmdyb3VwQnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBrZXkpIHtcbiAgICBpZiAoXy5oYXMocmVzdWx0LCBrZXkpKSByZXN1bHRba2V5XS5wdXNoKHZhbHVlKTsgZWxzZSByZXN1bHRba2V5XSA9IFt2YWx1ZV07XG4gIH0pO1xuXG4gIC8vIEluZGV4ZXMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiwgc2ltaWxhciB0byBgZ3JvdXBCeWAsIGJ1dCBmb3JcbiAgLy8gd2hlbiB5b3Uga25vdyB0aGF0IHlvdXIgaW5kZXggdmFsdWVzIHdpbGwgYmUgdW5pcXVlLlxuICBfLmluZGV4QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBrZXkpIHtcbiAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICB9KTtcblxuICAvLyBDb3VudHMgaW5zdGFuY2VzIG9mIGFuIG9iamVjdCB0aGF0IGdyb3VwIGJ5IGEgY2VydGFpbiBjcml0ZXJpb24uIFBhc3NcbiAgLy8gZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZSB0byBjb3VudCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlXG4gIC8vIGNyaXRlcmlvbi5cbiAgXy5jb3VudEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCB2YWx1ZSwga2V5KSB7XG4gICAgaWYgKF8uaGFzKHJlc3VsdCwga2V5KSkgcmVzdWx0W2tleV0rKzsgZWxzZSByZXN1bHRba2V5XSA9IDE7XG4gIH0pO1xuXG4gIC8vIFNhZmVseSBjcmVhdGUgYSByZWFsLCBsaXZlIGFycmF5IGZyb20gYW55dGhpbmcgaXRlcmFibGUuXG4gIF8udG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghb2JqKSByZXR1cm4gW107XG4gICAgaWYgKF8uaXNBcnJheShvYmopKSByZXR1cm4gc2xpY2UuY2FsbChvYmopO1xuICAgIGlmIChpc0FycmF5TGlrZShvYmopKSByZXR1cm4gXy5tYXAob2JqLCBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gXy52YWx1ZXMob2JqKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiBhbiBvYmplY3QuXG4gIF8uc2l6ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIDA7XG4gICAgcmV0dXJuIGlzQXJyYXlMaWtlKG9iaikgPyBvYmoubGVuZ3RoIDogXy5rZXlzKG9iaikubGVuZ3RoO1xuICB9O1xuXG4gIC8vIFNwbGl0IGEgY29sbGVjdGlvbiBpbnRvIHR3byBhcnJheXM6IG9uZSB3aG9zZSBlbGVtZW50cyBhbGwgc2F0aXNmeSB0aGUgZ2l2ZW5cbiAgLy8gcHJlZGljYXRlLCBhbmQgb25lIHdob3NlIGVsZW1lbnRzIGFsbCBkbyBub3Qgc2F0aXNmeSB0aGUgcHJlZGljYXRlLlxuICBfLnBhcnRpdGlvbiA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcHJlZGljYXRlID0gY2IocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB2YXIgcGFzcyA9IFtdLCBmYWlsID0gW107XG4gICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqKSB7XG4gICAgICAocHJlZGljYXRlKHZhbHVlLCBrZXksIG9iaikgPyBwYXNzIDogZmFpbCkucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIFtwYXNzLCBmYWlsXTtcbiAgfTtcblxuICAvLyBBcnJheSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gR2V0IHRoZSBmaXJzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBmaXJzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYGhlYWRgIGFuZCBgdGFrZWAuIFRoZSAqKmd1YXJkKiogY2hlY2tcbiAgLy8gYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmZpcnN0ID0gXy5oZWFkID0gXy50YWtlID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgaWYgKG4gPT0gbnVsbCB8fCBndWFyZCkgcmV0dXJuIGFycmF5WzBdO1xuICAgIHJldHVybiBfLmluaXRpYWwoYXJyYXksIGFycmF5Lmxlbmd0aCAtIG4pO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGxhc3QgZW50cnkgb2YgdGhlIGFycmF5LiBFc3BlY2lhbGx5IHVzZWZ1bCBvblxuICAvLyB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiBhbGwgdGhlIHZhbHVlcyBpblxuICAvLyB0aGUgYXJyYXksIGV4Y2x1ZGluZyB0aGUgbGFzdCBOLlxuICBfLmluaXRpYWwgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgTWF0aC5tYXgoMCwgYXJyYXkubGVuZ3RoIC0gKG4gPT0gbnVsbCB8fCBndWFyZCA/IDEgOiBuKSkpO1xuICB9O1xuXG4gIC8vIEdldCB0aGUgbGFzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBsYXN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS5cbiAgXy5sYXN0ID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgaWYgKG4gPT0gbnVsbCB8fCBndWFyZCkgcmV0dXJuIGFycmF5W2FycmF5Lmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBfLnJlc3QoYXJyYXksIE1hdGgubWF4KDAsIGFycmF5Lmxlbmd0aCAtIG4pKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBmaXJzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYHRhaWxgIGFuZCBgZHJvcGAuXG4gIC8vIEVzcGVjaWFsbHkgdXNlZnVsIG9uIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nIGFuICoqbioqIHdpbGwgcmV0dXJuXG4gIC8vIHRoZSByZXN0IE4gdmFsdWVzIGluIHRoZSBhcnJheS5cbiAgXy5yZXN0ID0gXy50YWlsID0gXy5kcm9wID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIG4gPT0gbnVsbCB8fCBndWFyZCA/IDEgOiBuKTtcbiAgfTtcblxuICAvLyBUcmltIG91dCBhbGwgZmFsc3kgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIF8uY29tcGFjdCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBfLmlkZW50aXR5KTtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiBhIHJlY3Vyc2l2ZSBgZmxhdHRlbmAgZnVuY3Rpb24uXG4gIHZhciBmbGF0dGVuID0gZnVuY3Rpb24oaW5wdXQsIHNoYWxsb3csIHN0cmljdCwgc3RhcnRJbmRleCkge1xuICAgIHZhciBvdXRwdXQgPSBbXSwgaWR4ID0gMDtcbiAgICBmb3IgKHZhciBpID0gc3RhcnRJbmRleCB8fCAwLCBsZW5ndGggPSBnZXRMZW5ndGgoaW5wdXQpOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB2YWx1ZSA9IGlucHV0W2ldO1xuICAgICAgaWYgKGlzQXJyYXlMaWtlKHZhbHVlKSAmJiAoXy5pc0FycmF5KHZhbHVlKSB8fCBfLmlzQXJndW1lbnRzKHZhbHVlKSkpIHtcbiAgICAgICAgLy9mbGF0dGVuIGN1cnJlbnQgbGV2ZWwgb2YgYXJyYXkgb3IgYXJndW1lbnRzIG9iamVjdFxuICAgICAgICBpZiAoIXNoYWxsb3cpIHZhbHVlID0gZmxhdHRlbih2YWx1ZSwgc2hhbGxvdywgc3RyaWN0KTtcbiAgICAgICAgdmFyIGogPSAwLCBsZW4gPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgIG91dHB1dC5sZW5ndGggKz0gbGVuO1xuICAgICAgICB3aGlsZSAoaiA8IGxlbikge1xuICAgICAgICAgIG91dHB1dFtpZHgrK10gPSB2YWx1ZVtqKytdO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFzdHJpY3QpIHtcbiAgICAgICAgb3V0cHV0W2lkeCsrXSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xuXG4gIC8vIEZsYXR0ZW4gb3V0IGFuIGFycmF5LCBlaXRoZXIgcmVjdXJzaXZlbHkgKGJ5IGRlZmF1bHQpLCBvciBqdXN0IG9uZSBsZXZlbC5cbiAgXy5mbGF0dGVuID0gZnVuY3Rpb24oYXJyYXksIHNoYWxsb3cpIHtcbiAgICByZXR1cm4gZmxhdHRlbihhcnJheSwgc2hhbGxvdywgZmFsc2UpO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHZlcnNpb24gb2YgdGhlIGFycmF5IHRoYXQgZG9lcyBub3QgY29udGFpbiB0aGUgc3BlY2lmaWVkIHZhbHVlKHMpLlxuICBfLndpdGhvdXQgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmRpZmZlcmVuY2UoYXJyYXksIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhIGR1cGxpY2F0ZS1mcmVlIHZlcnNpb24gb2YgdGhlIGFycmF5LiBJZiB0aGUgYXJyYXkgaGFzIGFscmVhZHlcbiAgLy8gYmVlbiBzb3J0ZWQsIHlvdSBoYXZlIHRoZSBvcHRpb24gb2YgdXNpbmcgYSBmYXN0ZXIgYWxnb3JpdGhtLlxuICAvLyBBbGlhc2VkIGFzIGB1bmlxdWVgLlxuICBfLnVuaXEgPSBfLnVuaXF1ZSA9IGZ1bmN0aW9uKGFycmF5LCBpc1NvcnRlZCwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpZiAoIV8uaXNCb29sZWFuKGlzU29ydGVkKSkge1xuICAgICAgY29udGV4dCA9IGl0ZXJhdGVlO1xuICAgICAgaXRlcmF0ZWUgPSBpc1NvcnRlZDtcbiAgICAgIGlzU29ydGVkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChpdGVyYXRlZSAhPSBudWxsKSBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgdmFyIHNlZW4gPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gZ2V0TGVuZ3RoKGFycmF5KTsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgdmFsdWUgPSBhcnJheVtpXSxcbiAgICAgICAgICBjb21wdXRlZCA9IGl0ZXJhdGVlID8gaXRlcmF0ZWUodmFsdWUsIGksIGFycmF5KSA6IHZhbHVlO1xuICAgICAgaWYgKGlzU29ydGVkKSB7XG4gICAgICAgIGlmICghaSB8fCBzZWVuICE9PSBjb21wdXRlZCkgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgICBzZWVuID0gY29tcHV0ZWQ7XG4gICAgICB9IGVsc2UgaWYgKGl0ZXJhdGVlKSB7XG4gICAgICAgIGlmICghXy5jb250YWlucyhzZWVuLCBjb21wdXRlZCkpIHtcbiAgICAgICAgICBzZWVuLnB1c2goY29tcHV0ZWQpO1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICghXy5jb250YWlucyhyZXN1bHQsIHZhbHVlKSkge1xuICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShmbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSwgdHJ1ZSkpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyBldmVyeSBpdGVtIHNoYXJlZCBiZXR3ZWVuIGFsbCB0aGVcbiAgLy8gcGFzc2VkLWluIGFycmF5cy5cbiAgXy5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB2YXIgYXJnc0xlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGdldExlbmd0aChhcnJheSk7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSBhcnJheVtpXTtcbiAgICAgIGlmIChfLmNvbnRhaW5zKHJlc3VsdCwgaXRlbSkpIGNvbnRpbnVlO1xuICAgICAgZm9yICh2YXIgaiA9IDE7IGogPCBhcmdzTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKCFfLmNvbnRhaW5zKGFyZ3VtZW50c1tqXSwgaXRlbSkpIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGogPT09IGFyZ3NMZW5ndGgpIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFRha2UgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBvbmUgYXJyYXkgYW5kIGEgbnVtYmVyIG9mIG90aGVyIGFycmF5cy5cbiAgLy8gT25seSB0aGUgZWxlbWVudHMgcHJlc2VudCBpbiBqdXN0IHRoZSBmaXJzdCBhcnJheSB3aWxsIHJlbWFpbi5cbiAgXy5kaWZmZXJlbmNlID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IGZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlLCB0cnVlLCAxKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgIHJldHVybiAhXy5jb250YWlucyhyZXN0LCB2YWx1ZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXy51bnppcChhcmd1bWVudHMpO1xuICB9O1xuXG4gIC8vIENvbXBsZW1lbnQgb2YgXy56aXAuIFVuemlwIGFjY2VwdHMgYW4gYXJyYXkgb2YgYXJyYXlzIGFuZCBncm91cHNcbiAgLy8gZWFjaCBhcnJheSdzIGVsZW1lbnRzIG9uIHNoYXJlZCBpbmRpY2VzXG4gIF8udW56aXAgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciBsZW5ndGggPSBhcnJheSAmJiBfLm1heChhcnJheSwgZ2V0TGVuZ3RoKS5sZW5ndGggfHwgMDtcbiAgICB2YXIgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHJlc3VsdFtpbmRleF0gPSBfLnBsdWNrKGFycmF5LCBpbmRleCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gQ29udmVydHMgbGlzdHMgaW50byBvYmplY3RzLiBQYXNzIGVpdGhlciBhIHNpbmdsZSBhcnJheSBvZiBgW2tleSwgdmFsdWVdYFxuICAvLyBwYWlycywgb3IgdHdvIHBhcmFsbGVsIGFycmF5cyBvZiB0aGUgc2FtZSBsZW5ndGggLS0gb25lIG9mIGtleXMsIGFuZCBvbmUgb2ZcbiAgLy8gdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzLlxuICBfLm9iamVjdCA9IGZ1bmN0aW9uKGxpc3QsIHZhbHVlcykge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gZ2V0TGVuZ3RoKGxpc3QpOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1dID0gdmFsdWVzW2ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1bMF1dID0gbGlzdFtpXVsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBHZW5lcmF0b3IgZnVuY3Rpb24gdG8gY3JlYXRlIHRoZSBmaW5kSW5kZXggYW5kIGZpbmRMYXN0SW5kZXggZnVuY3Rpb25zXG4gIGZ1bmN0aW9uIGNyZWF0ZVByZWRpY2F0ZUluZGV4RmluZGVyKGRpcikge1xuICAgIHJldHVybiBmdW5jdGlvbihhcnJheSwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICBwcmVkaWNhdGUgPSBjYihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgdmFyIGxlbmd0aCA9IGdldExlbmd0aChhcnJheSk7XG4gICAgICB2YXIgaW5kZXggPSBkaXIgPiAwID8gMCA6IGxlbmd0aCAtIDE7XG4gICAgICBmb3IgKDsgaW5kZXggPj0gMCAmJiBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gZGlyKSB7XG4gICAgICAgIGlmIChwcmVkaWNhdGUoYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpKSByZXR1cm4gaW5kZXg7XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIGZpcnN0IGluZGV4IG9uIGFuIGFycmF5LWxpa2UgdGhhdCBwYXNzZXMgYSBwcmVkaWNhdGUgdGVzdFxuICBfLmZpbmRJbmRleCA9IGNyZWF0ZVByZWRpY2F0ZUluZGV4RmluZGVyKDEpO1xuICBfLmZpbmRMYXN0SW5kZXggPSBjcmVhdGVQcmVkaWNhdGVJbmRleEZpbmRlcigtMSk7XG5cbiAgLy8gVXNlIGEgY29tcGFyYXRvciBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHRoZSBzbWFsbGVzdCBpbmRleCBhdCB3aGljaFxuICAvLyBhbiBvYmplY3Qgc2hvdWxkIGJlIGluc2VydGVkIHNvIGFzIHRvIG1haW50YWluIG9yZGVyLiBVc2VzIGJpbmFyeSBzZWFyY2guXG4gIF8uc29ydGVkSW5kZXggPSBmdW5jdGlvbihhcnJheSwgb2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQsIDEpO1xuICAgIHZhciB2YWx1ZSA9IGl0ZXJhdGVlKG9iaik7XG4gICAgdmFyIGxvdyA9IDAsIGhpZ2ggPSBnZXRMZW5ndGgoYXJyYXkpO1xuICAgIHdoaWxlIChsb3cgPCBoaWdoKSB7XG4gICAgICB2YXIgbWlkID0gTWF0aC5mbG9vcigobG93ICsgaGlnaCkgLyAyKTtcbiAgICAgIGlmIChpdGVyYXRlZShhcnJheVttaWRdKSA8IHZhbHVlKSBsb3cgPSBtaWQgKyAxOyBlbHNlIGhpZ2ggPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBsb3c7XG4gIH07XG5cbiAgLy8gR2VuZXJhdG9yIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGUgaW5kZXhPZiBhbmQgbGFzdEluZGV4T2YgZnVuY3Rpb25zXG4gIGZ1bmN0aW9uIGNyZWF0ZUluZGV4RmluZGVyKGRpciwgcHJlZGljYXRlRmluZCwgc29ydGVkSW5kZXgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGlkeCkge1xuICAgICAgdmFyIGkgPSAwLCBsZW5ndGggPSBnZXRMZW5ndGgoYXJyYXkpO1xuICAgICAgaWYgKHR5cGVvZiBpZHggPT0gJ251bWJlcicpIHtcbiAgICAgICAgaWYgKGRpciA+IDApIHtcbiAgICAgICAgICAgIGkgPSBpZHggPj0gMCA/IGlkeCA6IE1hdGgubWF4KGlkeCArIGxlbmd0aCwgaSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZW5ndGggPSBpZHggPj0gMCA/IE1hdGgubWluKGlkeCArIDEsIGxlbmd0aCkgOiBpZHggKyBsZW5ndGggKyAxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHNvcnRlZEluZGV4ICYmIGlkeCAmJiBsZW5ndGgpIHtcbiAgICAgICAgaWR4ID0gc29ydGVkSW5kZXgoYXJyYXksIGl0ZW0pO1xuICAgICAgICByZXR1cm4gYXJyYXlbaWR4XSA9PT0gaXRlbSA/IGlkeCA6IC0xO1xuICAgICAgfVxuICAgICAgaWYgKGl0ZW0gIT09IGl0ZW0pIHtcbiAgICAgICAgaWR4ID0gcHJlZGljYXRlRmluZChzbGljZS5jYWxsKGFycmF5LCBpLCBsZW5ndGgpLCBfLmlzTmFOKTtcbiAgICAgICAgcmV0dXJuIGlkeCA+PSAwID8gaWR4ICsgaSA6IC0xO1xuICAgICAgfVxuICAgICAgZm9yIChpZHggPSBkaXIgPiAwID8gaSA6IGxlbmd0aCAtIDE7IGlkeCA+PSAwICYmIGlkeCA8IGxlbmd0aDsgaWR4ICs9IGRpcikge1xuICAgICAgICBpZiAoYXJyYXlbaWR4XSA9PT0gaXRlbSkgcmV0dXJuIGlkeDtcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9O1xuICB9XG5cbiAgLy8gUmV0dXJuIHRoZSBwb3NpdGlvbiBvZiB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBhbiBpdGVtIGluIGFuIGFycmF5LFxuICAvLyBvciAtMSBpZiB0aGUgaXRlbSBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIGFycmF5LlxuICAvLyBJZiB0aGUgYXJyYXkgaXMgbGFyZ2UgYW5kIGFscmVhZHkgaW4gc29ydCBvcmRlciwgcGFzcyBgdHJ1ZWBcbiAgLy8gZm9yICoqaXNTb3J0ZWQqKiB0byB1c2UgYmluYXJ5IHNlYXJjaC5cbiAgXy5pbmRleE9mID0gY3JlYXRlSW5kZXhGaW5kZXIoMSwgXy5maW5kSW5kZXgsIF8uc29ydGVkSW5kZXgpO1xuICBfLmxhc3RJbmRleE9mID0gY3JlYXRlSW5kZXhGaW5kZXIoLTEsIF8uZmluZExhc3RJbmRleCk7XG5cbiAgLy8gR2VuZXJhdGUgYW4gaW50ZWdlciBBcnJheSBjb250YWluaW5nIGFuIGFyaXRobWV0aWMgcHJvZ3Jlc3Npb24uIEEgcG9ydCBvZlxuICAvLyB0aGUgbmF0aXZlIFB5dGhvbiBgcmFuZ2UoKWAgZnVuY3Rpb24uIFNlZVxuICAvLyBbdGhlIFB5dGhvbiBkb2N1bWVudGF0aW9uXShodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvZnVuY3Rpb25zLmh0bWwjcmFuZ2UpLlxuICBfLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgICBpZiAoc3RvcCA9PSBudWxsKSB7XG4gICAgICBzdG9wID0gc3RhcnQgfHwgMDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgc3RlcCA9IHN0ZXAgfHwgMTtcblxuICAgIHZhciBsZW5ndGggPSBNYXRoLm1heChNYXRoLmNlaWwoKHN0b3AgLSBzdGFydCkgLyBzdGVwKSwgMCk7XG4gICAgdmFyIHJhbmdlID0gQXJyYXkobGVuZ3RoKTtcblxuICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IGxlbmd0aDsgaWR4KyssIHN0YXJ0ICs9IHN0ZXApIHtcbiAgICAgIHJhbmdlW2lkeF0gPSBzdGFydDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmFuZ2U7XG4gIH07XG5cbiAgLy8gRnVuY3Rpb24gKGFoZW0pIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBEZXRlcm1pbmVzIHdoZXRoZXIgdG8gZXhlY3V0ZSBhIGZ1bmN0aW9uIGFzIGEgY29uc3RydWN0b3JcbiAgLy8gb3IgYSBub3JtYWwgZnVuY3Rpb24gd2l0aCB0aGUgcHJvdmlkZWQgYXJndW1lbnRzXG4gIHZhciBleGVjdXRlQm91bmQgPSBmdW5jdGlvbihzb3VyY2VGdW5jLCBib3VuZEZ1bmMsIGNvbnRleHQsIGNhbGxpbmdDb250ZXh0LCBhcmdzKSB7XG4gICAgaWYgKCEoY2FsbGluZ0NvbnRleHQgaW5zdGFuY2VvZiBib3VuZEZ1bmMpKSByZXR1cm4gc291cmNlRnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB2YXIgc2VsZiA9IGJhc2VDcmVhdGUoc291cmNlRnVuYy5wcm90b3R5cGUpO1xuICAgIHZhciByZXN1bHQgPSBzb3VyY2VGdW5jLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIGlmIChfLmlzT2JqZWN0KHJlc3VsdCkpIHJldHVybiByZXN1bHQ7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG5cbiAgLy8gQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gYSBnaXZlbiBvYmplY3QgKGFzc2lnbmluZyBgdGhpc2AsIGFuZCBhcmd1bWVudHMsXG4gIC8vIG9wdGlvbmFsbHkpLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgRnVuY3Rpb24uYmluZGAgaWZcbiAgLy8gYXZhaWxhYmxlLlxuICBfLmJpbmQgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0KSB7XG4gICAgaWYgKG5hdGl2ZUJpbmQgJiYgZnVuYy5iaW5kID09PSBuYXRpdmVCaW5kKSByZXR1cm4gbmF0aXZlQmluZC5hcHBseShmdW5jLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGlmICghXy5pc0Z1bmN0aW9uKGZ1bmMpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdCaW5kIG11c3QgYmUgY2FsbGVkIG9uIGEgZnVuY3Rpb24nKTtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgYm91bmQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleGVjdXRlQm91bmQoZnVuYywgYm91bmQsIGNvbnRleHQsIHRoaXMsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgIH07XG4gICAgcmV0dXJuIGJvdW5kO1xuICB9O1xuXG4gIC8vIFBhcnRpYWxseSBhcHBseSBhIGZ1bmN0aW9uIGJ5IGNyZWF0aW5nIGEgdmVyc2lvbiB0aGF0IGhhcyBoYWQgc29tZSBvZiBpdHNcbiAgLy8gYXJndW1lbnRzIHByZS1maWxsZWQsIHdpdGhvdXQgY2hhbmdpbmcgaXRzIGR5bmFtaWMgYHRoaXNgIGNvbnRleHQuIF8gYWN0c1xuICAvLyBhcyBhIHBsYWNlaG9sZGVyLCBhbGxvd2luZyBhbnkgY29tYmluYXRpb24gb2YgYXJndW1lbnRzIHRvIGJlIHByZS1maWxsZWQuXG4gIF8ucGFydGlhbCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgYm91bmRBcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHZhciBib3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBvc2l0aW9uID0gMCwgbGVuZ3RoID0gYm91bmRBcmdzLmxlbmd0aDtcbiAgICAgIHZhciBhcmdzID0gQXJyYXkobGVuZ3RoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYXJnc1tpXSA9IGJvdW5kQXJnc1tpXSA9PT0gXyA/IGFyZ3VtZW50c1twb3NpdGlvbisrXSA6IGJvdW5kQXJnc1tpXTtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChwb3NpdGlvbiA8IGFyZ3VtZW50cy5sZW5ndGgpIGFyZ3MucHVzaChhcmd1bWVudHNbcG9zaXRpb24rK10pO1xuICAgICAgcmV0dXJuIGV4ZWN1dGVCb3VuZChmdW5jLCBib3VuZCwgdGhpcywgdGhpcywgYXJncyk7XG4gICAgfTtcbiAgICByZXR1cm4gYm91bmQ7XG4gIH07XG5cbiAgLy8gQmluZCBhIG51bWJlciBvZiBhbiBvYmplY3QncyBtZXRob2RzIHRvIHRoYXQgb2JqZWN0LiBSZW1haW5pbmcgYXJndW1lbnRzXG4gIC8vIGFyZSB0aGUgbWV0aG9kIG5hbWVzIHRvIGJlIGJvdW5kLiBVc2VmdWwgZm9yIGVuc3VyaW5nIHRoYXQgYWxsIGNhbGxiYWNrc1xuICAvLyBkZWZpbmVkIG9uIGFuIG9iamVjdCBiZWxvbmcgdG8gaXQuXG4gIF8uYmluZEFsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBpLCBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoLCBrZXk7XG4gICAgaWYgKGxlbmd0aCA8PSAxKSB0aHJvdyBuZXcgRXJyb3IoJ2JpbmRBbGwgbXVzdCBiZSBwYXNzZWQgZnVuY3Rpb24gbmFtZXMnKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIG9ialtrZXldID0gXy5iaW5kKG9ialtrZXldLCBvYmopO1xuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIE1lbW9pemUgYW4gZXhwZW5zaXZlIGZ1bmN0aW9uIGJ5IHN0b3JpbmcgaXRzIHJlc3VsdHMuXG4gIF8ubWVtb2l6ZSA9IGZ1bmN0aW9uKGZ1bmMsIGhhc2hlcikge1xuICAgIHZhciBtZW1vaXplID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgY2FjaGUgPSBtZW1vaXplLmNhY2hlO1xuICAgICAgdmFyIGFkZHJlc3MgPSAnJyArIChoYXNoZXIgPyBoYXNoZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IGtleSk7XG4gICAgICBpZiAoIV8uaGFzKGNhY2hlLCBhZGRyZXNzKSkgY2FjaGVbYWRkcmVzc10gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gY2FjaGVbYWRkcmVzc107XG4gICAgfTtcbiAgICBtZW1vaXplLmNhY2hlID0ge307XG4gICAgcmV0dXJuIG1lbW9pemU7XG4gIH07XG5cbiAgLy8gRGVsYXlzIGEgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLCBhbmQgdGhlbiBjYWxsc1xuICAvLyBpdCB3aXRoIHRoZSBhcmd1bWVudHMgc3VwcGxpZWQuXG4gIF8uZGVsYXkgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIH0sIHdhaXQpO1xuICB9O1xuXG4gIC8vIERlZmVycyBhIGZ1bmN0aW9uLCBzY2hlZHVsaW5nIGl0IHRvIHJ1biBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhc1xuICAvLyBjbGVhcmVkLlxuICBfLmRlZmVyID0gXy5wYXJ0aWFsKF8uZGVsYXksIF8sIDEpO1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgd2hlbiBpbnZva2VkLCB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIGF0IG1vc3Qgb25jZVxuICAvLyBkdXJpbmcgYSBnaXZlbiB3aW5kb3cgb2YgdGltZS4gTm9ybWFsbHksIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gd2lsbCBydW5cbiAgLy8gYXMgbXVjaCBhcyBpdCBjYW4sIHdpdGhvdXQgZXZlciBnb2luZyBtb3JlIHRoYW4gb25jZSBwZXIgYHdhaXRgIGR1cmF0aW9uO1xuICAvLyBidXQgaWYgeW91J2QgbGlrZSB0byBkaXNhYmxlIHRoZSBleGVjdXRpb24gb24gdGhlIGxlYWRpbmcgZWRnZSwgcGFzc1xuICAvLyBge2xlYWRpbmc6IGZhbHNlfWAuIFRvIGRpc2FibGUgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlLCBkaXR0by5cbiAgXy50aHJvdHRsZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGV4dCwgYXJncywgcmVzdWx0O1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICB2YXIgcHJldmlvdXMgPSAwO1xuICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJldmlvdXMgPSBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlID8gMCA6IF8ubm93KCk7XG4gICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBfLm5vdygpO1xuICAgICAgaWYgKCFwcmV2aW91cyAmJiBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlKSBwcmV2aW91cyA9IG5vdztcbiAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChyZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiB3YWl0KSB7XG4gICAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHByZXZpb3VzID0gbm93O1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICAvLyBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gIC8vIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICAvLyBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICBfLmRlYm91bmNlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gICAgdmFyIHRpbWVvdXQsIGFyZ3MsIGNvbnRleHQsIHRpbWVzdGFtcCwgcmVzdWx0O1xuXG4gICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGFzdCA9IF8ubm93KCkgLSB0aW1lc3RhbXA7XG5cbiAgICAgIGlmIChsYXN0IDwgd2FpdCAmJiBsYXN0ID49IDApIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQgLSBsYXN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBpZiAoIWltbWVkaWF0ZSkge1xuICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgdGltZXN0YW1wID0gXy5ub3coKTtcbiAgICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgICAgaWYgKCF0aW1lb3V0KSB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICBpZiAoY2FsbE5vdykge1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBmdW5jdGlvbiBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIHNlY29uZCxcbiAgLy8gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBhcmd1bWVudHMsIHJ1biBjb2RlIGJlZm9yZSBhbmQgYWZ0ZXIsIGFuZFxuICAvLyBjb25kaXRpb25hbGx5IGV4ZWN1dGUgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxuICBfLndyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIF8ucGFydGlhbCh3cmFwcGVyLCBmdW5jKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgbmVnYXRlZCB2ZXJzaW9uIG9mIHRoZSBwYXNzZWQtaW4gcHJlZGljYXRlLlxuICBfLm5lZ2F0ZSA9IGZ1bmN0aW9uKHByZWRpY2F0ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhcHJlZGljYXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBpcyB0aGUgY29tcG9zaXRpb24gb2YgYSBsaXN0IG9mIGZ1bmN0aW9ucywgZWFjaFxuICAvLyBjb25zdW1pbmcgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZnVuY3Rpb24gdGhhdCBmb2xsb3dzLlxuICBfLmNvbXBvc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICB2YXIgc3RhcnQgPSBhcmdzLmxlbmd0aCAtIDE7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGkgPSBzdGFydDtcbiAgICAgIHZhciByZXN1bHQgPSBhcmdzW3N0YXJ0XS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgd2hpbGUgKGktLSkgcmVzdWx0ID0gYXJnc1tpXS5jYWxsKHRoaXMsIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIG9uIGFuZCBhZnRlciB0aGUgTnRoIGNhbGwuXG4gIF8uYWZ0ZXIgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgtLXRpbWVzIDwgMSkge1xuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIHVwIHRvIChidXQgbm90IGluY2x1ZGluZykgdGhlIE50aCBjYWxsLlxuICBfLmJlZm9yZSA9IGZ1bmN0aW9uKHRpbWVzLCBmdW5jKSB7XG4gICAgdmFyIG1lbW87XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tdGltZXMgPiAwKSB7XG4gICAgICAgIG1lbW8gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgICBpZiAodGltZXMgPD0gMSkgZnVuYyA9IG51bGw7XG4gICAgICByZXR1cm4gbWVtbztcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgYXQgbW9zdCBvbmUgdGltZSwgbm8gbWF0dGVyIGhvd1xuICAvLyBvZnRlbiB5b3UgY2FsbCBpdC4gVXNlZnVsIGZvciBsYXp5IGluaXRpYWxpemF0aW9uLlxuICBfLm9uY2UgPSBfLnBhcnRpYWwoXy5iZWZvcmUsIDIpO1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEtleXMgaW4gSUUgPCA5IHRoYXQgd29uJ3QgYmUgaXRlcmF0ZWQgYnkgYGZvciBrZXkgaW4gLi4uYCBhbmQgdGh1cyBtaXNzZWQuXG4gIHZhciBoYXNFbnVtQnVnID0gIXt0b1N0cmluZzogbnVsbH0ucHJvcGVydHlJc0VudW1lcmFibGUoJ3RvU3RyaW5nJyk7XG4gIHZhciBub25FbnVtZXJhYmxlUHJvcHMgPSBbJ3ZhbHVlT2YnLCAnaXNQcm90b3R5cGVPZicsICd0b1N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3Byb3BlcnR5SXNFbnVtZXJhYmxlJywgJ2hhc093blByb3BlcnR5JywgJ3RvTG9jYWxlU3RyaW5nJ107XG5cbiAgZnVuY3Rpb24gY29sbGVjdE5vbkVudW1Qcm9wcyhvYmosIGtleXMpIHtcbiAgICB2YXIgbm9uRW51bUlkeCA9IG5vbkVudW1lcmFibGVQcm9wcy5sZW5ndGg7XG4gICAgdmFyIGNvbnN0cnVjdG9yID0gb2JqLmNvbnN0cnVjdG9yO1xuICAgIHZhciBwcm90byA9IChfLmlzRnVuY3Rpb24oY29uc3RydWN0b3IpICYmIGNvbnN0cnVjdG9yLnByb3RvdHlwZSkgfHwgT2JqUHJvdG87XG5cbiAgICAvLyBDb25zdHJ1Y3RvciBpcyBhIHNwZWNpYWwgY2FzZS5cbiAgICB2YXIgcHJvcCA9ICdjb25zdHJ1Y3Rvcic7XG4gICAgaWYgKF8uaGFzKG9iaiwgcHJvcCkgJiYgIV8uY29udGFpbnMoa2V5cywgcHJvcCkpIGtleXMucHVzaChwcm9wKTtcblxuICAgIHdoaWxlIChub25FbnVtSWR4LS0pIHtcbiAgICAgIHByb3AgPSBub25FbnVtZXJhYmxlUHJvcHNbbm9uRW51bUlkeF07XG4gICAgICBpZiAocHJvcCBpbiBvYmogJiYgb2JqW3Byb3BdICE9PSBwcm90b1twcm9wXSAmJiAhXy5jb250YWlucyhrZXlzLCBwcm9wKSkge1xuICAgICAgICBrZXlzLnB1c2gocHJvcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0cmlldmUgdGhlIG5hbWVzIG9mIGFuIG9iamVjdCdzIG93biBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gW107XG4gICAgaWYgKG5hdGl2ZUtleXMpIHJldHVybiBuYXRpdmVLZXlzKG9iaik7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICAvLyBBaGVtLCBJRSA8IDkuXG4gICAgaWYgKGhhc0VudW1CdWcpIGNvbGxlY3ROb25FbnVtUHJvcHMob2JqLCBrZXlzKTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSBhbGwgdGhlIHByb3BlcnR5IG5hbWVzIG9mIGFuIG9iamVjdC5cbiAgXy5hbGxLZXlzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBbXTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICAgIC8vIEFoZW0sIElFIDwgOS5cbiAgICBpZiAoaGFzRW51bUJ1ZykgY29sbGVjdE5vbkVudW1Qcm9wcyhvYmosIGtleXMpO1xuICAgIHJldHVybiBrZXlzO1xuICB9O1xuXG4gIC8vIFJldHJpZXZlIHRoZSB2YWx1ZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgXy52YWx1ZXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgdmFsdWVzID0gQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YWx1ZXNbaV0gPSBvYmpba2V5c1tpXV07XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZXM7XG4gIH07XG5cbiAgLy8gUmV0dXJucyB0aGUgcmVzdWx0cyBvZiBhcHBseWluZyB0aGUgaXRlcmF0ZWUgdG8gZWFjaCBlbGVtZW50IG9mIHRoZSBvYmplY3RcbiAgLy8gSW4gY29udHJhc3QgdG8gXy5tYXAgaXQgcmV0dXJucyBhbiBvYmplY3RcbiAgXy5tYXBPYmplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgdmFyIGtleXMgPSAgXy5rZXlzKG9iaiksXG4gICAgICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGgsXG4gICAgICAgICAgcmVzdWx0cyA9IHt9LFxuICAgICAgICAgIGN1cnJlbnRLZXk7XG4gICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGN1cnJlbnRLZXkgPSBrZXlzW2luZGV4XTtcbiAgICAgICAgcmVzdWx0c1tjdXJyZW50S2V5XSA9IGl0ZXJhdGVlKG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENvbnZlcnQgYW4gb2JqZWN0IGludG8gYSBsaXN0IG9mIGBba2V5LCB2YWx1ZV1gIHBhaXJzLlxuICBfLnBhaXJzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHBhaXJzID0gQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBwYWlyc1tpXSA9IFtrZXlzW2ldLCBvYmpba2V5c1tpXV1dO1xuICAgIH1cbiAgICByZXR1cm4gcGFpcnM7XG4gIH07XG5cbiAgLy8gSW52ZXJ0IHRoZSBrZXlzIGFuZCB2YWx1ZXMgb2YgYW4gb2JqZWN0LiBUaGUgdmFsdWVzIG11c3QgYmUgc2VyaWFsaXphYmxlLlxuICBfLmludmVydCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRbb2JqW2tleXNbaV1dXSA9IGtleXNbaV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgc29ydGVkIGxpc3Qgb2YgdGhlIGZ1bmN0aW9uIG5hbWVzIGF2YWlsYWJsZSBvbiB0aGUgb2JqZWN0LlxuICAvLyBBbGlhc2VkIGFzIGBtZXRob2RzYFxuICBfLmZ1bmN0aW9ucyA9IF8ubWV0aG9kcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBuYW1lcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24ob2JqW2tleV0pKSBuYW1lcy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiBuYW1lcy5zb3J0KCk7XG4gIH07XG5cbiAgLy8gRXh0ZW5kIGEgZ2l2ZW4gb2JqZWN0IHdpdGggYWxsIHRoZSBwcm9wZXJ0aWVzIGluIHBhc3NlZC1pbiBvYmplY3QocykuXG4gIF8uZXh0ZW5kID0gY3JlYXRlQXNzaWduZXIoXy5hbGxLZXlzKTtcblxuICAvLyBBc3NpZ25zIGEgZ2l2ZW4gb2JqZWN0IHdpdGggYWxsIHRoZSBvd24gcHJvcGVydGllcyBpbiB0aGUgcGFzc2VkLWluIG9iamVjdChzKVxuICAvLyAoaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvT2JqZWN0L2Fzc2lnbilcbiAgXy5leHRlbmRPd24gPSBfLmFzc2lnbiA9IGNyZWF0ZUFzc2lnbmVyKF8ua2V5cyk7XG5cbiAgLy8gUmV0dXJucyB0aGUgZmlyc3Qga2V5IG9uIGFuIG9iamVjdCB0aGF0IHBhc3NlcyBhIHByZWRpY2F0ZSB0ZXN0XG4gIF8uZmluZEtleSA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcHJlZGljYXRlID0gY2IocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopLCBrZXk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICBpZiAocHJlZGljYXRlKG9ialtrZXldLCBrZXksIG9iaikpIHJldHVybiBrZXk7XG4gICAgfVxuICB9O1xuXG4gIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCBvbmx5IGNvbnRhaW5pbmcgdGhlIHdoaXRlbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ucGljayA9IGZ1bmN0aW9uKG9iamVjdCwgb2l0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9LCBvYmogPSBvYmplY3QsIGl0ZXJhdGVlLCBrZXlzO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKG9pdGVyYXRlZSkpIHtcbiAgICAgIGtleXMgPSBfLmFsbEtleXMob2JqKTtcbiAgICAgIGl0ZXJhdGVlID0gb3B0aW1pemVDYihvaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXlzID0gZmxhdHRlbihhcmd1bWVudHMsIGZhbHNlLCBmYWxzZSwgMSk7XG4gICAgICBpdGVyYXRlZSA9IGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iaikgeyByZXR1cm4ga2V5IGluIG9iajsgfTtcbiAgICAgIG9iaiA9IE9iamVjdChvYmopO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICB2YXIgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgIGlmIChpdGVyYXRlZSh2YWx1ZSwga2V5LCBvYmopKSByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgd2l0aG91dCB0aGUgYmxhY2tsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5vbWl0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGlmIChfLmlzRnVuY3Rpb24oaXRlcmF0ZWUpKSB7XG4gICAgICBpdGVyYXRlZSA9IF8ubmVnYXRlKGl0ZXJhdGVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBfLm1hcChmbGF0dGVuKGFyZ3VtZW50cywgZmFsc2UsIGZhbHNlLCAxKSwgU3RyaW5nKTtcbiAgICAgIGl0ZXJhdGVlID0gZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICByZXR1cm4gIV8uY29udGFpbnMoa2V5cywga2V5KTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBfLnBpY2sob2JqLCBpdGVyYXRlZSwgY29udGV4dCk7XG4gIH07XG5cbiAgLy8gRmlsbCBpbiBhIGdpdmVuIG9iamVjdCB3aXRoIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgXy5kZWZhdWx0cyA9IGNyZWF0ZUFzc2lnbmVyKF8uYWxsS2V5cywgdHJ1ZSk7XG5cbiAgLy8gQ3JlYXRlcyBhbiBvYmplY3QgdGhhdCBpbmhlcml0cyBmcm9tIHRoZSBnaXZlbiBwcm90b3R5cGUgb2JqZWN0LlxuICAvLyBJZiBhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIHByb3ZpZGVkIHRoZW4gdGhleSB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICAvLyBjcmVhdGVkIG9iamVjdC5cbiAgXy5jcmVhdGUgPSBmdW5jdGlvbihwcm90b3R5cGUsIHByb3BzKSB7XG4gICAgdmFyIHJlc3VsdCA9IGJhc2VDcmVhdGUocHJvdG90eXBlKTtcbiAgICBpZiAocHJvcHMpIF8uZXh0ZW5kT3duKHJlc3VsdCwgcHJvcHMpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gQ3JlYXRlIGEgKHNoYWxsb3ctY2xvbmVkKSBkdXBsaWNhdGUgb2YgYW4gb2JqZWN0LlxuICBfLmNsb25lID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gICAgcmV0dXJuIF8uaXNBcnJheShvYmopID8gb2JqLnNsaWNlKCkgOiBfLmV4dGVuZCh7fSwgb2JqKTtcbiAgfTtcblxuICAvLyBJbnZva2VzIGludGVyY2VwdG9yIHdpdGggdGhlIG9iaiwgYW5kIHRoZW4gcmV0dXJucyBvYmouXG4gIC8vIFRoZSBwcmltYXJ5IHB1cnBvc2Ugb2YgdGhpcyBtZXRob2QgaXMgdG8gXCJ0YXAgaW50b1wiIGEgbWV0aG9kIGNoYWluLCBpblxuICAvLyBvcmRlciB0byBwZXJmb3JtIG9wZXJhdGlvbnMgb24gaW50ZXJtZWRpYXRlIHJlc3VsdHMgd2l0aGluIHRoZSBjaGFpbi5cbiAgXy50YXAgPSBmdW5jdGlvbihvYmosIGludGVyY2VwdG9yKSB7XG4gICAgaW50ZXJjZXB0b3Iob2JqKTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybnMgd2hldGhlciBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gc2V0IG9mIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLmlzTWF0Y2ggPSBmdW5jdGlvbihvYmplY3QsIGF0dHJzKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMoYXR0cnMpLCBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiAhbGVuZ3RoO1xuICAgIHZhciBvYmogPSBPYmplY3Qob2JqZWN0KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgIGlmIChhdHRyc1trZXldICE9PSBvYmpba2V5XSB8fCAhKGtleSBpbiBvYmopKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG5cbiAgLy8gSW50ZXJuYWwgcmVjdXJzaXZlIGNvbXBhcmlzb24gZnVuY3Rpb24gZm9yIGBpc0VxdWFsYC5cbiAgdmFyIGVxID0gZnVuY3Rpb24oYSwgYiwgYVN0YWNrLCBiU3RhY2spIHtcbiAgICAvLyBJZGVudGljYWwgb2JqZWN0cyBhcmUgZXF1YWwuIGAwID09PSAtMGAsIGJ1dCB0aGV5IGFyZW4ndCBpZGVudGljYWwuXG4gICAgLy8gU2VlIHRoZSBbSGFybW9ueSBgZWdhbGAgcHJvcG9zYWxdKGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWhhcm1vbnk6ZWdhbCkuXG4gICAgaWYgKGEgPT09IGIpIHJldHVybiBhICE9PSAwIHx8IDEgLyBhID09PSAxIC8gYjtcbiAgICAvLyBBIHN0cmljdCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGBudWxsID09IHVuZGVmaW5lZGAuXG4gICAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHJldHVybiBhID09PSBiO1xuICAgIC8vIFVud3JhcCBhbnkgd3JhcHBlZCBvYmplY3RzLlxuICAgIGlmIChhIGluc3RhbmNlb2YgXykgYSA9IGEuX3dyYXBwZWQ7XG4gICAgaWYgKGIgaW5zdGFuY2VvZiBfKSBiID0gYi5fd3JhcHBlZDtcbiAgICAvLyBDb21wYXJlIGBbW0NsYXNzXV1gIG5hbWVzLlxuICAgIHZhciBjbGFzc05hbWUgPSB0b1N0cmluZy5jYWxsKGEpO1xuICAgIGlmIChjbGFzc05hbWUgIT09IHRvU3RyaW5nLmNhbGwoYikpIHJldHVybiBmYWxzZTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgLy8gU3RyaW5ncywgbnVtYmVycywgcmVndWxhciBleHByZXNzaW9ucywgZGF0ZXMsIGFuZCBib29sZWFucyBhcmUgY29tcGFyZWQgYnkgdmFsdWUuXG4gICAgICBjYXNlICdbb2JqZWN0IFJlZ0V4cF0nOlxuICAgICAgLy8gUmVnRXhwcyBhcmUgY29lcmNlZCB0byBzdHJpbmdzIGZvciBjb21wYXJpc29uIChOb3RlOiAnJyArIC9hL2kgPT09ICcvYS9pJylcbiAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgIC8vIFByaW1pdGl2ZXMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgb2JqZWN0IHdyYXBwZXJzIGFyZSBlcXVpdmFsZW50OyB0aHVzLCBgXCI1XCJgIGlzXG4gICAgICAgIC8vIGVxdWl2YWxlbnQgdG8gYG5ldyBTdHJpbmcoXCI1XCIpYC5cbiAgICAgICAgcmV0dXJuICcnICsgYSA9PT0gJycgKyBiO1xuICAgICAgY2FzZSAnW29iamVjdCBOdW1iZXJdJzpcbiAgICAgICAgLy8gYE5hTmBzIGFyZSBlcXVpdmFsZW50LCBidXQgbm9uLXJlZmxleGl2ZS5cbiAgICAgICAgLy8gT2JqZWN0KE5hTikgaXMgZXF1aXZhbGVudCB0byBOYU5cbiAgICAgICAgaWYgKCthICE9PSArYSkgcmV0dXJuICtiICE9PSArYjtcbiAgICAgICAgLy8gQW4gYGVnYWxgIGNvbXBhcmlzb24gaXMgcGVyZm9ybWVkIGZvciBvdGhlciBudW1lcmljIHZhbHVlcy5cbiAgICAgICAgcmV0dXJuICthID09PSAwID8gMSAvICthID09PSAxIC8gYiA6ICthID09PSArYjtcbiAgICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOlxuICAgICAgY2FzZSAnW29iamVjdCBCb29sZWFuXSc6XG4gICAgICAgIC8vIENvZXJjZSBkYXRlcyBhbmQgYm9vbGVhbnMgdG8gbnVtZXJpYyBwcmltaXRpdmUgdmFsdWVzLiBEYXRlcyBhcmUgY29tcGFyZWQgYnkgdGhlaXJcbiAgICAgICAgLy8gbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zLiBOb3RlIHRoYXQgaW52YWxpZCBkYXRlcyB3aXRoIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9uc1xuICAgICAgICAvLyBvZiBgTmFOYCBhcmUgbm90IGVxdWl2YWxlbnQuXG4gICAgICAgIHJldHVybiArYSA9PT0gK2I7XG4gICAgfVxuXG4gICAgdmFyIGFyZUFycmF5cyA9IGNsYXNzTmFtZSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICBpZiAoIWFyZUFycmF5cykge1xuICAgICAgaWYgKHR5cGVvZiBhICE9ICdvYmplY3QnIHx8IHR5cGVvZiBiICE9ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIC8vIE9iamVjdHMgd2l0aCBkaWZmZXJlbnQgY29uc3RydWN0b3JzIGFyZSBub3QgZXF1aXZhbGVudCwgYnV0IGBPYmplY3RgcyBvciBgQXJyYXlgc1xuICAgICAgLy8gZnJvbSBkaWZmZXJlbnQgZnJhbWVzIGFyZS5cbiAgICAgIHZhciBhQ3RvciA9IGEuY29uc3RydWN0b3IsIGJDdG9yID0gYi5jb25zdHJ1Y3RvcjtcbiAgICAgIGlmIChhQ3RvciAhPT0gYkN0b3IgJiYgIShfLmlzRnVuY3Rpb24oYUN0b3IpICYmIGFDdG9yIGluc3RhbmNlb2YgYUN0b3IgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmlzRnVuY3Rpb24oYkN0b3IpICYmIGJDdG9yIGluc3RhbmNlb2YgYkN0b3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICYmICgnY29uc3RydWN0b3InIGluIGEgJiYgJ2NvbnN0cnVjdG9yJyBpbiBiKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEFzc3VtZSBlcXVhbGl0eSBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoZSBhbGdvcml0aG0gZm9yIGRldGVjdGluZyBjeWNsaWNcbiAgICAvLyBzdHJ1Y3R1cmVzIGlzIGFkYXB0ZWQgZnJvbSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLCBhYnN0cmFjdCBvcGVyYXRpb24gYEpPYC5cblxuICAgIC8vIEluaXRpYWxpemluZyBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICAvLyBJdCdzIGRvbmUgaGVyZSBzaW5jZSB3ZSBvbmx5IG5lZWQgdGhlbSBmb3Igb2JqZWN0cyBhbmQgYXJyYXlzIGNvbXBhcmlzb24uXG4gICAgYVN0YWNrID0gYVN0YWNrIHx8IFtdO1xuICAgIGJTdGFjayA9IGJTdGFjayB8fCBbXTtcbiAgICB2YXIgbGVuZ3RoID0gYVN0YWNrLmxlbmd0aDtcbiAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgIC8vIExpbmVhciBzZWFyY2guIFBlcmZvcm1hbmNlIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZlxuICAgICAgLy8gdW5pcXVlIG5lc3RlZCBzdHJ1Y3R1cmVzLlxuICAgICAgaWYgKGFTdGFja1tsZW5ndGhdID09PSBhKSByZXR1cm4gYlN0YWNrW2xlbmd0aF0gPT09IGI7XG4gICAgfVxuXG4gICAgLy8gQWRkIHRoZSBmaXJzdCBvYmplY3QgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wdXNoKGEpO1xuICAgIGJTdGFjay5wdXNoKGIpO1xuXG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgaWYgKGFyZUFycmF5cykge1xuICAgICAgLy8gQ29tcGFyZSBhcnJheSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkuXG4gICAgICBsZW5ndGggPSBhLmxlbmd0aDtcbiAgICAgIGlmIChsZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIGlmICghZXEoYVtsZW5ndGhdLCBiW2xlbmd0aF0sIGFTdGFjaywgYlN0YWNrKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBEZWVwIGNvbXBhcmUgb2JqZWN0cy5cbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKGEpLCBrZXk7XG4gICAgICBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICAgIC8vIEVuc3VyZSB0aGF0IGJvdGggb2JqZWN0cyBjb250YWluIHRoZSBzYW1lIG51bWJlciBvZiBwcm9wZXJ0aWVzIGJlZm9yZSBjb21wYXJpbmcgZGVlcCBlcXVhbGl0eS5cbiAgICAgIGlmIChfLmtleXMoYikubGVuZ3RoICE9PSBsZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgZWFjaCBtZW1iZXJcbiAgICAgICAga2V5ID0ga2V5c1tsZW5ndGhdO1xuICAgICAgICBpZiAoIShfLmhhcyhiLCBrZXkpICYmIGVxKGFba2V5XSwgYltrZXldLCBhU3RhY2ssIGJTdGFjaykpKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlbW92ZSB0aGUgZmlyc3Qgb2JqZWN0IGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wb3AoKTtcbiAgICBiU3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gUGVyZm9ybSBhIGRlZXAgY29tcGFyaXNvbiB0byBjaGVjayBpZiB0d28gb2JqZWN0cyBhcmUgZXF1YWwuXG4gIF8uaXNFcXVhbCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gZXEoYSwgYik7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiBhcnJheSwgc3RyaW5nLCBvciBvYmplY3QgZW1wdHk/XG4gIC8vIEFuIFwiZW1wdHlcIiBvYmplY3QgaGFzIG5vIGVudW1lcmFibGUgb3duLXByb3BlcnRpZXMuXG4gIF8uaXNFbXB0eSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGlzQXJyYXlMaWtlKG9iaikgJiYgKF8uaXNBcnJheShvYmopIHx8IF8uaXNTdHJpbmcob2JqKSB8fCBfLmlzQXJndW1lbnRzKG9iaikpKSByZXR1cm4gb2JqLmxlbmd0aCA9PT0gMDtcbiAgICByZXR1cm4gXy5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBET00gZWxlbWVudD9cbiAgXy5pc0VsZW1lbnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gISEob2JqICYmIG9iai5ub2RlVHlwZSA9PT0gMSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhbiBhcnJheT9cbiAgLy8gRGVsZWdhdGVzIHRvIEVDTUE1J3MgbmF0aXZlIEFycmF5LmlzQXJyYXlcbiAgXy5pc0FycmF5ID0gbmF0aXZlSXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgYW4gb2JqZWN0P1xuICBfLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHR5cGUgPSB0eXBlb2Ygb2JqO1xuICAgIHJldHVybiB0eXBlID09PSAnZnVuY3Rpb24nIHx8IHR5cGUgPT09ICdvYmplY3QnICYmICEhb2JqO1xuICB9O1xuXG4gIC8vIEFkZCBzb21lIGlzVHlwZSBtZXRob2RzOiBpc0FyZ3VtZW50cywgaXNGdW5jdGlvbiwgaXNTdHJpbmcsIGlzTnVtYmVyLCBpc0RhdGUsIGlzUmVnRXhwLCBpc0Vycm9yLlxuICBfLmVhY2goWydBcmd1bWVudHMnLCAnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCcsICdFcnJvciddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgX1snaXMnICsgbmFtZV0gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0ICcgKyBuYW1lICsgJ10nO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIERlZmluZSBhIGZhbGxiYWNrIHZlcnNpb24gb2YgdGhlIG1ldGhvZCBpbiBicm93c2VycyAoYWhlbSwgSUUgPCA5KSwgd2hlcmVcbiAgLy8gdGhlcmUgaXNuJ3QgYW55IGluc3BlY3RhYmxlIFwiQXJndW1lbnRzXCIgdHlwZS5cbiAgaWYgKCFfLmlzQXJndW1lbnRzKGFyZ3VtZW50cykpIHtcbiAgICBfLmlzQXJndW1lbnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnY2FsbGVlJyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS4gV29yayBhcm91bmQgc29tZSB0eXBlb2YgYnVncyBpbiBvbGQgdjgsXG4gIC8vIElFIDExICgjMTYyMSksIGFuZCBpbiBTYWZhcmkgOCAoIzE5MjkpLlxuICBpZiAodHlwZW9mIC8uLyAhPSAnZnVuY3Rpb24nICYmIHR5cGVvZiBJbnQ4QXJyYXkgIT0gJ29iamVjdCcpIHtcbiAgICBfLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09ICdmdW5jdGlvbicgfHwgZmFsc2U7XG4gICAgfTtcbiAgfVxuXG4gIC8vIElzIGEgZ2l2ZW4gb2JqZWN0IGEgZmluaXRlIG51bWJlcj9cbiAgXy5pc0Zpbml0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xuICB9O1xuXG4gIC8vIElzIHRoZSBnaXZlbiB2YWx1ZSBgTmFOYD8gKE5hTiBpcyB0aGUgb25seSBudW1iZXIgd2hpY2ggZG9lcyBub3QgZXF1YWwgaXRzZWxmKS5cbiAgXy5pc05hTiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9PSArb2JqO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBib29sZWFuP1xuICBfLmlzQm9vbGVhbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHRydWUgfHwgb2JqID09PSBmYWxzZSB8fCB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEJvb2xlYW5dJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGVxdWFsIHRvIG51bGw/XG4gIF8uaXNOdWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gbnVsbDtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIHVuZGVmaW5lZD9cbiAgXy5pc1VuZGVmaW5lZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHZvaWQgMDtcbiAgfTtcblxuICAvLyBTaG9ydGN1dCBmdW5jdGlvbiBmb3IgY2hlY2tpbmcgaWYgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHByb3BlcnR5IGRpcmVjdGx5XG4gIC8vIG9uIGl0c2VsZiAoaW4gb3RoZXIgd29yZHMsIG5vdCBvbiBhIHByb3RvdHlwZSkuXG4gIF8uaGFzID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gb2JqICE9IG51bGwgJiYgaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gIH07XG5cbiAgLy8gVXRpbGl0eSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSdW4gVW5kZXJzY29yZS5qcyBpbiAqbm9Db25mbGljdCogbW9kZSwgcmV0dXJuaW5nIHRoZSBgX2AgdmFyaWFibGUgdG8gaXRzXG4gIC8vIHByZXZpb3VzIG93bmVyLiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcm9vdC5fID0gcHJldmlvdXNVbmRlcnNjb3JlO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vIEtlZXAgdGhlIGlkZW50aXR5IGZ1bmN0aW9uIGFyb3VuZCBmb3IgZGVmYXVsdCBpdGVyYXRlZXMuXG4gIF8uaWRlbnRpdHkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICAvLyBQcmVkaWNhdGUtZ2VuZXJhdGluZyBmdW5jdGlvbnMuIE9mdGVuIHVzZWZ1bCBvdXRzaWRlIG9mIFVuZGVyc2NvcmUuXG4gIF8uY29uc3RhbnQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuICB9O1xuXG4gIF8ubm9vcCA9IGZ1bmN0aW9uKCl7fTtcblxuICBfLnByb3BlcnR5ID0gcHJvcGVydHk7XG5cbiAgLy8gR2VuZXJhdGVzIGEgZnVuY3Rpb24gZm9yIGEgZ2l2ZW4gb2JqZWN0IHRoYXQgcmV0dXJucyBhIGdpdmVuIHByb3BlcnR5LlxuICBfLnByb3BlcnR5T2YgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09IG51bGwgPyBmdW5jdGlvbigpe30gOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBvYmpba2V5XTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBwcmVkaWNhdGUgZm9yIGNoZWNraW5nIHdoZXRoZXIgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHNldCBvZlxuICAvLyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5tYXRjaGVyID0gXy5tYXRjaGVzID0gZnVuY3Rpb24oYXR0cnMpIHtcbiAgICBhdHRycyA9IF8uZXh0ZW5kT3duKHt9LCBhdHRycyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIF8uaXNNYXRjaChvYmosIGF0dHJzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJ1biBhIGZ1bmN0aW9uICoqbioqIHRpbWVzLlxuICBfLnRpbWVzID0gZnVuY3Rpb24obiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICB2YXIgYWNjdW0gPSBBcnJheShNYXRoLm1heCgwLCBuKSk7XG4gICAgaXRlcmF0ZWUgPSBvcHRpbWl6ZUNiKGl0ZXJhdGVlLCBjb250ZXh0LCAxKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRlZShpKTtcbiAgICByZXR1cm4gYWNjdW07XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiBtaW4gYW5kIG1heCAoaW5jbHVzaXZlKS5cbiAgXy5yYW5kb20gPSBmdW5jdGlvbihtaW4sIG1heCkge1xuICAgIGlmIChtYXggPT0gbnVsbCkge1xuICAgICAgbWF4ID0gbWluO1xuICAgICAgbWluID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIG1pbiArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSk7XG4gIH07XG5cbiAgLy8gQSAocG9zc2libHkgZmFzdGVyKSB3YXkgdG8gZ2V0IHRoZSBjdXJyZW50IHRpbWVzdGFtcCBhcyBhbiBpbnRlZ2VyLlxuICBfLm5vdyA9IERhdGUubm93IHx8IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgfTtcblxuICAgLy8gTGlzdCBvZiBIVE1MIGVudGl0aWVzIGZvciBlc2NhcGluZy5cbiAgdmFyIGVzY2FwZU1hcCA9IHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmI3gyNzsnLFxuICAgICdgJzogJyYjeDYwOydcbiAgfTtcbiAgdmFyIHVuZXNjYXBlTWFwID0gXy5pbnZlcnQoZXNjYXBlTWFwKTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIHZhciBjcmVhdGVFc2NhcGVyID0gZnVuY3Rpb24obWFwKSB7XG4gICAgdmFyIGVzY2FwZXIgPSBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgcmV0dXJuIG1hcFttYXRjaF07XG4gICAgfTtcbiAgICAvLyBSZWdleGVzIGZvciBpZGVudGlmeWluZyBhIGtleSB0aGF0IG5lZWRzIHRvIGJlIGVzY2FwZWRcbiAgICB2YXIgc291cmNlID0gJyg/OicgKyBfLmtleXMobWFwKS5qb2luKCd8JykgKyAnKSc7XG4gICAgdmFyIHRlc3RSZWdleHAgPSBSZWdFeHAoc291cmNlKTtcbiAgICB2YXIgcmVwbGFjZVJlZ2V4cCA9IFJlZ0V4cChzb3VyY2UsICdnJyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgc3RyaW5nID0gc3RyaW5nID09IG51bGwgPyAnJyA6ICcnICsgc3RyaW5nO1xuICAgICAgcmV0dXJuIHRlc3RSZWdleHAudGVzdChzdHJpbmcpID8gc3RyaW5nLnJlcGxhY2UocmVwbGFjZVJlZ2V4cCwgZXNjYXBlcikgOiBzdHJpbmc7XG4gICAgfTtcbiAgfTtcbiAgXy5lc2NhcGUgPSBjcmVhdGVFc2NhcGVyKGVzY2FwZU1hcCk7XG4gIF8udW5lc2NhcGUgPSBjcmVhdGVFc2NhcGVyKHVuZXNjYXBlTWFwKTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIGBwcm9wZXJ0eWAgaXMgYSBmdW5jdGlvbiB0aGVuIGludm9rZSBpdCB3aXRoIHRoZVxuICAvLyBgb2JqZWN0YCBhcyBjb250ZXh0OyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5LCBmYWxsYmFjaykge1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdCA9PSBudWxsID8gdm9pZCAwIDogb2JqZWN0W3Byb3BlcnR5XTtcbiAgICBpZiAodmFsdWUgPT09IHZvaWQgMCkge1xuICAgICAgdmFsdWUgPSBmYWxsYmFjaztcbiAgICB9XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZS5jYWxsKG9iamVjdCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBpbnRlZ2VyIGlkICh1bmlxdWUgd2l0aGluIHRoZSBlbnRpcmUgY2xpZW50IHNlc3Npb24pLlxuICAvLyBVc2VmdWwgZm9yIHRlbXBvcmFyeSBET00gaWRzLlxuICB2YXIgaWRDb3VudGVyID0gMDtcbiAgXy51bmlxdWVJZCA9IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gIH07XG5cbiAgLy8gQnkgZGVmYXVsdCwgVW5kZXJzY29yZSB1c2VzIEVSQi1zdHlsZSB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLCBjaGFuZ2UgdGhlXG4gIC8vIGZvbGxvd2luZyB0ZW1wbGF0ZSBzZXR0aW5ncyB0byB1c2UgYWx0ZXJuYXRpdmUgZGVsaW1pdGVycy5cbiAgXy50ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbiAgfTtcblxuICAvLyBXaGVuIGN1c3RvbWl6aW5nIGB0ZW1wbGF0ZVNldHRpbmdzYCwgaWYgeW91IGRvbid0IHdhbnQgdG8gZGVmaW5lIGFuXG4gIC8vIGludGVycG9sYXRpb24sIGV2YWx1YXRpb24gb3IgZXNjYXBpbmcgcmVnZXgsIHdlIG5lZWQgb25lIHRoYXQgaXNcbiAgLy8gZ3VhcmFudGVlZCBub3QgdG8gbWF0Y2guXG4gIHZhciBub01hdGNoID0gLyguKV4vO1xuXG4gIC8vIENlcnRhaW4gY2hhcmFjdGVycyBuZWVkIHRvIGJlIGVzY2FwZWQgc28gdGhhdCB0aGV5IGNhbiBiZSBwdXQgaW50byBhXG4gIC8vIHN0cmluZyBsaXRlcmFsLlxuICB2YXIgZXNjYXBlcyA9IHtcbiAgICBcIidcIjogICAgICBcIidcIixcbiAgICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICAgJ1xccic6ICAgICAncicsXG4gICAgJ1xcbic6ICAgICAnbicsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xuICB9O1xuXG4gIHZhciBlc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdTIwMjh8XFx1MjAyOS9nO1xuXG4gIHZhciBlc2NhcGVDaGFyID0gZnVuY3Rpb24obWF0Y2gpIHtcbiAgICByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07XG4gIH07XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgLy8gTkI6IGBvbGRTZXR0aW5nc2Agb25seSBleGlzdHMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuICBfLnRlbXBsYXRlID0gZnVuY3Rpb24odGV4dCwgc2V0dGluZ3MsIG9sZFNldHRpbmdzKSB7XG4gICAgaWYgKCFzZXR0aW5ncyAmJiBvbGRTZXR0aW5ncykgc2V0dGluZ3MgPSBvbGRTZXR0aW5ncztcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBSZWdFeHAoW1xuICAgICAgKHNldHRpbmdzLmVzY2FwZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmV2YWx1YXRlIHx8IG5vTWF0Y2gpLnNvdXJjZVxuICAgIF0uam9pbignfCcpICsgJ3wkJywgJ2cnKTtcblxuICAgIC8vIENvbXBpbGUgdGhlIHRlbXBsYXRlIHNvdXJjZSwgZXNjYXBpbmcgc3RyaW5nIGxpdGVyYWxzIGFwcHJvcHJpYXRlbHkuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcbiAgICAgIHNvdXJjZSArPSB0ZXh0LnNsaWNlKGluZGV4LCBvZmZzZXQpLnJlcGxhY2UoZXNjYXBlciwgZXNjYXBlQ2hhcik7XG4gICAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcblxuICAgICAgaWYgKGVzY2FwZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGVzY2FwZSArIFwiKSk9PW51bGw/Jyc6Xy5lc2NhcGUoX190KSkrXFxuJ1wiO1xuICAgICAgfSBlbHNlIGlmIChpbnRlcnBvbGF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGludGVycG9sYXRlICsgXCIpKT09bnVsbD8nJzpfX3QpK1xcbidcIjtcbiAgICAgIH0gZWxzZSBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cblxuICAgICAgLy8gQWRvYmUgVk1zIG5lZWQgdGhlIG1hdGNoIHJldHVybmVkIHRvIHByb2R1Y2UgdGhlIGNvcnJlY3Qgb2ZmZXN0LlxuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgJ3JldHVybiBfX3A7XFxuJztcblxuICAgIHRyeSB7XG4gICAgICB2YXIgcmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCAnXycsIHNvdXJjZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIHZhciB0ZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiByZW5kZXIuY2FsbCh0aGlzLCBkYXRhLCBfKTtcbiAgICB9O1xuXG4gICAgLy8gUHJvdmlkZSB0aGUgY29tcGlsZWQgc291cmNlIGFzIGEgY29udmVuaWVuY2UgZm9yIHByZWNvbXBpbGF0aW9uLlxuICAgIHZhciBhcmd1bWVudCA9IHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonO1xuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgYXJndW1lbnQgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbi4gU3RhcnQgY2hhaW5pbmcgYSB3cmFwcGVkIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLmNoYWluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGluc3RhbmNlID0gXyhvYmopO1xuICAgIGluc3RhbmNlLl9jaGFpbiA9IHRydWU7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9O1xuXG4gIC8vIE9PUFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgLy8gSWYgVW5kZXJzY29yZSBpcyBjYWxsZWQgYXMgYSBmdW5jdGlvbiwgaXQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRoYXRcbiAgLy8gY2FuIGJlIHVzZWQgT08tc3R5bGUuIFRoaXMgd3JhcHBlciBob2xkcyBhbHRlcmVkIHZlcnNpb25zIG9mIGFsbCB0aGVcbiAgLy8gdW5kZXJzY29yZSBmdW5jdGlvbnMuIFdyYXBwZWQgb2JqZWN0cyBtYXkgYmUgY2hhaW5lZC5cblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY29udGludWUgY2hhaW5pbmcgaW50ZXJtZWRpYXRlIHJlc3VsdHMuXG4gIHZhciByZXN1bHQgPSBmdW5jdGlvbihpbnN0YW5jZSwgb2JqKSB7XG4gICAgcmV0dXJuIGluc3RhbmNlLl9jaGFpbiA/IF8ob2JqKS5jaGFpbigpIDogb2JqO1xuICB9O1xuXG4gIC8vIEFkZCB5b3VyIG93biBjdXN0b20gZnVuY3Rpb25zIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5taXhpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIF8uZWFjaChfLmZ1bmN0aW9ucyhvYmopLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICB2YXIgZnVuYyA9IF9bbmFtZV0gPSBvYmpbbmFtZV07XG4gICAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IFt0aGlzLl93cmFwcGVkXTtcbiAgICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0KHRoaXMsIGZ1bmMuYXBwbHkoXywgYXJncykpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBBZGQgYWxsIG9mIHRoZSBVbmRlcnNjb3JlIGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlciBvYmplY3QuXG4gIF8ubWl4aW4oXyk7XG5cbiAgLy8gQWRkIGFsbCBtdXRhdG9yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgXy5lYWNoKFsncG9wJywgJ3B1c2gnLCAncmV2ZXJzZScsICdzaGlmdCcsICdzb3J0JywgJ3NwbGljZScsICd1bnNoaWZ0J10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG9iaiA9IHRoaXMuX3dyYXBwZWQ7XG4gICAgICBtZXRob2QuYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKChuYW1lID09PSAnc2hpZnQnIHx8IG5hbWUgPT09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdCh0aGlzLCBvYmopO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEFkZCBhbGwgYWNjZXNzb3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBfLmVhY2goWydjb25jYXQnLCAnam9pbicsICdzbGljZSddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZXN1bHQodGhpcywgbWV0aG9kLmFwcGx5KHRoaXMuX3dyYXBwZWQsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEV4dHJhY3RzIHRoZSByZXN1bHQgZnJvbSBhIHdyYXBwZWQgYW5kIGNoYWluZWQgb2JqZWN0LlxuICBfLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl93cmFwcGVkO1xuICB9O1xuXG4gIC8vIFByb3ZpZGUgdW53cmFwcGluZyBwcm94eSBmb3Igc29tZSBtZXRob2RzIHVzZWQgaW4gZW5naW5lIG9wZXJhdGlvbnNcbiAgLy8gc3VjaCBhcyBhcml0aG1ldGljIGFuZCBKU09OIHN0cmluZ2lmaWNhdGlvbi5cbiAgXy5wcm90b3R5cGUudmFsdWVPZiA9IF8ucHJvdG90eXBlLnRvSlNPTiA9IF8ucHJvdG90eXBlLnZhbHVlO1xuXG4gIF8ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICcnICsgdGhpcy5fd3JhcHBlZDtcbiAgfTtcblxuICAvLyBBTUQgcmVnaXN0cmF0aW9uIGhhcHBlbnMgYXQgdGhlIGVuZCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIEFNRCBsb2FkZXJzXG4gIC8vIHRoYXQgbWF5IG5vdCBlbmZvcmNlIG5leHQtdHVybiBzZW1hbnRpY3Mgb24gbW9kdWxlcy4gRXZlbiB0aG91Z2ggZ2VuZXJhbFxuICAvLyBwcmFjdGljZSBmb3IgQU1EIHJlZ2lzdHJhdGlvbiBpcyB0byBiZSBhbm9ueW1vdXMsIHVuZGVyc2NvcmUgcmVnaXN0ZXJzXG4gIC8vIGFzIGEgbmFtZWQgbW9kdWxlIGJlY2F1c2UsIGxpa2UgalF1ZXJ5LCBpdCBpcyBhIGJhc2UgbGlicmFyeSB0aGF0IGlzXG4gIC8vIHBvcHVsYXIgZW5vdWdoIHRvIGJlIGJ1bmRsZWQgaW4gYSB0aGlyZCBwYXJ0eSBsaWIsIGJ1dCBub3QgYmUgcGFydCBvZlxuICAvLyBhbiBBTUQgbG9hZCByZXF1ZXN0LiBUaG9zZSBjYXNlcyBjb3VsZCBnZW5lcmF0ZSBhbiBlcnJvciB3aGVuIGFuXG4gIC8vIGFub255bW91cyBkZWZpbmUoKSBpcyBjYWxsZWQgb3V0c2lkZSBvZiBhIGxvYWRlciByZXF1ZXN0LlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKCd1bmRlcnNjb3JlJywgW10sIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIF87XG4gICAgfSk7XG4gIH1cbn0uY2FsbCh0aGlzKSk7XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCJpbXBvcnQgQ2FydG8gZnJvbSAnY2FydG8nO1xuXG5jb25zdCBTWU1CT0xZWkVSUyA9IHtcbiAgbWFya2VyOiAncG9pbnRzJyxcbiAgcG9seWdvbjogJ3BvbHlnb25zJyxcbiAgbGluZTogJ2xpbmVzJ1xuXHR9O1xuXG5jb25zdCBDQ1NTID0gbmV3IENhcnRvLlJlbmRlcmVySlMoKTtcblxuY29uc3QgdHJhbnNsYXRlU3ltTmFtZSA9IGZ1bmN0aW9uIChzeW1OYW1lKSB7XG4gIHJldHVybiBTWU1CT0xZWkVSU1tzeW1OYW1lXTtcblx0fTtcblxuY29uc3QgZ2V0QXR0cmlidXRlTmFtZSA9IGZ1bmN0aW9uIChzeW0sIGZlYXR1cmUpIHtcbiAgcmV0dXJuIHN5bSArICctJyArIGZlYXR1cmU7XG5cdH07XG5cbmNvbnN0IGFkZEZ1bmN0aW9uID0gZnVuY3Rpb24gKGlubmVyQ29kZSkge1xuICByZXR1cm4gYGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgX3ZhbHVlID0gbnVsbDtcbiAgICAke2lubmVyQ29kZX1cbiAgICByZXR1cm4gX3ZhbHVlO1xuICB9YDtcblx0fTtcblxuY29uc3QgbWFrZVRhbmdyYW1Db25kID0gZnVuY3Rpb24gKGNvbmQpIHtcbiAgcmV0dXJuIGNvbmRcbiAgICAucmVwbGFjZSgvY3R4Lnpvb20vZywgJyR6b29tJylcbiAgICAucmVwbGFjZSgvZGF0YVxcWy9nLCAnZmVhdHVyZVsnKTtcblx0fTtcblxuY29uc3QgZ2V0QXR0cmlidXRlRmVhdHVyZSA9IGZ1bmN0aW9uIChzeW0sIGZlYXR1cmUsIGx5KSB7XG4gIGxldCBhdHRyID0gbHlbZ2V0QXR0cmlidXRlTmFtZShzeW0sIGZlYXR1cmUpXTtcbiAgaWYgKCFhdHRyKSByZXR1cm4gJyc7XG5cbiAgbGV0IGpzID0gYXR0ci5qcyxcbiAgICAgIGZuQm9keSA9ICcnO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwganMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGZuQm9keSArPSBtYWtlVGFuZ3JhbUNvbmQoanNbaV0pO1xuICB9XG5cbiAgcmV0dXJuIGFkZEZ1bmN0aW9uKGZuQm9keSk7XG5cdH07XG5cbmNvbnN0IGdldFN5bWJvbGl6ZXJzID0gZnVuY3Rpb24gKGxheWVyKSB7XG4gIGxldCBkcmF3ID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGF5ZXIuc3ltYm9saXplcnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCBzeW0gPSBsYXllci5zeW1ib2xpemVyc1tpXTtcblx0XHRcdGRyYXdbdHJhbnNsYXRlU3ltTmFtZShzeW0pXSA9IHtcblx0XHRcdFx0XHRjb2xvcjogZ2V0QXR0cmlidXRlRmVhdHVyZShzeW0sICdmaWxsJywgbGF5ZXIpLFxuXHRcdFx0XHRcdHNpemU6IGdldEF0dHJpYnV0ZUZlYXR1cmUoc3ltLCAnc2l6ZScsIGxheWVyKSxcblx0XHRcdFx0XHR3aWR0aDogZ2V0QXR0cmlidXRlRmVhdHVyZShzeW0sICd3aWR0aCcsIGxheWVyKVxuXHRcdFx0fTtcbiAgfVxuXG4gIHJldHVybiBkcmF3O1xuXHR9O1xuXG5jb25zdCBleHRyYWN0RmVhdHVyZXMgPSBmdW5jdGlvbiAoY2Nzcykge1xuICBsZXQgbGF5ZXJzID0gQ0NTUy5yZW5kZXIoY2NzcykuZ2V0TGF5ZXJzKCksXG4gICAgICBkcmF3cyA9IHt9O1xuXG4gIC8vIE5PVEU6IHRoaXMgaXMgd3JvbmcsIHdlIGhhdmUgdG8gc2VwYXJhdGUgdGhlIGxheWVycy5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXllcnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCBseSA9IGxheWVyc1tpXS5zaGFkZXI7XG5cblx0XHRcdGRyYXdzID0gZ2V0U3ltYm9saXplcnMobHkpO1xuICB9XG5cbiAgcmV0dXJuIGRyYXdzO1xufTtcblxudmFyIEMyWTtcblxuZXhwb3J0IGRlZmF1bHQgQzJZID0ge1xuICBleHRyYWN0RmVhdHVyZXNcbn07XG4iLCJpbXBvcnQgQ0NTUyBmcm9tICcuL2NhcnRvJztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNhcnRvMkRyYXc6IENDU1MuZXh0cmFjdEZlYXR1cmVzLFxuXHR9O1xuIl19
