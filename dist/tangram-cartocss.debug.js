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

var TYPES = {
  polygon: {
    color: 'fill'
  },
  line: {
    color: 'color'
  },
  marker: {
    color: 'color'
  }
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

var stringFunction = function stringFunction(fn, def) {
  if (!fn) return function () {
    return def;
  };

  fn = 'return (' + fn + '());';

  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  return new (Function.prototype.bind.apply(Function, [null].concat(args, [fn])))();
};

var getPropertyName = function getPropertyName(prop, type) {
  return TYPES[prop][type];
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
      color: getAttributeFeature(sym, getPropertyName(sym, 'color'), layer),
      size: getAttributeFeature(sym, 'size', layer),
      width: stringFunction(getAttributeFeature(sym, 'width', layer), '', 'feature', '$zoom')({}, 10) + 'px'
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL2Z1bmN0aW9ucy5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3BhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vcmVuZGVyZXIuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3JlbmRlcmVyX2pzLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90b3JxdWUtcmVmZXJlbmNlLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL2NhbGwuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvY29sb3IuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvY29tbWVudC5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9kZWZpbml0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL2RpbWVuc2lvbi5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9lbGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL2V4cHJlc3Npb24uanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvZmllbGQuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL2ZpbHRlcnNldC5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9mb250c2V0LmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL2ZyYW1lX29mZnNldC5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9pbWFnZWZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9pbnZhbGlkLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL2tleXdvcmQuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvbGF5ZXIuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvbGl0ZXJhbC5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9vcGVyYXRpb24uanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvcXVvdGVkLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL3JlZmVyZW5jZS5qcyIsIm5vZGVfbW9kdWxlcy9jYXJ0by9saWIvY2FydG8vdHJlZS9ydWxlLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL3J1bGVzZXQuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvc2VsZWN0b3IuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvc3R5bGUuanMiLCJub2RlX21vZHVsZXMvY2FydG8vbGliL2NhcnRvL3RyZWUvdXJsLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL3ZhbHVlLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL3ZhcmlhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2NhcnRvL2xpYi9jYXJ0by90cmVlL3pvb20uanMiLCJub2RlX21vZHVsZXMvY2FydG8vcGFja2FnZS5qc29uIiwibm9kZV9tb2R1bGVzL21hcG5pay1yZWZlcmVuY2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91bmRlcnNjb3JlL3VuZGVyc2NvcmUuanMiLCJub2RlX21vZHVsZXMvdXRpbC9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsInNyYy9jYXJ0by5qcyIsInNyYy9tb2R1bGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdldBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbFpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3Q0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDblFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVnREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7QUMxa0JBOzs7Ozs7QUFFQSxJQUFNLGNBQWM7QUFDbEIsVUFBUSxRQURVO0FBRWxCLFdBQVMsVUFGUztBQUdsQixRQUFNO0FBSFksQ0FBcEI7O0FBTUEsSUFBTSxRQUFRO0FBQ1osV0FBUztBQUNQLFdBQU87QUFEQSxHQURHO0FBSVosUUFBTTtBQUNKLFdBQU87QUFESCxHQUpNO0FBT1osVUFBUTtBQUNOLFdBQU87QUFERDtBQVBJLENBQWQ7O0FBWUEsSUFBTSxPQUFPLElBQUksZ0JBQU0sVUFBVixFQUFiOztBQUVBLElBQU0sbUJBQW1CLFNBQW5CLGdCQUFtQixDQUFVLE9BQVYsRUFBbUI7QUFDMUMsU0FBTyxZQUFZLE9BQVosQ0FBUDtBQUNELENBRkQ7O0FBSUEsSUFBTSxtQkFBbUIsU0FBbkIsZ0JBQW1CLENBQVUsR0FBVixFQUFlLE9BQWYsRUFBd0I7QUFDL0MsU0FBTyxNQUFNLEdBQU4sR0FBWSxPQUFuQjtBQUNELENBRkQ7O0FBSUEsSUFBTSxjQUFjLFNBQWQsV0FBYyxDQUFVLFNBQVYsRUFBcUI7QUFDdkMseURBRUksU0FGSjtBQUtELENBTkQ7O0FBUUEsSUFBTSxrQkFBa0IsU0FBbEIsZUFBa0IsQ0FBVSxJQUFWLEVBQWdCO0FBQ3RDLFNBQU8sS0FDSixPQURJLENBQ0ksV0FESixFQUNpQixPQURqQixFQUVKLE9BRkksQ0FFSSxTQUZKLEVBRWUsVUFGZixDQUFQO0FBR0QsQ0FKRDs7QUFNQSxJQUFNLGlCQUFpQixTQUFqQixjQUFpQixDQUFVLEVBQVYsRUFBYyxHQUFkLEVBQTRCO0FBQ2pELE1BQUksQ0FBQyxFQUFMLEVBQVMsT0FBTyxZQUFZO0FBQUMsV0FBTyxHQUFQO0FBQVksR0FBaEM7O0FBRVQsb0JBQWdCLEVBQWhCOztBQUhpRCxvQ0FBTixJQUFNO0FBQU4sUUFBTTtBQUFBOztBQUtqRCw0Q0FBVyxRQUFYLGdCQUF1QixJQUF2QixHQUE2QixFQUE3QjtBQUNELENBTkQ7O0FBUUEsSUFBTSxrQkFBa0IsU0FBbEIsZUFBa0IsQ0FBVSxJQUFWLEVBQWdCLElBQWhCLEVBQXNCO0FBQzVDLFNBQU8sTUFBTSxJQUFOLEVBQVksSUFBWixDQUFQO0FBQ0QsQ0FGRDs7QUFJQSxJQUFNLHNCQUFzQixTQUF0QixtQkFBc0IsQ0FBVSxHQUFWLEVBQWUsT0FBZixFQUF3QixFQUF4QixFQUE0QjtBQUN0RCxNQUFJLE9BQU8sR0FBRyxpQkFBaUIsR0FBakIsRUFBc0IsT0FBdEIsQ0FBSCxDQUFYO0FBQ0EsTUFBSSxDQUFDLElBQUwsRUFBVyxPQUFPLEVBQVA7O0FBRVgsTUFBSSxLQUFLLEtBQUssRUFBZDtBQUFBLE1BQ0ksU0FBUyxFQURiOztBQUdBLE9BQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxHQUFHLE1BQXZCLEVBQStCLEdBQS9CLEVBQW9DO0FBQ25DLGNBQVUsZ0JBQWdCLEdBQUcsQ0FBSCxDQUFoQixDQUFWO0FBQ0E7O0FBRUQsU0FBTyxZQUFZLE1BQVosQ0FBUDtBQUNELENBWkQ7O0FBY0EsSUFBTSxpQkFBaUIsU0FBakIsY0FBaUIsQ0FBVSxLQUFWLEVBQWlCO0FBQ3RDLE1BQUksT0FBTyxFQUFYO0FBQ0EsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLE1BQU0sV0FBTixDQUFrQixNQUF0QyxFQUE4QyxHQUE5QyxFQUFtRDtBQUNsRCxRQUFJLE1BQU0sTUFBTSxXQUFOLENBQWtCLENBQWxCLENBQVY7QUFDQSxTQUFLLGlCQUFpQixHQUFqQixDQUFMLElBQThCO0FBQzVCLGFBQU8sb0JBQW9CLEdBQXBCLEVBQXlCLGdCQUFnQixHQUFoQixFQUFxQixPQUFyQixDQUF6QixFQUF3RCxLQUF4RCxDQURxQjtBQUU1QixZQUFNLG9CQUFvQixHQUFwQixFQUF5QixNQUF6QixFQUFpQyxLQUFqQyxDQUZzQjtBQUc1QixhQUFPLGVBQWUsb0JBQW9CLEdBQXBCLEVBQXlCLE9BQXpCLEVBQWtDLEtBQWxDLENBQWYsRUFBeUQsRUFBekQsRUFBNkQsU0FBN0QsRUFBd0UsT0FBeEUsRUFBaUYsRUFBakYsRUFBcUYsRUFBckYsSUFBMkY7QUFIdEUsS0FBOUI7QUFLQTs7QUFFRCxTQUFPLElBQVA7QUFDRCxDQVpEOztBQWNBLElBQU0sa0JBQWtCLFNBQWxCLGVBQWtCLENBQVUsSUFBVixFQUFnQjtBQUN0QyxNQUFJLFNBQVMsS0FBSyxNQUFMLENBQVksSUFBWixFQUFrQixTQUFsQixFQUFiO0FBQUEsTUFDSSxRQUFRLEVBRFo7O0FBR0E7QUFDQSxPQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksT0FBTyxNQUEzQixFQUFtQyxHQUFuQyxFQUF3QztBQUN2QyxRQUFJLEtBQUssT0FBTyxDQUFQLEVBQVUsTUFBbkI7O0FBRUEsWUFBUSxlQUFlLEVBQWYsQ0FBUjtBQUNBOztBQUVELFNBQU8sS0FBUDtBQUNELENBWkQ7O0FBY0EsSUFBSSxHQUFKOztrQkFFZSxNQUFNO0FBQ25CO0FBRG1CLEM7Ozs7O0FDcEdyQjs7Ozs7O0FBRUEsT0FBTyxPQUFQLEdBQWlCO0FBQ2YsY0FBWSxnQkFBSztBQURGLENBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyB3aGVuIHVzZWQgaW4gbm9kZSwgdGhpcyB3aWxsIGFjdHVhbGx5IGxvYWQgdGhlIHV0aWwgbW9kdWxlIHdlIGRlcGVuZCBvblxuLy8gdmVyc3VzIGxvYWRpbmcgdGhlIGJ1aWx0aW4gdXRpbCBtb2R1bGUgYXMgaGFwcGVucyBvdGhlcndpc2Vcbi8vIHRoaXMgaXMgYSBidWcgaW4gbm9kZSBtb2R1bGUgbG9hZGluZyBhcyBmYXIgYXMgSSBhbSBjb25jZXJuZWRcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcblxudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBzdGFja1N0YXJ0RnVuY3Rpb24ubmFtZTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHV0aWwuaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWU7XG4gIH1cbiAgaWYgKHV0aWwuaXNOdW1iZXIodmFsdWUpICYmICFpc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB1dGlsLmlzUmVnRXhwKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodXRpbC5pc1N0cmluZyhzKSkge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuYWN0dWFsLCByZXBsYWNlciksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmV4cGVjdGVkLCByZXBsYWNlciksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNCdWZmZXIoYWN0dWFsKSAmJiB1dGlsLmlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIGlmIChhY3R1YWwubGVuZ3RoICE9IGV4cGVjdGVkLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3R1YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhY3R1YWxbaV0gIT09IGV4cGVjdGVkW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCF1dGlsLmlzT2JqZWN0KGFjdHVhbCkgJiYgIXV0aWwuaXNPYmplY3QoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiKSB7XG4gIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGEpIHx8IHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy8gaWYgb25lIGlzIGEgcHJpbWl0aXZlLCB0aGUgb3RoZXIgbXVzdCBiZSBzYW1lXG4gIGlmICh1dGlsLmlzUHJpbWl0aXZlKGEpIHx8IHV0aWwuaXNQcmltaXRpdmUoYikpIHtcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgfVxuICB2YXIgYUlzQXJncyA9IGlzQXJndW1lbnRzKGEpLFxuICAgICAgYklzQXJncyA9IGlzQXJndW1lbnRzKGIpO1xuICBpZiAoKGFJc0FyZ3MgJiYgIWJJc0FyZ3MpIHx8ICghYUlzQXJncyAmJiBiSXNBcmdzKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhSXNBcmdzKSB7XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiKTtcbiAgfVxuICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAga2IgPSBvYmplY3RLZXlzKGIpLFxuICAgICAga2V5LCBpO1xuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodXRpbC5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYWN0dWFsID0gZTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW2ZhbHNlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikge3Rocm93IGVycjt9fTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCIiLCIoZnVuY3Rpb24gKHRyZWUpIHtcblxudHJlZS5mdW5jdGlvbnMgPSB7XG4gICAgcmdiOiBmdW5jdGlvbiAociwgZywgYikge1xuICAgICAgICByZXR1cm4gdGhpcy5yZ2JhKHIsIGcsIGIsIDEuMCk7XG4gICAgfSxcbiAgICByZ2JhOiBmdW5jdGlvbiAociwgZywgYiwgYSkge1xuICAgICAgICB2YXIgcmdiID0gW3IsIGcsIGJdLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gbnVtYmVyKGMpOyB9KTtcbiAgICAgICAgYSA9IG51bWJlcihhKTtcbiAgICAgICAgaWYgKHJnYi5zb21lKGlzTmFOKSB8fCBpc05hTihhKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5Db2xvcihyZ2IsIGEpO1xuICAgIH0sXG4gICAgLy8gT25seSByZXF1aXJlIHZhbFxuICAgIHN0b3A6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgdmFyIGNvbG9yLCBtb2RlO1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIGNvbG9yID0gYXJndW1lbnRzWzFdO1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIG1vZGUgPSBhcmd1bWVudHNbMl07XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzOiAndGFnJyxcbiAgICAgICAgICAgIHZhbDogdmFsLFxuICAgICAgICAgICAgY29sb3I6IGNvbG9yLFxuICAgICAgICAgICAgbW9kZTogbW9kZSxcbiAgICAgICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbihlbnYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1xcblxcdDxzdG9wIHZhbHVlPVwiJyArIHZhbC5ldihlbnYpICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgIChjb2xvciA/ICcgY29sb3I9XCInICsgY29sb3IuZXYoZW52KSArICdcIiAnIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgKG1vZGUgPyAnIG1vZGU9XCInICsgbW9kZS5ldihlbnYpICsgJ1wiICcgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgICAnLz4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgaHNsOiBmdW5jdGlvbiAoaCwgcywgbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5oc2xhKGgsIHMsIGwsIDEuMCk7XG4gICAgfSxcbiAgICBoc2xhOiBmdW5jdGlvbiAoaCwgcywgbCwgYSkge1xuICAgICAgICBoID0gKG51bWJlcihoKSAlIDM2MCkgLyAzNjA7XG4gICAgICAgIHMgPSBudW1iZXIocyk7IGwgPSBudW1iZXIobCk7IGEgPSBudW1iZXIoYSk7XG4gICAgICAgIGlmIChbaCwgcywgbCwgYV0uc29tZShpc05hTikpIHJldHVybiBudWxsO1xuXG4gICAgICAgIHZhciBtMiA9IGwgPD0gMC41ID8gbCAqIChzICsgMSkgOiBsICsgcyAtIGwgKiBzLFxuICAgICAgICAgICAgbTEgPSBsICogMiAtIG0yO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJnYmEoaHVlKGggKyAxLzMpICogMjU1LFxuICAgICAgICAgICAgICAgICAgICAgICAgIGh1ZShoKSAgICAgICAqIDI1NSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBodWUoaCAtIDEvMykgKiAyNTUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgYSk7XG5cbiAgICAgICAgZnVuY3Rpb24gaHVlKGgpIHtcbiAgICAgICAgICAgIGggPSBoIDwgMCA/IGggKyAxIDogKGggPiAxID8gaCAtIDEgOiBoKTtcbiAgICAgICAgICAgIGlmICAgICAgKGggKiA2IDwgMSkgcmV0dXJuIG0xICsgKG0yIC0gbTEpICogaCAqIDY7XG4gICAgICAgICAgICBlbHNlIGlmIChoICogMiA8IDEpIHJldHVybiBtMjtcbiAgICAgICAgICAgIGVsc2UgaWYgKGggKiAzIDwgMikgcmV0dXJuIG0xICsgKG0yIC0gbTEpICogKDIvMyAtIGgpICogNjtcbiAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgcmV0dXJuIG0xO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBodWU6IGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICBpZiAoISgndG9IU0wnIGluIGNvbG9yKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5EaW1lbnNpb24oTWF0aC5yb3VuZChjb2xvci50b0hTTCgpLmgpKTtcbiAgICB9LFxuICAgIHNhdHVyYXRpb246IGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICBpZiAoISgndG9IU0wnIGluIGNvbG9yKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5EaW1lbnNpb24oTWF0aC5yb3VuZChjb2xvci50b0hTTCgpLnMgKiAxMDApLCAnJScpO1xuICAgIH0sXG4gICAgbGlnaHRuZXNzOiBmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gbmV3IHRyZWUuRGltZW5zaW9uKE1hdGgucm91bmQoY29sb3IudG9IU0woKS5sICogMTAwKSwgJyUnKTtcbiAgICB9LFxuICAgIGFscGhhOiBmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gbmV3IHRyZWUuRGltZW5zaW9uKGNvbG9yLnRvSFNMKCkuYSk7XG4gICAgfSxcbiAgICBzYXR1cmF0ZTogZnVuY3Rpb24gKGNvbG9yLCBhbW91bnQpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgaHNsID0gY29sb3IudG9IU0woKTtcblxuICAgICAgICBoc2wucyArPSBhbW91bnQudmFsdWUgLyAxMDA7XG4gICAgICAgIGhzbC5zID0gY2xhbXAoaHNsLnMpO1xuICAgICAgICByZXR1cm4gaHNsYShoc2wpO1xuICAgIH0sXG4gICAgZGVzYXR1cmF0ZTogZnVuY3Rpb24gKGNvbG9yLCBhbW91bnQpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgaHNsID0gY29sb3IudG9IU0woKTtcblxuICAgICAgICBoc2wucyAtPSBhbW91bnQudmFsdWUgLyAxMDA7XG4gICAgICAgIGhzbC5zID0gY2xhbXAoaHNsLnMpO1xuICAgICAgICByZXR1cm4gaHNsYShoc2wpO1xuICAgIH0sXG4gICAgbGlnaHRlbjogZnVuY3Rpb24gKGNvbG9yLCBhbW91bnQpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgaHNsID0gY29sb3IudG9IU0woKTtcblxuICAgICAgICBoc2wubCArPSBhbW91bnQudmFsdWUgLyAxMDA7XG4gICAgICAgIGhzbC5sID0gY2xhbXAoaHNsLmwpO1xuICAgICAgICByZXR1cm4gaHNsYShoc2wpO1xuICAgIH0sXG4gICAgZGFya2VuOiBmdW5jdGlvbiAoY29sb3IsIGFtb3VudCkge1xuICAgICAgICBpZiAoISgndG9IU0wnIGluIGNvbG9yKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHZhciBoc2wgPSBjb2xvci50b0hTTCgpO1xuXG4gICAgICAgIGhzbC5sIC09IGFtb3VudC52YWx1ZSAvIDEwMDtcbiAgICAgICAgaHNsLmwgPSBjbGFtcChoc2wubCk7XG4gICAgICAgIHJldHVybiBoc2xhKGhzbCk7XG4gICAgfSxcbiAgICBmYWRlaW46IGZ1bmN0aW9uIChjb2xvciwgYW1vdW50KSB7XG4gICAgICAgIGlmICghKCd0b0hTTCcgaW4gY29sb3IpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGhzbCA9IGNvbG9yLnRvSFNMKCk7XG5cbiAgICAgICAgaHNsLmEgKz0gYW1vdW50LnZhbHVlIC8gMTAwO1xuICAgICAgICBoc2wuYSA9IGNsYW1wKGhzbC5hKTtcbiAgICAgICAgcmV0dXJuIGhzbGEoaHNsKTtcbiAgICB9LFxuICAgIGZhZGVvdXQ6IGZ1bmN0aW9uIChjb2xvciwgYW1vdW50KSB7XG4gICAgICAgIGlmICghKCd0b0hTTCcgaW4gY29sb3IpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGhzbCA9IGNvbG9yLnRvSFNMKCk7XG5cbiAgICAgICAgaHNsLmEgLT0gYW1vdW50LnZhbHVlIC8gMTAwO1xuICAgICAgICBoc2wuYSA9IGNsYW1wKGhzbC5hKTtcbiAgICAgICAgcmV0dXJuIGhzbGEoaHNsKTtcbiAgICB9LFxuICAgIHNwaW46IGZ1bmN0aW9uIChjb2xvciwgYW1vdW50KSB7XG4gICAgICAgIGlmICghKCd0b0hTTCcgaW4gY29sb3IpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGhzbCA9IGNvbG9yLnRvSFNMKCk7XG4gICAgICAgIHZhciBodWUgPSAoaHNsLmggKyBhbW91bnQudmFsdWUpICUgMzYwO1xuXG4gICAgICAgIGhzbC5oID0gaHVlIDwgMCA/IDM2MCArIGh1ZSA6IGh1ZTtcblxuICAgICAgICByZXR1cm4gaHNsYShoc2wpO1xuICAgIH0sXG4gICAgcmVwbGFjZTogZnVuY3Rpb24gKGVudGl0eSwgYSwgYikge1xuICAgICAgICBpZiAoZW50aXR5LmlzID09PSAnZmllbGQnKSB7XG4gICAgICAgICAgICByZXR1cm4gZW50aXR5LnRvU3RyaW5nICsgJy5yZXBsYWNlKCcgKyBhLnRvU3RyaW5nKCkgKyAnLCAnICsgYi50b1N0cmluZygpICsgJyknO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGVudGl0eS5yZXBsYWNlKGEsIGIpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvL1xuICAgIC8vIENvcHlyaWdodCAoYykgMjAwNi0yMDA5IEhhbXB0b24gQ2F0bGluLCBOYXRoYW4gV2VpemVuYmF1bSwgYW5kIENocmlzIEVwcHN0ZWluXG4gICAgLy8gaHR0cDovL3Nhc3MtbGFuZy5jb21cbiAgICAvL1xuICAgIG1peDogZnVuY3Rpb24gKGNvbG9yMSwgY29sb3IyLCB3ZWlnaHQpIHtcbiAgICAgICAgdmFyIHAgPSB3ZWlnaHQudmFsdWUgLyAxMDAuMDtcbiAgICAgICAgdmFyIHcgPSBwICogMiAtIDE7XG4gICAgICAgIHZhciBhID0gY29sb3IxLnRvSFNMKCkuYSAtIGNvbG9yMi50b0hTTCgpLmE7XG5cbiAgICAgICAgdmFyIHcxID0gKCgodyAqIGEgPT0gLTEpID8gdyA6ICh3ICsgYSkgLyAoMSArIHcgKiBhKSkgKyAxKSAvIDIuMDtcbiAgICAgICAgdmFyIHcyID0gMSAtIHcxO1xuXG4gICAgICAgIHZhciByZ2IgPSBbY29sb3IxLnJnYlswXSAqIHcxICsgY29sb3IyLnJnYlswXSAqIHcyLFxuICAgICAgICAgICAgICAgICAgIGNvbG9yMS5yZ2JbMV0gKiB3MSArIGNvbG9yMi5yZ2JbMV0gKiB3MixcbiAgICAgICAgICAgICAgICAgICBjb2xvcjEucmdiWzJdICogdzEgKyBjb2xvcjIucmdiWzJdICogdzJdO1xuXG4gICAgICAgIHZhciBhbHBoYSA9IGNvbG9yMS5hbHBoYSAqIHAgKyBjb2xvcjIuYWxwaGEgKiAoMSAtIHApO1xuXG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5Db2xvcihyZ2IsIGFscGhhKTtcbiAgICB9LFxuICAgIGdyZXlzY2FsZTogZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlc2F0dXJhdGUoY29sb3IsIG5ldyB0cmVlLkRpbWVuc2lvbigxMDApKTtcbiAgICB9LFxuICAgICclJzogZnVuY3Rpb24gKHF1b3RlZCAvKiBhcmcsIGFyZywgLi4uKi8pIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLFxuICAgICAgICAgICAgc3RyID0gcXVvdGVkLnZhbHVlO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoLyVzLywgICAgYXJnc1tpXS52YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8lW2RhXS8sIGFyZ3NbaV0udG9TdHJpbmcoKSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoLyUlL2csICclJyk7XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5RdW90ZWQoc3RyKTtcbiAgICB9XG59O1xuXG52YXIgaW1hZ2VfZmlsdGVyX2Z1bmN0b3JzID0gW1xuICAgICdlbWJvc3MnLCAnYmx1cicsICdncmF5JywgJ3NvYmVsJywgJ2VkZ2UtZGV0ZWN0JyxcbiAgICAneC1ncmFkaWVudCcsICd5LWdyYWRpZW50JywgJ3NoYXJwZW4nXTtcblxuZm9yICh2YXIgaSA9IDA7IGkgPCBpbWFnZV9maWx0ZXJfZnVuY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZiA9IGltYWdlX2ZpbHRlcl9mdW5jdG9yc1tpXTtcbiAgICB0cmVlLmZ1bmN0aW9uc1tmXSA9IChmdW5jdGlvbihmKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5JbWFnZUZpbHRlcihmKTtcbiAgICAgICAgfTtcbiAgICB9KShmKTtcbn1cblxudHJlZS5mdW5jdGlvbnNbJ2FnZy1zdGFjay1ibHVyJ10gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgcmV0dXJuIG5ldyB0cmVlLkltYWdlRmlsdGVyKCdhZ2ctc3RhY2stYmx1cicsIFt4LCB5XSk7XG59O1xuXG50cmVlLmZ1bmN0aW9uc1snc2NhbGUtaHNsYSddID0gZnVuY3Rpb24oaDAsaDEsczAsczEsbDAsbDEsYTAsYTEpIHtcbiAgICByZXR1cm4gbmV3IHRyZWUuSW1hZ2VGaWx0ZXIoJ3NjYWxlLWhzbGEnLCBbaDAsaDEsczAsczEsbDAsbDEsYTAsYTFdKTtcbn07XG5cbmZ1bmN0aW9uIGhzbGEoaCkge1xuICAgIHJldHVybiB0cmVlLmZ1bmN0aW9ucy5oc2xhKGguaCwgaC5zLCBoLmwsIGguYSk7XG59XG5cbmZ1bmN0aW9uIG51bWJlcihuKSB7XG4gICAgaWYgKG4gaW5zdGFuY2VvZiB0cmVlLkRpbWVuc2lvbikge1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChuLnVuaXQgPT0gJyUnID8gbi52YWx1ZSAvIDEwMCA6IG4udmFsdWUpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mKG4pID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gbjtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gTmFOO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xhbXAodmFsKSB7XG4gICAgcmV0dXJuIE1hdGgubWluKDEsIE1hdGgubWF4KDAsIHZhbCkpO1xufVxuXG59KShyZXF1aXJlKCcuL3RyZWUnKSk7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKSxcbiAgICBmcyA9IHJlcXVpcmUoJ2ZzJyksXG4gICAgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuXG5mdW5jdGlvbiBnZXRWZXJzaW9uKCkge1xuICAgIGlmIChwcm9jZXNzLmJyb3dzZXIpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoJy4uLy4uL3BhY2thZ2UuanNvbicpLnZlcnNpb24uc3BsaXQoJy4nKTtcbiAgICB9IGVsc2UgaWYgKHBhcnNlSW50KHByb2Nlc3MudmVyc2lvbi5zcGxpdCgnLicpWzFdLCAxMCkgPiA0KSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlKCcuLi8uLi9wYWNrYWdlLmpzb24nKS52ZXJzaW9uLnNwbGl0KCcuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gb2xkZXIgbm9kZVxuICAgICAgICB2YXIgcGFja2FnZV9qc29uID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwnLi4vLi4vcGFja2FnZS5qc29uJykpKTtcbiAgICAgICAgcmV0dXJuIHBhY2thZ2VfanNvbi52ZXJzaW9uLnNwbGl0KCcuJyk7XG4gICAgfVxufVxuXG52YXIgY2FydG8gPSB7XG4gICAgdmVyc2lvbjogZ2V0VmVyc2lvbigpLFxuICAgIFBhcnNlcjogcmVxdWlyZSgnLi9wYXJzZXInKS5QYXJzZXIsXG4gICAgUmVuZGVyZXI6IHJlcXVpcmUoJy4vcmVuZGVyZXInKS5SZW5kZXJlcixcbiAgICB0cmVlOiByZXF1aXJlKCcuL3RyZWUnKSxcbiAgICBSZW5kZXJlckpTOiByZXF1aXJlKCcuL3JlbmRlcmVyX2pzJyksXG4gICAgZGVmYXVsdF9yZWZlcmVuY2U6IHJlcXVpcmUoJy4vdG9ycXVlLXJlZmVyZW5jZScpLFxuXG4gICAgLy8gQFRPRE9cbiAgICB3cml0ZUVycm9yOiBmdW5jdGlvbihjdHgsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSAnJztcbiAgICAgICAgdmFyIGV4dHJhY3QgPSBjdHguZXh0cmFjdDtcbiAgICAgICAgdmFyIGVycm9yID0gW107XG5cbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuc2lsZW50KSB7IHJldHVybjsgfVxuXG4gICAgICAgIG9wdGlvbnMuaW5kZW50ID0gb3B0aW9ucy5pbmRlbnQgfHwgJyc7XG5cbiAgICAgICAgaWYgKCEoJ2luZGV4JyBpbiBjdHgpIHx8ICFleHRyYWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbC5lcnJvcihvcHRpb25zLmluZGVudCArIChjdHguc3RhY2sgfHwgY3R4Lm1lc3NhZ2UpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YoZXh0cmFjdFswXSkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKHN0eWxpemUoKGN0eC5saW5lIC0gMSkgKyAnICcgKyBleHRyYWN0WzBdLCAnZ3JleScpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChleHRyYWN0WzFdID09PSAnJyAmJiB0eXBlb2YgZXh0cmFjdFsyXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGV4dHJhY3RbMV0gPSAnwrYnO1xuICAgICAgICB9XG4gICAgICAgIGVycm9yLnB1c2goY3R4LmxpbmUgKyAnICcgKyBleHRyYWN0WzFdLnNsaWNlKDAsIGN0eC5jb2x1bW4pICtcbiAgICAgICAgICAgIHN0eWxpemUoc3R5bGl6ZShleHRyYWN0WzFdW2N0eC5jb2x1bW5dLCAnYm9sZCcpICtcbiAgICAgICAgICAgIGV4dHJhY3RbMV0uc2xpY2UoY3R4LmNvbHVtbiArIDEpLCAneWVsbG93JykpO1xuXG4gICAgICAgIGlmICh0eXBlb2YoZXh0cmFjdFsyXSkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBlcnJvci5wdXNoKHN0eWxpemUoKGN0eC5saW5lICsgMSkgKyAnICcgKyBleHRyYWN0WzJdLCAnZ3JleScpKTtcbiAgICAgICAgfVxuICAgICAgICBlcnJvciA9IG9wdGlvbnMuaW5kZW50ICsgZXJyb3Iuam9pbignXFxuJyArIG9wdGlvbnMuaW5kZW50KSArICdcXDAzM1swbVxcbic7XG5cbiAgICAgICAgbWVzc2FnZSA9IG9wdGlvbnMuaW5kZW50ICsgbWVzc2FnZSArIHN0eWxpemUoY3R4Lm1lc3NhZ2UsICdyZWQnKTtcbiAgICAgICAgaWYgKGN0eC5maWxlbmFtZSkgKG1lc3NhZ2UgKz0gc3R5bGl6ZSgnIGluICcsICdyZWQnKSArIGN0eC5maWxlbmFtZSk7XG5cbiAgICAgICAgdXRpbC5lcnJvcihtZXNzYWdlLCBlcnJvcik7XG5cbiAgICAgICAgaWYgKGN0eC5jYWxsTGluZSkge1xuICAgICAgICAgICAgdXRpbC5lcnJvcihzdHlsaXplKCdmcm9tICcsICdyZWQnKSArIChjdHguZmlsZW5hbWUgfHwgJycpKTtcbiAgICAgICAgICAgIHV0aWwuZXJyb3Ioc3R5bGl6ZShjdHguY2FsbExpbmUsICdncmV5JykgKyAnICcgKyBjdHguY2FsbEV4dHJhY3QpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjdHguc3RhY2spIHsgdXRpbC5lcnJvcihzdHlsaXplKGN0eC5zdGFjaywgJ3JlZCcpKTsgfVxuICAgIH1cbn07XG5cbnJlcXVpcmUoJy4vdHJlZS9jYWxsJyk7XG5yZXF1aXJlKCcuL3RyZWUvY29sb3InKTtcbnJlcXVpcmUoJy4vdHJlZS9jb21tZW50Jyk7XG5yZXF1aXJlKCcuL3RyZWUvZGVmaW5pdGlvbicpO1xucmVxdWlyZSgnLi90cmVlL2RpbWVuc2lvbicpO1xucmVxdWlyZSgnLi90cmVlL2VsZW1lbnQnKTtcbnJlcXVpcmUoJy4vdHJlZS9leHByZXNzaW9uJyk7XG5yZXF1aXJlKCcuL3RyZWUvZmlsdGVyc2V0Jyk7XG5yZXF1aXJlKCcuL3RyZWUvZmlsdGVyJyk7XG5yZXF1aXJlKCcuL3RyZWUvZmllbGQnKTtcbnJlcXVpcmUoJy4vdHJlZS9rZXl3b3JkJyk7XG5yZXF1aXJlKCcuL3RyZWUvbGF5ZXInKTtcbnJlcXVpcmUoJy4vdHJlZS9saXRlcmFsJyk7XG5yZXF1aXJlKCcuL3RyZWUvb3BlcmF0aW9uJyk7XG5yZXF1aXJlKCcuL3RyZWUvcXVvdGVkJyk7XG5yZXF1aXJlKCcuL3RyZWUvaW1hZ2VmaWx0ZXInKTtcbnJlcXVpcmUoJy4vdHJlZS9yZWZlcmVuY2UnKTtcbnJlcXVpcmUoJy4vdHJlZS9ydWxlJyk7XG5yZXF1aXJlKCcuL3RyZWUvcnVsZXNldCcpO1xucmVxdWlyZSgnLi90cmVlL3NlbGVjdG9yJyk7XG5yZXF1aXJlKCcuL3RyZWUvc3R5bGUnKTtcbnJlcXVpcmUoJy4vdHJlZS91cmwnKTtcbnJlcXVpcmUoJy4vdHJlZS92YWx1ZScpO1xucmVxdWlyZSgnLi90cmVlL3ZhcmlhYmxlJyk7XG5yZXF1aXJlKCcuL3RyZWUvem9vbScpO1xucmVxdWlyZSgnLi90cmVlL2ludmFsaWQnKTtcbnJlcXVpcmUoJy4vdHJlZS9mb250c2V0Jyk7XG5yZXF1aXJlKCcuL3RyZWUvZnJhbWVfb2Zmc2V0Jyk7XG5yZXF1aXJlKCcuL2Z1bmN0aW9ucycpO1xuXG5mb3IgKHZhciBrIGluIGNhcnRvKSB7IGV4cG9ydHNba10gPSBjYXJ0b1trXTsgfVxuXG4vLyBTdHlsaXplIGEgc3RyaW5nXG5mdW5jdGlvbiBzdHlsaXplKHN0ciwgc3R5bGUpIHtcbiAgICB2YXIgc3R5bGVzID0ge1xuICAgICAgICAnYm9sZCcgOiBbMSwgMjJdLFxuICAgICAgICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAgICAgICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICAgICAgICd5ZWxsb3cnIDogWzMzLCAzOV0sXG4gICAgICAgICdncmVlbicgOiBbMzIsIDM5XSxcbiAgICAgICAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgICAgICAgJ2dyZXknIDogWzkwLCAzOV1cbiAgICB9O1xuICAgIHJldHVybiAnXFwwMzNbJyArIHN0eWxlc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFwwMzNbJyArIHN0eWxlc1tzdHlsZV1bMV0gKyAnbSc7XG59XG4iLCJ2YXIgY2FydG8gPSBleHBvcnRzLFxuICAgIHRyZWUgPSByZXF1aXJlKCcuL3RyZWUnKSxcbiAgICBfID0gZ2xvYmFsLl8gfHwgcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG4vLyAgICBUb2tlbiBtYXRjaGluZyBpcyBkb25lIHdpdGggdGhlIGAkYCBmdW5jdGlvbiwgd2hpY2ggZWl0aGVyIHRha2VzXG4vLyAgICBhIHRlcm1pbmFsIHN0cmluZyBvciByZWdleHAsIG9yIGEgbm9uLXRlcm1pbmFsIGZ1bmN0aW9uIHRvIGNhbGwuXG4vLyAgICBJdCBhbHNvIHRha2VzIGNhcmUgb2YgbW92aW5nIGFsbCB0aGUgaW5kaWNlcyBmb3J3YXJkcy5cbmNhcnRvLlBhcnNlciA9IGZ1bmN0aW9uIFBhcnNlcihlbnYpIHtcbiAgICB2YXIgaW5wdXQsICAgICAgIC8vIExlU1MgaW5wdXQgc3RyaW5nXG4gICAgICAgIGksICAgICAgICAgICAvLyBjdXJyZW50IGluZGV4IGluIGBpbnB1dGBcbiAgICAgICAgaiwgICAgICAgICAgIC8vIGN1cnJlbnQgY2h1bmtcbiAgICAgICAgdGVtcCwgICAgICAgIC8vIHRlbXBvcmFyaWx5IGhvbGRzIGEgY2h1bmsncyBzdGF0ZSwgZm9yIGJhY2t0cmFja2luZ1xuICAgICAgICBtZW1vLCAgICAgICAgLy8gdGVtcG9yYXJpbHkgaG9sZHMgYGlgLCB3aGVuIGJhY2t0cmFja2luZ1xuICAgICAgICBmdXJ0aGVzdCwgICAgLy8gZnVydGhlc3QgaW5kZXggdGhlIHBhcnNlciBoYXMgZ29uZSB0b1xuICAgICAgICBjaHVua3MsICAgICAgLy8gY2h1bmtpZmllZCBpbnB1dFxuICAgICAgICBjdXJyZW50LCAgICAgLy8gaW5kZXggb2YgY3VycmVudCBjaHVuaywgaW4gYGlucHV0YFxuICAgICAgICBwYXJzZXI7XG5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhZnRlciBhbGwgZmlsZXNcbiAgICAvLyBoYXZlIGJlZW4gaW1wb3J0ZWQgdGhyb3VnaCBgQGltcG9ydGAuXG4gICAgdmFyIGZpbmlzaCA9IGZ1bmN0aW9uKCkge307XG5cbiAgICBmdW5jdGlvbiBzYXZlKCkgICAge1xuICAgICAgICB0ZW1wID0gY2h1bmtzW2pdO1xuICAgICAgICBtZW1vID0gaTtcbiAgICAgICAgY3VycmVudCA9IGk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlc3RvcmUoKSB7XG4gICAgICAgIGNodW5rc1tqXSA9IHRlbXA7XG4gICAgICAgIGkgPSBtZW1vO1xuICAgICAgICBjdXJyZW50ID0gaTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzeW5jKCkge1xuICAgICAgICBpZiAoaSA+IGN1cnJlbnQpIHtcbiAgICAgICAgICAgIGNodW5rc1tqXSA9IGNodW5rc1tqXS5zbGljZShpIC0gY3VycmVudCk7XG4gICAgICAgICAgICBjdXJyZW50ID0gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvL1xuICAgIC8vIFBhcnNlIGZyb20gYSB0b2tlbiwgcmVnZXhwIG9yIHN0cmluZywgYW5kIG1vdmUgZm9yd2FyZCBpZiBtYXRjaFxuICAgIC8vXG4gICAgZnVuY3Rpb24gJCh0b2spIHtcbiAgICAgICAgdmFyIG1hdGNoLCBhcmdzLCBsZW5ndGgsIGMsIGluZGV4LCBlbmRJbmRleCwgaztcblxuICAgICAgICAvLyBOb24tdGVybWluYWxcbiAgICAgICAgaWYgKHRvayBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdG9rLmNhbGwocGFyc2VyLnBhcnNlcnMpO1xuICAgICAgICAvLyBUZXJtaW5hbFxuICAgICAgICAvLyBFaXRoZXIgbWF0Y2ggYSBzaW5nbGUgY2hhcmFjdGVyIGluIHRoZSBpbnB1dCxcbiAgICAgICAgLy8gb3IgbWF0Y2ggYSByZWdleHAgaW4gdGhlIGN1cnJlbnQgY2h1bmsgKGNodW5rW2pdKS5cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YodG9rKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG1hdGNoID0gaW5wdXQuY2hhckF0KGkpID09PSB0b2sgPyB0b2sgOiBudWxsO1xuICAgICAgICAgICAgbGVuZ3RoID0gMTtcbiAgICAgICAgICAgIHN5bmMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN5bmMoKTtcblxuICAgICAgICAgICAgbWF0Y2ggPSB0b2suZXhlYyhjaHVua3Nbal0pO1xuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBtYXRjaCBpcyBjb25maXJtZWQsIGFkZCB0aGUgbWF0Y2ggbGVuZ3RoIHRvIGBpYCxcbiAgICAgICAgLy8gYW5kIGNvbnN1bWUgYW55IGV4dHJhIHdoaXRlLXNwYWNlIGNoYXJhY3RlcnMgKCcgJyB8fCAnXFxuJylcbiAgICAgICAgLy8gd2hpY2ggY29tZSBhZnRlciB0aGF0LiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIHRoYXQgTGVTUydzXG4gICAgICAgIC8vIGdyYW1tYXIgaXMgbW9zdGx5IHdoaXRlLXNwYWNlIGluc2Vuc2l0aXZlLlxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIHZhciBtZW0gPSBpICs9IGxlbmd0aDtcbiAgICAgICAgICAgIGVuZEluZGV4ID0gaSArIGNodW5rc1tqXS5sZW5ndGggLSBsZW5ndGg7XG5cbiAgICAgICAgICAgIHdoaWxlIChpIDwgZW5kSW5kZXgpIHtcbiAgICAgICAgICAgICAgICBjID0gaW5wdXQuY2hhckNvZGVBdChpKTtcbiAgICAgICAgICAgICAgICBpZiAoISAoYyA9PT0gMzIgfHwgYyA9PT0gMTAgfHwgYyA9PT0gOSkpIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaHVua3Nbal0gPSBjaHVua3Nbal0uc2xpY2UobGVuZ3RoICsgKGkgLSBtZW0pKTtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBpO1xuXG4gICAgICAgICAgICBpZiAoY2h1bmtzW2pdLmxlbmd0aCA9PT0gMCAmJiBqIDwgY2h1bmtzLmxlbmd0aCAtIDEpIHsgaisrOyB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YobWF0Y2gpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoLmxlbmd0aCA9PT0gMSA/IG1hdGNoWzBdIDogbWF0Y2g7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTYW1lIGFzICQoKSwgYnV0IGRvbid0IGNoYW5nZSB0aGUgc3RhdGUgb2YgdGhlIHBhcnNlcixcbiAgICAvLyBqdXN0IHJldHVybiB0aGUgbWF0Y2guXG4gICAgZnVuY3Rpb24gcGVlayh0b2spIHtcbiAgICAgICAgaWYgKHR5cGVvZih0b2spID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0LmNoYXJBdChpKSA9PT0gdG9rO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICEhdG9rLnRlc3QoY2h1bmtzW2pdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4dHJhY3RFcnJvckxpbmUoc3R5bGUsIGVycm9ySW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIChzdHlsZS5zbGljZSgwLCBlcnJvckluZGV4KS5tYXRjaCgvXFxuL2cpIHx8ICcnKS5sZW5ndGggKyAxO1xuICAgIH1cblxuXG4gICAgLy8gTWFrZSBhbiBlcnJvciBvYmplY3QgZnJvbSBhIHBhc3NlZCBzZXQgb2YgcHJvcGVydGllcy5cbiAgICAvLyBBY2NlcHRlZCBwcm9wZXJ0aWVzOlxuICAgIC8vIC0gYG1lc3NhZ2VgOiBUZXh0IG9mIHRoZSBlcnJvciBtZXNzYWdlLlxuICAgIC8vIC0gYGZpbGVuYW1lYDogRmlsZW5hbWUgd2hlcmUgdGhlIGVycm9yIG9jY3VycmVkLlxuICAgIC8vIC0gYGluZGV4YDogQ2hhci4gaW5kZXggd2hlcmUgdGhlIGVycm9yIG9jY3VycmVkLlxuICAgIGZ1bmN0aW9uIG1ha2VFcnJvcihlcnIpIHtcbiAgICAgICAgdmFyIGVpbnB1dDtcbiAgICAgICAgdmFyIGVycm9yVGVtcGxhdGU7XG5cbiAgICAgICAgXy5kZWZhdWx0cyhlcnIsIHtcbiAgICAgICAgICAgIGluZGV4OiBmdXJ0aGVzdCxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBlbnYuZmlsZW5hbWUsXG4gICAgICAgICAgICBtZXNzYWdlOiAnUGFyc2UgZXJyb3IuJyxcbiAgICAgICAgICAgIGxpbmU6IDAsXG4gICAgICAgICAgICBjb2x1bW46IC0xXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChlcnIuZmlsZW5hbWUgJiYgdGhhdC5lbnYuaW5wdXRzICYmIHRoYXQuZW52LmlucHV0c1tlcnIuZmlsZW5hbWVdKSB7XG4gICAgICAgICAgICBlaW5wdXQgPSB0aGF0LmVudi5pbnB1dHNbZXJyLmZpbGVuYW1lXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVpbnB1dCA9IGlucHV0O1xuICAgICAgICB9XG5cbiAgICAgICAgZXJyLmxpbmUgPSBleHRyYWN0RXJyb3JMaW5lKGVpbnB1dCwgZXJyLmluZGV4KTtcbiAgICAgICAgZm9yICh2YXIgbiA9IGVyci5pbmRleDsgbiA+PSAwICYmIGVpbnB1dC5jaGFyQXQobikgIT09ICdcXG4nOyBuLS0pIHtcbiAgICAgICAgICAgIGVyci5jb2x1bW4rKztcbiAgICAgICAgfVxuICAgICAgICBlcnJvclRlbXBsYXRlID0gXy50ZW1wbGF0ZSgnPCU9ZmlsZW5hbWUlPjo8JT1saW5lJT46PCU9Y29sdW1uJT4gPCU9bWVzc2FnZSU+Jyk7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoZXJyb3JUZW1wbGF0ZShlcnIpKTtcbiAgICB9XG5cbiAgICB0aGlzLmVudiA9IGVudiA9IGVudiB8fCB7fTtcbiAgICB0aGlzLmVudi5maWxlbmFtZSA9IHRoaXMuZW52LmZpbGVuYW1lIHx8IG51bGw7XG4gICAgdGhpcy5lbnYuaW5wdXRzID0gdGhpcy5lbnYuaW5wdXRzIHx8IHt9O1xuXG4gICAgLy8gVGhlIFBhcnNlclxuICAgIHBhcnNlciA9IHtcblxuICAgICAgICBleHRyYWN0RXJyb3JMaW5lOiBleHRyYWN0RXJyb3JMaW5lLFxuICAgICAgICAvL1xuICAgICAgICAvLyBQYXJzZSBhbiBpbnB1dCBzdHJpbmcgaW50byBhbiBhYnN0cmFjdCBzeW50YXggdHJlZS5cbiAgICAgICAgLy8gVGhyb3dzIGFuIGVycm9yIG9uIHBhcnNlIGVycm9ycy5cbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICAgICAgdmFyIHJvb3QsIHN0YXJ0LCBlbmQsIHpvbmUsIGxpbmUsIGxpbmVzLCBidWZmID0gW10sIGMsIGVycm9yID0gbnVsbDtcblxuICAgICAgICAgICAgaSA9IGogPSBjdXJyZW50ID0gZnVydGhlc3QgPSAwO1xuICAgICAgICAgICAgY2h1bmtzID0gW107XG4gICAgICAgICAgICBpbnB1dCA9IHN0ci5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpO1xuICAgICAgICAgICAgaWYgKGVudi5maWxlbmFtZSkge1xuICAgICAgICAgICAgICAgIHRoYXQuZW52LmlucHV0c1tlbnYuZmlsZW5hbWVdID0gaW5wdXQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBlYXJseV9leGl0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIFNwbGl0IHRoZSBpbnB1dCBpbnRvIGNodW5rcy5cbiAgICAgICAgICAgIGNodW5rcyA9IChmdW5jdGlvbiAoY2h1bmtzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGogPSAwLFxuICAgICAgICAgICAgICAgICAgICBza2lwID0gLyg/OkBcXHtbXFx3LV0rXFx9fFteXCInYFxce1xcfVxcL1xcKFxcKVxcXFxdKSsvZyxcbiAgICAgICAgICAgICAgICAgICAgY29tbWVudCA9IC9cXC9cXCooPzpbXipdfFxcKitbXlxcLypdKSpcXCorXFwvfFxcL1xcLy4qL2csXG4gICAgICAgICAgICAgICAgICAgIHN0cmluZyA9IC9cIigoPzpbXlwiXFxcXFxcclxcbl18XFxcXC4pKilcInwnKCg/OlteJ1xcXFxcXHJcXG5dfFxcXFwuKSopJ3xgKCg/OlteYF18XFxcXC4pKilgL2csXG4gICAgICAgICAgICAgICAgICAgIGxldmVsID0gMCxcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgIGNodW5rID0gY2h1bmtzWzBdLFxuICAgICAgICAgICAgICAgICAgICBpblBhcmFtO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGMsIGNjOyBpIDwgaW5wdXQubGVuZ3RoOykge1xuICAgICAgICAgICAgICAgICAgICBza2lwLmxhc3RJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaCA9IHNraXAuZXhlYyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaC5pbmRleCA9PT0gaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNodW5rLnB1c2gobWF0Y2hbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGMgPSBpbnB1dC5jaGFyQXQoaSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQubGFzdEluZGV4ID0gc3RyaW5nLmxhc3RJbmRleCA9IGk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoID0gc3RyaW5nLmV4ZWMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2guaW5kZXggPT09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpICs9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaHVuay5wdXNoKG1hdGNoWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5QYXJhbSAmJiBjID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjID0gaW5wdXQuY2hhckF0KGkgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYyA9PT0gJy8nIHx8IGNjID09PSAnKicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2ggPSBjb21tZW50LmV4ZWMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaC5pbmRleCA9PT0gaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSArPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaHVuay5wdXNoKG1hdGNoWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd7JzogaWYgKCEgaW5QYXJhbSkgeyBsZXZlbCArKzsgICAgICAgIGNodW5rLnB1c2goYyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ30nOiBpZiAoISBpblBhcmFtKSB7IGxldmVsIC0tOyAgICAgICAgY2h1bmsucHVzaChjKTsgY2h1bmtzWysral0gPSBjaHVuayA9IFtdOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnKCc6IGlmICghIGluUGFyYW0pIHsgaW5QYXJhbSA9IHRydWU7ICBjaHVuay5wdXNoKGMpOyAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICcpJzogaWYgKCAgaW5QYXJhbSkgeyBpblBhcmFtID0gZmFsc2U7IGNodW5rLnB1c2goYyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmsucHVzaChjKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxldmVsICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGkgLSAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1BhcnNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IChsZXZlbCA+IDApID8gXCJtaXNzaW5nIGNsb3NpbmcgYH1gXCIgOiBcIm1pc3Npbmcgb3BlbmluZyBge2BcIlxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBjaHVua3MubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmpvaW4oJycpOyB9KTtcbiAgICAgICAgICAgIH0pKFtbXV0pO1xuXG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBtYWtlRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTdGFydCB3aXRoIHRoZSBwcmltYXJ5IHJ1bGUuXG4gICAgICAgICAgICAvLyBUaGUgd2hvbGUgc3ludGF4IHRyZWUgaXMgaGVsZCB1bmRlciBhIFJ1bGVzZXQgbm9kZSxcbiAgICAgICAgICAgIC8vIHdpdGggdGhlIGByb290YCBwcm9wZXJ0eSBzZXQgdG8gdHJ1ZSwgc28gbm8gYHt9YCBhcmVcbiAgICAgICAgICAgIC8vIG91dHB1dC5cbiAgICAgICAgICAgIHJvb3QgPSBuZXcgdHJlZS5SdWxlc2V0KFtdLCAkKHRoaXMucGFyc2Vycy5wcmltYXJ5KSk7XG4gICAgICAgICAgICByb290LnJvb3QgPSB0cnVlO1xuXG4gICAgICAgICAgICAvLyBHZXQgYW4gYXJyYXkgb2YgUnVsZXNldCBvYmplY3RzLCBmbGF0dGVuZWRcbiAgICAgICAgICAgIC8vIGFuZCBzb3J0ZWQgYWNjb3JkaW5nIHRvIHNwZWNpZmljaXR5U29ydFxuICAgICAgICAgICAgcm9vdC50b0xpc3QgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmUsIGxpbmVzLCBjb2x1bW47XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGVudikge1xuICAgICAgICAgICAgICAgICAgICBlbnYuZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVudi5lcnJvcnMpIGVudi5lcnJvcnMgPSBuZXcgRXJyb3IoJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudi5lcnJvcnMubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudi5lcnJvcnMubWVzc2FnZSArPSAnXFxuJyArIG1ha2VFcnJvcihlKS5tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnYuZXJyb3JzLm1lc3NhZ2UgPSBtYWtlRXJyb3IoZSkubWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZW52LmZyYW1lcyA9IGVudi5mcmFtZXMgfHwgW107XG5cblxuICAgICAgICAgICAgICAgICAgICAvLyBjYWxsIHBvcHVsYXRlcyBJbnZhbGlkLWNhdXNlZCBlcnJvcnNcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmluaXRpb25zID0gdGhpcy5mbGF0dGVuKFtdLCBbXSwgZW52KTtcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5pdGlvbnMuc29ydChzcGVjaWZpY2l0eVNvcnQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmaW5pdGlvbnM7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIC8vIFNvcnQgcnVsZXMgYnkgc3BlY2lmaWNpdHk6IHRoaXMgZnVuY3Rpb24gZXhwZWN0cyBzZWxlY3RvcnMgdG8gYmVcbiAgICAgICAgICAgIC8vIHNwbGl0IGFscmVhZHkuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gV3JpdHRlbiB0byBiZSB1c2VkIGFzIGEgLnNvcnQoRnVuY3Rpb24pO1xuICAgICAgICAgICAgLy8gYXJndW1lbnQuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gWzEsIDAsIDAsIDQ2N10gPiBbMCwgMCwgMSwgNTIwXVxuICAgICAgICAgICAgdmFyIHNwZWNpZmljaXR5U29ydCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXMgPSBhLnNwZWNpZmljaXR5O1xuICAgICAgICAgICAgICAgIHZhciBicyA9IGIuc3BlY2lmaWNpdHk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXNbMF0gIT0gYnNbMF0pIHJldHVybiBic1swXSAtIGFzWzBdO1xuICAgICAgICAgICAgICAgIGlmIChhc1sxXSAhPSBic1sxXSkgcmV0dXJuIGJzWzFdIC0gYXNbMV07XG4gICAgICAgICAgICAgICAgaWYgKGFzWzJdICE9IGJzWzJdKSByZXR1cm4gYnNbMl0gLSBhc1syXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYnNbM10gLSBhc1szXTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiByb290O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEhlcmUgaW4sIHRoZSBwYXJzaW5nIHJ1bGVzL2Z1bmN0aW9uc1xuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgYmFzaWMgc3RydWN0dXJlIG9mIHRoZSBzeW50YXggdHJlZSBnZW5lcmF0ZWQgaXMgYXMgZm9sbG93czpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gICBSdWxlc2V0IC0+ICBSdWxlIC0+IFZhbHVlIC0+IEV4cHJlc3Npb24gLT4gRW50aXR5XG4gICAgICAgIC8vXG4gICAgICAgIC8vICBJbiBnZW5lcmFsLCBtb3N0IHJ1bGVzIHdpbGwgdHJ5IHRvIHBhcnNlIGEgdG9rZW4gd2l0aCB0aGUgYCQoKWAgZnVuY3Rpb24sIGFuZCBpZiB0aGUgcmV0dXJuXG4gICAgICAgIC8vICB2YWx1ZSBpcyB0cnVseSwgd2lsbCByZXR1cm4gYSBuZXcgbm9kZSwgb2YgdGhlIHJlbGV2YW50IHR5cGUuIFNvbWV0aW1lcywgd2UgbmVlZCB0byBjaGVja1xuICAgICAgICAvLyAgZmlyc3QsIGJlZm9yZSBwYXJzaW5nLCB0aGF0J3Mgd2hlbiB3ZSB1c2UgYHBlZWsoKWAuXG4gICAgICAgIHBhcnNlcnM6IHtcbiAgICAgICAgICAgIC8vIFRoZSBgcHJpbWFyeWAgcnVsZSBpcyB0aGUgKmVudHJ5KiBhbmQgKmV4aXQqIHBvaW50IG9mIHRoZSBwYXJzZXIuXG4gICAgICAgICAgICAvLyBUaGUgcnVsZXMgaGVyZSBjYW4gYXBwZWFyIGF0IGFueSBsZXZlbCBvZiB0aGUgcGFyc2UgdHJlZS5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUaGUgcmVjdXJzaXZlIG5hdHVyZSBvZiB0aGUgZ3JhbW1hciBpcyBhbiBpbnRlcnBsYXkgYmV0d2VlbiB0aGUgYGJsb2NrYFxuICAgICAgICAgICAgLy8gcnVsZSwgd2hpY2ggcmVwcmVzZW50cyBgeyAuLi4gfWAsIHRoZSBgcnVsZXNldGAgcnVsZSwgYW5kIHRoaXMgYHByaW1hcnlgIHJ1bGUsXG4gICAgICAgICAgICAvLyBhcyByZXByZXNlbnRlZCBieSB0aGlzIHNpbXBsaWZpZWQgZ3JhbW1hcjpcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyAgICAgcHJpbWFyeSAg4oaSICAocnVsZXNldCB8IHJ1bGUpK1xuICAgICAgICAgICAgLy8gICAgIHJ1bGVzZXQgIOKGkiAgc2VsZWN0b3IrIGJsb2NrXG4gICAgICAgICAgICAvLyAgICAgYmxvY2sgICAg4oaSICAneycgcHJpbWFyeSAnfSdcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBPbmx5IGF0IG9uZSBwb2ludCBpcyB0aGUgcHJpbWFyeSBydWxlIG5vdCBjYWxsZWQgZnJvbSB0aGVcbiAgICAgICAgICAgIC8vIGJsb2NrIHJ1bGU6IGF0IHRoZSByb290IGxldmVsLlxuICAgICAgICAgICAgcHJpbWFyeTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUsIHJvb3QgPSBbXTtcblxuICAgICAgICAgICAgICAgIHdoaWxlICgobm9kZSA9ICQodGhpcy5ydWxlKSB8fCAkKHRoaXMucnVsZXNldCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMuY29tbWVudCkpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgvXltcXHNcXG5dKy8pIHx8IChub2RlID0gJCh0aGlzLmludmFsaWQpKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZSkgcm9vdC5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGludmFsaWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2h1bmsgPSAkKC9eW147XFxuXSpbO1xcbl0vKTtcblxuICAgICAgICAgICAgICAgIC8vIFRvIGZhaWwgZ3JhY2VmdWxseSwgbWF0Y2ggZXZlcnl0aGluZyB1bnRpbCBhIHNlbWljb2xvbiBvciBsaW5lYnJlYWsuXG4gICAgICAgICAgICAgICAgaWYgKGNodW5rKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5JbnZhbGlkKGNodW5rLCBtZW1vKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBXZSBjcmVhdGUgYSBDb21tZW50IG5vZGUgZm9yIENTUyBjb21tZW50cyBgLyogKi9gLFxuICAgICAgICAgICAgLy8gYnV0IGtlZXAgdGhlIExlU1MgY29tbWVudHMgYC8vYCBzaWxlbnQsIGJ5IGp1c3Qgc2tpcHBpbmdcbiAgICAgICAgICAgIC8vIG92ZXIgdGhlbS5cbiAgICAgICAgICAgIGNvbW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBjb21tZW50O1xuXG4gICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJBdChpKSAhPT0gJy8nKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckF0KGkgKyAxKSA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5Db21tZW50KCQoL15cXC9cXC8uKi8pLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1lbnQgPSAkKC9eXFwvXFwqKD86W14qXXxcXCorW15cXC8qXSkqXFwqK1xcL1xcbj8vKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuQ29tbWVudChjb21tZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBFbnRpdGllcyBhcmUgdG9rZW5zIHdoaWNoIGNhbiBiZSBmb3VuZCBpbnNpZGUgYW4gRXhwcmVzc2lvblxuICAgICAgICAgICAgZW50aXRpZXM6IHtcblxuICAgICAgICAgICAgICAgIC8vIEEgc3RyaW5nLCB3aGljaCBzdXBwb3J0cyBlc2NhcGluZyBcIiBhbmQgJyBcIm1pbGt5IHdheVwiICdoZVxcJ3MgdGhlIG9uZSEnXG4gICAgICAgICAgICAgICAgcXVvdGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJBdChpKSAhPT0gJ1wiJyAmJiBpbnB1dC5jaGFyQXQoaSkgIT09IFwiJ1wiKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdHIgPSAkKC9eXCIoKD86W15cIlxcXFxcXHJcXG5dfFxcXFwuKSopXCJ8JygoPzpbXidcXFxcXFxyXFxuXXxcXFxcLikqKScvKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlF1b3RlZChzdHJbMV0gfHwgc3RyWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAvLyBBIHJlZmVyZW5jZSB0byBhIE1hcG5payBmaWVsZCwgbGlrZSBbTkFNRV1cbiAgICAgICAgICAgICAgICAvLyBCZWhpbmQgdGhlIHNjZW5lcywgdGhpcyBoYXMgdGhlIHNhbWUgcmVwcmVzZW50YXRpb24sIGJ1dCBDYXJ0b1xuICAgICAgICAgICAgICAgIC8vIG5lZWRzIHRvIGJlIGNhcmVmdWwgdG8gd2FybiB3aGVuIHVuc3VwcG9ydGVkIG9wZXJhdGlvbnMgYXJlIHVzZWQuXG4gICAgICAgICAgICAgICAgZmllbGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoISAkKCdbJykpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpZWxkX25hbWUgPSAkKC8oXlteXFxdXSspLyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghICQoJ10nKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGRfbmFtZSkgcmV0dXJuIG5ldyB0cmVlLkZpZWxkKGZpZWxkX25hbWVbMV0pO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgY29tcGFyaXNvbiBvcGVyYXRvclxuICAgICAgICAgICAgICAgIGNvbXBhcmlzb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RyID0gJCgvXj1+fD18IT18PD18Pj18PHw+Lyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gQSBjYXRjaC1hbGwgd29yZCwgc3VjaCBhczogaGFyZC1saWdodFxuICAgICAgICAgICAgICAgIC8vIFRoZXNlIGNhbiBzdGFydCB3aXRoIGVpdGhlciBhIGxldHRlciBvciBhIGRhc2ggKC0pLFxuICAgICAgICAgICAgICAgIC8vIGFuZCB0aGVuIGNvbnRhaW4gbnVtYmVycywgdW5kZXJzY29yZXMsIGFuZCBsZXR0ZXJzLlxuICAgICAgICAgICAgICAgIGtleXdvcmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgayA9ICQoL15bQS1aYS16LV0rW0EtWmEtei0wLTlfXSovKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGspIHsgcmV0dXJuIG5ldyB0cmVlLktleXdvcmQoayk7IH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gQSBmdW5jdGlvbiBjYWxsIGxpa2UgcmdiKDI1NSwgMCwgMjU1KVxuICAgICAgICAgICAgICAgIC8vIFRoZSBhcmd1bWVudHMgYXJlIHBhcnNlZCB3aXRoIHRoZSBgZW50aXRpZXMuYXJndW1lbnRzYCBwYXJzZXIuXG4gICAgICAgICAgICAgICAgY2FsbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lLCBhcmdzO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghKG5hbWUgPSAvXihbXFx3XFwtXSt8JSlcXCgvLmV4ZWMoY2h1bmtzW2pdKSkpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gbmFtZVsxXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gJ3VybCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVybCgpIGlzIGhhbmRsZWQgYnkgdGhlIHVybCBwYXJzZXIgaW5zdGVhZFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpICs9IG5hbWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgJCgnKCcpOyAvLyBQYXJzZSB0aGUgJygnIGFuZCBjb25zdW1lIHdoaXRlc3BhY2UuXG5cbiAgICAgICAgICAgICAgICAgICAgYXJncyA9ICQodGhpcy5lbnRpdGllc1snYXJndW1lbnRzJ10pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghJCgnKScpKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5DYWxsKG5hbWUsIGFyZ3MsIGkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBBcmd1bWVudHMgYXJlIGNvbW1hLXNlcGFyYXRlZCBleHByZXNzaW9uc1xuICAgICAgICAgICAgICAgICdhcmd1bWVudHMnOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXSwgYXJnO1xuXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChhcmcgPSAkKHRoaXMuZXhwcmVzc2lvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaChhcmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEgJCgnLCcpKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJncztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGxpdGVyYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJCh0aGlzLmVudGl0aWVzLmRpbWVuc2lvbikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy5rZXl3b3JkY29sb3IpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMuaGV4Y29sb3IpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMucXVvdGVkKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgdXJsKCkgdG9rZW5zXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBXZSB1c2UgYSBzcGVjaWZpYyBydWxlIGZvciB1cmxzLCBiZWNhdXNlIHRoZXkgZG9uJ3QgcmVhbGx5IGJlaGF2ZSBsaWtlXG4gICAgICAgICAgICAgICAgLy8gc3RhbmRhcmQgZnVuY3Rpb24gY2FsbHMuIFRoZSBkaWZmZXJlbmNlIGlzIHRoYXQgdGhlIGFyZ3VtZW50IGRvZXNuJ3QgaGF2ZVxuICAgICAgICAgICAgICAgIC8vIHRvIGJlIGVuY2xvc2VkIHdpdGhpbiBhIHN0cmluZywgc28gaXQgY2FuJ3QgYmUgcGFyc2VkIGFzIGFuIEV4cHJlc3Npb24uXG4gICAgICAgICAgICAgICAgdXJsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQXQoaSkgIT09ICd1JyB8fCAhJCgvXnVybFxcKC8pKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gJCh0aGlzLmVudGl0aWVzLnF1b3RlZCkgfHwgJCh0aGlzLmVudGl0aWVzLnZhcmlhYmxlKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoL15bXFwtXFx3JUAkXFwvLiY9OjsjKz9+XSsvKSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgJCgnKScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuSW52YWxpZCh2YWx1ZSwgbWVtbywgJ01pc3NpbmcgY2xvc2luZyApIGluIFVSTC4nKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5VUkwoKHR5cGVvZiB2YWx1ZS52YWx1ZSAhPT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSBpbnN0YW5jZW9mIHRyZWUuVmFyaWFibGUpID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA6IG5ldyB0cmVlLlF1b3RlZCh2YWx1ZSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIC8vIEEgVmFyaWFibGUgZW50aXR5LCBzdWNoIGFzIGBAZmlua2AsIGluXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyAgICAgd2lkdGg6IEBmaW5rICsgMnB4XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBXZSB1c2UgYSBkaWZmZXJlbnQgcGFyc2VyIGZvciB2YXJpYWJsZSBkZWZpbml0aW9ucyxcbiAgICAgICAgICAgICAgICAvLyBzZWUgYHBhcnNlcnMudmFyaWFibGVgLlxuICAgICAgICAgICAgICAgIHZhcmlhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUsIGluZGV4ID0gaTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckF0KGkpID09PSAnQCcgJiYgKG5hbWUgPSAkKC9eQFtcXHctXSsvKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5WYXJpYWJsZShuYW1lLCBpbmRleCwgZW52LmZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBoZXhjb2xvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZ2I7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQXQoaSkgPT09ICcjJyAmJiAocmdiID0gJCgvXiMoW2EtZkEtRjAtOV17Nn18W2EtZkEtRjAtOV17M30pLykpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuQ29sb3IocmdiWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBrZXl3b3JkY29sb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmdiID0gY2h1bmtzW2pdLm1hdGNoKC9eW2Etel0rLyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZ2IgJiYgcmdiWzBdIGluIHRyZWUuUmVmZXJlbmNlLmRhdGEuY29sb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuQ29sb3IodHJlZS5SZWZlcmVuY2UuZGF0YS5jb2xvcnNbJCgvXlthLXpdKy8pXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gQSBEaW1lbnNpb24sIHRoYXQgaXMsIGEgbnVtYmVyIGFuZCBhIHVuaXQuIFRoZSBvbmx5XG4gICAgICAgICAgICAgICAgLy8gdW5pdCB0aGF0IGhhcyBhbiBlZmZlY3QgaXMgJVxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gaW5wdXQuY2hhckNvZGVBdChpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChjID4gNTcgfHwgYyA8IDQ1KSB8fCBjID09PSA0NykgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSAkKC9eKC0/XFxkKlxcLj9cXGQrKD86W2VFXVstK10/XFxkKyk/KShcXCV8XFx3Kyk/Lyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkRpbWVuc2lvbih2YWx1ZVsxXSwgdmFsdWVbMl0sIG1lbW8pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBUaGUgdmFyaWFibGUgcGFydCBvZiBhIHZhcmlhYmxlIGRlZmluaXRpb24uXG4gICAgICAgICAgICAvLyBVc2VkIGluIHRoZSBgcnVsZWAgcGFyc2VyLiBMaWtlIEBmaW5rOlxuICAgICAgICAgICAgdmFyaWFibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJBdChpKSA9PT0gJ0AnICYmIChuYW1lID0gJCgvXihAW1xcdy1dKylcXHMqOi8pKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmFtZVsxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBFbnRpdGllcyBhcmUgdGhlIHNtYWxsZXN0IHJlY29nbml6ZWQgdG9rZW4sXG4gICAgICAgICAgICAvLyBhbmQgY2FuIGJlIGZvdW5kIGluc2lkZSBhIHJ1bGUncyB2YWx1ZS5cbiAgICAgICAgICAgIGVudGl0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQodGhpcy5lbnRpdGllcy5jYWxsKSB8fFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMubGl0ZXJhbCkgfHxcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLmZpZWxkKSB8fFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMudmFyaWFibGUpIHx8XG4gICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy51cmwpIHx8XG4gICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy5rZXl3b3JkKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIEEgUnVsZSB0ZXJtaW5hdG9yLiBOb3RlIHRoYXQgd2UgdXNlIGBwZWVrKClgIHRvIGNoZWNrIGZvciAnfScsXG4gICAgICAgICAgICAvLyBiZWNhdXNlIHRoZSBgYmxvY2tgIHJ1bGUgd2lsbCBiZSBleHBlY3RpbmcgaXQsIGJ1dCB3ZSBzdGlsbCBuZWVkIHRvIG1ha2Ugc3VyZVxuICAgICAgICAgICAgLy8gaXQncyB0aGVyZSwgaWYgJzsnIHdhcyBvbW1pdHRlZC5cbiAgICAgICAgICAgIGVuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQoJzsnKSB8fCBwZWVrKCd9Jyk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBFbGVtZW50cyBhcmUgdGhlIGJ1aWxkaW5nIGJsb2NrcyBmb3IgU2VsZWN0b3JzLiBUaGV5IGNvbnNpc3Qgb2ZcbiAgICAgICAgICAgIC8vIGFuIGVsZW1lbnQgbmFtZSwgc3VjaCBhcyBhIHRhZyBhIGNsYXNzLCBvciBgKmAuXG4gICAgICAgICAgICBlbGVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgZSA9ICQoL14oPzpbLiNdW1xcd1xcLV0rfFxcKnxNYXApLyk7XG4gICAgICAgICAgICAgICAgaWYgKGUpIHJldHVybiBuZXcgdHJlZS5FbGVtZW50KGUpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gQXR0YWNobWVudHMgYWxsb3cgYWRkaW5nIG11bHRpcGxlIGxpbmVzLCBwb2x5Z29ucyBldGMuIHRvIGFuXG4gICAgICAgICAgICAvLyBvYmplY3QuIFRoZXJlIGNhbiBvbmx5IGJlIG9uZSBhdHRhY2htZW50IHBlciBzZWxlY3Rvci5cbiAgICAgICAgICAgIGF0dGFjaG1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBzID0gJCgvXjo6KFtcXHdcXC1dKyg/OlxcL1tcXHdcXC1dKykqKS8pO1xuICAgICAgICAgICAgICAgIGlmIChzKSByZXR1cm4gc1sxXTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIFNlbGVjdG9ycyBhcmUgbWFkZSBvdXQgb2Ygb25lIG9yIG1vcmUgRWxlbWVudHMsIHNlZSBhYm92ZS5cbiAgICAgICAgICAgIHNlbGVjdG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgYSwgYXR0YWNobWVudCxcbiAgICAgICAgICAgICAgICAgICAgZSwgZWxlbWVudHMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgZiwgZmlsdGVycyA9IG5ldyB0cmVlLkZpbHRlcnNldCgpLFxuICAgICAgICAgICAgICAgICAgICB6LCB6b29tcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBmcmFtZV9vZmZzZXQgPSB0cmVlLkZyYW1lT2Zmc2V0Lm5vbmU7XG4gICAgICAgICAgICAgICAgICAgIHNlZ21lbnRzID0gMCwgY29uZGl0aW9ucyA9IDA7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoXG4gICAgICAgICAgICAgICAgICAgICAgICAoZSA9ICQodGhpcy5lbGVtZW50KSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICh6ID0gJCh0aGlzLnpvb20pKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGZvID0gJCh0aGlzLmZyYW1lX29mZnNldCkpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoZiA9ICQodGhpcy5maWx0ZXIpKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGEgPSAkKHRoaXMuYXR0YWNobWVudCkpXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBzZWdtZW50cysrO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh6KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB6b29tcy5wdXNoKHopO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9ucysrO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFtZV9vZmZzZXQgPSBmbztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbnMrKztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXJyID0gZmlsdGVycy5hZGQoZik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbWFrZUVycm9yKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaSAtIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbnMrKztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhdHRhY2htZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBtYWtlRXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdFbmNvdW50ZXJlZCBzZWNvbmQgYXR0YWNobWVudCBuYW1lLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGkgLSAxXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dGFjaG1lbnQgPSBhO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBpbnB1dC5jaGFyQXQoaSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjID09PSAneycgfHwgYyA9PT0gJ30nIHx8IGMgPT09ICc7JyB8fCBjID09PSAnLCcpIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc2VnbWVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlNlbGVjdG9yKGZpbHRlcnMsIHpvb21zLCBmcmFtZV9vZmZzZXQsIGVsZW1lbnRzLCBhdHRhY2htZW50LCBjb25kaXRpb25zLCBtZW1vKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBmaWx0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNhdmUoKTtcbiAgICAgICAgICAgICAgICB2YXIga2V5LCBvcCwgdmFsO1xuICAgICAgICAgICAgICAgIGlmICghICQoJ1snKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmIChrZXkgPSAkKC9eW2EtekEtWjAtOVxcLV9dKy8pIHx8XG4gICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy5xdW90ZWQpIHx8XG4gICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy52YXJpYWJsZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLmtleXdvcmQpIHx8XG4gICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy5maWVsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogcmVtb3ZlIGF0IDEuMC4wXG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgaW5zdGFuY2VvZiB0cmVlLlF1b3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5ID0gbmV3IHRyZWUuRmllbGQoa2V5LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICgob3AgPSAkKHRoaXMuZW50aXRpZXMuY29tcGFyaXNvbikpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAodmFsID0gJCh0aGlzLmVudGl0aWVzLnF1b3RlZCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLnZhcmlhYmxlKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMuZGltZW5zaW9uKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMua2V5d29yZCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLmZpZWxkKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghICQoJ10nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG1ha2VFcnJvcih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdNaXNzaW5nIGNsb3NpbmcgXSBvZiBmaWx0ZXIuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IG1lbW8gLSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWtleS5pcykga2V5ID0gbmV3IHRyZWUuRmllbGQoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5GaWx0ZXIoa2V5LCBvcCwgdmFsLCBtZW1vLCBlbnYuZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZnJhbWVfb2Zmc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzYXZlKCk7XG4gICAgICAgICAgICAgICAgdmFyIG9wLCB2YWw7XG4gICAgICAgICAgICAgICAgaWYgKCQoL15cXFtcXHMqZnJhbWUtb2Zmc2V0L2cpICYmXG4gICAgICAgICAgICAgICAgICAgIChvcCA9ICQodGhpcy5lbnRpdGllcy5jb21wYXJpc29uKSkgJiZcbiAgICAgICAgICAgICAgICAgICAgKHZhbCA9ICQoL15cXGQrLykpICYmXG4gICAgICAgICAgICAgICAgICAgICQoJ10nKSkgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cmVlLkZyYW1lT2Zmc2V0KG9wLCB2YWwsIG1lbW8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHpvb206IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNhdmUoKTtcbiAgICAgICAgICAgICAgICB2YXIgb3AsIHZhbDtcbiAgICAgICAgICAgICAgICBpZiAoJCgvXlxcW1xccyp6b29tL2cpICYmXG4gICAgICAgICAgICAgICAgICAgIChvcCA9ICQodGhpcy5lbnRpdGllcy5jb21wYXJpc29uKSkgJiZcbiAgICAgICAgICAgICAgICAgICAgKHZhbCA9ICQodGhpcy5lbnRpdGllcy52YXJpYWJsZSkgfHwgJCh0aGlzLmVudGl0aWVzLmRpbWVuc2lvbikpICYmICQoJ10nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlpvb20ob3AsIHZhbCwgbWVtbyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYmFja3RyYWNrXG4gICAgICAgICAgICAgICAgICAgIHJlc3RvcmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBUaGUgYGJsb2NrYCBydWxlIGlzIHVzZWQgYnkgYHJ1bGVzZXRgXG4gICAgICAgICAgICAvLyBJdCdzIGEgd3JhcHBlciBhcm91bmQgdGhlIGBwcmltYXJ5YCBydWxlLCB3aXRoIGFkZGVkIGB7fWAuXG4gICAgICAgICAgICBibG9jazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoJCgneycpICYmIChjb250ZW50ID0gJCh0aGlzLnByaW1hcnkpKSAmJiAkKCd9JykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gZGl2LCAuY2xhc3MsIGJvZHkgPiBwIHsuLi59XG4gICAgICAgICAgICBydWxlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0b3JzID0gW10sIHMsIGYsIGwsIHJ1bGVzLCBmaWx0ZXJzID0gW107XG4gICAgICAgICAgICAgICAgc2F2ZSgpO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKHMgPSAkKHRoaXMuc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdG9ycy5wdXNoKHMpO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoJCh0aGlzLmNvbW1lbnQpKSB7fVxuICAgICAgICAgICAgICAgICAgICBpZiAoISAkKCcsJykpIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCQodGhpcy5jb21tZW50KSkge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHMpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCQodGhpcy5jb21tZW50KSkge31cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0b3JzLmxlbmd0aCA+IDAgJiYgKHJ1bGVzID0gJCh0aGlzLmJsb2NrKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9ycy5sZW5ndGggPT09IDEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdG9yc1swXS5lbGVtZW50cy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdG9yc1swXS5lbGVtZW50c1swXS52YWx1ZSA9PT0gJ01hcCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBycyA9IG5ldyB0cmVlLlJ1bGVzZXQoc2VsZWN0b3JzLCBydWxlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBycy5pc01hcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlJ1bGVzZXQoc2VsZWN0b3JzLCBydWxlcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQmFja3RyYWNrXG4gICAgICAgICAgICAgICAgICAgIHJlc3RvcmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBydWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSwgdmFsdWUsIGMgPSBpbnB1dC5jaGFyQXQoaSk7XG4gICAgICAgICAgICAgICAgc2F2ZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09ICcuJyB8fCBjID09PSAnIycpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9ICQodGhpcy52YXJpYWJsZSkgfHwgJCh0aGlzLnByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9ICQodGhpcy52YWx1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICYmICQodGhpcy5lbmQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuUnVsZShuYW1lLCB2YWx1ZSwgbWVtbywgZW52LmZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1cnRoZXN0ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGZvbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IFtdLCBleHByZXNzaW9uID0gW10sIHdlaWdodCwgZm9udCwgZTtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChlID0gJCh0aGlzLmVudGl0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwcmVzc2lvbi5wdXNoKGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhbHVlLnB1c2gobmV3IHRyZWUuRXhwcmVzc2lvbihleHByZXNzaW9uKSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoJCgnLCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChlID0gJCh0aGlzLmV4cHJlc3Npb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS5wdXNoKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEgJCgnLCcpKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlZhbHVlKHZhbHVlKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIEEgVmFsdWUgaXMgYSBjb21tYS1kZWxpbWl0ZWQgbGlzdCBvZiBFeHByZXNzaW9uc1xuICAgICAgICAgICAgLy8gSW4gYSBSdWxlLCBhIFZhbHVlIHJlcHJlc2VudHMgZXZlcnl0aGluZyBhZnRlciB0aGUgYDpgLFxuICAgICAgICAgICAgLy8gYW5kIGJlZm9yZSB0aGUgYDtgLlxuICAgICAgICAgICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBlLCBleHByZXNzaW9ucyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKGUgPSAkKHRoaXMuZXhwcmVzc2lvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwcmVzc2lvbnMucHVzaChlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgJCgnLCcpKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV4cHJlc3Npb25zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlZhbHVlKGV4cHJlc3Npb25zLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZS52YWx1ZVswXTtcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXhwcmVzc2lvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5WYWx1ZShleHByZXNzaW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEEgc3ViLWV4cHJlc3Npb24sIGNvbnRhaW5lZCBieSBwYXJlbnRoZW5zaXNcbiAgICAgICAgICAgIHN1YjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGUsIGV4cHJlc3Npb25zID0gW107XG5cbiAgICAgICAgICAgICAgICBpZiAoJCgnKCcpKSB7XG4gICAgICAgICAgICAgICAgICB3aGlsZSAoZSA9ICQodGhpcy5leHByZXNzaW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgIGV4cHJlc3Npb25zLnB1c2goZSk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCEgJCgnLCcpKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAkKCcpJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV4cHJlc3Npb25zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlZhbHVlKGV4cHJlc3Npb25zLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZS52YWx1ZVswXTtcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXhwcmVzc2lvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5WYWx1ZShleHByZXNzaW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBtaXNub21lciBiZWNhdXNlIGl0IGFjdHVhbGx5IGhhbmRsZXMgbXVsdGlwbGljYXRpb25cbiAgICAgICAgICAgIC8vIGFuZCBkaXZpc2lvbi5cbiAgICAgICAgICAgIG11bHRpcGxpY2F0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbSwgYSwgb3AsIG9wZXJhdGlvbjtcbiAgICAgICAgICAgICAgICBpZiAobSA9ICQodGhpcy5vcGVyYW5kKSkge1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKG9wID0gKCQoJy8nKSB8fCAkKCcqJykgfHwgJCgnJScpKSkgJiYgKGEgPSAkKHRoaXMub3BlcmFuZCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVyYXRpb24gPSBuZXcgdHJlZS5PcGVyYXRpb24ob3AsIFtvcGVyYXRpb24gfHwgbSwgYV0sIG1lbW8pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcGVyYXRpb24gfHwgbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWRkaXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtLCBhLCBvcCwgb3BlcmF0aW9uO1xuICAgICAgICAgICAgICAgIGlmIChtID0gJCh0aGlzLm11bHRpcGxpY2F0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKG9wID0gJCgvXlstK11cXHMrLykgfHwgKGlucHV0LmNoYXJBdChpIC0gMSkgIT0gJyAnICYmICgkKCcrJykgfHwgJCgnLScpKSkpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAoYSA9ICQodGhpcy5tdWx0aXBsaWNhdGlvbikpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVyYXRpb24gPSBuZXcgdHJlZS5PcGVyYXRpb24ob3AsIFtvcGVyYXRpb24gfHwgbSwgYV0sIG1lbW8pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcGVyYXRpb24gfHwgbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBBbiBvcGVyYW5kIGlzIGFueXRoaW5nIHRoYXQgY2FuIGJlIHBhcnQgb2YgYW4gb3BlcmF0aW9uLFxuICAgICAgICAgICAgLy8gc3VjaCBhcyBhIENvbG9yLCBvciBhIFZhcmlhYmxlXG4gICAgICAgICAgICBvcGVyYW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJCh0aGlzLnN1YikgfHwgJCh0aGlzLmVudGl0eSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBFeHByZXNzaW9ucyBlaXRoZXIgcmVwcmVzZW50IG1hdGhlbWF0aWNhbCBvcGVyYXRpb25zLFxuICAgICAgICAgICAgLy8gb3Igd2hpdGUtc3BhY2UgZGVsaW1pdGVkIEVudGl0aWVzLiAgQHZhciAqIDJcbiAgICAgICAgICAgIGV4cHJlc3Npb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBlLCBkZWxpbSwgZW50aXRpZXMgPSBbXSwgZDtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChlID0gJCh0aGlzLmFkZGl0aW9uKSB8fCAkKHRoaXMuZW50aXR5KSkge1xuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoKGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChlbnRpdGllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5FeHByZXNzaW9uKGVudGl0aWVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvcGVydHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gJCgvXigoW2Etel1bLWEtel8wLTldKlxcLyk/XFwqPy0/Wy1hLXpfMC05XSspXFxzKjovKTtcbiAgICAgICAgICAgICAgICBpZiAobmFtZSkgcmV0dXJuIG5hbWVbMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBwYXJzZXI7XG59O1xuIiwidmFyIF8gPSBnbG9iYWwuXyB8fCByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG52YXIgY2FydG8gPSByZXF1aXJlKCcuL2luZGV4Jyk7XG5cbmNhcnRvLlJlbmRlcmVyID0gZnVuY3Rpb24gUmVuZGVyZXIoZW52LCBvcHRpb25zKSB7XG4gICAgdGhpcy5lbnYgPSBlbnYgfHwge307XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLm9wdGlvbnMubWFwbmlrX3ZlcnNpb24gPSB0aGlzLm9wdGlvbnMubWFwbmlrX3ZlcnNpb24gfHwgJzMuMC4wJztcbn07XG5cbi8qKlxuICogUHJlcGFyZSBhIE1TUyBkb2N1bWVudCAoZ2l2ZW4gYXMgYW4gc3RyaW5nKSBpbnRvIGFcbiAqIFhNTCBTdHlsZSBmcmFnbWVudCAobW9zdGx5IHVzZWZ1bCBmb3IgZGVidWdnaW5nKVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBkYXRhIHRoZSBtc3MgY29udGVudHMgYXMgYSBzdHJpbmcuXG4gKi9cbmNhcnRvLlJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXJNU1MgPSBmdW5jdGlvbiByZW5kZXIoZGF0YSkge1xuICAgIC8vIGVmZmVjdHMgaXMgYSBjb250YWluZXIgZm9yIHNpZGUtZWZmZWN0cywgd2hpY2ggY3VycmVudGx5XG4gICAgLy8gYXJlIGxpbWl0ZWQgdG8gRm9udFNldHMuXG4gICAgdmFyIGVudiA9IF8uZGVmYXVsdHModGhpcy5lbnYsIHtcbiAgICAgICAgYmVuY2htYXJrOiBmYWxzZSxcbiAgICAgICAgdmFsaWRhdGlvbl9kYXRhOiBmYWxzZSxcbiAgICAgICAgZWZmZWN0czogW11cbiAgICB9KTtcblxuICAgIGlmICghY2FydG8udHJlZS5SZWZlcmVuY2Uuc2V0VmVyc2lvbih0aGlzLm9wdGlvbnMubWFwbmlrX3ZlcnNpb24pKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBzZXQgbWFwbmlrIHZlcnNpb24gdG8gXCIgKyB0aGlzLm9wdGlvbnMubWFwbmlrX3ZlcnNpb24pO1xuICAgIH1cblxuICAgIHZhciBvdXRwdXQgPSBbXTtcbiAgICB2YXIgc3R5bGVzID0gW107XG5cbiAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS50aW1lKCdQYXJzaW5nIE1TUycpO1xuICAgIHZhciBwYXJzZXIgPSAoY2FydG8uUGFyc2VyKGVudikpLnBhcnNlKGRhdGEpO1xuICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWVFbmQoJ1BhcnNpbmcgTVNTJyk7XG5cbiAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS50aW1lKCdSdWxlIGdlbmVyYXRpb24nKTtcbiAgICB2YXIgcnVsZV9saXN0ID0gcGFyc2VyLnRvTGlzdChlbnYpO1xuICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWVFbmQoJ1J1bGUgZ2VuZXJhdGlvbicpO1xuXG4gICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZSgnUnVsZSBpbmhlcml0YW5jZScpO1xuICAgIHZhciBydWxlcyA9IGluaGVyaXREZWZpbml0aW9ucyhydWxlX2xpc3QsIGVudik7XG4gICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZUVuZCgnUnVsZSBpbmhlcml0YW5jZScpO1xuXG4gICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZSgnU3R5bGUgc29ydCcpO1xuICAgIHZhciBzb3J0ZWQgPSBzb3J0U3R5bGVzKHJ1bGVzLGVudik7XG4gICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZUVuZCgnU3R5bGUgc29ydCcpO1xuXG4gICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZSgnVG90YWwgU3R5bGUgZ2VuZXJhdGlvbicpO1xuICAgIGZvciAodmFyIGsgPSAwLCBydWxlLCBzdHlsZV9uYW1lOyBrIDwgc29ydGVkLmxlbmd0aDsgaysrKSB7XG4gICAgICAgIHJ1bGUgPSBzb3J0ZWRba107XG4gICAgICAgIHN0eWxlX25hbWUgPSAnc3R5bGUnICsgKHJ1bGUuYXR0YWNobWVudCAhPT0gJ19fZGVmYXVsdF9fJyA/ICctJyArIHJ1bGUuYXR0YWNobWVudCA6ICcnKTtcbiAgICAgICAgc3R5bGVzLnB1c2goc3R5bGVfbmFtZSk7XG4gICAgICAgIHZhciBiZW5jaF9uYW1lID0gJ1xcdFN0eWxlIFwiJytzdHlsZV9uYW1lKydcIiAoIycraysnKSB0b1hNTCc7XG4gICAgICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWUoYmVuY2hfbmFtZSk7XG4gICAgICAgIC8vIGVudi5lZmZlY3RzIGNhbiBiZSBtb2RpZmllZCBieSB0aGlzIGNhbGxcbiAgICAgICAgb3V0cHV0LnB1c2goY2FydG8udHJlZS5TdHlsZVhNTChzdHlsZV9uYW1lLCBydWxlLmF0dGFjaG1lbnQsIHJ1bGUsIGVudikpO1xuICAgICAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS50aW1lRW5kKGJlbmNoX25hbWUpO1xuICAgIH1cbiAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS50aW1lRW5kKCdUb3RhbCBTdHlsZSBnZW5lcmF0aW9uJyk7XG4gICAgaWYgKGVudi5lcnJvcnMpIHRocm93IGVudi5lcnJvcnM7XG4gICAgcmV0dXJuIG91dHB1dC5qb2luKCdcXG4nKTtcbn07XG5cbi8qKlxuICogUHJlcGFyZSBhIE1NTCBkb2N1bWVudCAoZ2l2ZW4gYXMgYW4gb2JqZWN0KSBpbnRvIGFcbiAqIGZ1bGx5LWxvY2FsaXplZCBYTUwgZmlsZSByZWFkeSBmb3IgTWFwbmlrMiBjb25zdW1wdGlvblxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBtIC0gdGhlIEpTT04gZmlsZSBhcyBhIHN0cmluZy5cbiAqL1xuY2FydG8uUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcihtKSB7XG4gICAgLy8gZWZmZWN0cyBpcyBhIGNvbnRhaW5lciBmb3Igc2lkZS1lZmZlY3RzLCB3aGljaCBjdXJyZW50bHlcbiAgICAvLyBhcmUgbGltaXRlZCB0byBGb250U2V0cy5cbiAgICB2YXIgZW52ID0gXy5kZWZhdWx0cyh0aGlzLmVudiwge1xuICAgICAgICBiZW5jaG1hcms6IGZhbHNlLFxuICAgICAgICB2YWxpZGF0aW9uX2RhdGE6IGZhbHNlLFxuICAgICAgICBlZmZlY3RzOiBbXSxcbiAgICAgICAgcHBpOiA5MC43MTRcbiAgICB9KTtcblxuICAgIGlmICghY2FydG8udHJlZS5SZWZlcmVuY2Uuc2V0VmVyc2lvbih0aGlzLm9wdGlvbnMubWFwbmlrX3ZlcnNpb24pKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBzZXQgbWFwbmlrIHZlcnNpb24gdG8gXCIgKyB0aGlzLm9wdGlvbnMubWFwbmlrX3ZlcnNpb24pO1xuICAgIH1cblxuICAgIHZhciBvdXRwdXQgPSBbXTtcblxuICAgIC8vIFRyYW5zZm9ybSBzdHlsZXNoZWV0cyBpbnRvIGRlZmluaXRpb25zLlxuICAgIHZhciBkZWZpbml0aW9ucyA9IF8uY2hhaW4obS5TdHlsZXNoZWV0KVxuICAgICAgICAubWFwKGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcyA9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlN0eWxlc2hlZXQgb2JqZWN0IGlzIGV4cGVjdGVkIG5vdCBhIHN0cmluZzogJ1wiICsgcyArIFwiJ1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFBhc3NpbmcgdGhlIGVudmlyb25tZW50IGZyb20gc3R5bGVzaGVldCB0byBzdHlsZXNoZWV0LFxuICAgICAgICAgICAgLy8gYWxsb3dzIGZyYW1lcyBhbmQgZWZmZWN0cyB0byBiZSBtYWludGFpbmVkLlxuICAgICAgICAgICAgZW52ID0gXy5leHRlbmQoZW52LCB7ZmlsZW5hbWU6cy5pZH0pO1xuXG4gICAgICAgICAgICB2YXIgdGltZSA9ICtuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgIHJvb3QgPSAoY2FydG8uUGFyc2VyKGVudikpLnBhcnNlKHMuZGF0YSk7XG4gICAgICAgICAgICBpZiAoZW52LmJlbmNobWFyaylcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1BhcnNpbmcgdGltZTogJyArIChuZXcgRGF0ZSgpIC0gdGltZSkgKyAnbXMnKTtcbiAgICAgICAgICAgIHJldHVybiByb290LnRvTGlzdChlbnYpO1xuICAgICAgICB9KVxuICAgICAgICAuZmxhdHRlbigpXG4gICAgICAgIC52YWx1ZSgpO1xuXG4gICAgZnVuY3Rpb24gYXBwbGllc1RvKG5hbWUsIGNsYXNzSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRlZmluaXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBkZWZpbml0aW9uLmFwcGxpZXNUbyhsLm5hbWUsIGNsYXNzSW5kZXgpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBsYXllcnMgYW5kIGNyZWF0ZSBzdHlsZXMgY3VzdG9tLWJ1aWx0XG4gICAgLy8gZm9yIGVhY2ggb2YgdGhlbSwgYW5kIGFwcGx5IHRob3NlIHN0eWxlcyB0byB0aGUgbGF5ZXJzLlxuICAgIHZhciBzdHlsZXMsIGwsIGNsYXNzSW5kZXgsIHJ1bGVzLCBzb3J0ZWQsIG1hdGNoaW5nO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbS5MYXllci5sZW5ndGg7IGkrKykge1xuICAgICAgICBsID0gbS5MYXllcltpXTtcbiAgICAgICAgc3R5bGVzID0gW107XG4gICAgICAgIGNsYXNzSW5kZXggPSB7fTtcblxuICAgICAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS53YXJuKCdwcm9jZXNzaW5nIGxheWVyOiAnICsgbC5pZCk7XG4gICAgICAgIC8vIENsYXNzZXMgYXJlIGdpdmVuIGFzIHNwYWNlLXNlcGFyYXRlZCBhbHBoYW51bWVyaWMgc3RyaW5ncy5cbiAgICAgICAgdmFyIGNsYXNzZXMgPSAobFsnY2xhc3MnXSB8fCAnJykuc3BsaXQoL1xccysvZyk7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2xhc3Nlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgY2xhc3NJbmRleFtjbGFzc2VzW2pdXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgbWF0Y2hpbmcgPSBkZWZpbml0aW9ucy5maWx0ZXIoYXBwbGllc1RvKGwubmFtZSwgY2xhc3NJbmRleCkpO1xuICAgICAgICBydWxlcyA9IGluaGVyaXREZWZpbml0aW9ucyhtYXRjaGluZywgZW52KTtcbiAgICAgICAgc29ydGVkID0gc29ydFN0eWxlcyhydWxlcywgZW52KTtcblxuICAgICAgICBmb3IgKHZhciBrID0gMCwgcnVsZSwgc3R5bGVfbmFtZTsgayA8IHNvcnRlZC5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgcnVsZSA9IHNvcnRlZFtrXTtcbiAgICAgICAgICAgIHN0eWxlX25hbWUgPSBsLm5hbWUgKyAocnVsZS5hdHRhY2htZW50ICE9PSAnX19kZWZhdWx0X18nID8gJy0nICsgcnVsZS5hdHRhY2htZW50IDogJycpO1xuXG4gICAgICAgICAgICAvLyBlbnYuZWZmZWN0cyBjYW4gYmUgbW9kaWZpZWQgYnkgdGhpcyBjYWxsXG4gICAgICAgICAgICB2YXIgc3R5bGVYTUwgPSBjYXJ0by50cmVlLlN0eWxlWE1MKHN0eWxlX25hbWUsIHJ1bGUuYXR0YWNobWVudCwgcnVsZSwgZW52KTtcblxuICAgICAgICAgICAgaWYgKHN0eWxlWE1MKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goc3R5bGVYTUwpO1xuICAgICAgICAgICAgICAgIHN0eWxlcy5wdXNoKHN0eWxlX25hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgb3V0cHV0LnB1c2goY2FydG8udHJlZS5MYXllclhNTChsLCBzdHlsZXMpKTtcbiAgICB9XG5cbiAgICBvdXRwdXQudW5zaGlmdChlbnYuZWZmZWN0cy5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICByZXR1cm4gZS50b1hNTChlbnYpO1xuICAgIH0pLmpvaW4oJ1xcbicpKTtcblxuICAgIHZhciBtYXBfcHJvcGVydGllcyA9IGdldE1hcFByb3BlcnRpZXMobSwgZGVmaW5pdGlvbnMsIGVudik7XG5cbiAgICAvLyBFeGl0IG9uIGVycm9ycy5cbiAgICBpZiAoZW52LmVycm9ycykgdGhyb3cgZW52LmVycm9ycztcblxuICAgIC8vIFBhc3MgVGlsZUpTT04gYW5kIG90aGVyIGN1c3RvbSBwYXJhbWV0ZXJzIHRocm91Z2ggdG8gTWFwbmlrIFhNTC5cbiAgICB2YXIgcGFyYW1ldGVycyA9IF8ucmVkdWNlKG0sIGZ1bmN0aW9uKG1lbW8sIHYsIGspIHtcbiAgICAgICAgaWYgKCF2ICYmIHYgIT09IDApIHJldHVybiBtZW1vO1xuXG4gICAgICAgIHN3aXRjaCAoaykge1xuICAgICAgICAvLyBLbm93biBza2lwcGFibGUgcHJvcGVydGllcy5cbiAgICAgICAgY2FzZSAnc3JzJzpcbiAgICAgICAgY2FzZSAnTGF5ZXInOlxuICAgICAgICBjYXNlICdTdHlsZXNoZWV0JzpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBOb24gVVJMLWJvdW5kIFRpbGVKU09OIHByb3BlcnRpZXMuXG4gICAgICAgIGNhc2UgJ2JvdW5kcyc6XG4gICAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICAgIGNhc2UgJ21pbnpvb20nOlxuICAgICAgICBjYXNlICdtYXh6b29tJzpcbiAgICAgICAgY2FzZSAndmVyc2lvbic6XG4gICAgICAgICAgICBtZW1vLnB1c2goJyAgPFBhcmFtZXRlciBuYW1lPVwiJyArIGsgKyAnXCI+JyArIHYgKyAnPC9QYXJhbWV0ZXI+Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gUHJvcGVydGllcyB0aGF0IHJlcXVpcmUgQ0RBVEEuXG4gICAgICAgIGNhc2UgJ25hbWUnOlxuICAgICAgICBjYXNlICdkZXNjcmlwdGlvbic6XG4gICAgICAgIGNhc2UgJ2xlZ2VuZCc6XG4gICAgICAgIGNhc2UgJ2F0dHJpYnV0aW9uJzpcbiAgICAgICAgY2FzZSAndGVtcGxhdGUnOlxuICAgICAgICAgICAgbWVtby5wdXNoKCcgIDxQYXJhbWV0ZXIgbmFtZT1cIicgKyBrICsgJ1wiPjwhW0NEQVRBWycgKyB2ICsgJ11dPjwvUGFyYW1ldGVyPicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIE1hcG5payBpbWFnZSBmb3JtYXQuXG4gICAgICAgIGNhc2UgJ2Zvcm1hdCc6XG4gICAgICAgICAgICBtZW1vLnB1c2goJyAgPFBhcmFtZXRlciBuYW1lPVwiJyArIGsgKyAnXCI+JyArIHYgKyAnPC9QYXJhbWV0ZXI+Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gTWFwbmlrIGludGVyYWN0aXZpdHkgc2V0dGluZ3MuXG4gICAgICAgIGNhc2UgJ2ludGVyYWN0aXZpdHknOlxuICAgICAgICAgICAgbWVtby5wdXNoKCcgIDxQYXJhbWV0ZXIgbmFtZT1cImludGVyYWN0aXZpdHlfbGF5ZXJcIj4nICsgdi5sYXllciArICc8L1BhcmFtZXRlcj4nKTtcbiAgICAgICAgICAgIG1lbW8ucHVzaCgnICA8UGFyYW1ldGVyIG5hbWU9XCJpbnRlcmFjdGl2aXR5X2ZpZWxkc1wiPicgKyB2LmZpZWxkcyArICc8L1BhcmFtZXRlcj4nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBTdXBwb3J0IGFueSBhZGRpdGlvbmFsIHNjYWxhciBwcm9wZXJ0aWVzLlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2Ygdikge1xuICAgICAgICAgICAgICAgIG1lbW8ucHVzaCgnICA8UGFyYW1ldGVyIG5hbWU9XCInICsgayArICdcIj48IVtDREFUQVsnICsgdiArICddXT48L1BhcmFtZXRlcj4nKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoJ251bWJlcicgPT09IHR5cGVvZiB2KSB7XG4gICAgICAgICAgICAgICAgbWVtby5wdXNoKCcgIDxQYXJhbWV0ZXIgbmFtZT1cIicgKyBrICsgJ1wiPicgKyB2ICsgJzwvUGFyYW1ldGVyPicpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgnYm9vbGVhbicgPT09IHR5cGVvZiB2KSB7XG4gICAgICAgICAgICAgICAgbWVtby5wdXNoKCcgIDxQYXJhbWV0ZXIgbmFtZT1cIicgKyBrICsgJ1wiPicgKyB2ICsgJzwvUGFyYW1ldGVyPicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgfSwgW10pO1xuICAgIGlmIChwYXJhbWV0ZXJzLmxlbmd0aCkgb3V0cHV0LnVuc2hpZnQoXG4gICAgICAgICc8UGFyYW1ldGVycz5cXG4nICtcbiAgICAgICAgcGFyYW1ldGVycy5qb2luKCdcXG4nKSArXG4gICAgICAgICdcXG48L1BhcmFtZXRlcnM+XFxuJ1xuICAgICk7XG5cbiAgICB2YXIgcHJvcGVydGllcyA9IF8ubWFwKG1hcF9wcm9wZXJ0aWVzLCBmdW5jdGlvbih2KSB7IHJldHVybiAnICcgKyB2OyB9KS5qb2luKCcnKTtcblxuICAgIG91dHB1dC51bnNoaWZ0KFxuICAgICAgICAnPD94bWwgdmVyc2lvbj1cIjEuMFwiICcgK1xuICAgICAgICAnZW5jb2Rpbmc9XCJ1dGYtOFwiPz5cXG4nICtcbiAgICAgICAgJzwhRE9DVFlQRSBNYXBbXT5cXG4nICtcbiAgICAgICAgJzxNYXAnICsgcHJvcGVydGllcyArJz5cXG4nKTtcbiAgICBvdXRwdXQucHVzaCgnPC9NYXA+Jyk7XG4gICAgcmV0dXJuIG91dHB1dC5qb2luKCdcXG4nKTtcbn07XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBjdXJyZW50bHkgbW9kaWZpZXMgJ2N1cnJlbnQnXG4gKiBAcGFyYW0ge0FycmF5fSAgY3VycmVudCAgY3VycmVudCBsaXN0IG9mIHJ1bGVzXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmaW5pdGlvbiBhIERlZmluaXRpb24gb2JqZWN0IHRvIGFkZCB0byB0aGUgcnVsZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBieUZpbHRlciBhbiBvYmplY3QvZGljdGlvbmFyeSBvZiBleGlzdGluZyBmaWx0ZXJzLiBUaGlzIGlzXG4gKiBhY3R1YWxseSBrZXllZCBgYXR0YWNobWVudC0+ZmlsdGVyYFxuICogQHBhcmFtIHtPYmplY3R9IGVudiB0aGUgY3VycmVudCBlbnZpcm9ubWVudFxuKi9cbmZ1bmN0aW9uIGFkZFJ1bGVzKGN1cnJlbnQsIGRlZmluaXRpb24sIGJ5RmlsdGVyLCBlbnYpIHtcbiAgICB2YXIgbmV3RmlsdGVycyA9IGRlZmluaXRpb24uZmlsdGVycyxcbiAgICAgICAgbmV3UnVsZXMgPSBkZWZpbml0aW9uLnJ1bGVzLFxuICAgICAgICB1cGRhdGVkRmlsdGVycywgY2xvbmUsIHByZXZpb3VzO1xuXG4gICAgLy8gVGhlIGN1cnJlbnQgZGVmaW5pdGlvbiBtaWdodCBoYXZlIGJlZW4gc3BsaXQgdXAgaW50b1xuICAgIC8vIG11bHRpcGxlIGRlZmluaXRpb25zIGFscmVhZHkuXG4gICAgZm9yICh2YXIgayA9IDA7IGsgPCBjdXJyZW50Lmxlbmd0aDsgaysrKSB7XG4gICAgICAgIHVwZGF0ZWRGaWx0ZXJzID0gY3VycmVudFtrXS5maWx0ZXJzLmNsb25lV2l0aChuZXdGaWx0ZXJzKTtcbiAgICAgICAgaWYgKHVwZGF0ZWRGaWx0ZXJzKSB7XG4gICAgICAgICAgICBwcmV2aW91cyA9IGJ5RmlsdGVyW3VwZGF0ZWRGaWx0ZXJzXTtcbiAgICAgICAgICAgIGlmIChwcmV2aW91cykge1xuICAgICAgICAgICAgICAgIC8vIFRoZXJlJ3MgYWxyZWFkeSBhIGRlZmluaXRpb24gd2l0aCB0aG9zZSBleGFjdFxuICAgICAgICAgICAgICAgIC8vIGZpbHRlcnMuIEFkZCB0aGUgY3VycmVudCBkZWZpbml0aW9ucycgcnVsZXNcbiAgICAgICAgICAgICAgICAvLyBhbmQgc3RvcCBwcm9jZXNzaW5nIGl0IGFzIHRoZSBleGlzdGluZyBydWxlXG4gICAgICAgICAgICAgICAgLy8gaGFzIGFscmVhZHkgZ29uZSBkb3duIHRoZSBpbmhlcml0YW5jZSBjaGFpbi5cbiAgICAgICAgICAgICAgICBwcmV2aW91cy5hZGRSdWxlcyhuZXdSdWxlcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsb25lID0gY3VycmVudFtrXS5jbG9uZSh1cGRhdGVkRmlsdGVycyk7XG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgd2UncmUgb25seSBtYWludGFpbmluZyB0aGUgY2xvbmVcbiAgICAgICAgICAgICAgICAvLyB3aGVuIHdlIGRpZCBhY3R1YWxseSBhZGQgcnVsZXMuIElmIG5vdCwgdGhlcmUnc1xuICAgICAgICAgICAgICAgIC8vIG5vIG5lZWQgdG8ga2VlcCB0aGUgY2xvbmUgYXJvdW5kLlxuICAgICAgICAgICAgICAgIGlmIChjbG9uZS5hZGRSdWxlcyhuZXdSdWxlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgaW5zZXJ0ZWQgYW4gZWxlbWVudCBiZWZvcmUgdGhpcyBvbmUsIHNvIHdlIG5lZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gdG8gbWFrZSBzdXJlIHRoYXQgaW4gdGhlIG5leHQgbG9vcCBpdGVyYXRpb24sIHdlJ3JlXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vdCBwZXJmb3JtaW5nIHRoZSBzYW1lIHRhc2sgZm9yIHRoaXMgZWxlbWVudCBhZ2FpbixcbiAgICAgICAgICAgICAgICAgICAgLy8gaGVuY2UgdGhlIGsrKy5cbiAgICAgICAgICAgICAgICAgICAgYnlGaWx0ZXJbdXBkYXRlZEZpbHRlcnNdID0gY2xvbmU7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQuc3BsaWNlKGssIDAsIGNsb25lKTtcbiAgICAgICAgICAgICAgICAgICAgaysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh1cGRhdGVkRmlsdGVycyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gaWYgdXBkYXRlZEZpbHRlcnMgaXMgbnVsbCwgdGhlbiBhZGRpbmcgdGhlIGZpbHRlcnMgZG9lc24ndFxuICAgICAgICAgICAgLy8gaW52YWxpZGF0ZSBvciBzcGxpdCB0aGUgc2VsZWN0b3IsIHNvIHdlIGFkZFJ1bGVzIHRvIHRoZVxuICAgICAgICAgICAgLy8gY29tYmluZWQgc2VsZWN0b3JcblxuICAgICAgICAgICAgLy8gRmlsdGVycyBjYW4gYmUgYWRkZWQsIGJ1dCB0aGV5IGRvbid0IGNoYW5nZSB0aGVcbiAgICAgICAgICAgIC8vIGZpbHRlcnMuIFRoaXMgbWVhbnMgd2UgZG9uJ3QgaGF2ZSB0byBzcGxpdCB0aGVcbiAgICAgICAgICAgIC8vIGRlZmluaXRpb24uXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gdGhpcyBpcyBjbG9uZWQgaGVyZSBiZWNhdXNlIG9mIHNoYXJlZCBjbGFzc2VzLCBzZWVcbiAgICAgICAgICAgIC8vIHNoYXJlZGNsYXNzLm1zc1xuICAgICAgICAgICAgY3VycmVudFtrXSA9IGN1cnJlbnRba10uY2xvbmUoKTtcbiAgICAgICAgICAgIGN1cnJlbnRba10uYWRkUnVsZXMobmV3UnVsZXMpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIHVwZGF0ZWRGZWF0dXJlcyBpcyBmYWxzZSwgdGhlbiB0aGUgZmlsdGVycyBzcGxpdCB0aGUgcnVsZSxcbiAgICAgICAgLy8gc28gdGhleSBhcmVuJ3QgdGhlIHNhbWUgaW5oZXJpdGFuY2UgY2hhaW5cbiAgICB9XG4gICAgcmV0dXJuIGN1cnJlbnQ7XG59XG5cbi8qKlxuICogQXBwbHkgaW5oZXJpdGVkIHN0eWxlcyBmcm9tIHRoZWlyIGFuY2VzdG9ycyB0byB0aGVtLlxuICpcbiAqIGNhbGxlZCBlaXRoZXIgb25jZSBwZXIgcmVuZGVyIChpbiB0aGUgY2FzZSBvZiBtc3MpIG9yIHBlciBsYXllclxuICogKGZvciBtbWwpXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRlZmluaXRpb25zIC0gYSBsaXN0IG9mIGRlZmluaXRpb25zIG9iamVjdHNcbiAqICAgdGhhdCBjb250YWluIC5ydWxlc1xuICogQHBhcmFtIHtPYmplY3R9IGVudiAtIHRoZSBlbnZpcm9ubWVudFxuICogQHJldHVybiB7QXJyYXk8QXJyYXk+fSBhbiBhcnJheSBvZiBhcnJheXMgaXMgcmV0dXJuZWQsXG4gKiAgIGluIHdoaWNoIGVhY2ggYXJyYXkgcmVmZXJzIHRvIGEgc3BlY2lmaWMgYXR0YWNobWVudFxuICovXG5mdW5jdGlvbiBpbmhlcml0RGVmaW5pdGlvbnMoZGVmaW5pdGlvbnMsIGVudikge1xuICAgIHZhciBpbmhlcml0VGltZSA9ICtuZXcgRGF0ZSgpO1xuICAgIC8vIGRlZmluaXRpb25zIGFyZSBvcmRlcmVkIGJ5IHNwZWNpZmljaXR5LFxuICAgIC8vIGhpZ2ggKGluZGV4IDApIHRvIGxvd1xuICAgIHZhciBieUF0dGFjaG1lbnQgPSB7fSxcbiAgICAgICAgYnlGaWx0ZXIgPSB7fTtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgdmFyIGN1cnJlbnQsIHByZXZpb3VzLCBhdHRhY2htZW50O1xuXG4gICAgLy8gRXZhbHVhdGUgdGhlIGZpbHRlcnMgc3BlY2lmaWVkIGJ5IGVhY2ggZGVmaW5pdGlvbiB3aXRoIHRoZSBnaXZlblxuICAgIC8vIGVudmlyb25tZW50IHRvIGNvcnJlY3RseSByZXNvbHZlIHZhcmlhYmxlIHJlZmVyZW5jZXNcbiAgICBkZWZpbml0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZC5maWx0ZXJzLmV2KGVudik7XG4gICAgfSk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlZmluaXRpb25zLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgYXR0YWNobWVudCA9IGRlZmluaXRpb25zW2ldLmF0dGFjaG1lbnQ7XG4gICAgICAgIGN1cnJlbnQgPSBbZGVmaW5pdGlvbnNbaV1dO1xuXG4gICAgICAgIGlmICghYnlBdHRhY2htZW50W2F0dGFjaG1lbnRdKSB7XG4gICAgICAgICAgICBieUF0dGFjaG1lbnRbYXR0YWNobWVudF0gPSBbXTtcbiAgICAgICAgICAgIGJ5QXR0YWNobWVudFthdHRhY2htZW50XS5hdHRhY2htZW50ID0gYXR0YWNobWVudDtcbiAgICAgICAgICAgIGJ5RmlsdGVyW2F0dGFjaG1lbnRdID0ge307XG4gICAgICAgICAgICByZXN1bHQucHVzaChieUF0dGFjaG1lbnRbYXR0YWNobWVudF0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIGFsbCBzdWJzZXF1ZW50IHJ1bGVzLlxuICAgICAgICBmb3IgKHZhciBqID0gaSArIDE7IGogPCBkZWZpbml0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKGRlZmluaXRpb25zW2pdLmF0dGFjaG1lbnQgPT09IGF0dGFjaG1lbnQpIHtcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGluaGVyaXQgcnVsZXMgZnJvbSB0aGUgc2FtZSBhdHRhY2htZW50LlxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBhZGRSdWxlcyhjdXJyZW50LCBkZWZpbml0aW9uc1tqXSwgYnlGaWx0ZXJbYXR0YWNobWVudF0sIGVudik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGN1cnJlbnQubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgIGJ5RmlsdGVyW2F0dGFjaG1lbnRdW2N1cnJlbnRba10uZmlsdGVyc10gPSBjdXJyZW50W2tdO1xuICAgICAgICAgICAgYnlBdHRhY2htZW50W2F0dGFjaG1lbnRdLnB1c2goY3VycmVudFtrXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS53YXJuKCdJbmhlcml0YW5jZSB0aW1lOiAnICsgKChuZXcgRGF0ZSgpIC0gaW5oZXJpdFRpbWUpKSArICdtcycpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcblxufVxuXG4vLyBTb3J0IHN0eWxlcyBieSB0aGUgbWluaW11bSBpbmRleCBvZiB0aGVpciBydWxlcy5cbi8vIFRoaXMgc29ydHMgYSBzbGljZSBvZiB0aGUgc3R5bGVzLCBzbyBpdCByZXR1cm5zIGEgc29ydGVkXG4vLyBhcnJheSBidXQgZG9lcyBub3QgY2hhbmdlIHRoZSBpbnB1dC5cbmZ1bmN0aW9uIHNvcnRTdHlsZXNJbmRleChhLCBiKSB7IHJldHVybiBiLmluZGV4IC0gYS5pbmRleDsgfVxuZnVuY3Rpb24gc29ydFN0eWxlcyhzdHlsZXMsIGVudikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3R5bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IHN0eWxlc1tpXTtcbiAgICAgICAgc3R5bGUuaW5kZXggPSBJbmZpbml0eTtcbiAgICAgICAgZm9yICh2YXIgYiA9IDA7IGIgPCBzdHlsZS5sZW5ndGg7IGIrKykge1xuICAgICAgICAgICAgdmFyIHJ1bGVzID0gc3R5bGVbYl0ucnVsZXM7XG4gICAgICAgICAgICBmb3IgKHZhciByID0gMDsgciA8IHJ1bGVzLmxlbmd0aDsgcisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJ1bGUgPSBydWxlc1tyXTtcbiAgICAgICAgICAgICAgICBpZiAocnVsZS5pbmRleCA8IHN0eWxlLmluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLmluZGV4ID0gcnVsZS5pbmRleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgcmVzdWx0ID0gc3R5bGVzLnNsaWNlKCk7XG4gICAgcmVzdWx0LnNvcnQoc29ydFN0eWxlc0luZGV4KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIEZpbmQgYSBydWxlIGxpa2UgTWFwIHsgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjsgfSxcbiAqIGlmIGFueSwgYW5kIHJldHVybiBhIGxpc3Qgb2YgcHJvcGVydGllcyB0byBiZSBpbnNlcnRlZFxuICogaW50byB0aGUgPE1hcCBlbGVtZW50IG9mIHRoZSByZXN1bHRpbmcgWE1MLiBUcmFuc2xhdGVzXG4gKiBwcm9wZXJ0aWVzIG9mIHRoZSBtbWwgb2JqZWN0IGF0IGBtYCBkaXJlY3RseSBpbnRvIFhNTFxuICogcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbSB0aGUgbW1sIG9iamVjdC5cbiAqIEBwYXJhbSB7QXJyYXl9IGRlZmluaXRpb25zIHRoZSBvdXRwdXQgb2YgdG9MaXN0LlxuICogQHBhcmFtIHtPYmplY3R9IGVudlxuICogQHJldHVybiB7U3RyaW5nfSByZW5kZXJlZCBwcm9wZXJ0aWVzLlxuICovXG5mdW5jdGlvbiBnZXRNYXBQcm9wZXJ0aWVzKG0sIGRlZmluaXRpb25zLCBlbnYpIHtcbiAgICB2YXIgcnVsZXMgPSB7fTtcbiAgICB2YXIgc3ltYm9saXplcnMgPSBjYXJ0by50cmVlLlJlZmVyZW5jZS5kYXRhLnN5bWJvbGl6ZXJzLm1hcDtcblxuICAgIF8obSkuZWFjaChmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIGlmIChrZXkgaW4gc3ltYm9saXplcnMpIHJ1bGVzW2tleV0gPSBrZXkgKyAnPVwiJyArIHZhbHVlICsgJ1wiJztcbiAgICB9KTtcblxuICAgIGRlZmluaXRpb25zLmZpbHRlcihmdW5jdGlvbihyKSB7XG4gICAgICAgIHJldHVybiByLmVsZW1lbnRzLmpvaW4oJycpID09PSAnTWFwJztcbiAgICB9KS5mb3JFYWNoKGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByLnJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gci5ydWxlc1tpXS5uYW1lO1xuICAgICAgICAgICAgaWYgKCEoa2V5IGluIHN5bWJvbGl6ZXJzKSkge1xuICAgICAgICAgICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdSdWxlICcgKyBrZXkgKyAnIG5vdCBhbGxvd2VkIGZvciBNYXAuJyxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHIucnVsZXNbaV0uaW5kZXhcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJ1bGVzW2tleV0gPSByLnJ1bGVzW2ldLmV2KGVudikudG9YTUwoZW52KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBydWxlcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjYXJ0bztcbm1vZHVsZS5leHBvcnRzLmFkZFJ1bGVzID0gYWRkUnVsZXM7XG5tb2R1bGUuZXhwb3J0cy5pbmhlcml0RGVmaW5pdGlvbnMgPSBpbmhlcml0RGVmaW5pdGlvbnM7XG5tb2R1bGUuZXhwb3J0cy5zb3J0U3R5bGVzID0gc29ydFN0eWxlcztcbiIsIihmdW5jdGlvbihjYXJ0bykge1xudmFyIHRyZWUgPSByZXF1aXJlKCcuL3RyZWUnKTtcbnZhciBfID0gZ2xvYmFsLl8gfHwgcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG5cbmZ1bmN0aW9uIENhcnRvQ1NTKHN0eWxlLCBvcHRpb25zKSB7XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMuaW1hZ2VVUkxzID0gW107XG4gIGlmKHN0eWxlKSB7XG4gICAgdGhpcy5zZXRTdHlsZShzdHlsZSk7XG4gIH1cbn1cblxuQ2FydG9DU1MuTGF5ZXIgPSBmdW5jdGlvbihzaGFkZXIsIG9wdGlvbnMpIHtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgdGhpcy5zaGFkZXIgPSBzaGFkZXI7XG59O1xuXG5cbkNhcnRvQ1NTLkxheWVyLnByb3RvdHlwZSA9IHtcblxuICBmdWxsTmFtZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2hhZGVyLmF0dGFjaG1lbnQ7XG4gIH0sXG5cbiAgbmFtZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZnVsbE5hbWUoKS5zcGxpdCgnOjonKVswXTtcbiAgfSxcblxuICAvLyBmcmFtZXMgdGhpcyBsYXllciBuZWVkIHRvIGJlIHJlbmRlcmVkXG4gIGZyYW1lczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2hhZGVyLmZyYW1lcztcbiAgfSxcblxuICBhdHRhY2htZW50OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5mdWxsTmFtZSgpLnNwbGl0KCc6OicpWzFdO1xuICB9LFxuXG4gIGV2YWw6IGZ1bmN0aW9uKHByb3ApIHtcbiAgICB2YXIgcCA9IHRoaXMuc2hhZGVyW3Byb3BdO1xuICAgIGlmICghcCB8fCAhcC5zdHlsZSkgcmV0dXJuO1xuICAgIHJldHVybiBwLnN0eWxlKHt9LCB7IHpvb206IDAsICdmcmFtZS1vZmZzZXQnOiAwIH0pO1xuICB9LFxuXG4gIC8qXG4gICAqIGBwcm9wc2A6IGZlYXR1cmUgcHJvcGVydGllc1xuICAgKiBgY29udGV4dGA6IHJlbmRlcmluZyBwcm9wZXJ0aWVzLCBpLmUgem9vbVxuICAgKi9cbiAgZ2V0U3R5bGU6IGZ1bmN0aW9uKHByb3BzLCBjb250ZXh0KSB7XG4gICAgdmFyIHN0eWxlID0ge307XG4gICAgZm9yKHZhciBpIGluIHRoaXMuc2hhZGVyKSB7XG4gICAgICBpZihpICE9PSAnYXR0YWNobWVudCcgJiYgaSAhPT0gJ3pvb20nICYmIGkgIT09ICdmcmFtZXMnICYmIGkgIT09ICdzeW1ib2xpemVycycpIHtcbiAgICAgICAgc3R5bGVbaV0gPSB0aGlzLnNoYWRlcltpXS5zdHlsZShwcm9wcywgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHlsZTtcbiAgfSxcblxuICAvKipcbiAgICogcmV0dXJuIHRoZSBzeW1ib2xpemVycyB0aGF0IG5lZWQgdG8gYmUgcmVuZGVyZWQgd2l0aCBcbiAgICogdGhpcyBzdHlsZS4gVGhlIG9yZGVyIGlzIHRoZSByZW5kZXJpbmcgb3JkZXIuXG4gICAqIEByZXR1cm5zIGEgbGlzdCB3aXRoIDMgcG9zc2libGUgdmFsdWVzICdsaW5lJywgJ21hcmtlcicsICdwb2x5Z29uJ1xuICAgKi9cbiAgZ2V0U3ltYm9saXplcnM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNoYWRlci5zeW1ib2xpemVycztcbiAgfSxcblxuICAvKipcbiAgICogcmV0dXJucyBpZiB0aGUgc3R5bGUgdmFyaWVzIHdpdGggc29tZSBmZWF0dXJlIHByb3BlcnR5LlxuICAgKiBVc2VmdWwgdG8gb3B0aW1pemUgcmVuZGVyaW5nXG4gICAqL1xuICBpc1ZhcmlhYmxlOiBmdW5jdGlvbigpIHtcbiAgICBmb3IodmFyIGkgaW4gdGhpcy5zaGFkZXIpIHtcbiAgICAgIGlmKGkgIT09ICdhdHRhY2htZW50JyAmJiBpICE9PSAnem9vbScgJiYgaSAhPT0gJ2ZyYW1lcycgJiYgaSAhPT0gJ3N5bWJvbGl6ZXJzJykge1xuICAgICAgICBpZiAoIXRoaXMuc2hhZGVyW2ldLmNvbnN0YW50KSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIGdldFNoYWRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2hhZGVyO1xuICB9LFxuXG4gIC8qKlxuICAgKiByZXR1cm5zIHRydWUgaWYgYSBmZWF0dXJlIG5lZWRzIHRvIGJlIHJlbmRlcmVkXG4gICAqL1xuICBmaWx0ZXI6IGZ1bmN0aW9uKGZlYXR1cmVUeXBlLCBwcm9wcywgY29udGV4dCkge1xuICAgIGZvcih2YXIgaSBpbiB0aGlzLnNoYWRlcikge1xuICAgICB2YXIgcyA9IHRoaXMuc2hhZGVyW2ldKHByb3BzLCBjb250ZXh0KTtcbiAgICAgaWYocykge1xuICAgICAgIHJldHVybiB0cnVlO1xuICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvL1xuICAvLyBnaXZlbiBhIGdlb2VtdHJ5IHR5cGUgcmV0dXJucyB0aGUgdHJhbnNmb3JtZWQgb25lIGFjb3JkaW5nIHRoZSBDYXJ0b0NTU1xuICAvLyBGb3IgcG9pbnRzIHRoZXJlIGFyZSB0d28ga2luZCBvZiB0eXBlczogcG9pbnQgYW5kIHNwcml0ZSwgdGhlIGZpcnN0IG9uZSBcbiAgLy8gaXMgYSBjaXJjbGUsIHNlY29uZCBvbmUgaXMgYW4gaW1hZ2Ugc3ByaXRlXG4gIC8vXG4gIC8vIHRoZSBvdGhlciBnZW9tZXRyeSB0eXBlcyBhcmUgdGhlIHNhbWUgdGhhbiBnZW9qc29uIChwb2x5Z29uLCBsaW5lc3RyaW5nLi4uKVxuICAvL1xuICB0cmFuc2Zvcm1HZW9tZXRyeTogZnVuY3Rpb24odHlwZSkge1xuICAgIHJldHVybiB0eXBlO1xuICB9LFxuXG4gIHRyYW5zZm9ybUdlb21ldHJpZXM6IGZ1bmN0aW9uKGdlb2pzb24pIHtcbiAgICByZXR1cm4gZ2VvanNvbjtcbiAgfVxuXG59O1xuXG5DYXJ0b0NTUy5wcm90b3R5cGUgPSB7XG5cbiAgc2V0U3R5bGU6IGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgdmFyIGxheWVycyA9IHRoaXMucGFyc2Uoc3R5bGUpO1xuICAgIGlmKCFsYXllcnMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLnBhcnNlX2Vudi5lcnJvcnMpO1xuICAgIH1cbiAgICB0aGlzLmxheWVycyA9IGxheWVycy5tYXAoZnVuY3Rpb24oc2hhZGVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2FydG9DU1MuTGF5ZXIoc2hhZGVyKTtcbiAgICB9KTtcbiAgfSxcblxuICBnZXRMYXllcnM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmxheWVycztcbiAgfSxcblxuICBnZXREZWZhdWx0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5maW5kTGF5ZXIoeyBhdHRhY2htZW50OiAnX19kZWZhdWx0X18nIH0pO1xuICB9LFxuXG4gIGZpbmRMYXllcjogZnVuY3Rpb24od2hlcmUpIHtcbiAgICByZXR1cm4gXy5maW5kKHRoaXMubGF5ZXJzLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgZm9yICh2YXIga2V5IGluIHdoZXJlKSB7XG4gICAgICAgIHZhciB2ID0gdmFsdWVba2V5XTtcbiAgICAgICAgaWYgKHR5cGVvZih2KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHYgPSB2LmNhbGwodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh3aGVyZVtrZXldICE9PSB2KSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfSxcblxuICBfY3JlYXRlRm46IGZ1bmN0aW9uKG9wcykge1xuICAgIHZhciBib2R5ID0gb3BzLmpvaW4oJ1xcbicpO1xuICAgIGlmKHRoaXMub3B0aW9ucy5kZWJ1ZykgY29uc29sZS5sb2coYm9keSk7XG4gICAgcmV0dXJuIEZ1bmN0aW9uKFwiZGF0YVwiLFwiY3R4XCIsIFwidmFyIF92YWx1ZSA9IG51bGw7IFwiICsgIGJvZHkgKyBcIjsgcmV0dXJuIF92YWx1ZTsgXCIpO1xuICB9LFxuXG4gIF9jb21waWxlOiBmdW5jdGlvbihzaGFkZXIpIHtcbiAgICBpZih0eXBlb2Ygc2hhZGVyID09PSAnc3RyaW5nJykge1xuICAgICAgICBzaGFkZXIgPSBldmFsKFwiKGZ1bmN0aW9uKCkgeyByZXR1cm4gXCIgKyBzaGFkZXIgK1wiOyB9KSgpXCIpO1xuICAgIH1cbiAgICB0aGlzLnNoYWRlcl9zcmMgPSBzaGFkZXI7XG4gICAgZm9yKHZhciBhdHRyIGluIHNoYWRlcikge1xuICAgICAgICB2YXIgYyA9IG1hcHBlclthdHRyXTtcbiAgICAgICAgaWYoYykge1xuICAgICAgICAgICAgdGhpcy5jb21waWxlZFtjXSA9IGV2YWwoXCIoZnVuY3Rpb24oKSB7IHJldHVybiBzaGFkZXJbYXR0cl07IH0pKCk7XCIpO1xuICAgICAgICB9XG4gICAgfVxuICB9LFxuICBnZXRJbWFnZVVSTHM6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHRoaXMuaW1hZ2VVUkxzO1xuICB9LFxuXG4gIHBhcnNlOiBmdW5jdGlvbihjYXJ0b2Nzcykge1xuICAgIHZhciBwYXJzZV9lbnYgPSB7XG4gICAgICBmcmFtZXM6IFtdLFxuICAgICAgZXJyb3JzOiBbXSxcbiAgICAgIGVycm9yOiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgdGhpcy5lcnJvcnMucHVzaChvYmopO1xuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5wYXJzZV9lbnYgPSBwYXJzZV9lbnY7XG5cbiAgICB2YXIgcnVsZXNldCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIHJ1bGVzZXQgPSAobmV3IGNhcnRvLlBhcnNlcihwYXJzZV9lbnYpKS5wYXJzZShjYXJ0b2Nzcyk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAvLyBhZGQgdGhlIHN0eWxlLm1zcyBzdHJpbmcgdG8gbWF0Y2ggdGhlIHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclxuICAgICAgcGFyc2VfZW52LmVycm9ycy5wdXNoKGUubWVzc2FnZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmKHJ1bGVzZXQpIHtcblxuICAgICAgZnVuY3Rpb24gZGVmS2V5KGRlZikge1xuICAgICAgICByZXR1cm4gZGVmLmVsZW1lbnRzWzBdICsgXCI6OlwiICsgZGVmLmF0dGFjaG1lbnQ7XG4gICAgICB9XG4gICAgICB2YXIgZGVmcyA9IHJ1bGVzZXQudG9MaXN0KHBhcnNlX2Vudik7XG4gICAgICBkZWZzLnJldmVyc2UoKTtcbiAgICAgIC8vIGdyb3VwIGJ5IGVsZW1lbnRzWzBdLnZhbHVlOjphdHRhY2htZW50XG4gICAgICB2YXIgbGF5ZXJzID0ge307XG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgZGVmcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgZGVmID0gZGVmc1tpXTtcbiAgICAgICAgdmFyIGtleSA9IGRlZktleShkZWYpO1xuICAgICAgICB2YXIgbGF5ZXIgPSBsYXllcnNba2V5XSA9IChsYXllcnNba2V5XSB8fCB7XG4gICAgICAgICAgc3ltYm9saXplcnM6IFtdXG4gICAgICAgIH0pO1xuICAgICAgICBmb3IodmFyIHUgPSAwOyB1PGRlZi5ydWxlcy5sZW5ndGg7IHUrKyl7XG4gICAgICAgICAgICBpZihkZWYucnVsZXNbdV0ubmFtZSA9PT0gXCJtYXJrZXItZmlsZVwiIHx8IGRlZi5ydWxlc1t1XS5uYW1lID09PSBcInBvaW50LWZpbGVcIil7XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gZGVmLnJ1bGVzW3VdLnZhbHVlLnZhbHVlWzBdLnZhbHVlWzBdLnZhbHVlLnZhbHVlO1xuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VVUkxzLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IFxuICAgICAgICBsYXllci5mcmFtZXMgPSBbXTtcbiAgICAgICAgbGF5ZXIuem9vbSA9IHRyZWUuWm9vbS5hbGw7XG4gICAgICAgIHZhciBwcm9wcyA9IGRlZi50b0pTKHBhcnNlX2Vudik7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGVidWcpIGNvbnNvbGUubG9nKFwicHJvcHNcIiwgcHJvcHMpO1xuICAgICAgICBmb3IodmFyIHYgaW4gcHJvcHMpIHtcbiAgICAgICAgICB2YXIgbHlyID0gbGF5ZXJbdl0gPSBsYXllclt2XSB8fCB7XG4gICAgICAgICAgICBjb25zdGFudDogZmFsc2UsXG4gICAgICAgICAgICBzeW1ib2xpemVyOiBudWxsLFxuICAgICAgICAgICAganM6IFtdLFxuICAgICAgICAgICAgaW5kZXg6IDBcbiAgICAgICAgICB9O1xuICAgICAgICAgIC8vIGJ1aWxkIGphdmFzY3JpcHQgc3RhdGVtZW50c1xuICAgICAgICAgIGx5ci5qcy5wdXNoKHByb3BzW3ZdLm1hcChmdW5jdGlvbihhKSB7IHJldHVybiBhLmpzOyB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgICAgLy8gZ2V0IHN5bWJvbGl6ZXIgZm9yIHByb3BcbiAgICAgICAgICBseXIuc3ltYm9saXplciA9IF8uZmlyc3QocHJvcHNbdl0ubWFwKGZ1bmN0aW9uKGEpIHsgcmV0dXJuIGEuc3ltYm9saXplcjsgfSkpO1xuICAgICAgICAgIC8vIHNlcmFjaCB0aGUgbWF4IGluZGV4IHRvIGtub3cgcmVuZGVyaW5nIG9yZGVyXG4gICAgICAgICAgbHlyLmluZGV4ID0gXy5tYXgocHJvcHNbdl0ubWFwKGZ1bmN0aW9uKGEpIHsgcmV0dXJuIGEuaW5kZXg7IH0pLmNvbmNhdChseXIuaW5kZXgpKTtcbiAgICAgICAgICBseXIuY29uc3RhbnQgPSAhXy5hbnkocHJvcHNbdl0ubWFwKGZ1bmN0aW9uKGEpIHsgcmV0dXJuICFhLmNvbnN0YW50OyB9KSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIG9yZGVyZWRfbGF5ZXJzID0gW107XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmRlYnVnKSBjb25zb2xlLmxvZyhsYXllcnMpO1xuXG4gICAgICB2YXIgZG9uZSA9IHt9O1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGRlZnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGRlZiA9IGRlZnNbaV07XG4gICAgICAgIHZhciBrID0gZGVmS2V5KGRlZik7XG4gICAgICAgIHZhciBsYXllciA9IGxheWVyc1trXTtcbiAgICAgICAgaWYoIWRvbmVba10pIHtcbiAgICAgICAgICBpZih0aGlzLm9wdGlvbnMuZGVidWcpIGNvbnNvbGUubG9nKFwiKipcIiwgayk7XG4gICAgICAgICAgZm9yKHZhciBwcm9wIGluIGxheWVyKSB7XG4gICAgICAgICAgICBpZiAocHJvcCAhPT0gJ3pvb20nICYmIHByb3AgIT09ICdmcmFtZXMnICYmIHByb3AgIT09ICdzeW1ib2xpemVycycpIHtcbiAgICAgICAgICAgICAgaWYodGhpcy5vcHRpb25zLmRlYnVnKSBjb25zb2xlLmxvZyhcIipcIiwgcHJvcCk7XG4gICAgICAgICAgICAgIGxheWVyW3Byb3BdLnN0eWxlID0gdGhpcy5fY3JlYXRlRm4obGF5ZXJbcHJvcF0uanMpO1xuICAgICAgICAgICAgICBsYXllci5zeW1ib2xpemVycy5wdXNoKGxheWVyW3Byb3BdLnN5bWJvbGl6ZXIpO1xuICAgICAgICAgICAgICBsYXllci5zeW1ib2xpemVycyA9IF8udW5pcShsYXllci5zeW1ib2xpemVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGxheWVyLmF0dGFjaG1lbnQgPSBrO1xuICAgICAgICAgIG9yZGVyZWRfbGF5ZXJzLnB1c2gobGF5ZXIpO1xuICAgICAgICAgIGRvbmVba10gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGxheWVyLnpvb20gfD0gZGVmLnpvb207XG4gICAgICAgIGxheWVyLmZyYW1lcy5wdXNoKGRlZi5mcmFtZV9vZmZzZXQpO1xuICAgICAgfVxuXG4gICAgICAvLyB1bmlxIHRoZSBmcmFtZXNcbiAgICAgIGZvcihpID0gMDsgaSA8IG9yZGVyZWRfbGF5ZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIG9yZGVyZWRfbGF5ZXJzW2ldLmZyYW1lcyA9IF8udW5pcShvcmRlcmVkX2xheWVyc1tpXS5mcmFtZXMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gb3JkZXJlZF9sYXllcnM7XG5cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG5cblxuY2FydG8uUmVuZGVyZXJKUyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLm9wdGlvbnMubWFwbmlrX3ZlcnNpb24gPSB0aGlzLm9wdGlvbnMubWFwbmlrX3ZlcnNpb24gfHwgJ2xhdGVzdCc7XG59O1xuXG4vLyBQcmVwYXJlIGEgamF2YXNjcmlwdCBvYmplY3Qgd2hpY2ggY29udGFpbnMgdGhlIGxheWVyc1xuY2FydG8uUmVuZGVyZXJKUy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKGNhcnRvY3NzLCBjYWxsYmFjaykge1xuICAgIHZhciByZWZlcmVuY2UgPSByZXF1aXJlKCcuL3RvcnF1ZS1yZWZlcmVuY2UnKTtcbiAgICB0cmVlLlJlZmVyZW5jZS5zZXREYXRhKHJlZmVyZW5jZS52ZXJzaW9uLmxhdGVzdCk7XG4gICAgcmV0dXJuIG5ldyBDYXJ0b0NTUyhjYXJ0b2NzcywgdGhpcy5vcHRpb25zKTtcbn1cblxuaWYodHlwZW9mKG1vZHVsZSkgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gY2FydG8uUmVuZGVyZXJKUztcbn1cblxuXG59KShyZXF1aXJlKCcuLi9jYXJ0bycpKTtcbiIsInZhciBfbWFwbmlrX3JlZmVyZW5jZV9sYXRlc3QgPSB7XG4gICAgXCJ2ZXJzaW9uXCI6IFwiMi4xLjFcIixcbiAgICBcInN0eWxlXCI6IHtcbiAgICAgICAgXCJmaWx0ZXItbW9kZVwiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgIFwiYWxsXCIsXG4gICAgICAgICAgICAgICAgXCJmaXJzdFwiXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJDb250cm9sIHRoZSBwcm9jZXNzaW5nIGJlaGF2aW9yIG9mIFJ1bGUgZmlsdGVycyB3aXRoaW4gYSBTdHlsZS4gSWYgJ2FsbCcgaXMgdXNlZCB0aGVuIGFsbCBSdWxlcyBhcmUgcHJvY2Vzc2VkIHNlcXVlbnRpYWxseSBpbmRlcGVuZGVudCBvZiB3aGV0aGVyIGFueSBwcmV2aW91cyBmaWx0ZXJzIG1hdGNoZWQuIElmICdmaXJzdCcgaXMgdXNlZCB0aGVuIGl0IG1lYW5zIHByb2Nlc3NpbmcgZW5kcyBhZnRlciB0aGUgZmlyc3QgbWF0Y2ggKGEgcG9zaXRpdmUgZmlsdGVyIGV2YWx1YXRpb24pIGFuZCBubyBmdXJ0aGVyIFJ1bGVzIGluIHRoZSBTdHlsZSBhcmUgcHJvY2Vzc2VkICgnZmlyc3QnIGlzIHVzdWFsbHkgdGhlIGRlZmF1bHQgZm9yIENTUyBpbXBsZW1lbnRhdGlvbnMgb24gdG9wIG9mIE1hcG5payB0byBzaW1wbGlmeSB0cmFuc2xhdGlvbiBmcm9tIENTUyB0byBNYXBuaWsgWE1MKVwiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYWxsXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIkFsbCBSdWxlcyBpbiBhIFN0eWxlIGFyZSBwcm9jZXNzZWQgd2hldGhlciB0aGV5IGhhdmUgZmlsdGVycyBvciBub3QgYW5kIHdoZXRoZXIgb3Igbm90IHRoZSBmaWx0ZXIgY29uZGl0aW9ucyBldmFsdWF0ZSB0byB0cnVlLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiaW1hZ2UtZmlsdGVyc1wiOiB7XG4gICAgICAgICAgICBcImNzc1wiOiBcImltYWdlLWZpbHRlcnNcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwibm8gZmlsdGVyc1wiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZnVuY3Rpb25zXCIsXG4gICAgICAgICAgICBcImZ1bmN0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgW1wiYWdnLXN0YWNrLWJsdXJcIiwgMl0sXG4gICAgICAgICAgICAgICAgW1wiZW1ib3NzXCIsIDBdLFxuICAgICAgICAgICAgICAgIFtcImJsdXJcIiwgMF0sXG4gICAgICAgICAgICAgICAgW1wiZ3JheVwiLCAwXSxcbiAgICAgICAgICAgICAgICBbXCJzb2JlbFwiLCAwXSxcbiAgICAgICAgICAgICAgICBbXCJlZGdlLWRldGVjdFwiLCAwXSxcbiAgICAgICAgICAgICAgICBbXCJ4LWdyYWRpZW50XCIsIDBdLFxuICAgICAgICAgICAgICAgIFtcInktZ3JhZGllbnRcIiwgMF0sXG4gICAgICAgICAgICAgICAgW1wiaW52ZXJ0XCIsIDBdLFxuICAgICAgICAgICAgICAgIFtcInNoYXJwZW5cIiwgMF0sXG4gICAgICAgICAgICAgICAgW1wiY29sb3JpemUtYWxwaGFcIiwgLTFdLFxuICAgICAgICAgICAgICAgIFtcImNvbG9yLXRvLWFscGhhXCIsIDFdLFxuICAgICAgICAgICAgICAgIFtcInNjYWxlLWhzbGFcIiwgOF1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBcImRvY1wiOiBcIkEgbGlzdCBvZiBpbWFnZSBmaWx0ZXJzLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiY29tcC1vcFwiOiB7XG4gICAgICAgICAgICBcImNzc1wiOiBcImNvbXAtb3BcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBsYXllciBvbiB0b3Agb2Ygb3RoZXIgbGF5ZXJzXCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBsYXllciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIGxheWVycyBhdG9wIG9yIGJlbG93IGl0LlwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICBcImRzdFwiLFxuICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcInNvdXJjZS1vdmVyXCIsIC8vIGFkZGVkIGZvciB0b3JxdWVcbiAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgXCJzcmMtaW5cIixcbiAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgIFwiZHN0LW91dFwiLFxuICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgXCJ4b3JcIixcbiAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgXCJtdWx0aXBseVwiLFxuICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgXCJkYXJrZW5cIixcbiAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICBcImxpZ2h0ZXJcIiwgLy8gYWRkZWQgZm9yIHRvcnF1ZVxuICAgICAgICAgICAgICAgIFwiY29sb3ItZG9kZ2VcIixcbiAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICBcInNvZnQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgIFwiY29udHJhc3RcIixcbiAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgIFwiZ3JhaW4tbWVyZ2VcIixcbiAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgIFwic2F0dXJhdGlvblwiLFxuICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgXCJvcGFjaXR5XCI6IHtcbiAgICAgICAgICAgIFwiY3NzXCI6IFwib3BhY2l0eVwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgIFwiZG9jXCI6IFwiQW4gYWxwaGEgdmFsdWUgZm9yIHRoZSBzdHlsZSAod2hpY2ggbWVhbnMgYW4gYWxwaGEgYXBwbGllZCB0byBhbGwgZmVhdHVyZXMgaW4gc2VwYXJhdGUgYnVmZmVyIGFuZCB0aGVuIGNvbXBvc2l0ZWQgYmFjayB0byBtYWluIGJ1ZmZlcilcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJubyBzZXBhcmF0ZSBidWZmZXIgd2lsbCBiZSB1c2VkIGFuZCBubyBhbHBoYSB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIHN0eWxlIGFmdGVyIHJlbmRlcmluZ1wiXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFwibGF5ZXJcIiA6IHtcbiAgICAgICAgXCJuYW1lXCI6IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIlwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6XCJzdHJpbmdcIixcbiAgICAgICAgICAgIFwicmVxdWlyZWRcIiA6IHRydWUsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIk5vIGxheWVyIG5hbWUgaGFzIGJlZW4gcHJvdmlkZWRcIixcbiAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG5hbWUgb2YgYSBsYXllci4gQ2FuIGJlIGFueXRoaW5nIHlvdSB3aXNoIGFuZCBpcyBub3Qgc3RyaWN0bHkgdmFsaWRhdGVkLCBidXQgaWRlYWxseSB1bmlxdWUgIGluIHRoZSBtYXBcIlxuICAgICAgICB9LFxuICAgICAgICBcInNyc1wiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJcIixcbiAgICAgICAgICAgIFwidHlwZVwiOlwic3RyaW5nXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIk5vIHNycyB2YWx1ZSBpcyBwcm92aWRlZCBhbmQgdGhlIHZhbHVlIHdpbGwgYmUgaW5oZXJpdGVkIGZyb20gdGhlIE1hcCdzIHNyc1wiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgc3BhdGlhbCByZWZlcmVuY2Ugc3lzdGVtIGRlZmluaXRpb24gZm9yIHRoZSBsYXllciwgYWthIHRoZSBwcm9qZWN0aW9uLiBDYW4gZWl0aGVyIGJlIGEgcHJvajQgbGl0ZXJhbCBzdHJpbmcgbGlrZSAnK3Byb2o9bG9uZ2xhdCArZWxscHM9V0dTODQgK2RhdHVtPVdHUzg0ICtub19kZWZzJyBvciwgaWYgdGhlIHByb3BlciBwcm9qNCBlcHNnL25hZC9ldGMgaWRlbnRpZmllciBmaWxlcyBhcmUgaW5zdGFsbGVkLCBhIHN0cmluZyB0aGF0IHVzZXMgYW4gaWQgbGlrZTogJytpbml0PWVwc2c6NDMyNidcIlxuICAgICAgICB9LFxuICAgICAgICBcInN0YXR1c1wiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogdHJ1ZSxcbiAgICAgICAgICAgIFwidHlwZVwiOlwiYm9vbGVhblwiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJUaGlzIGxheWVyIHdpbGwgYmUgbWFya2VkIGFzIGFjdGl2ZSBhbmQgYXZhaWxhYmxlIGZvciBwcm9jZXNzaW5nXCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcIkEgcHJvcGVydHkgdGhhdCBjYW4gYmUgc2V0IHRvIGZhbHNlIHRvIGRpc2FibGUgdGhpcyBsYXllciBmcm9tIGJlaW5nIHByb2Nlc3NlZFwiXG4gICAgICAgIH0sXG4gICAgICAgIFwibWluem9vbVwiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIwXCIsXG4gICAgICAgICAgICBcInR5cGVcIjpcImZsb2F0XCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlRoZSBsYXllciB3aWxsIGJlIHZpc2libGUgYXQgdGhlIG1pbmltdW0gcG9zc2libGUgc2NhbGVcIixcbiAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG1pbmltdW0gc2NhbGUgZGVub21pbmF0b3IgdGhhdCB0aGlzIGxheWVyIHdpbGwgYmUgdmlzaWJsZSBhdC4gQSBsYXllcidzIHZpc2liaWxpdHkgaXMgZGV0ZXJtaW5lZCBieSB3aGV0aGVyIGl0cyBzdGF0dXMgaXMgdHJ1ZSBhbmQgaWYgdGhlIE1hcCBzY2FsZSA+PSBtaW56b29tIC0gMWUtNiBhbmQgc2NhbGUgPCBtYXh6b29tICsgMWUtNlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwibWF4em9vbVwiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIxLjc5NzY5ZSszMDhcIixcbiAgICAgICAgICAgIFwidHlwZVwiOlwiZmxvYXRcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiVGhlIGxheWVyIHdpbGwgYmUgdmlzaWJsZSBhdCB0aGUgbWF4aW11bSBwb3NzaWJsZSBzY2FsZVwiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgbWF4aW11bSBzY2FsZSBkZW5vbWluYXRvciB0aGF0IHRoaXMgbGF5ZXIgd2lsbCBiZSB2aXNpYmxlIGF0LiBUaGUgZGVmYXVsdCBpcyB0aGUgbnVtZXJpYyBsaW1pdCBvZiB0aGUgQysrIGRvdWJsZSB0eXBlLCB3aGljaCBtYXkgdmFyeSBzbGlnaHRseSBieSBzeXN0ZW0sIGJ1dCBpcyBsaWtlbHkgYSBtYXNzaXZlIG51bWJlciBsaWtlIDEuNzk3NjllKzMwOCBhbmQgZW5zdXJlcyB0aGF0IHRoaXMgbGF5ZXIgd2lsbCBhbHdheXMgYmUgdmlzaWJsZSB1bmxlc3MgdGhlIHZhbHVlIGlzIHJlZHVjZWQuIEEgbGF5ZXIncyB2aXNpYmlsaXR5IGlzIGRldGVybWluZWQgYnkgd2hldGhlciBpdHMgc3RhdHVzIGlzIHRydWUgYW5kIGlmIHRoZSBNYXAgc2NhbGUgPj0gbWluem9vbSAtIDFlLTYgYW5kIHNjYWxlIDwgbWF4em9vbSArIDFlLTZcIlxuICAgICAgICB9LFxuICAgICAgICBcInF1ZXJ5YWJsZVwiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogZmFsc2UsXG4gICAgICAgICAgICBcInR5cGVcIjpcImJvb2xlYW5cIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiVGhlIGxheWVyIHdpbGwgbm90IGJlIGF2YWlsYWJsZSBmb3IgdGhlIGRpcmVjdCBxdWVyeWluZyBvZiBkYXRhIHZhbHVlc1wiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJUaGlzIHByb3BlcnR5IHdhcyBhZGRlZCBmb3IgR2V0RmVhdHVyZUluZm8vV01TIGNvbXBhdGliaWxpdHkgYW5kIGlzIHJhcmVseSB1c2VkLiBJdCBpcyBvZmYgYnkgZGVmYXVsdCBtZWFuaW5nIHRoYXQgaW4gYSBXTVMgY29udGV4dCB0aGUgbGF5ZXIgd2lsbCBub3QgYmUgYWJsZSB0byBiZSBxdWVyaWVkIHVubGVzcyB0aGUgcHJvcGVydHkgaXMgZXhwbGljaXRseSBzZXQgdG8gdHJ1ZVwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiY2xlYXItbGFiZWwtY2FjaGVcIjoge1xuICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlLFxuICAgICAgICAgICAgXCJ0eXBlXCI6XCJib29sZWFuXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlRoZSByZW5kZXJlcidzIGNvbGxpc2lvbiBkZXRlY3RvciBjYWNoZSAodXNlZCBmb3IgYXZvaWRpbmcgZHVwbGljYXRlIGxhYmVscyBhbmQgb3ZlcmxhcHBpbmcgbWFya2Vycykgd2lsbCBub3QgYmUgY2xlYXJlZCBpbW1lZGlhdGVseSBiZWZvcmUgcHJvY2Vzc2luZyB0aGlzIGxheWVyXCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcIlRoaXMgcHJvcGVydHksIGJ5IGRlZmF1bHQgb2ZmLCBjYW4gYmUgZW5hYmxlZCB0byBhbGxvdyBhIHVzZXIgdG8gY2xlYXIgdGhlIGNvbGxpc2lvbiBkZXRlY3RvciBjYWNoZSBiZWZvcmUgYSBnaXZlbiBsYXllciBpcyBwcm9jZXNzZWQuIFRoaXMgbWF5IGJlIGRlc2lyYWJsZSB0byBlbnN1cmUgdGhhdCBhIGdpdmVuIGxheWVycyBkYXRhIHNob3dzIHVwIG9uIHRoZSBtYXAgZXZlbiBpZiBpdCBub3JtYWxseSB3b3VsZCBub3QgYmVjYXVzZSBvZiBjb2xsaXNpb25zIHdpdGggcHJldmlvdXNseSByZW5kZXJlZCBsYWJlbHMgb3IgbWFya2Vyc1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ3JvdXAtYnlcIjoge1xuICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiXCIsXG4gICAgICAgICAgICBcInR5cGVcIjpcInN0cmluZ1wiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyBzcGVjaWFsIGxheWVyIGdyb3VwaW5nIHdpbGwgYmUgdXNlZCBkdXJpbmcgcmVuZGVyaW5nXCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9tYXBuaWsvbWFwbmlrL3dpa2kvR3JvdXBlZC1yZW5kZXJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcImJ1ZmZlci1zaXplXCI6IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIjBcIixcbiAgICAgICAgICAgIFwidHlwZVwiOlwiZmxvYXRcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiTm8gYnVmZmVyIHdpbGwgYmUgdXNlZFwiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJFeHRyYSB0b2xlcmFuY2UgYXJvdW5kIHRoZSBMYXllciBleHRlbnQgKGluIHBpeGVscykgdXNlZCB0byB3aGVuIHF1ZXJ5aW5nIGFuZCAocG90ZW50aWFsbHkpIGNsaXBwaW5nIHRoZSBsYXllciBkYXRhIGR1cmluZyByZW5kZXJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcIm1heGltdW0tZXh0ZW50XCI6IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgIFwidHlwZVwiOlwiYmJveFwiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyBjbGlwcGluZyBleHRlbnQgd2lsbCBiZSB1c2VkXCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcIkFuIGV4dGVudCB0byBiZSB1c2VkIHRvIGxpbWl0IHRoZSBib3VuZHMgdXNlZCB0byBxdWVyeSB0aGlzIHNwZWNpZmljIGxheWVyIGRhdGEgZHVyaW5nIHJlbmRlcmluZy4gU2hvdWxkIGJlIG1pbngsIG1pbnksIG1heHgsIG1heHkgaW4gdGhlIGNvb3JkaW5hdGVzIG9mIHRoZSBMYXllci5cIlxuICAgICAgICB9XG4gICAgfSxcbiAgICBcInN5bWJvbGl6ZXJzXCIgOiB7XG4gICAgICAgIFwiKlwiOiB7XG4gICAgICAgICAgICBcImltYWdlLWZpbHRlcnNcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiaW1hZ2UtZmlsdGVyc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIGZpbHRlcnNcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmdW5jdGlvbnNcIixcbiAgICAgICAgICAgICAgICBcImZ1bmN0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIFtcImFnZy1zdGFjay1ibHVyXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJlbWJvc3NcIiwgMF0sXG4gICAgICAgICAgICAgICAgICAgIFtcImJsdXJcIiwgMF0sXG4gICAgICAgICAgICAgICAgICAgIFtcImdyYXlcIiwgMF0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNvYmVsXCIsIDBdLFxuICAgICAgICAgICAgICAgICAgICBbXCJlZGdlLWRldGVjdFwiLCAwXSxcbiAgICAgICAgICAgICAgICAgICAgW1wieC1ncmFkaWVudFwiLCAwXSxcbiAgICAgICAgICAgICAgICAgICAgW1wieS1ncmFkaWVudFwiLCAwXSxcbiAgICAgICAgICAgICAgICAgICAgW1wiaW52ZXJ0XCIsIDBdLFxuICAgICAgICAgICAgICAgICAgICBbXCJzaGFycGVuXCIsIDBdLFxuICAgICAgICAgICAgICAgICAgICBbXCJjb2xvcml6ZS1hbHBoYVwiLCAtMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcImNvbG9yLXRvLWFscGhhXCIsIDFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJzY2FsZS1oc2xhXCIsIDhdLFxuICAgICAgICAgICAgICAgICAgICBbXCJidWNrZXRzXCIsIC0xXSxcbiAgICAgICAgICAgICAgICAgICAgW1wiY2F0ZWdvcnlcIiwgLTFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJlcXVhbFwiLCAtMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcImhlYWR0YWlsc1wiLCAtMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcImplbmtzXCIsIC0xXSxcbiAgICAgICAgICAgICAgICAgICAgW1wicXVhbnRpbGVzXCIsIC0xXSxcbiAgICAgICAgICAgICAgICAgICAgW1wiY2FydG9jb2xvclwiLCAtMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcImNvbG9yYnJld2VyXCIsIC0xXSxcbiAgICAgICAgICAgICAgICAgICAgW1wicmFuZ2VcIiwgLTFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJyYW1wXCIsIC0xXVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBIGxpc3Qgb2YgaW1hZ2UgZmlsdGVycy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY29tcC1vcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJjb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBsYXllciBvbiB0b3Agb2Ygb3RoZXIgbGF5ZXJzXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgbGF5ZXIgc2hvdWxkIGJlaGF2ZSByZWxhdGl2ZSB0byBsYXllcnMgYXRvcCBvciBiZWxvdyBpdC5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1wiY2xlYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNvdXJjZS1vdmVyXCIsIC8vIGFkZGVkIGZvciB0b3JxdWVcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaWdodGVyXCIsIC8vIGFkZGVkIGZvciB0b3JxdWVcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwib3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJvcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkFuIGFscGhhIHZhbHVlIGZvciB0aGUgc3R5bGUgKHdoaWNoIG1lYW5zIGFuIGFscGhhIGFwcGxpZWQgdG8gYWxsIGZlYXR1cmVzIGluIHNlcGFyYXRlIGJ1ZmZlciBhbmQgdGhlbiBjb21wb3NpdGVkIGJhY2sgdG8gbWFpbiBidWZmZXIpXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJubyBzZXBhcmF0ZSBidWZmZXIgd2lsbCBiZSB1c2VkIGFuZCBubyBhbHBoYSB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIHN0eWxlIGFmdGVyIHJlbmRlcmluZ1wiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwibWFwXCI6IHtcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiTWFwIEJhY2tncm91bmQgY29sb3JcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1pbWFnZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJiYWNrZ3JvdW5kLWltYWdlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwidXJpXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQW4gaW1hZ2UgdGhhdCBpcyByZXBlYXRlZCBiZWxvdyBhbGwgZmVhdHVyZXMgb24gYSBtYXAgYXMgYSBiYWNrZ3JvdW5kLlwiLFxuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJNYXAgQmFja2dyb3VuZCBpbWFnZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzcnNcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic3JzXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiK3Byb2o9bG9uZ2xhdCArZWxscHM9V0dTODQgK2RhdHVtPVdHUzg0ICtub19kZWZzXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJUaGUgcHJvajQgbGl0ZXJhbCBvZiBFUFNHOjQzMjYgaXMgYXNzdW1lZCB0byBiZSB0aGUgTWFwJ3Mgc3BhdGlhbCByZWZlcmVuY2UgYW5kIGFsbCBkYXRhIGZyb20gbGF5ZXJzIHdpdGhpbiB0aGlzIG1hcCB3aWxsIGJlIHBsb3R0ZWQgdXNpbmcgdGhpcyBjb29yZGluYXRlIHN5c3RlbS4gSWYgYW55IGxheWVycyBkbyBub3QgZGVjbGFyZSBhbiBzcnMgdmFsdWUgdGhlbiB0aGV5IHdpbGwgYmUgYXNzdW1lZCB0byBiZSBpbiB0aGUgc2FtZSBzcnMgYXMgdGhlIE1hcCBhbmQgbm90IHRyYW5zZm9ybWF0aW9ucyB3aWxsIGJlIG5lZWRlZCB0byBwbG90IHRoZW0gaW4gdGhlIE1hcCdzIGNvb3JkaW5hdGUgc3BhY2VcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIk1hcCBzcGF0aWFsIHJlZmVyZW5jZSAocHJvajQgc3RyaW5nKVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJidWZmZXItc2l6ZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJidWZmZXItc2l6ZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIjBcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjpcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyBidWZmZXIgd2lsbCBiZSB1c2VkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJFeHRyYSB0b2xlcmFuY2UgYXJvdW5kIHRoZSBtYXAgKGluIHBpeGVscykgdXNlZCB0byBlbnN1cmUgbGFiZWxzIGNyb3NzaW5nIHRpbGUgYm91bmRhcmllcyBhcmUgZXF1YWxseSByZW5kZXJlZCBpbiBlYWNoIHRpbGUgKGUuZy4gY3V0IGluIGVhY2ggdGlsZSkuIE5vdCBpbnRlbmRlZCB0byBiZSB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGggXFxcImF2b2lkLWVkZ2VzXFxcIi5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibWF4aW11bS1leHRlbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOlwiYmJveFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiTm8gY2xpcHBpbmcgZXh0ZW50IHdpbGwgYmUgdXNlZFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQW4gZXh0ZW50IHRvIGJlIHVzZWQgdG8gbGltaXQgdGhlIGJvdW5kcyB1c2VkIHRvIHF1ZXJ5IGFsbCBsYXllcnMgZHVyaW5nIHJlbmRlcmluZy4gU2hvdWxkIGJlIG1pbngsIG1pbnksIG1heHgsIG1heHkgaW4gdGhlIGNvb3JkaW5hdGVzIG9mIHRoZSBNYXAuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImJhc2VcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiYmFzZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiVGhpcyBiYXNlIHBhdGggZGVmYXVsdHMgdG8gYW4gZW1wdHkgc3RyaW5nIG1lYW5pbmcgdGhhdCBhbnkgcmVsYXRpdmUgcGF0aHMgdG8gZmlsZXMgcmVmZXJlbmNlZCBpbiBzdHlsZXMgb3IgbGF5ZXJzIHdpbGwgYmUgaW50ZXJwcmV0ZWQgcmVsYXRpdmUgdG8gdGhlIGFwcGxpY2F0aW9uIHByb2Nlc3MuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbnkgcmVsYXRpdmUgcGF0aHMgdXNlZCB0byByZWZlcmVuY2UgZmlsZXMgd2lsbCBiZSB1bmRlcnN0b29kIGFzIHJlbGF0aXZlIHRvIHRoaXMgZGlyZWN0b3J5IHBhdGggaWYgdGhlIG1hcCBpcyBsb2FkZWQgZnJvbSBhbiBpbiBtZW1vcnkgb2JqZWN0IHJhdGhlciB0aGFuIGZyb20gdGhlIGZpbGVzeXN0ZW0uIElmIHRoZSBtYXAgaXMgbG9hZGVkIGZyb20gdGhlIGZpbGVzeXN0ZW0gYW5kIHRoaXMgb3B0aW9uIGlzIG5vdCBwcm92aWRlZCBpdCB3aWxsIGJlIHNldCB0byB0aGUgZGlyZWN0b3J5IG9mIHRoZSBzdHlsZXNoZWV0LlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJwYXRocy1mcm9tLXhtbFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlBhdGhzIHJlYWQgZnJvbSBYTUwgd2lsbCBiZSBpbnRlcnByZXRlZCBmcm9tIHRoZSBsb2NhdGlvbiBvZiB0aGUgWE1MXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwidmFsdWUgdG8gY29udHJvbCB3aGV0aGVyIHBhdGhzIGluIHRoZSBYTUwgd2lsbCBiZSBpbnRlcnByZXRlZCBmcm9tIHRoZSBsb2NhdGlvbiBvZiB0aGUgWE1MIG9yIGZyb20gdGhlIHdvcmtpbmcgZGlyZWN0b3J5IG9mIHRoZSBwcm9ncmFtIHRoYXQgY2FsbHMgbG9hZF9tYXAoKVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtaW5pbXVtLXZlcnNpb25cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiTWFwbmlrIHZlcnNpb24gd2lsbCBub3QgYmUgZGV0ZWN0ZWQgYW5kIG5vIGVycm9yIHdpbGwgYmUgdGhyb3duIGFib3V0IGNvbXBhdGliaWxpdHlcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBtaW51bXVtIE1hcG5payB2ZXJzaW9uIChlLmcuIDAuNy4yKSBuZWVkZWQgdG8gdXNlIGNlcnRhaW4gZnVuY3Rpb25hbGl0eSBpbiB0aGUgc3R5bGVzaGVldFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmb250LWRpcmVjdG9yeVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJmb250LWRpcmVjdG9yeVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVyaVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIk5vIG1hcC1zcGVjaWZpYyBmb250cyB3aWxsIGJlIHJlZ2lzdGVyZWRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlBhdGggdG8gYSBkaXJlY3Rvcnkgd2hpY2ggaG9sZHMgZm9udHMgd2hpY2ggc2hvdWxkIGJlIHJlZ2lzdGVyZWQgd2hlbiB0aGUgTWFwIGlzIGxvYWRlZCAoaW4gYWRkaXRpb24gdG8gYW55IGZvbnRzIHRoYXQgbWF5IGJlIGF1dG9tYXRpY2FsbHkgcmVnaXN0ZXJlZCkuXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJwb2x5Z29uXCI6IHtcbiAgICAgICAgICAgIFwiZmlsbFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2x5Z29uLWZpbGxcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInJnYmEoMTI4LDEyOCwxMjgsMSlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImdyYXkgYW5kIGZ1bGx5IG9wYXF1ZSAoYWxwaGEgPSAxKSwgc2FtZSBhcyByZ2IoMTI4LDEyOCwxMjgpXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJGaWxsIGNvbG9yIHRvIGFzc2lnbiB0byBhIHBvbHlnb25cIixcbiAgICAgICAgICAgICAgICBcImV4cHJlc3Npb25cIjogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZmlsbC1vcGFjaXR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgb3BhY2l0eSBvZiB0aGUgcG9seWdvblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwib3BhcXVlXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImdhbW1hXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tZ2FtbWFcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZnVsbHkgYW50aWFsaWFzZWRcIixcbiAgICAgICAgICAgICAgICBcInJhbmdlXCI6IFwiMC0xXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJMZXZlbCBvZiBhbnRpYWxpYXNpbmcgb2YgcG9seWdvbiBlZGdlc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnYW1tYS1tZXRob2RcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1nYW1tYS1tZXRob2RcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcInBvd2VyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInRocmVzaG9sZFwiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInBvd2VyXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJwb3coeCxnYW1tYSkgaXMgdXNlZCB0byBjYWxjdWxhdGUgcGl4ZWwgZ2FtbWEsIHdoaWNoIHByb2R1Y2VzIHNsaWdodGx5IHNtb290aGVyIGxpbmUgYW5kIHBvbHlnb24gYW50aWFsaWFzaW5nIHRoYW4gdGhlICdsaW5lYXInIG1ldGhvZCwgd2hpbGUgb3RoZXIgbWV0aG9kcyBhcmUgdXN1YWxseSBvbmx5IHVzZWQgdG8gZGlzYWJsZSBBQVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQW4gQW50aWdyYWluIEdlb21ldHJ5IHNwZWNpZmljIHJlbmRlcmluZyBoaW50IHRvIGNvbnRyb2wgdGhlIHF1YWxpdHkgb2YgYW50aWFsaWFzaW5nLiBVbmRlciB0aGUgaG9vZCBpbiBNYXBuaWsgdGhpcyBtZXRob2QgaXMgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIHRoZSAnZ2FtbWEnIHZhbHVlICh3aGljaCBkZWZhdWx0cyB0byAxKS4gVGhlIG1ldGhvZHMgYXJlIGluIHRoZSBBR0cgc291cmNlIGF0IGh0dHBzOi8vZ2l0aHViLmNvbS9tYXBuaWsvbWFwbmlrL2Jsb2IvbWFzdGVyL2RlcHMvYWdnL2luY2x1ZGUvYWdnX2dhbW1hX2Z1bmN0aW9ucy5oXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNsaXBcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1jbGlwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBiZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYmVmb3JlIHJlbmRlcmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiZ2VvbWV0cmllcyBhcmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJ5IGRlZmF1bHQgZm9yIGJlc3QgcmVuZGVyaW5nIHBlcmZvcm1hbmNlLiBJbiBzb21lIGNhc2VzIHVzZXJzIG1heSB3aXNoIHRvIGRpc2FibGUgdGhpcyB0byBhdm9pZCByZW5kZXJpbmcgYXJ0aWZhY3RzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzbW9vdGhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1zbW9vdGhcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwibm8gc21vb3RoaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJyYW5nZVwiOiBcIjAtMVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU21vb3RocyBvdXQgZ2VvbWV0cnkgYW5nbGVzLiAwIGlzIG5vIHNtb290aGluZywgMSBpcyBmdWxseSBzbW9vdGhlZC4gVmFsdWVzIGdyZWF0ZXIgdGhhbiAxIHdpbGwgcHJvZHVjZSB3aWxkLCBsb29waW5nIGdlb21ldHJpZXMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImdlb21ldHJ5LXRyYW5zZm9ybVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2x5Z29uLWdlb21ldHJ5LXRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZ1bmN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImdlb21ldHJ5IHdpbGwgbm90IGJlIHRyYW5zZm9ybWVkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbGxvd3MgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb25zIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGdlb21ldHJ5LlwiLFxuICAgICAgICAgICAgICAgIFwiZnVuY3Rpb25zXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgW1wibWF0cml4XCIsIDZdLFxuICAgICAgICAgICAgICAgICAgICBbXCJ0cmFuc2xhdGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNjYWxlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJyb3RhdGVcIiwgM10sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdYXCIsIDFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WVwiLCAxXVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNvbXAtb3BcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1jb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBzeW1ib2xpemVyIG9uIHRvcCBvZiBvdGhlciBzeW1ib2xpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgc3ltYm9saXplciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIHN5bWJvbGl6ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImxpbmVcIjoge1xuICAgICAgICAgICAgXCJzdHJva2VcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1jb2xvclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInJnYmEoMCwwLDAsMSlcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiYmxhY2sgYW5kIGZ1bGx5IG9wYXF1ZSAoYWxwaGEgPSAxKSwgc2FtZSBhcyByZ2IoMCwwLDApXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgY29sb3Igb2YgYSBkcmF3biBsaW5lXCIsXG4gICAgICAgICAgICAgICAgXCJleHByZXNzaW9uXCI6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInN0cm9rZS13aWR0aFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLXdpZHRoXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSB3aWR0aCBvZiBhIGxpbmUgaW4gcGl4ZWxzXCIsXG4gICAgICAgICAgICAgICAgXCJleHByZXNzaW9uXCI6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInN0cm9rZS1vcGFjaXR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJvcGFxdWVcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBvcGFjaXR5IG9mIGEgbGluZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzdHJva2UtbGluZWpvaW5cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1qb2luXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibWl0ZXJcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcIm1pdGVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicm91bmRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJiZXZlbFwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBiZWhhdmlvciBvZiBsaW5lcyB3aGVuIGpvaW5pbmdcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3Ryb2tlLWxpbmVjYXBcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1jYXBcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJidXR0XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJidXR0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwicm91bmRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcXVhcmVcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgZGlzcGxheSBvZiBsaW5lIGVuZGluZ3NcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3Ryb2tlLWdhbW1hXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtZ2FtbWFcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZnVsbHkgYW50aWFsaWFzZWRcIixcbiAgICAgICAgICAgICAgICBcInJhbmdlXCI6IFwiMC0xXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJMZXZlbCBvZiBhbnRpYWxpYXNpbmcgb2Ygc3Ryb2tlIGxpbmVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3Ryb2tlLWdhbW1hLW1ldGhvZFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLWdhbW1hLW1ldGhvZFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwicG93ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5lYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJub25lXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidGhyZXNob2xkXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwicG93ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcInBvdyh4LGdhbW1hKSBpcyB1c2VkIHRvIGNhbGN1bGF0ZSBwaXhlbCBnYW1tYSwgd2hpY2ggcHJvZHVjZXMgc2xpZ2h0bHkgc21vb3RoZXIgbGluZSBhbmQgcG9seWdvbiBhbnRpYWxpYXNpbmcgdGhhbiB0aGUgJ2xpbmVhcicgbWV0aG9kLCB3aGlsZSBvdGhlciBtZXRob2RzIGFyZSB1c3VhbGx5IG9ubHkgdXNlZCB0byBkaXNhYmxlIEFBXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbiBBbnRpZ3JhaW4gR2VvbWV0cnkgc3BlY2lmaWMgcmVuZGVyaW5nIGhpbnQgdG8gY29udHJvbCB0aGUgcXVhbGl0eSBvZiBhbnRpYWxpYXNpbmcuIFVuZGVyIHRoZSBob29kIGluIE1hcG5payB0aGlzIG1ldGhvZCBpcyB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGggdGhlICdnYW1tYScgdmFsdWUgKHdoaWNoIGRlZmF1bHRzIHRvIDEpLiBUaGUgbWV0aG9kcyBhcmUgaW4gdGhlIEFHRyBzb3VyY2UgYXQgaHR0cHM6Ly9naXRodWIuY29tL21hcG5pay9tYXBuaWsvYmxvYi9tYXN0ZXIvZGVwcy9hZ2cvaW5jbHVkZS9hZ2dfZ2FtbWFfZnVuY3Rpb25zLmhcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3Ryb2tlLWRhc2hhcnJheVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLWRhc2hhcnJheVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlcnNcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkEgcGFpciBvZiBsZW5ndGggdmFsdWVzIFthLGJdLCB3aGVyZSAoYSkgaXMgdGhlIGRhc2ggbGVuZ3RoIGFuZCAoYikgaXMgdGhlIGdhcCBsZW5ndGggcmVzcGVjdGl2ZWx5LiBNb3JlIHRoYW4gdHdvIHZhbHVlcyBhcmUgc3VwcG9ydGVkIGZvciBtb3JlIGNvbXBsZXggcGF0dGVybnMuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwic29saWQgbGluZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzdHJva2UtZGFzaG9mZnNldFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLWRhc2gtb2Zmc2V0XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyc1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwidmFsaWQgcGFyYW1ldGVyIGJ1dCBub3QgY3VycmVudGx5IHVzZWQgaW4gcmVuZGVyZXJzIChvbmx5IGV4aXN0cyBmb3IgZXhwZXJpbWVudGFsIHN2ZyBzdXBwb3J0IGluIE1hcG5payB3aGljaCBpcyBub3QgeWV0IGVuYWJsZWQpXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwic29saWQgbGluZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzdHJva2UtbWl0ZXJsaW1pdFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLW1pdGVybGltaXRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIGxpbWl0IG9uIHRoZSByYXRpbyBvZiB0aGUgbWl0ZXIgbGVuZ3RoIHRvIHRoZSBzdHJva2Utd2lkdGguIFVzZWQgdG8gYXV0b21hdGljYWxseSBjb252ZXJ0IG1pdGVyIGpvaW5zIHRvIGJldmVsIGpvaW5zIGZvciBzaGFycCBhbmdsZXMgdG8gYXZvaWQgdGhlIG1pdGVyIGV4dGVuZGluZyBiZXlvbmQgdGhlIHRoaWNrbmVzcyBvZiB0aGUgc3Ryb2tpbmcgcGF0aC4gTm9ybWFsbHkgd2lsbCBub3QgbmVlZCB0byBiZSBzZXQsIGJ1dCBhIGxhcmdlciB2YWx1ZSBjYW4gc29tZXRpbWVzIGhlbHAgYXZvaWQgamFnZ3kgYXJ0aWZhY3RzLlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiA0LjAsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJXaWxsIGF1dG8tY29udmVydCBtaXRlcnMgdG8gYmV2ZWwgbGluZSBqb2lucyB3aGVuIHRoZXRhIGlzIGxlc3MgdGhhbiAyOSBkZWdyZWVzIGFzIHBlciB0aGUgU1ZHIHNwZWM6ICdtaXRlckxlbmd0aCAvIHN0cm9rZS13aWR0aCA9IDEgLyBzaW4gKCB0aGV0YSAvIDIgKSdcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY2xpcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLWNsaXBcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJnZW9tZXRyeSB3aWxsIGJlIGNsaXBwZWQgdG8gbWFwIGJvdW5kcyBiZWZvcmUgcmVuZGVyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJnZW9tZXRyaWVzIGFyZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYnkgZGVmYXVsdCBmb3IgYmVzdCByZW5kZXJpbmcgcGVyZm9ybWFuY2UuIEluIHNvbWUgY2FzZXMgdXNlcnMgbWF5IHdpc2ggdG8gZGlzYWJsZSB0aGlzIHRvIGF2b2lkIHJlbmRlcmluZyBhcnRpZmFjdHMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNtb290aFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLXNtb290aFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJubyBzbW9vdGhpbmdcIixcbiAgICAgICAgICAgICAgICBcInJhbmdlXCI6IFwiMC0xXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTbW9vdGhzIG91dCBnZW9tZXRyeSBhbmdsZXMuIDAgaXMgbm8gc21vb3RoaW5nLCAxIGlzIGZ1bGx5IHNtb290aGVkLiBWYWx1ZXMgZ3JlYXRlciB0aGFuIDEgd2lsbCBwcm9kdWNlIHdpbGQsIGxvb3BpbmcgZ2VvbWV0cmllcy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwib2Zmc2V0XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtb2Zmc2V0XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIG9mZnNldFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiT2Zmc2V0cyBhIGxpbmUgYSBudW1iZXIgb2YgcGl4ZWxzIHBhcmFsbGVsIHRvIGl0cyBhY3R1YWwgcGF0aC4gUG9zdGl2ZSB2YWx1ZXMgbW92ZSB0aGUgbGluZSBsZWZ0LCBuZWdhdGl2ZSB2YWx1ZXMgbW92ZSBpdCByaWdodCAocmVsYXRpdmUgdG8gdGhlIGRpcmVjdGlvbmFsaXR5IG9mIHRoZSBsaW5lKS5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicmFzdGVyaXplclwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLXJhc3Rlcml6ZXJcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcImZ1bGxcIixcbiAgICAgICAgICAgICAgICAgICAgXCJmYXN0XCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImZ1bGxcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkV4cG9zZXMgYW4gYWx0ZXJuYXRlIEFHRyByZW5kZXJpbmcgbWV0aG9kIHRoYXQgc2FjcmlmaWNlcyBzb21lIGFjY3VyYWN5IGZvciBzcGVlZC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZ2VvbWV0cnktdHJhbnNmb3JtXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtZ2VvbWV0cnktdHJhbnNmb3JtXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZnVuY3Rpb25zXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBub3QgYmUgdHJhbnNmb3JtZWRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkFsbG93cyB0cmFuc2Zvcm1hdGlvbiBmdW5jdGlvbnMgdG8gYmUgYXBwbGllZCB0byB0aGUgZ2VvbWV0cnkuXCIsXG4gICAgICAgICAgICAgICAgXCJmdW5jdGlvbnNcIjogW1xuICAgICAgICAgICAgICAgICAgICBbXCJtYXRyaXhcIiwgNl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInRyYW5zbGF0ZVwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2NhbGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInJvdGF0ZVwiLCAzXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2tld1hcIiwgMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdZXCIsIDFdXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY29tcC1vcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLWNvbXAtb3BcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiYWRkIHRoZSBjdXJyZW50IHN5bWJvbGl6ZXIgb24gdG9wIG9mIG90aGVyIHN5bWJvbGl6ZXJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBzeW1ib2xpemVyIHNob3VsZCBiZWhhdmUgcmVsYXRpdmUgdG8gc3ltYm9saXplcnMgYXRvcCBvciBiZWxvdyBpdC5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1wiY2xlYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGx1c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzY3JlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGFya2VuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGlnaHRlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWRvZGdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItYnVyblwiLFxuICAgICAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzb2Z0LWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlmZmVyZW5jZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnRyYXN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLW1lcmdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tZXh0cmFjdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNhdHVyYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwibWFya2Vyc1wiOiB7XG4gICAgICAgICAgICBcImZpbGVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLWZpbGVcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkFuIFNWRyBmaWxlIHRoYXQgdGhpcyBtYXJrZXIgc2hvd3MgYXQgZWFjaCBwbGFjZW1lbnQuIElmIG5vIGZpbGUgaXMgZ2l2ZW4sIHRoZSBtYXJrZXIgd2lsbCBzaG93IGFuIGVsbGlwc2UuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJBbiBlbGxpcHNlIG9yIGNpcmNsZSwgaWYgd2lkdGggZXF1YWxzIGhlaWdodFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVyaVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJvcGFjaXR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgb3ZlcmFsbCBvcGFjaXR5IG9mIHRoZSBtYXJrZXIsIGlmIHNldCwgb3ZlcnJpZGVzIGJvdGggdGhlIG9wYWNpdHkgb2YgYm90aCB0aGUgZmlsbCBhbmQgc3Ryb2tlXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJUaGUgc3Ryb2tlLW9wYWNpdHkgYW5kIGZpbGwtb3BhY2l0eSB3aWxsIGJlIHVzZWRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmaWxsLW9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLWZpbGwtb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIGZpbGwgb3BhY2l0eSBvZiB0aGUgbWFya2VyXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJvcGFxdWVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzdHJva2VcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLWxpbmUtY29sb3JcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBjb2xvciBvZiB0aGUgc3Ryb2tlIGFyb3VuZCBhIG1hcmtlciBzaGFwZS5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJibGFja1wiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImNvbG9yXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInN0cm9rZS13aWR0aFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItbGluZS13aWR0aFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIHdpZHRoIG9mIHRoZSBzdHJva2UgYXJvdW5kIGEgbWFya2VyIHNoYXBlLCBpbiBwaXhlbHMuIFRoaXMgaXMgcG9zaXRpb25lZCBvbiB0aGUgYm91bmRhcnksIHNvIGhpZ2ggdmFsdWVzIGNhbiBjb3ZlciB0aGUgYXJlYSBpdHNlbGYuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3Ryb2tlLW9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLWxpbmUtb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwib3BhcXVlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgb3BhY2l0eSBvZiBhIGxpbmVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJwbGFjZW1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLXBsYWNlbWVudFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwicG9pbnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5lXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW50ZXJpb3JcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwicG9pbnRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlBsYWNlIG1hcmtlcnMgYXQgdGhlIGNlbnRlciBwb2ludCAoY2VudHJvaWQpIG9mIHRoZSBnZW9tZXRyeVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQXR0ZW1wdCB0byBwbGFjZSBtYXJrZXJzIG9uIGEgcG9pbnQsIGluIHRoZSBjZW50ZXIgb2YgYSBwb2x5Z29uLCBvciBpZiBtYXJrZXJzLXBsYWNlbWVudDpsaW5lLCB0aGVuIG11bHRpcGxlIHRpbWVzIGFsb25nIGEgbGluZS4gJ2ludGVyaW9yJyBwbGFjZW1lbnQgY2FuIGJlIHVzZWQgdG8gZW5zdXJlIHRoYXQgcG9pbnRzIHBsYWNlZCBvbiBwb2x5Z29ucyBhcmUgZm9yY2VkIHRvIGJlIGluc2lkZSB0aGUgcG9seWdvbiBpbnRlcmlvclwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtdWx0aS1wb2xpY3lcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLW11bHRpLXBvbGljeVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiZWFjaFwiLFxuICAgICAgICAgICAgICAgICAgICBcIndob2xlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGFyZ2VzdFwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJlYWNoXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJJZiBhIGZlYXR1cmUgY29udGFpbnMgbXVsdGlwbGUgZ2VvbWV0cmllcyBhbmQgdGhlIHBsYWNlbWVudCB0eXBlIGlzIGVpdGhlciBwb2ludCBvciBpbnRlcmlvciB0aGVuIGEgbWFya2VyIHdpbGwgYmUgcmVuZGVyZWQgZm9yIGVhY2hcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkEgc3BlY2lhbCBzZXR0aW5nIHRvIGFsbG93IHRoZSB1c2VyIHRvIGNvbnRyb2wgcmVuZGVyaW5nIGJlaGF2aW9yIGZvciAnbXVsdGktZ2VvbWV0cmllcycgKHdoZW4gYSBmZWF0dXJlIGNvbnRhaW5zIG11bHRpcGxlIGdlb21ldHJpZXMpLiBUaGlzIHNldHRpbmcgZG9lcyBub3QgYXBwbHkgdG8gbWFya2VycyBwbGFjZWQgYWxvbmcgbGluZXMuIFRoZSAnZWFjaCcgcG9saWN5IGlzIGRlZmF1bHQgYW5kIG1lYW5zIGFsbCBnZW9tZXRyaWVzIHdpbGwgZ2V0IGEgbWFya2VyLiBUaGUgJ3dob2xlJyBwb2xpY3kgbWVhbnMgdGhhdCB0aGUgYWdncmVnYXRlIGNlbnRyb2lkIGJldHdlZW4gYWxsIGdlb21ldHJpZXMgd2lsbCBiZSB1c2VkLiBUaGUgJ2xhcmdlc3QnIHBvbGljeSBtZWFucyB0aGF0IG9ubHkgdGhlIGxhcmdlc3QgKGJ5IGJvdW5kaW5nIGJveCBhcmVhcykgZmVhdHVyZSB3aWxsIGdldCBhIHJlbmRlcmVkIG1hcmtlciAodGhpcyBpcyBob3cgdGV4dCBsYWJlbGluZyBiZWhhdmVzIGJ5IGRlZmF1bHQpLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtYXJrZXItdHlwZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItdHlwZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiYXJyb3dcIixcbiAgICAgICAgICAgICAgICAgICAgXCJlbGxpcHNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVjdGFuZ2xlXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImVsbGlwc2VcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBkZWZhdWx0IG1hcmtlci10eXBlLiBJZiBhIFNWRyBmaWxlIGlzIG5vdCBnaXZlbiBhcyB0aGUgbWFya2VyLWZpbGUgcGFyYW1ldGVyLCB0aGUgcmVuZGVyZXIgcHJvdmlkZXMgZWl0aGVyIGFuIGFycm93IG9yIGFuIGVsbGlwc2UgKGEgY2lyY2xlIGlmIGhlaWdodCBpcyBlcXVhbCB0byB3aWR0aClcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwid2lkdGhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLXdpZHRoXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEwLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIHdpZHRoIG9mIHRoZSBtYXJrZXIsIGlmIHVzaW5nIG9uZSBvZiB0aGUgZGVmYXVsdCB0eXBlcy5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZXhwcmVzc2lvblwiOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJoZWlnaHRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLWhlaWdodFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxMCxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBoZWlnaHQgb2YgdGhlIG1hcmtlciwgaWYgdXNpbmcgb25lIG9mIHRoZSBkZWZhdWx0IHR5cGVzLlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJleHByZXNzaW9uXCI6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZpbGxcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLWZpbGxcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJibHVlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgY29sb3Igb2YgdGhlIGFyZWEgb2YgdGhlIG1hcmtlci5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgIFwiZXhwcmVzc2lvblwiOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJhbGxvdy1vdmVybGFwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1hbGxvdy1vdmVybGFwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbnRyb2wgd2hldGhlciBvdmVybGFwcGluZyBtYXJrZXJzIGFyZSBzaG93biBvciBoaWRkZW4uXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJEbyBub3QgYWxsb3cgbWFrZXJzIHRvIG92ZXJsYXAgd2l0aCBlYWNoIG90aGVyIC0gb3ZlcmxhcHBpbmcgbWFya2VycyB3aWxsIG5vdCBiZSBzaG93bi5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiaWdub3JlLXBsYWNlbWVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItaWdub3JlLXBsYWNlbWVudFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJkbyBub3Qgc3RvcmUgdGhlIGJib3ggb2YgdGhpcyBnZW9tZXRyeSBpbiB0aGUgY29sbGlzaW9uIGRldGVjdG9yIGNhY2hlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJ2YWx1ZSB0byBjb250cm9sIHdoZXRoZXIgdGhlIHBsYWNlbWVudCBvZiB0aGUgZmVhdHVyZSB3aWxsIHByZXZlbnQgdGhlIHBsYWNlbWVudCBvZiBvdGhlciBmZWF0dXJlc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzcGFjaW5nXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1zcGFjaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTcGFjZSBiZXR3ZWVuIHJlcGVhdGVkIGxhYmVsc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibWF4LWVycm9yXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1tYXgtZXJyb3JcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLjIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgbWF4aW11bSBkaWZmZXJlbmNlIGJldHdlZW4gYWN0dWFsIG1hcmtlciBwbGFjZW1lbnQgYW5kIHRoZSBtYXJrZXItc3BhY2luZyBwYXJhbWV0ZXIuIFNldHRpbmcgYSBoaWdoIHZhbHVlIGNhbiBhbGxvdyB0aGUgcmVuZGVyZXIgdG8gdHJ5IHRvIHJlc29sdmUgcGxhY2VtZW50IGNvbmZsaWN0cyB3aXRoIG90aGVyIHN5bWJvbGl6ZXJzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLXRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZ1bmN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIFwiZnVuY3Rpb25zXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgW1wibWF0cml4XCIsIDZdLFxuICAgICAgICAgICAgICAgICAgICBbXCJ0cmFuc2xhdGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNjYWxlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJyb3RhdGVcIiwgM10sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdYXCIsIDFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WVwiLCAxXVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyB0cmFuc2Zvcm1hdGlvblwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU1ZHIHRyYW5zZm9ybWF0aW9uIGRlZmluaXRpb25cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY2xpcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItY2xpcFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImdlb21ldHJ5IHdpbGwgYmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJlZm9yZSByZW5kZXJpbmdcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcImdlb21ldHJpZXMgYXJlIGNsaXBwZWQgdG8gbWFwIGJvdW5kcyBieSBkZWZhdWx0IGZvciBiZXN0IHJlbmRlcmluZyBwZXJmb3JtYW5jZS4gSW4gc29tZSBjYXNlcyB1c2VycyBtYXkgd2lzaCB0byBkaXNhYmxlIHRoaXMgdG8gYXZvaWQgcmVuZGVyaW5nIGFydGlmYWN0cy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic21vb3RoXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1zbW9vdGhcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwibm8gc21vb3RoaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJyYW5nZVwiOiBcIjAtMVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU21vb3RocyBvdXQgZ2VvbWV0cnkgYW5nbGVzLiAwIGlzIG5vIHNtb290aGluZywgMSBpcyBmdWxseSBzbW9vdGhlZC4gVmFsdWVzIGdyZWF0ZXIgdGhhbiAxIHdpbGwgcHJvZHVjZSB3aWxkLCBsb29waW5nIGdlb21ldHJpZXMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImdlb21ldHJ5LXRyYW5zZm9ybVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItZ2VvbWV0cnktdHJhbnNmb3JtXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZnVuY3Rpb25zXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBub3QgYmUgdHJhbnNmb3JtZWRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkFsbG93cyB0cmFuc2Zvcm1hdGlvbiBmdW5jdGlvbnMgdG8gYmUgYXBwbGllZCB0byB0aGUgZ2VvbWV0cnkuXCIsXG4gICAgICAgICAgICAgICAgXCJmdW5jdGlvbnNcIjogW1xuICAgICAgICAgICAgICAgICAgICBbXCJtYXRyaXhcIiwgNl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInRyYW5zbGF0ZVwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2NhbGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInJvdGF0ZVwiLCAzXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2tld1hcIiwgMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdZXCIsIDFdXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY29tcC1vcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItY29tcC1vcFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJhZGQgdGhlIGN1cnJlbnQgc3ltYm9saXplciBvbiB0b3Agb2Ygb3RoZXIgc3ltYm9saXplclwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQ29tcG9zaXRlIG9wZXJhdGlvbi4gVGhpcyBkZWZpbmVzIGhvdyB0aGlzIHN5bWJvbGl6ZXIgc2hvdWxkIGJlaGF2ZSByZWxhdGl2ZSB0byBzeW1ib2xpemVycyBhdG9wIG9yIGJlbG93IGl0LlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXCJjbGVhclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyY1wiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtaW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtaW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ4b3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwbHVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibWludXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtdWx0aXBseVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNjcmVlblwiLFxuICAgICAgICAgICAgICAgICAgICBcIm92ZXJsYXlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkYXJrZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaWdodGVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItZG9kZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1idXJuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaGFyZC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNvZnQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkaWZmZXJlbmNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZXhjbHVzaW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29udHJhc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnQtcmdiXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tbWVyZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1leHRyYWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaHVlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2F0dXJhdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIlxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJzaGllbGRcIjoge1xuICAgICAgICAgICAgXCJuYW1lXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1uYW1lXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJleHByZXNzaW9uXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJzZXJpYWxpemF0aW9uXCI6IFwiY29udGVudFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVmFsdWUgdG8gdXNlIGZvciBhIHNoaWVsZFxcXCJzIHRleHQgbGFiZWwuIERhdGEgY29sdW1ucyBhcmUgc3BlY2lmaWVkIHVzaW5nIGJyYWNrZXRzIGxpa2UgW2NvbHVtbl9uYW1lXVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmaWxlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1maWxlXCIsXG4gICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVyaVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkltYWdlIGZpbGUgdG8gcmVuZGVyIGJlaGluZCB0aGUgc2hpZWxkIHRleHRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZmFjZS1uYW1lXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1mYWNlLW5hbWVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICBcInZhbGlkYXRlXCI6IFwiZm9udFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRm9udCBuYW1lIGFuZCBzdHlsZSB0byB1c2UgZm9yIHRoZSBzaGllbGQgdGV4dFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidW5sb2NrLWltYWdlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC11bmxvY2staW1hZ2VcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGlzIHBhcmFtZXRlciBzaG91bGQgYmUgc2V0IHRvIHRydWUgaWYgeW91IGFyZSB0cnlpbmcgdG8gcG9zaXRpb24gdGV4dCBiZXNpZGUgcmF0aGVyIHRoYW4gb24gdG9wIG9mIHRoZSBzaGllbGQgaW1hZ2VcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJ0ZXh0IGFsaWdubWVudCByZWxhdGl2ZSB0byB0aGUgc2hpZWxkIGltYWdlIHVzZXMgdGhlIGNlbnRlciBvZiB0aGUgaW1hZ2UgYXMgdGhlIGFuY2hvciBmb3IgdGV4dCBwb3NpdGlvbmluZy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic2l6ZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtc2l6ZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgc2l6ZSBvZiB0aGUgc2hpZWxkIHRleHQgaW4gcGl4ZWxzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZpbGxcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWZpbGxcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIGNvbG9yIG9mIHRoZSBzaGllbGQgdGV4dFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJwbGFjZW1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXBsYWNlbWVudFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwicG9pbnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5lXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmVydGV4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW50ZXJpb3JcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwicG9pbnRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkhvdyB0aGlzIHNoaWVsZCBzaG91bGQgYmUgcGxhY2VkLiBQb2ludCBwbGFjZW1lbnQgYXR0ZW1wdHMgdG8gcGxhY2UgaXQgb24gdG9wIG9mIHBvaW50cywgbGluZSBwbGFjZXMgYWxvbmcgbGluZXMgbXVsdGlwbGUgdGltZXMgcGVyIGZlYXR1cmUsIHZlcnRleCBwbGFjZXMgb24gdGhlIHZlcnRleGVzIG9mIHBvbHlnb25zLCBhbmQgaW50ZXJpb3IgYXR0ZW1wdHMgdG8gcGxhY2UgaW5zaWRlIG9mIHBvbHlnb25zLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJhdm9pZC1lZGdlc1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtYXZvaWQtZWRnZXNcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRlbGwgcG9zaXRpb25pbmcgYWxnb3JpdGhtIHRvIGF2b2lkIGxhYmVsaW5nIG5lYXIgaW50ZXJzZWN0aW9uIGVkZ2VzLlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImFsbG93LW92ZXJsYXBcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWFsbG93LW92ZXJsYXBcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQ29udHJvbCB3aGV0aGVyIG92ZXJsYXBwaW5nIHNoaWVsZHMgYXJlIHNob3duIG9yIGhpZGRlbi5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIkRvIG5vdCBhbGxvdyBzaGllbGRzIHRvIG92ZXJsYXAgd2l0aCBvdGhlciBtYXAgZWxlbWVudHMgYWxyZWFkeSBwbGFjZWQuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm1pbmltdW0tZGlzdGFuY2VcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLW1pbi1kaXN0YW5jZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJNaW5pbXVtIGRpc3RhbmNlIHRvIHRoZSBuZXh0IHNoaWVsZCBzeW1ib2wsIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBzaGllbGQuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNwYWNpbmdcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXNwYWNpbmdcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIHNwYWNpbmcgYmV0d2VlbiByZXBlYXRlZCBvY2N1cnJlbmNlcyBvZiB0aGUgc2FtZSBzaGllbGQgb24gYSBsaW5lXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm1pbmltdW0tcGFkZGluZ1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtbWluLXBhZGRpbmdcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkRldGVybWluZXMgdGhlIG1pbmltdW0gYW1vdW50IG9mIHBhZGRpbmcgdGhhdCBhIHNoaWVsZCBnZXRzIHJlbGF0aXZlIHRvIG90aGVyIHNoaWVsZHNcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ3cmFwLXdpZHRoXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC13cmFwLXdpZHRoXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwidW5zaWduZWRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkxlbmd0aCBvZiBhIGNodW5rIG9mIHRleHQgaW4gY2hhcmFjdGVycyBiZWZvcmUgd3JhcHBpbmcgdGV4dFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ3cmFwLWJlZm9yZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtd3JhcC1iZWZvcmVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiV3JhcCB0ZXh0IGJlZm9yZSB3cmFwLXdpZHRoIGlzIHJlYWNoZWQuIElmIGZhbHNlLCB3cmFwcGVkIGxpbmVzIHdpbGwgYmUgYSBiaXQgbG9uZ2VyIHRoYW4gd3JhcC13aWR0aC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwid3JhcC1jaGFyYWN0ZXJcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXdyYXAtY2hhcmFjdGVyXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiIFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVXNlIHRoaXMgY2hhcmFjdGVyIGluc3RlYWQgb2YgYSBzcGFjZSB0byB3cmFwIGxvbmcgbmFtZXMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImhhbG8tZmlsbFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtaGFsby1maWxsXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIjRkZGRkZGXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU3BlY2lmaWVzIHRoZSBjb2xvciBvZiB0aGUgaGFsbyBhcm91bmQgdGhlIHRleHQuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImhhbG8tcmFkaXVzXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1oYWxvLXJhZGl1c1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU3BlY2lmeSB0aGUgcmFkaXVzIG9mIHRoZSBoYWxvIGluIHBpeGVsc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwibm8gaGFsb1wiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNoYXJhY3Rlci1zcGFjaW5nXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1jaGFyYWN0ZXItc3BhY2luZ1wiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVuc2lnbmVkXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJIb3Jpem9udGFsIHNwYWNpbmcgYmV0d2VlbiBjaGFyYWN0ZXJzIChpbiBwaXhlbHMpLiBDdXJyZW50bHkgd29ya3MgZm9yIHBvaW50IHBsYWNlbWVudCBvbmx5LCBub3QgbGluZSBwbGFjZW1lbnQuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImxpbmUtc3BhY2luZ1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtbGluZS1zcGFjaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJWZXJ0aWNhbCBzcGFjaW5nIGJldHdlZW4gbGluZXMgb2YgbXVsdGlsaW5lIGxhYmVscyAoaW4gcGl4ZWxzKVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVuc2lnbmVkXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImR4XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC10ZXh0LWR4XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkRpc3BsYWNlIHRleHQgd2l0aGluIHNoaWVsZCBieSBmaXhlZCBhbW91bnQsIGluIHBpeGVscywgKy8tIGFsb25nIHRoZSBYIGF4aXMuICBBIHBvc2l0aXZlIHZhbHVlIHdpbGwgc2hpZnQgdGhlIHRleHQgcmlnaHRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXRleHQtZHlcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRGlzcGxhY2UgdGV4dCB3aXRoaW4gc2hpZWxkIGJ5IGZpeGVkIGFtb3VudCwgaW4gcGl4ZWxzLCArLy0gYWxvbmcgdGhlIFkgYXhpcy4gIEEgcG9zaXRpdmUgdmFsdWUgd2lsbCBzaGlmdCB0aGUgdGV4dCBkb3duXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNoaWVsZC1keFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtZHhcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRGlzcGxhY2Ugc2hpZWxkIGJ5IGZpeGVkIGFtb3VudCwgaW4gcGl4ZWxzLCArLy0gYWxvbmcgdGhlIFggYXhpcy4gIEEgcG9zaXRpdmUgdmFsdWUgd2lsbCBzaGlmdCB0aGUgdGV4dCByaWdodFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzaGllbGQtZHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkRpc3BsYWNlIHNoaWVsZCBieSBmaXhlZCBhbW91bnQsIGluIHBpeGVscywgKy8tIGFsb25nIHRoZSBZIGF4aXMuICBBIHBvc2l0aXZlIHZhbHVlIHdpbGwgc2hpZnQgdGhlIHRleHQgZG93blwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJvcGFjaXR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIihEZWZhdWx0IDEuMCkgLSBvcGFjaXR5IG9mIHRoZSBpbWFnZSB1c2VkIGZvciB0aGUgc2hpZWxkXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInRleHQtb3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtdGV4dC1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIihEZWZhdWx0IDEuMCkgLSBvcGFjaXR5IG9mIHRoZSB0ZXh0IHBsYWNlZCBvbiB0b3Agb2YgdGhlIHNoaWVsZFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJob3Jpem9udGFsLWFsaWdubWVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtaG9yaXpvbnRhbC1hbGlnbm1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcImxlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaWRkbGVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyaWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImF1dG9cIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgc2hpZWxkJ3MgaG9yaXpvbnRhbCBhbGlnbm1lbnQgZnJvbSBpdHMgY2VudGVycG9pbnRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJhdXRvXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInZlcnRpY2FsLWFsaWdubWVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtdmVydGljYWwtYWxpZ25tZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJ0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaWRkbGVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJib3R0b21cIixcbiAgICAgICAgICAgICAgICAgICAgXCJhdXRvXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIHNoaWVsZCdzIHZlcnRpY2FsIGFsaWdubWVudCBmcm9tIGl0cyBjZW50ZXJwb2ludFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm1pZGRsZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ0ZXh0LXRyYW5zZm9ybVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtdGV4dC10cmFuc2Zvcm1cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ1cHBlcmNhc2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsb3dlcmNhc2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjYXBpdGFsaXplXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVHJhbnNmb3JtIHRoZSBjYXNlIG9mIHRoZSBjaGFyYWN0ZXJzXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibm9uZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJqdXN0aWZ5LWFsaWdubWVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtanVzdGlmeS1hbGlnbm1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcImxlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyaWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImF1dG9cIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEZWZpbmUgaG93IHRleHQgaW4gYSBzaGllbGQncyBsYWJlbCBpcyBqdXN0aWZpZWRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJhdXRvXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNsaXBcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWNsaXBcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJnZW9tZXRyeSB3aWxsIGJlIGNsaXBwZWQgdG8gbWFwIGJvdW5kcyBiZWZvcmUgcmVuZGVyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJnZW9tZXRyaWVzIGFyZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYnkgZGVmYXVsdCBmb3IgYmVzdCByZW5kZXJpbmcgcGVyZm9ybWFuY2UuIEluIHNvbWUgY2FzZXMgdXNlcnMgbWF5IHdpc2ggdG8gZGlzYWJsZSB0aGlzIHRvIGF2b2lkIHJlbmRlcmluZyBhcnRpZmFjdHMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNvbXAtb3BcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWNvbXAtb3BcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiYWRkIHRoZSBjdXJyZW50IHN5bWJvbGl6ZXIgb24gdG9wIG9mIG90aGVyIHN5bWJvbGl6ZXJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBzeW1ib2xpemVyIHNob3VsZCBiZWhhdmUgcmVsYXRpdmUgdG8gc3ltYm9saXplcnMgYXRvcCBvciBiZWxvdyBpdC5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1wiY2xlYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGx1c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzY3JlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGFya2VuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGlnaHRlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWRvZGdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItYnVyblwiLFxuICAgICAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzb2Z0LWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlmZmVyZW5jZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnRyYXN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLW1lcmdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tZXh0cmFjdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNhdHVyYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwibGluZS1wYXR0ZXJuXCI6IHtcbiAgICAgICAgICAgIFwiZmlsZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLXBhdHRlcm4tZmlsZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVyaVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbiBpbWFnZSBmaWxlIHRvIGJlIHJlcGVhdGVkIGFuZCB3YXJwZWQgYWxvbmcgYSBsaW5lXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNsaXBcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1wYXR0ZXJuLWNsaXBcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJnZW9tZXRyeSB3aWxsIGJlIGNsaXBwZWQgdG8gbWFwIGJvdW5kcyBiZWZvcmUgcmVuZGVyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJnZW9tZXRyaWVzIGFyZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYnkgZGVmYXVsdCBmb3IgYmVzdCByZW5kZXJpbmcgcGVyZm9ybWFuY2UuIEluIHNvbWUgY2FzZXMgdXNlcnMgbWF5IHdpc2ggdG8gZGlzYWJsZSB0aGlzIHRvIGF2b2lkIHJlbmRlcmluZyBhcnRpZmFjdHMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNtb290aFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLXBhdHRlcm4tc21vb3RoXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIHNtb290aGluZ1wiLFxuICAgICAgICAgICAgICAgIFwicmFuZ2VcIjogXCIwLTFcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNtb290aHMgb3V0IGdlb21ldHJ5IGFuZ2xlcy4gMCBpcyBubyBzbW9vdGhpbmcsIDEgaXMgZnVsbHkgc21vb3RoZWQuIFZhbHVlcyBncmVhdGVyIHRoYW4gMSB3aWxsIHByb2R1Y2Ugd2lsZCwgbG9vcGluZyBnZW9tZXRyaWVzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnZW9tZXRyeS10cmFuc2Zvcm1cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1wYXR0ZXJuLWdlb21ldHJ5LXRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZ1bmN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImdlb21ldHJ5IHdpbGwgbm90IGJlIHRyYW5zZm9ybWVkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbGxvd3MgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb25zIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGdlb21ldHJ5LlwiLFxuICAgICAgICAgICAgICAgIFwiZnVuY3Rpb25zXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgW1wibWF0cml4XCIsIDZdLFxuICAgICAgICAgICAgICAgICAgICBbXCJ0cmFuc2xhdGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNjYWxlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJyb3RhdGVcIiwgM10sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdYXCIsIDFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WVwiLCAxXVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNvbXAtb3BcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1wYXR0ZXJuLWNvbXAtb3BcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiYWRkIHRoZSBjdXJyZW50IHN5bWJvbGl6ZXIgb24gdG9wIG9mIG90aGVyIHN5bWJvbGl6ZXJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBzeW1ib2xpemVyIHNob3VsZCBiZWhhdmUgcmVsYXRpdmUgdG8gc3ltYm9saXplcnMgYXRvcCBvciBiZWxvdyBpdC5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1wiY2xlYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGx1c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzY3JlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGFya2VuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGlnaHRlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWRvZGdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItYnVyblwiLFxuICAgICAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzb2Z0LWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlmZmVyZW5jZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnRyYXN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLW1lcmdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tZXh0cmFjdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNhdHVyYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwicG9seWdvbi1wYXR0ZXJuXCI6IHtcbiAgICAgICAgICAgIFwiZmlsZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2x5Z29uLXBhdHRlcm4tZmlsZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVyaVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJJbWFnZSB0byB1c2UgYXMgYSByZXBlYXRlZCBwYXR0ZXJuIGZpbGwgd2l0aGluIGEgcG9seWdvblwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJhbGlnbm1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1wYXR0ZXJuLWFsaWdubWVudFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwibG9jYWxcIixcbiAgICAgICAgICAgICAgICAgICAgXCJnbG9iYWxcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibG9jYWxcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNwZWNpZnkgd2hldGhlciB0byBhbGlnbiBwYXR0ZXJuIGZpbGxzIHRvIHRoZSBsYXllciBvciB0byB0aGUgbWFwLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnYW1tYVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2x5Z29uLXBhdHRlcm4tZ2FtbWFcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZnVsbHkgYW50aWFsaWFzZWRcIixcbiAgICAgICAgICAgICAgICBcInJhbmdlXCI6IFwiMC0xXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJMZXZlbCBvZiBhbnRpYWxpYXNpbmcgb2YgcG9seWdvbiBwYXR0ZXJuIGVkZ2VzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1wYXR0ZXJuLW9wYWNpdHlcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiKERlZmF1bHQgMS4wKSAtIEFwcGx5IGFuIG9wYWNpdHkgbGV2ZWwgdG8gdGhlIGltYWdlIHVzZWQgZm9yIHRoZSBwYXR0ZXJuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJUaGUgaW1hZ2UgaXMgcmVuZGVyZWQgd2l0aG91dCBtb2RpZmljYXRpb25zXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNsaXBcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1wYXR0ZXJuLWNsaXBcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJnZW9tZXRyeSB3aWxsIGJlIGNsaXBwZWQgdG8gbWFwIGJvdW5kcyBiZWZvcmUgcmVuZGVyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJnZW9tZXRyaWVzIGFyZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYnkgZGVmYXVsdCBmb3IgYmVzdCByZW5kZXJpbmcgcGVyZm9ybWFuY2UuIEluIHNvbWUgY2FzZXMgdXNlcnMgbWF5IHdpc2ggdG8gZGlzYWJsZSB0aGlzIHRvIGF2b2lkIHJlbmRlcmluZyBhcnRpZmFjdHMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNtb290aFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2x5Z29uLXBhdHRlcm4tc21vb3RoXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIHNtb290aGluZ1wiLFxuICAgICAgICAgICAgICAgIFwicmFuZ2VcIjogXCIwLTFcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNtb290aHMgb3V0IGdlb21ldHJ5IGFuZ2xlcy4gMCBpcyBubyBzbW9vdGhpbmcsIDEgaXMgZnVsbHkgc21vb3RoZWQuIFZhbHVlcyBncmVhdGVyIHRoYW4gMSB3aWxsIHByb2R1Y2Ugd2lsZCwgbG9vcGluZyBnZW9tZXRyaWVzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnZW9tZXRyeS10cmFuc2Zvcm1cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1wYXR0ZXJuLWdlb21ldHJ5LXRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZ1bmN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImdlb21ldHJ5IHdpbGwgbm90IGJlIHRyYW5zZm9ybWVkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbGxvd3MgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb25zIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGdlb21ldHJ5LlwiLFxuICAgICAgICAgICAgICAgIFwiZnVuY3Rpb25zXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgW1wibWF0cml4XCIsIDZdLFxuICAgICAgICAgICAgICAgICAgICBbXCJ0cmFuc2xhdGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNjYWxlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJyb3RhdGVcIiwgM10sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdYXCIsIDFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WVwiLCAxXVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNvbXAtb3BcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1wYXR0ZXJuLWNvbXAtb3BcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiYWRkIHRoZSBjdXJyZW50IHN5bWJvbGl6ZXIgb24gdG9wIG9mIG90aGVyIHN5bWJvbGl6ZXJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBzeW1ib2xpemVyIHNob3VsZCBiZWhhdmUgcmVsYXRpdmUgdG8gc3ltYm9saXplcnMgYXRvcCBvciBiZWxvdyBpdC5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1wiY2xlYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGx1c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzY3JlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGFya2VuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGlnaHRlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWRvZGdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItYnVyblwiLFxuICAgICAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzb2Z0LWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlmZmVyZW5jZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnRyYXN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLW1lcmdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tZXh0cmFjdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNhdHVyYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwicmFzdGVyXCI6IHtcbiAgICAgICAgICAgIFwib3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJyYXN0ZXItb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwib3BhcXVlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBvcGFjaXR5IG9mIHRoZSByYXN0ZXIgc3ltYm9saXplciBvbiB0b3Agb2Ygb3RoZXIgc3ltYm9saXplcnMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZpbHRlci1mYWN0b3JcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicmFzdGVyLWZpbHRlci1mYWN0b3JcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogLTEsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJBbGxvdyB0aGUgZGF0YXNvdXJjZSB0byBjaG9vc2UgYXBwcm9wcmlhdGUgZG93bnNjYWxpbmcuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoaXMgaXMgdXNlZCBieSB0aGUgUmFzdGVyIG9yIEdkYWwgZGF0YXNvdXJjZXMgdG8gcHJlLWRvd25zY2FsZSBpbWFnZXMgdXNpbmcgb3ZlcnZpZXdzLiBIaWdoZXIgbnVtYmVycyBjYW4gc29tZXRpbWVzIGNhdXNlIG11Y2ggYmV0dGVyIHNjYWxlZCBpbWFnZSBvdXRwdXQsIGF0IHRoZSBjb3N0IG9mIHNwZWVkLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzY2FsaW5nXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInJhc3Rlci1zY2FsaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJuZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImJpbGluZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYmlsaW5lYXI4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYmljdWJpY1wiLFxuICAgICAgICAgICAgICAgICAgICBcInNwbGluZTE2XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3BsaW5lMzZcIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYW5uaW5nXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaGFtbWluZ1wiLFxuICAgICAgICAgICAgICAgICAgICBcImhlcm1pdGVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJrYWlzZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJxdWFkcmljXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY2F0cm9tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ2F1c3NpYW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJiZXNzZWxcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaXRjaGVsbFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNpbmNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsYW5jem9zXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYmxhY2ttYW5cIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibmVhclwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIHNjYWxpbmcgYWxnb3JpdGhtIHVzZWQgdG8gbWFraW5nIGRpZmZlcmVudCByZXNvbHV0aW9uIHZlcnNpb25zIG9mIHRoaXMgcmFzdGVyIGxheWVyLiBCaWxpbmVhciBpcyBhIGdvb2QgY29tcHJvbWlzZSBiZXR3ZWVuIHNwZWVkIGFuZCBhY2N1cmFjeSwgd2hpbGUgbGFuY3pvcyBnaXZlcyB0aGUgaGlnaGVzdCBxdWFsaXR5LlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtZXNoLXNpemVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicmFzdGVyLW1lc2gtc2l6ZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxNixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlJlcHJvamVjdGlvbiBtZXNoIHdpbGwgYmUgMS8xNiBvZiB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgc291cmNlIGltYWdlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwidW5zaWduZWRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkEgcmVkdWNlZCByZXNvbHV0aW9uIG1lc2ggaXMgdXNlZCBmb3IgcmFzdGVyIHJlcHJvamVjdGlvbiwgYW5kIHRoZSB0b3RhbCBpbWFnZSBzaXplIGlzIGRpdmlkZWQgYnkgdGhlIG1lc2gtc2l6ZSB0byBkZXRlcm1pbmUgdGhlIHF1YWxpdHkgb2YgdGhhdCBtZXNoLiBWYWx1ZXMgZm9yIG1lc2gtc2l6ZSBsYXJnZXIgdGhhbiB0aGUgZGVmYXVsdCB3aWxsIHJlc3VsdCBpbiBmYXN0ZXIgcmVwcm9qZWN0aW9uIGJ1dCBtaWdodCBsZWFkIHRvIGRpc3RvcnRpb24uXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNvbXAtb3BcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicmFzdGVyLWNvbXAtb3BcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiYWRkIHRoZSBjdXJyZW50IHN5bWJvbGl6ZXIgb24gdG9wIG9mIG90aGVyIHN5bWJvbGl6ZXJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBzeW1ib2xpemVyIHNob3VsZCBiZWhhdmUgcmVsYXRpdmUgdG8gc3ltYm9saXplcnMgYXRvcCBvciBiZWxvdyBpdC5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1wiY2xlYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGx1c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzY3JlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGFya2VuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGlnaHRlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWRvZGdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItYnVyblwiLFxuICAgICAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzb2Z0LWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlmZmVyZW5jZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnRyYXN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLW1lcmdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tZXh0cmFjdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNhdHVyYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwicG9pbnRcIjoge1xuICAgICAgICAgICAgXCJmaWxlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvaW50LWZpbGVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1cmlcIixcbiAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkltYWdlIGZpbGUgdG8gcmVwcmVzZW50IGEgcG9pbnRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiYWxsb3ctb3ZlcmxhcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2ludC1hbGxvdy1vdmVybGFwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbnRyb2wgd2hldGhlciBvdmVybGFwcGluZyBwb2ludHMgYXJlIHNob3duIG9yIGhpZGRlbi5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIkRvIG5vdCBhbGxvdyBwb2ludHMgdG8gb3ZlcmxhcCB3aXRoIGVhY2ggb3RoZXIgLSBvdmVybGFwcGluZyBtYXJrZXJzIHdpbGwgbm90IGJlIHNob3duLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJpZ25vcmUtcGxhY2VtZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvaW50LWlnbm9yZS1wbGFjZW1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZG8gbm90IHN0b3JlIHRoZSBiYm94IG9mIHRoaXMgZ2VvbWV0cnkgaW4gdGhlIGNvbGxpc2lvbiBkZXRlY3RvciBjYWNoZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwidmFsdWUgdG8gY29udHJvbCB3aGV0aGVyIHRoZSBwbGFjZW1lbnQgb2YgdGhlIGZlYXR1cmUgd2lsbCBwcmV2ZW50IHRoZSBwbGFjZW1lbnQgb2Ygb3RoZXIgZmVhdHVyZXNcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwib3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2ludC1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMS4wLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiRnVsbHkgb3BhcXVlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBIHZhbHVlIGZyb20gMCB0byAxIHRvIGNvbnRyb2wgdGhlIG9wYWNpdHkgb2YgdGhlIHBvaW50XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInBsYWNlbWVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2ludC1wbGFjZW1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcImNlbnRyb2lkXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW50ZXJpb3JcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJIb3cgdGhpcyBwb2ludCBzaG91bGQgYmUgcGxhY2VkLiBDZW50cm9pZCBjYWxjdWxhdGVzIHRoZSBnZW9tZXRyaWMgY2VudGVyIG9mIGEgcG9seWdvbiwgd2hpY2ggY2FuIGJlIG91dHNpZGUgb2YgaXQsIHdoaWxlIGludGVyaW9yIGFsd2F5cyBwbGFjZXMgaW5zaWRlIG9mIGEgcG9seWdvbi5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJjZW50cm9pZFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9pbnQtdHJhbnNmb3JtXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZnVuY3Rpb25zXCIsXG4gICAgICAgICAgICAgICAgXCJmdW5jdGlvbnNcIjogW1xuICAgICAgICAgICAgICAgICAgICBbXCJtYXRyaXhcIiwgNl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInRyYW5zbGF0ZVwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2NhbGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInJvdGF0ZVwiLCAzXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2tld1hcIiwgMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdZXCIsIDFdXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIk5vIHRyYW5zZm9ybWF0aW9uXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTVkcgdHJhbnNmb3JtYXRpb24gZGVmaW5pdGlvblwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvaW50LWNvbXAtb3BcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiYWRkIHRoZSBjdXJyZW50IHN5bWJvbGl6ZXIgb24gdG9wIG9mIG90aGVyIHN5bWJvbGl6ZXJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBzeW1ib2xpemVyIHNob3VsZCBiZWhhdmUgcmVsYXRpdmUgdG8gc3ltYm9saXplcnMgYXRvcCBvciBiZWxvdyBpdC5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1wiY2xlYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGx1c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzY3JlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGFya2VuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGlnaHRlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWRvZGdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItYnVyblwiLFxuICAgICAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzb2Z0LWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlmZmVyZW5jZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnRyYXN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLW1lcmdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tZXh0cmFjdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNhdHVyYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwidGV4dFwiOiB7XG4gICAgICAgICAgICBcIm5hbWVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1uYW1lXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJleHByZXNzaW9uXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFwic2VyaWFsaXphdGlvblwiOiBcImNvbnRlbnRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlZhbHVlIHRvIHVzZSBmb3IgYSB0ZXh0IGxhYmVsLiBEYXRhIGNvbHVtbnMgYXJlIHNwZWNpZmllZCB1c2luZyBicmFja2V0cyBsaWtlIFtjb2x1bW5fbmFtZV1cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZmFjZS1uYW1lXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtZmFjZS1uYW1lXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJ2YWxpZGF0ZVwiOiBcImZvbnRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkZvbnQgbmFtZSBhbmQgc3R5bGUgdG8gcmVuZGVyIGEgbGFiZWwgaW5cIixcbiAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNpemVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1zaXplXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMTAsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUZXh0IHNpemUgaW4gcGl4ZWxzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInRleHQtcmF0aW9cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1yYXRpb1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRGVmaW5lIHRoZSBhbW91bnQgb2YgdGV4dCAob2YgdGhlIHRvdGFsKSBwcmVzZW50IG9uIHN1Y2Nlc3NpdmUgbGluZXMgd2hlbiB3cmFwcGluZyBvY2N1cnNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1bnNpZ25lZFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ3cmFwLXdpZHRoXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtd3JhcC13aWR0aFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiTGVuZ3RoIG9mIGEgY2h1bmsgb2YgdGV4dCBpbiBjaGFyYWN0ZXJzIGJlZm9yZSB3cmFwcGluZyB0ZXh0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwidW5zaWduZWRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwid3JhcC1iZWZvcmVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC13cmFwLWJlZm9yZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJXcmFwIHRleHQgYmVmb3JlIHdyYXAtd2lkdGggaXMgcmVhY2hlZC4gSWYgZmFsc2UsIHdyYXBwZWQgbGluZXMgd2lsbCBiZSBhIGJpdCBsb25nZXIgdGhhbiB3cmFwLXdpZHRoLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ3cmFwLWNoYXJhY3RlclwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LXdyYXAtY2hhcmFjdGVyXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiIFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVXNlIHRoaXMgY2hhcmFjdGVyIGluc3RlYWQgb2YgYSBzcGFjZSB0byB3cmFwIGxvbmcgdGV4dC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3BhY2luZ1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LXNwYWNpbmdcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1bnNpZ25lZFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRGlzdGFuY2UgYmV0d2VlbiByZXBlYXRlZCB0ZXh0IGxhYmVscyBvbiBhIGxpbmUgKGFrYS4gbGFiZWwtc3BhY2luZylcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY2hhcmFjdGVyLXNwYWNpbmdcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1jaGFyYWN0ZXItc3BhY2luZ1wiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJIb3Jpem9udGFsIHNwYWNpbmcgYWRqdXN0bWVudCBiZXR3ZWVuIGNoYXJhY3RlcnMgaW4gcGl4ZWxzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImxpbmUtc3BhY2luZ1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWxpbmUtc3BhY2luZ1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVuc2lnbmVkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJWZXJ0aWNhbCBzcGFjaW5nIGFkanVzdG1lbnQgYmV0d2VlbiBsaW5lcyBpbiBwaXhlbHNcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibGFiZWwtcG9zaXRpb24tdG9sZXJhbmNlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtbGFiZWwtcG9zaXRpb24tdG9sZXJhbmNlXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwidW5zaWduZWRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkFsbG93cyB0aGUgbGFiZWwgdG8gYmUgZGlzcGxhY2VkIGZyb20gaXRzIGlkZWFsIHBvc2l0aW9uIGJ5IGEgbnVtYmVyIG9mIHBpeGVscyAob25seSB3b3JrcyB3aXRoIHBsYWNlbWVudDpsaW5lKVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtYXgtY2hhci1hbmdsZS1kZWx0YVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LW1heC1jaGFyLWFuZ2xlLWRlbHRhXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIyMi41XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgbWF4aW11bSBhbmdsZSBjaGFuZ2UsIGluIGRlZ3JlZXMsIGFsbG93ZWQgYmV0d2VlbiBhZGphY2VudCBjaGFyYWN0ZXJzIGluIGEgbGFiZWwuIFRoaXMgdmFsdWUgaW50ZXJuYWxseSBpcyBjb252ZXJ0ZWQgdG8gcmFkaWFucyB0byB0aGUgZGVmYXVsdCBpcyAyMi41Km1hdGgucGkvMTgwLjAuIFRoZSBoaWdoZXIgdGhlIHZhbHVlIHRoZSBmZXdlciBsYWJlbHMgd2lsbCBiZSBwbGFjZWQgYXJvdW5kIGFyb3VuZCBzaGFycCBjb3JuZXJzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmaWxsXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtZmlsbFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU3BlY2lmaWVzIHRoZSBjb2xvciBmb3IgdGhlIHRleHRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIjMDAwMDAwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiY29sb3JcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwib3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LW9wYWNpdHlcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkEgbnVtYmVyIGZyb20gMCB0byAxIHNwZWNpZnlpbmcgdGhlIG9wYWNpdHkgZm9yIHRoZSB0ZXh0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEuMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIkZ1bGx5IG9wYXF1ZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImhhbG8tZmlsbFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWhhbG8tZmlsbFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiI0ZGRkZGRlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwid2hpdGVcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNwZWNpZmllcyB0aGUgY29sb3Igb2YgdGhlIGhhbG8gYXJvdW5kIHRoZSB0ZXh0LlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJoYWxvLXJhZGl1c1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWhhbG8tcmFkaXVzXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTcGVjaWZ5IHRoZSByYWRpdXMgb2YgdGhlIGhhbG8gaW4gcGl4ZWxzXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJubyBoYWxvXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZHhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1keFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEaXNwbGFjZSB0ZXh0IGJ5IGZpeGVkIGFtb3VudCwgaW4gcGl4ZWxzLCArLy0gYWxvbmcgdGhlIFggYXhpcy4gIEEgcG9zaXRpdmUgdmFsdWUgd2lsbCBzaGlmdCB0aGUgdGV4dCByaWdodFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJkeVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkRpc3BsYWNlIHRleHQgYnkgZml4ZWQgYW1vdW50LCBpbiBwaXhlbHMsICsvLSBhbG9uZyB0aGUgWSBheGlzLiAgQSBwb3NpdGl2ZSB2YWx1ZSB3aWxsIHNoaWZ0IHRoZSB0ZXh0IGRvd25cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidmVydGljYWwtYWxpZ25tZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtdmVydGljYWwtYWxpZ25tZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgIFwidG9wXCIsXG4gICAgICAgICAgICAgICAgICBcIm1pZGRsZVwiLFxuICAgICAgICAgICAgICAgICAgXCJib3R0b21cIixcbiAgICAgICAgICAgICAgICAgIFwiYXV0b1wiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlBvc2l0aW9uIG9mIGxhYmVsIHJlbGF0aXZlIHRvIHBvaW50IHBvc2l0aW9uLlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImF1dG9cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIkRlZmF1bHQgYWZmZWN0ZWQgYnkgdmFsdWUgb2YgZHk7IFxcXCJib3R0b21cXFwiIGZvciBkeT4wLCBcXFwidG9wXFxcIiBmb3IgZHk8MC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiYXZvaWQtZWRnZXNcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1hdm9pZC1lZGdlc1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGVsbCBwb3NpdGlvbmluZyBhbGdvcml0aG0gdG8gYXZvaWQgbGFiZWxpbmcgbmVhciBpbnRlcnNlY3Rpb24gZWRnZXMuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibWluaW11bS1kaXN0YW5jZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LW1pbi1kaXN0YW5jZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiTWluaW11bSBwZXJtaXR0ZWQgZGlzdGFuY2UgdG8gdGhlIG5leHQgdGV4dCBzeW1ib2xpemVyLlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm1pbmltdW0tcGFkZGluZ1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LW1pbi1wYWRkaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEZXRlcm1pbmVzIHRoZSBtaW5pbXVtIGFtb3VudCBvZiBwYWRkaW5nIHRoYXQgYSB0ZXh0IHN5bWJvbGl6ZXIgZ2V0cyByZWxhdGl2ZSB0byBvdGhlciB0ZXh0XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibWluaW11bS1wYXRoLWxlbmd0aFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LW1pbi1wYXRoLWxlbmd0aFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJwbGFjZSBsYWJlbHMgb24gYWxsIHBhdGhzXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJQbGFjZSBsYWJlbHMgb25seSBvbiBwYXRocyBsb25nZXIgdGhhbiB0aGlzIHZhbHVlLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJhbGxvdy1vdmVybGFwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtYWxsb3ctb3ZlcmxhcFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb250cm9sIHdoZXRoZXIgb3ZlcmxhcHBpbmcgdGV4dCBpcyBzaG93biBvciBoaWRkZW4uXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJEbyBub3QgYWxsb3cgdGV4dCB0byBvdmVybGFwIHdpdGggb3RoZXIgdGV4dCAtIG92ZXJsYXBwaW5nIG1hcmtlcnMgd2lsbCBub3QgYmUgc2hvd24uXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm9yaWVudGF0aW9uXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtb3JpZW50YXRpb25cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZXhwcmVzc2lvblwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiUm90YXRlIHRoZSB0ZXh0LlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJwbGFjZW1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1wbGFjZW1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcInBvaW50XCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInZlcnRleFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludGVyaW9yXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInBvaW50XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb250cm9sIHRoZSBzdHlsZSBvZiBwbGFjZW1lbnQgb2YgYSBwb2ludCB2ZXJzdXMgdGhlIGdlb21ldHJ5IGl0IGlzIGF0dGFjaGVkIHRvLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJwbGFjZW1lbnQtdHlwZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LXBsYWNlbWVudC10eXBlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJSZS1wb3NpdGlvbiBhbmQvb3IgcmUtc2l6ZSB0ZXh0IHRvIGF2b2lkIG92ZXJsYXBzLiBcXFwic2ltcGxlXFxcIiBmb3IgYmFzaWMgYWxnb3JpdGhtICh1c2luZyB0ZXh0LXBsYWNlbWVudHMgc3RyaW5nLCkgXFxcImR1bW15XFxcIiB0byB0dXJuIHRoaXMgZmVhdHVyZSBvZmYuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJkdW1teVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNpbXBsZVwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJkdW1teVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJwbGFjZW1lbnRzXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtcGxhY2VtZW50c1wiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiSWYgXFxcInBsYWNlbWVudC10eXBlXFxcIiBpcyBzZXQgdG8gXFxcInNpbXBsZVxcXCIsIHVzZSB0aGlzIFxcXCJQT1NJVElPTlMsW1NJWkVTXVxcXCIgc3RyaW5nLiBBbiBleGFtcGxlIGlzIGB0ZXh0LXBsYWNlbWVudHM6IFxcXCJFLE5FLFNFLFcsTlcsU1dcXFwiO2AgXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInRleHQtdHJhbnNmb3JtXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtdHJhbnNmb3JtXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJub25lXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidXBwZXJjYXNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibG93ZXJjYXNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY2FwaXRhbGl6ZVwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRyYW5zZm9ybSB0aGUgY2FzZSBvZiB0aGUgY2hhcmFjdGVyc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiaG9yaXpvbnRhbC1hbGlnbm1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1ob3Jpem9udGFsLWFsaWdubWVudFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwibGVmdFwiLFxuICAgICAgICAgICAgICAgICAgICBcIm1pZGRsZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInJpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXV0b1wiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSB0ZXh0J3MgaG9yaXpvbnRhbCBhbGlnbm1lbnQgZnJvbSBpdHMgY2VudGVycG9pbnRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJhdXRvXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImp1c3RpZnktYWxpZ25tZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtYWxpZ25cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcImxlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyaWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImF1dG9cIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEZWZpbmUgaG93IHRleHQgaXMganVzdGlmaWVkXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYXV0b1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiQXV0byBhbGlnbm1lbnQgbWVhbnMgdGhhdCB0ZXh0IHdpbGwgYmUgY2VudGVyZWQgYnkgZGVmYXVsdCBleGNlcHQgd2hlbiB1c2luZyB0aGUgYHBsYWNlbWVudC10eXBlYCBwYXJhbWV0ZXIgLSBpbiB0aGF0IGNhc2UgZWl0aGVyIHJpZ2h0IG9yIGxlZnQganVzdGlmaWNhdGlvbiB3aWxsIGJlIHVzZWQgYXV0b21hdGljYWxseSBkZXBlbmRpbmcgb24gd2hlcmUgdGhlIHRleHQgY291bGQgYmUgZml0IGdpdmVuIHRoZSBgdGV4dC1wbGFjZW1lbnRzYCBkaXJlY3RpdmVzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImNsaXBcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1jbGlwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBiZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYmVmb3JlIHJlbmRlcmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiZ2VvbWV0cmllcyBhcmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJ5IGRlZmF1bHQgZm9yIGJlc3QgcmVuZGVyaW5nIHBlcmZvcm1hbmNlLiBJbiBzb21lIGNhc2VzIHVzZXJzIG1heSB3aXNoIHRvIGRpc2FibGUgdGhpcyB0byBhdm9pZCByZW5kZXJpbmcgYXJ0aWZhY3RzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtY29tcC1vcFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJhZGQgdGhlIGN1cnJlbnQgc3ltYm9saXplciBvbiB0b3Agb2Ygb3RoZXIgc3ltYm9saXplclwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQ29tcG9zaXRlIG9wZXJhdGlvbi4gVGhpcyBkZWZpbmVzIGhvdyB0aGlzIHN5bWJvbGl6ZXIgc2hvdWxkIGJlaGF2ZSByZWxhdGl2ZSB0byBzeW1ib2xpemVycyBhdG9wIG9yIGJlbG93IGl0LlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXCJjbGVhclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyY1wiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtaW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtaW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ4b3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwbHVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibWludXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtdWx0aXBseVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNjcmVlblwiLFxuICAgICAgICAgICAgICAgICAgICBcIm92ZXJsYXlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkYXJrZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaWdodGVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItZG9kZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1idXJuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaGFyZC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNvZnQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkaWZmZXJlbmNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZXhjbHVzaW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29udHJhc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnQtcmdiXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tbWVyZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1leHRyYWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaHVlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2F0dXJhdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIlxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJidWlsZGluZ1wiOiB7XG4gICAgICAgICAgICBcImZpbGxcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiYnVpbGRpbmctZmlsbFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIiNGRkZGRkZcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBjb2xvciBvZiB0aGUgYnVpbGRpbmdzIHdhbGxzLlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImNvbG9yXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZpbGwtb3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJidWlsZGluZy1maWxsLW9wYWNpdHlcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG9wYWNpdHkgb2YgdGhlIGJ1aWxkaW5nIGFzIGEgd2hvbGUsIGluY2x1ZGluZyBhbGwgd2FsbHMuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImhlaWdodFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJidWlsZGluZy1oZWlnaHRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBoZWlnaHQgb2YgdGhlIGJ1aWxkaW5nIGluIHBpeGVscy5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZXhwcmVzc2lvblwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIjBcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInRvcnF1ZVwiOiB7XG4gICAgICAgICAgXCItdG9ycXVlLWNsZWFyLWNvbG9yXCI6IHtcbiAgICAgICAgICAgICAgXCJjc3NcIjogXCItdG9ycXVlLWNsZWFyLWNvbG9yXCIsXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImNvbG9yXCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIixcbiAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJmdWxsIGNsZWFyXCIsXG4gICAgICAgICAgICAgIFwiZG9jXCI6IFwiY29sb3IgdXNlZCB0byBjbGVhciBjYW52YXMgb24gZWFjaCBmcmFtZVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIi10b3JxdWUtZnJhbWUtY291bnRcIjoge1xuICAgICAgICAgICAgICBcImNzc1wiOiBcIi10b3JxdWUtZnJhbWUtY291bnRcIixcbiAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiMTI4XCIsXG4gICAgICAgICAgICAgIFwidHlwZVwiOlwiZmxvYXRcIixcbiAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJ0aGUgZGF0YSBpcyBicm9rZW4gaW50byAxMjggdGltZSBmcmFtZXNcIixcbiAgICAgICAgICAgICAgXCJkb2NcIjogXCJOdW1iZXIgb2YgYW5pbWF0aW9uIHN0ZXBzL2ZyYW1lcyB1c2VkIGluIHRoZSBhbmltYXRpb24uIElmIHRoZSBkYXRhIGNvbnRhaW5zIGEgZmV3ZXJlIG51bWJlciBvZiB0b3RhbCBmcmFtZXMsIHRoZSBsZXNzZXIgdmFsdWUgd2lsbCBiZSB1c2VkLlwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIi10b3JxdWUtcmVzb2x1dGlvblwiOiB7XG4gICAgICAgICAgICAgIFwiY3NzXCI6IFwiLXRvcnF1ZS1yZXNvbHV0aW9uXCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIjJcIixcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6XCJmbG9hdFwiLFxuICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlwiLFxuICAgICAgICAgICAgICBcImRvY1wiOiBcIlNwYXRpYWwgcmVzb2x1dGlvbiBpbiBwaXhlbHMuIEEgcmVzb2x1dGlvbiBvZiAxIG1lYW5zIG5vIHNwYXRpYWwgYWdncmVnYXRpb24gb2YgdGhlIGRhdGEuIEFueSBvdGhlciByZXNvbHV0aW9uIG9mIE4gcmVzdWx0cyBpbiBzcGF0aWFsIGFnZ3JlZ2F0aW9uIGludG8gY2VsbHMgb2YgTnhOIHBpeGVscy4gVGhlIHZhbHVlIE4gbXVzdCBiZSBwb3dlciBvZiAyXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiLXRvcnF1ZS1hbmltYXRpb24tZHVyYXRpb25cIjoge1xuICAgICAgICAgICAgICBcImNzc1wiOiBcIi10b3JxdWUtYW5pbWF0aW9uLWR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIjMwXCIsXG4gICAgICAgICAgICAgIFwidHlwZVwiOlwiZmxvYXRcIixcbiAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJ0aGUgYW5pbWF0aW9uIGxhc3RzIDMwIHNlY29uZHNcIixcbiAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbmltYXRpb24gZHVyYXRpb24gaW4gc2Vjb25kc1wiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIi10b3JxdWUtYWdncmVnYXRpb24tZnVuY3Rpb25cIjoge1xuICAgICAgICAgICAgICBcImNzc1wiOiBcIi10b3JxdWUtYWdncmVnYXRpb24tZnVuY3Rpb25cIixcbiAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiY291bnQoY2FydG9kYl9pZClcIixcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwidGhlIHZhbHVlIGZvciBlYWNoIGNlbGwgaXMgdGhlIGNvdW50IG9mIHBvaW50cyBpbiB0aGF0IGNlbGxcIixcbiAgICAgICAgICAgICAgXCJkb2NcIjogXCJBIGZ1bmN0aW9uIHVzZWQgdG8gY2FsY3VsYXRlIGEgdmFsdWUgZnJvbSB0aGUgYWdncmVnYXRlIGRhdGEgZm9yIGVhY2ggY2VsbC4gU2VlIC10b3JxdWUtcmVzb2x1dGlvblwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIi10b3JxdWUtdGltZS1hdHRyaWJ1dGVcIjoge1xuICAgICAgICAgICAgICBcImNzc1wiOiBcIi10b3JxdWUtdGltZS1hdHRyaWJ1dGVcIixcbiAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwidGltZVwiLFxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJ0aGUgZGF0YSBjb2x1bW4gaW4geW91ciB0YWJsZSB0aGF0IGlzIG9mIGEgdGltZSBiYXNlZCB0eXBlXCIsXG4gICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIHRhYmxlIGNvbHVtbiB0aGF0IGNvbnRhaW5zIHRoZSB0aW1lIGluZm9ybWF0aW9uIHVzZWQgY3JlYXRlIHRoZSBhbmltYXRpb25cIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCItdG9ycXVlLWRhdGEtYWdncmVnYXRpb25cIjoge1xuICAgICAgICAgICAgICBcImNzc1wiOiBcIi10b3JxdWUtZGF0YS1hZ2dyZWdhdGlvblwiLFxuICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJsaW5lYXJcIixcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICBcImxpbmVhclwiLFxuICAgICAgICAgICAgICAgIFwiY3VtdWxhdGl2ZVwiXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwicHJldmlvdXMgdmFsdWVzIGFyZSBkaXNjYXJkZWRcIixcbiAgICAgICAgICAgICAgXCJkb2NcIjogXCJBIGxpbmVhciBhbmltYXRpb24gd2lsbCBkaXNjYXJkIHByZXZpb3VzIHZhbHVlcyB3aGlsZSBhIGN1bXVsYXRpdmUgYW5pbWF0aW9uIHdpbGwgYWNjdW11bGF0ZSB0aGVtIHVudGlsIGl0IHJlc3RhcnRzXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFwiY29sb3JzXCI6IHtcbiAgICAgICAgXCJhbGljZWJsdWVcIjogIFsyNDAsIDI0OCwgMjU1XSxcbiAgICAgICAgXCJhbnRpcXVld2hpdGVcIjogIFsyNTAsIDIzNSwgMjE1XSxcbiAgICAgICAgXCJhcXVhXCI6ICBbMCwgMjU1LCAyNTVdLFxuICAgICAgICBcImFxdWFtYXJpbmVcIjogIFsxMjcsIDI1NSwgMjEyXSxcbiAgICAgICAgXCJhenVyZVwiOiAgWzI0MCwgMjU1LCAyNTVdLFxuICAgICAgICBcImJlaWdlXCI6ICBbMjQ1LCAyNDUsIDIyMF0sXG4gICAgICAgIFwiYmlzcXVlXCI6ICBbMjU1LCAyMjgsIDE5Nl0sXG4gICAgICAgIFwiYmxhY2tcIjogIFswLCAwLCAwXSxcbiAgICAgICAgXCJibGFuY2hlZGFsbW9uZFwiOiAgWzI1NSwyMzUsMjA1XSxcbiAgICAgICAgXCJibHVlXCI6ICBbMCwgMCwgMjU1XSxcbiAgICAgICAgXCJibHVldmlvbGV0XCI6ICBbMTM4LCA0MywgMjI2XSxcbiAgICAgICAgXCJicm93blwiOiAgWzE2NSwgNDIsIDQyXSxcbiAgICAgICAgXCJidXJseXdvb2RcIjogIFsyMjIsIDE4NCwgMTM1XSxcbiAgICAgICAgXCJjYWRldGJsdWVcIjogIFs5NSwgMTU4LCAxNjBdLFxuICAgICAgICBcImNoYXJ0cmV1c2VcIjogIFsxMjcsIDI1NSwgMF0sXG4gICAgICAgIFwiY2hvY29sYXRlXCI6ICBbMjEwLCAxMDUsIDMwXSxcbiAgICAgICAgXCJjb3JhbFwiOiAgWzI1NSwgMTI3LCA4MF0sXG4gICAgICAgIFwiY29ybmZsb3dlcmJsdWVcIjogIFsxMDAsIDE0OSwgMjM3XSxcbiAgICAgICAgXCJjb3Juc2lsa1wiOiAgWzI1NSwgMjQ4LCAyMjBdLFxuICAgICAgICBcImNyaW1zb25cIjogIFsyMjAsIDIwLCA2MF0sXG4gICAgICAgIFwiY3lhblwiOiAgWzAsIDI1NSwgMjU1XSxcbiAgICAgICAgXCJkYXJrYmx1ZVwiOiAgWzAsIDAsIDEzOV0sXG4gICAgICAgIFwiZGFya2N5YW5cIjogIFswLCAxMzksIDEzOV0sXG4gICAgICAgIFwiZGFya2dvbGRlbnJvZFwiOiAgWzE4NCwgMTM0LCAxMV0sXG4gICAgICAgIFwiZGFya2dyYXlcIjogIFsxNjksIDE2OSwgMTY5XSxcbiAgICAgICAgXCJkYXJrZ3JlZW5cIjogIFswLCAxMDAsIDBdLFxuICAgICAgICBcImRhcmtncmV5XCI6ICBbMTY5LCAxNjksIDE2OV0sXG4gICAgICAgIFwiZGFya2toYWtpXCI6ICBbMTg5LCAxODMsIDEwN10sXG4gICAgICAgIFwiZGFya21hZ2VudGFcIjogIFsxMzksIDAsIDEzOV0sXG4gICAgICAgIFwiZGFya29saXZlZ3JlZW5cIjogIFs4NSwgMTA3LCA0N10sXG4gICAgICAgIFwiZGFya29yYW5nZVwiOiAgWzI1NSwgMTQwLCAwXSxcbiAgICAgICAgXCJkYXJrb3JjaGlkXCI6ICBbMTUzLCA1MCwgMjA0XSxcbiAgICAgICAgXCJkYXJrcmVkXCI6ICBbMTM5LCAwLCAwXSxcbiAgICAgICAgXCJkYXJrc2FsbW9uXCI6ICBbMjMzLCAxNTAsIDEyMl0sXG4gICAgICAgIFwiZGFya3NlYWdyZWVuXCI6ICBbMTQzLCAxODgsIDE0M10sXG4gICAgICAgIFwiZGFya3NsYXRlYmx1ZVwiOiAgWzcyLCA2MSwgMTM5XSxcbiAgICAgICAgXCJkYXJrc2xhdGVncmV5XCI6ICBbNDcsIDc5LCA3OV0sXG4gICAgICAgIFwiZGFya3R1cnF1b2lzZVwiOiAgWzAsIDIwNiwgMjA5XSxcbiAgICAgICAgXCJkYXJrdmlvbGV0XCI6ICBbMTQ4LCAwLCAyMTFdLFxuICAgICAgICBcImRlZXBwaW5rXCI6ICBbMjU1LCAyMCwgMTQ3XSxcbiAgICAgICAgXCJkZWVwc2t5Ymx1ZVwiOiAgWzAsIDE5MSwgMjU1XSxcbiAgICAgICAgXCJkaW1ncmF5XCI6ICBbMTA1LCAxMDUsIDEwNV0sXG4gICAgICAgIFwiZGltZ3JleVwiOiAgWzEwNSwgMTA1LCAxMDVdLFxuICAgICAgICBcImRvZGdlcmJsdWVcIjogIFszMCwgMTQ0LCAyNTVdLFxuICAgICAgICBcImZpcmVicmlja1wiOiAgWzE3OCwgMzQsIDM0XSxcbiAgICAgICAgXCJmbG9yYWx3aGl0ZVwiOiAgWzI1NSwgMjUwLCAyNDBdLFxuICAgICAgICBcImZvcmVzdGdyZWVuXCI6ICBbMzQsIDEzOSwgMzRdLFxuICAgICAgICBcImZ1Y2hzaWFcIjogIFsyNTUsIDAsIDI1NV0sXG4gICAgICAgIFwiZ2FpbnNib3JvXCI6ICBbMjIwLCAyMjAsIDIyMF0sXG4gICAgICAgIFwiZ2hvc3R3aGl0ZVwiOiAgWzI0OCwgMjQ4LCAyNTVdLFxuICAgICAgICBcImdvbGRcIjogIFsyNTUsIDIxNSwgMF0sXG4gICAgICAgIFwiZ29sZGVucm9kXCI6ICBbMjE4LCAxNjUsIDMyXSxcbiAgICAgICAgXCJncmF5XCI6ICBbMTI4LCAxMjgsIDEyOF0sXG4gICAgICAgIFwiZ3JleVwiOiAgWzEyOCwgMTI4LCAxMjhdLFxuICAgICAgICBcImdyZWVuXCI6ICBbMCwgMTI4LCAwXSxcbiAgICAgICAgXCJncmVlbnllbGxvd1wiOiAgWzE3MywgMjU1LCA0N10sXG4gICAgICAgIFwiaG9uZXlkZXdcIjogIFsyNDAsIDI1NSwgMjQwXSxcbiAgICAgICAgXCJob3RwaW5rXCI6ICBbMjU1LCAxMDUsIDE4MF0sXG4gICAgICAgIFwiaW5kaWFucmVkXCI6ICBbMjA1LCA5MiwgOTJdLFxuICAgICAgICBcImluZGlnb1wiOiAgWzc1LCAwLCAxMzBdLFxuICAgICAgICBcIml2b3J5XCI6ICBbMjU1LCAyNTUsIDI0MF0sXG4gICAgICAgIFwia2hha2lcIjogIFsyNDAsIDIzMCwgMTQwXSxcbiAgICAgICAgXCJsYXZlbmRlclwiOiAgWzIzMCwgMjMwLCAyNTBdLFxuICAgICAgICBcImxhdmVuZGVyYmx1c2hcIjogIFsyNTUsIDI0MCwgMjQ1XSxcbiAgICAgICAgXCJsYXduZ3JlZW5cIjogIFsxMjQsIDI1MiwgMF0sXG4gICAgICAgIFwibGVtb25jaGlmZm9uXCI6ICBbMjU1LCAyNTAsIDIwNV0sXG4gICAgICAgIFwibGlnaHRibHVlXCI6ICBbMTczLCAyMTYsIDIzMF0sXG4gICAgICAgIFwibGlnaHRjb3JhbFwiOiAgWzI0MCwgMTI4LCAxMjhdLFxuICAgICAgICBcImxpZ2h0Y3lhblwiOiAgWzIyNCwgMjU1LCAyNTVdLFxuICAgICAgICBcImxpZ2h0Z29sZGVucm9keWVsbG93XCI6ICBbMjUwLCAyNTAsIDIxMF0sXG4gICAgICAgIFwibGlnaHRncmF5XCI6ICBbMjExLCAyMTEsIDIxMV0sXG4gICAgICAgIFwibGlnaHRncmVlblwiOiAgWzE0NCwgMjM4LCAxNDRdLFxuICAgICAgICBcImxpZ2h0Z3JleVwiOiAgWzIxMSwgMjExLCAyMTFdLFxuICAgICAgICBcImxpZ2h0cGlua1wiOiAgWzI1NSwgMTgyLCAxOTNdLFxuICAgICAgICBcImxpZ2h0c2FsbW9uXCI6ICBbMjU1LCAxNjAsIDEyMl0sXG4gICAgICAgIFwibGlnaHRzZWFncmVlblwiOiAgWzMyLCAxNzgsIDE3MF0sXG4gICAgICAgIFwibGlnaHRza3libHVlXCI6ICBbMTM1LCAyMDYsIDI1MF0sXG4gICAgICAgIFwibGlnaHRzbGF0ZWdyYXlcIjogIFsxMTksIDEzNiwgMTUzXSxcbiAgICAgICAgXCJsaWdodHNsYXRlZ3JleVwiOiAgWzExOSwgMTM2LCAxNTNdLFxuICAgICAgICBcImxpZ2h0c3RlZWxibHVlXCI6ICBbMTc2LCAxOTYsIDIyMl0sXG4gICAgICAgIFwibGlnaHR5ZWxsb3dcIjogIFsyNTUsIDI1NSwgMjI0XSxcbiAgICAgICAgXCJsaW1lXCI6ICBbMCwgMjU1LCAwXSxcbiAgICAgICAgXCJsaW1lZ3JlZW5cIjogIFs1MCwgMjA1LCA1MF0sXG4gICAgICAgIFwibGluZW5cIjogIFsyNTAsIDI0MCwgMjMwXSxcbiAgICAgICAgXCJtYWdlbnRhXCI6ICBbMjU1LCAwLCAyNTVdLFxuICAgICAgICBcIm1hcm9vblwiOiAgWzEyOCwgMCwgMF0sXG4gICAgICAgIFwibWVkaXVtYXF1YW1hcmluZVwiOiAgWzEwMiwgMjA1LCAxNzBdLFxuICAgICAgICBcIm1lZGl1bWJsdWVcIjogIFswLCAwLCAyMDVdLFxuICAgICAgICBcIm1lZGl1bW9yY2hpZFwiOiAgWzE4NiwgODUsIDIxMV0sXG4gICAgICAgIFwibWVkaXVtcHVycGxlXCI6ICBbMTQ3LCAxMTIsIDIxOV0sXG4gICAgICAgIFwibWVkaXVtc2VhZ3JlZW5cIjogIFs2MCwgMTc5LCAxMTNdLFxuICAgICAgICBcIm1lZGl1bXNsYXRlYmx1ZVwiOiAgWzEyMywgMTA0LCAyMzhdLFxuICAgICAgICBcIm1lZGl1bXNwcmluZ2dyZWVuXCI6ICBbMCwgMjUwLCAxNTRdLFxuICAgICAgICBcIm1lZGl1bXR1cnF1b2lzZVwiOiAgWzcyLCAyMDksIDIwNF0sXG4gICAgICAgIFwibWVkaXVtdmlvbGV0cmVkXCI6ICBbMTk5LCAyMSwgMTMzXSxcbiAgICAgICAgXCJtaWRuaWdodGJsdWVcIjogIFsyNSwgMjUsIDExMl0sXG4gICAgICAgIFwibWludGNyZWFtXCI6ICBbMjQ1LCAyNTUsIDI1MF0sXG4gICAgICAgIFwibWlzdHlyb3NlXCI6ICBbMjU1LCAyMjgsIDIyNV0sXG4gICAgICAgIFwibW9jY2FzaW5cIjogIFsyNTUsIDIyOCwgMTgxXSxcbiAgICAgICAgXCJuYXZham93aGl0ZVwiOiAgWzI1NSwgMjIyLCAxNzNdLFxuICAgICAgICBcIm5hdnlcIjogIFswLCAwLCAxMjhdLFxuICAgICAgICBcIm9sZGxhY2VcIjogIFsyNTMsIDI0NSwgMjMwXSxcbiAgICAgICAgXCJvbGl2ZVwiOiAgWzEyOCwgMTI4LCAwXSxcbiAgICAgICAgXCJvbGl2ZWRyYWJcIjogIFsxMDcsIDE0MiwgMzVdLFxuICAgICAgICBcIm9yYW5nZVwiOiAgWzI1NSwgMTY1LCAwXSxcbiAgICAgICAgXCJvcmFuZ2VyZWRcIjogIFsyNTUsIDY5LCAwXSxcbiAgICAgICAgXCJvcmNoaWRcIjogIFsyMTgsIDExMiwgMjE0XSxcbiAgICAgICAgXCJwYWxlZ29sZGVucm9kXCI6ICBbMjM4LCAyMzIsIDE3MF0sXG4gICAgICAgIFwicGFsZWdyZWVuXCI6ICBbMTUyLCAyNTEsIDE1Ml0sXG4gICAgICAgIFwicGFsZXR1cnF1b2lzZVwiOiAgWzE3NSwgMjM4LCAyMzhdLFxuICAgICAgICBcInBhbGV2aW9sZXRyZWRcIjogIFsyMTksIDExMiwgMTQ3XSxcbiAgICAgICAgXCJwYXBheWF3aGlwXCI6ICBbMjU1LCAyMzksIDIxM10sXG4gICAgICAgIFwicGVhY2hwdWZmXCI6ICBbMjU1LCAyMTgsIDE4NV0sXG4gICAgICAgIFwicGVydVwiOiAgWzIwNSwgMTMzLCA2M10sXG4gICAgICAgIFwicGlua1wiOiAgWzI1NSwgMTkyLCAyMDNdLFxuICAgICAgICBcInBsdW1cIjogIFsyMjEsIDE2MCwgMjIxXSxcbiAgICAgICAgXCJwb3dkZXJibHVlXCI6ICBbMTc2LCAyMjQsIDIzMF0sXG4gICAgICAgIFwicHVycGxlXCI6ICBbMTI4LCAwLCAxMjhdLFxuICAgICAgICBcInJlZFwiOiAgWzI1NSwgMCwgMF0sXG4gICAgICAgIFwicm9zeWJyb3duXCI6ICBbMTg4LCAxNDMsIDE0M10sXG4gICAgICAgIFwicm95YWxibHVlXCI6ICBbNjUsIDEwNSwgMjI1XSxcbiAgICAgICAgXCJzYWRkbGVicm93blwiOiAgWzEzOSwgNjksIDE5XSxcbiAgICAgICAgXCJzYWxtb25cIjogIFsyNTAsIDEyOCwgMTE0XSxcbiAgICAgICAgXCJzYW5keWJyb3duXCI6ICBbMjQ0LCAxNjQsIDk2XSxcbiAgICAgICAgXCJzZWFncmVlblwiOiAgWzQ2LCAxMzksIDg3XSxcbiAgICAgICAgXCJzZWFzaGVsbFwiOiAgWzI1NSwgMjQ1LCAyMzhdLFxuICAgICAgICBcInNpZW5uYVwiOiAgWzE2MCwgODIsIDQ1XSxcbiAgICAgICAgXCJzaWx2ZXJcIjogIFsxOTIsIDE5MiwgMTkyXSxcbiAgICAgICAgXCJza3libHVlXCI6ICBbMTM1LCAyMDYsIDIzNV0sXG4gICAgICAgIFwic2xhdGVibHVlXCI6ICBbMTA2LCA5MCwgMjA1XSxcbiAgICAgICAgXCJzbGF0ZWdyYXlcIjogIFsxMTIsIDEyOCwgMTQ0XSxcbiAgICAgICAgXCJzbGF0ZWdyZXlcIjogIFsxMTIsIDEyOCwgMTQ0XSxcbiAgICAgICAgXCJzbm93XCI6ICBbMjU1LCAyNTAsIDI1MF0sXG4gICAgICAgIFwic3ByaW5nZ3JlZW5cIjogIFswLCAyNTUsIDEyN10sXG4gICAgICAgIFwic3RlZWxibHVlXCI6ICBbNzAsIDEzMCwgMTgwXSxcbiAgICAgICAgXCJ0YW5cIjogIFsyMTAsIDE4MCwgMTQwXSxcbiAgICAgICAgXCJ0ZWFsXCI6ICBbMCwgMTI4LCAxMjhdLFxuICAgICAgICBcInRoaXN0bGVcIjogIFsyMTYsIDE5MSwgMjE2XSxcbiAgICAgICAgXCJ0b21hdG9cIjogIFsyNTUsIDk5LCA3MV0sXG4gICAgICAgIFwidHVycXVvaXNlXCI6ICBbNjQsIDIyNCwgMjA4XSxcbiAgICAgICAgXCJ2aW9sZXRcIjogIFsyMzgsIDEzMCwgMjM4XSxcbiAgICAgICAgXCJ3aGVhdFwiOiAgWzI0NSwgMjIyLCAxNzldLFxuICAgICAgICBcIndoaXRlXCI6ICBbMjU1LCAyNTUsIDI1NV0sXG4gICAgICAgIFwid2hpdGVzbW9rZVwiOiAgWzI0NSwgMjQ1LCAyNDVdLFxuICAgICAgICBcInllbGxvd1wiOiAgWzI1NSwgMjU1LCAwXSxcbiAgICAgICAgXCJ5ZWxsb3dncmVlblwiOiAgWzE1NCwgMjA1LCA1MF0sXG4gICAgICAgIFwidHJhbnNwYXJlbnRcIjogIFswLCAwLCAwLCAwXVxuICAgIH0sXG4gICAgXCJmaWx0ZXJcIjoge1xuICAgICAgICBcInZhbHVlXCI6IFtcbiAgICAgICAgICAgIFwidHJ1ZVwiLFxuICAgICAgICAgICAgXCJmYWxzZVwiLFxuICAgICAgICAgICAgXCJudWxsXCIsXG4gICAgICAgICAgICBcInBvaW50XCIsXG4gICAgICAgICAgICBcImxpbmVzdHJpbmdcIixcbiAgICAgICAgICAgIFwicG9seWdvblwiLFxuICAgICAgICAgICAgXCJjb2xsZWN0aW9uXCJcbiAgICAgICAgXVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHZlcnNpb246IHtcbiAgICBsYXRlc3Q6IF9tYXBuaWtfcmVmZXJlbmNlX2xhdGVzdCxcbiAgICAnMi4xLjEnOiBfbWFwbmlrX3JlZmVyZW5jZV9sYXRlc3RcbiAgfVxufTtcbiIsIi8qKlxuICogVE9ETzogZG9jdW1lbnQgdGhpcy4gV2hhdCBkb2VzIHRoaXMgZG8/XG4gKi9cbmlmKHR5cGVvZihtb2R1bGUpICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gIG1vZHVsZS5leHBvcnRzLmZpbmQgPSBmdW5jdGlvbiAob2JqLCBmdW4pIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCByOyBpIDwgb2JqLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHIgPSBmdW4uY2FsbChvYmosIG9ialtpXSkpIHsgcmV0dXJuIHI7IH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICB9O1xufVxuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcbnZhciBfID0gZ2xvYmFsLl8gfHwgcmVxdWlyZSgndW5kZXJzY29yZScpO1xudHJlZS5DYWxsID0gZnVuY3Rpb24gQ2FsbChuYW1lLCBhcmdzLCBpbmRleCkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5hcmdzID0gYXJncztcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG59O1xuXG50cmVlLkNhbGwucHJvdG90eXBlID0ge1xuICAgIGlzOiAnY2FsbCcsXG4gICAgLy8gV2hlbiBldnVhdGluZyBhIGZ1bmN0aW9uIGNhbGwsXG4gICAgLy8gd2UgZWl0aGVyIGZpbmQgdGhlIGZ1bmN0aW9uIGluIGB0cmVlLmZ1bmN0aW9uc2AgWzFdLFxuICAgIC8vIGluIHdoaWNoIGNhc2Ugd2UgY2FsbCBpdCwgcGFzc2luZyB0aGUgIGV2YWx1YXRlZCBhcmd1bWVudHMsXG4gICAgLy8gb3Igd2Ugc2ltcGx5IHByaW50IGl0IG91dCBhcyBpdCBhcHBlYXJlZCBvcmlnaW5hbGx5IFsyXS5cbiAgICAvLyBUaGUgKmZ1bmN0aW9ucy5qcyogZmlsZSBjb250YWlucyB0aGUgYnVpbHQtaW4gZnVuY3Rpb25zLlxuICAgIC8vIFRoZSByZWFzb24gd2h5IHdlIGV2YWx1YXRlIHRoZSBhcmd1bWVudHMsIGlzIGluIHRoZSBjYXNlIHdoZXJlXG4gICAgLy8gd2UgdHJ5IHRvIHBhc3MgYSB2YXJpYWJsZSB0byBhIGZ1bmN0aW9uLCBsaWtlOiBgc2F0dXJhdGUoQGNvbG9yKWAuXG4gICAgLy8gVGhlIGZ1bmN0aW9uIHNob3VsZCByZWNlaXZlIHRoZSB2YWx1ZSwgbm90IHRoZSB2YXJpYWJsZS5cbiAgICAnZXYnOiBmdW5jdGlvbihlbnYpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSB0aGlzLmFyZ3MubWFwKGZ1bmN0aW9uKGEpIHsgcmV0dXJuIGEuZXYoZW52KTsgfSk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoYXJnc1tpXS5pcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBpczogJ3VuZGVmaW5lZCcsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5uYW1lIGluIHRyZWUuZnVuY3Rpb25zKSB7XG4gICAgICAgICAgICBpZiAodHJlZS5mdW5jdGlvbnNbdGhpcy5uYW1lXS5sZW5ndGggPD0gYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gdHJlZS5mdW5jdGlvbnNbdGhpcy5uYW1lXS5hcHBseSh0cmVlLmZ1bmN0aW9ucywgYXJncyk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ2luY29ycmVjdCBhcmd1bWVudHMgZ2l2ZW4gdG8gJyArIHRoaXMubmFtZSArICcoKScsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdydW50aW1lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBpczogJ3VuZGVmaW5lZCcsIHZhbHVlOiAndW5kZWZpbmVkJyB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnaW5jb3JyZWN0IG51bWJlciBvZiBhcmd1bWVudHMgZm9yICcgKyB0aGlzLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJygpLiAnICsgdHJlZS5mdW5jdGlvbnNbdGhpcy5uYW1lXS5sZW5ndGggKyAnIGV4cGVjdGVkLicsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAncnVudGltZScsXG4gICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgaXM6ICd1bmRlZmluZWQnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGZuID0gdHJlZS5SZWZlcmVuY2UubWFwbmlrRnVuY3Rpb25zW3RoaXMubmFtZV07XG4gICAgICAgICAgICBpZiAoZm4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbnMgPSBfLnBhaXJzKHRyZWUuUmVmZXJlbmNlLm1hcG5pa0Z1bmN0aW9ucyk7XG4gICAgICAgICAgICAgICAgLy8gY2hlYXAgY2xvc2VzdCwgbmVlZHMgaW1wcm92ZW1lbnQuXG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSB0aGlzLm5hbWU7XG4gICAgICAgICAgICAgICAgdmFyIG1lYW4gPSBmdW5jdGlvbnMubWFwKGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtmWzBdLCB0cmVlLlJlZmVyZW5jZS5lZGl0RGlzdGFuY2UobmFtZSwgZlswXSksIGZbMV1dO1xuICAgICAgICAgICAgICAgIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYVsxXSAtIGJbMV07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ3Vua25vd24gZnVuY3Rpb24gJyArIHRoaXMubmFtZSArICcoKSwgZGlkIHlvdSBtZWFuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVhblswXVswXSArICcoJyArIG1lYW5bMF1bMl0gKyAnKScsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAncnVudGltZScsXG4gICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgaXM6ICd1bmRlZmluZWQnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZuICE9PSBhcmdzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgICEoQXJyYXkuaXNBcnJheShmbikgJiYgXy5pbmNsdWRlKGZuLCBhcmdzLmxlbmd0aCkpICYmXG4gICAgICAgICAgICAgICAgLy8gc3VwcG9ydCB2YXJpYWJsZS1hcmcgZnVuY3Rpb25zIGxpa2UgYGNvbG9yaXplLWFscGhhYFxuICAgICAgICAgICAgICAgIGZuICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdmdW5jdGlvbiAnICsgdGhpcy5uYW1lICsgJygpIHRha2VzICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgZm4gKyAnIGFyZ3VtZW50cyBhbmQgd2FzIGdpdmVuICcgKyBhcmdzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdydW50aW1lJyxcbiAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMuZmlsZW5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBpczogJ3VuZGVmaW5lZCcsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGV2YWx1YXRlZCB2ZXJzaW9ucyBvZiBhcmd1bWVudHNcbiAgICAgICAgICAgICAgICB0aGlzLmFyZ3MgPSBhcmdzO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbihlbnYsIGZvcm1hdCkge1xuICAgICAgICBpZiAodGhpcy5hcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmFtZSArICcoJyArIHRoaXMuYXJncy5qb2luKCcsJykgKyAnKSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xuICAgICAgICB9XG4gICAgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG4vLyBSR0IgQ29sb3JzIC0gI2ZmMDAxNCwgI2VlZVxuLy8gY2FuIGJlIGluaXRpYWxpemVkIHdpdGggYSAzIG9yIDYgY2hhciBzdHJpbmcgb3IgYSAzIG9yIDQgZWxlbWVudFxuLy8gbnVtZXJpY2FsIGFycmF5XG50cmVlLkNvbG9yID0gZnVuY3Rpb24gQ29sb3IocmdiLCBhKSB7XG4gICAgLy8gVGhlIGVuZCBnb2FsIGhlcmUsIGlzIHRvIHBhcnNlIHRoZSBhcmd1bWVudHNcbiAgICAvLyBpbnRvIGFuIGludGVnZXIgdHJpcGxldCwgc3VjaCBhcyBgMTI4LCAyNTUsIDBgXG4gICAgLy9cbiAgICAvLyBUaGlzIGZhY2lsaXRhdGVzIG9wZXJhdGlvbnMgYW5kIGNvbnZlcnNpb25zLlxuICAgIGlmIChBcnJheS5pc0FycmF5KHJnYikpIHtcbiAgICAgICAgdGhpcy5yZ2IgPSByZ2Iuc2xpY2UoMCwgMyk7XG4gICAgfSBlbHNlIGlmIChyZ2IubGVuZ3RoID09IDYpIHtcbiAgICAgICAgdGhpcy5yZ2IgPSByZ2IubWF0Y2goLy57Mn0vZykubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUludChjLCAxNik7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmdiID0gcmdiLnNwbGl0KCcnKS5tYXAoZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KGMgKyBjLCAxNik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YoYSkgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHRoaXMuYWxwaGEgPSBhO1xuICAgIH0gZWxzZSBpZiAocmdiLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICB0aGlzLmFscGhhID0gcmdiWzNdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYWxwaGEgPSAxO1xuICAgIH1cbn07XG5cbnRyZWUuQ29sb3IucHJvdG90eXBlID0ge1xuICAgIGlzOiAnY29sb3InLFxuICAgICdldic6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSxcblxuICAgIC8vIElmIHdlIGhhdmUgc29tZSB0cmFuc3BhcmVuY3ksIHRoZSBvbmx5IHdheSB0byByZXByZXNlbnQgaXRcbiAgICAvLyBpcyB2aWEgYHJnYmFgLiBPdGhlcndpc2UsIHdlIHVzZSB0aGUgaGV4IHJlcHJlc2VudGF0aW9uLFxuICAgIC8vIHdoaWNoIGhhcyBiZXR0ZXIgY29tcGF0aWJpbGl0eSB3aXRoIG9sZGVyIGJyb3dzZXJzLlxuICAgIC8vIFZhbHVlcyBhcmUgY2FwcGVkIGJldHdlZW4gYDBgIGFuZCBgMjU1YCwgcm91bmRlZCBhbmQgemVyby1wYWRkZWQuXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5hbHBoYSA8IDEuMCkge1xuICAgICAgICAgICAgcmV0dXJuICdyZ2JhKCcgKyB0aGlzLnJnYi5tYXAoZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKGMpO1xuICAgICAgICAgICAgfSkuY29uY2F0KHRoaXMuYWxwaGEpLmpvaW4oJywgJykgKyAnKSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gJyMnICsgdGhpcy5yZ2IubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgICAgICAgICBpID0gTWF0aC5yb3VuZChpKTtcbiAgICAgICAgICAgICAgICBpID0gKGkgPiAyNTUgPyAyNTUgOiAoaSA8IDAgPyAwIDogaSkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaS5sZW5ndGggPT09IDEgPyAnMCcgKyBpIDogaTtcbiAgICAgICAgICAgIH0pLmpvaW4oJycpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIE9wZXJhdGlvbnMgaGF2ZSB0byBiZSBkb25lIHBlci1jaGFubmVsLCBpZiBub3QsXG4gICAgLy8gY2hhbm5lbHMgd2lsbCBzcGlsbCBvbnRvIGVhY2ggb3RoZXIuIE9uY2Ugd2UgaGF2ZVxuICAgIC8vIG91ciByZXN1bHQsIGluIHRoZSBmb3JtIG9mIGFuIGludGVnZXIgdHJpcGxldCxcbiAgICAvLyB3ZSBjcmVhdGUgYSBuZXcgQ29sb3Igbm9kZSB0byBob2xkIHRoZSByZXN1bHQuXG4gICAgb3BlcmF0ZTogZnVuY3Rpb24oZW52LCBvcCwgb3RoZXIpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIGlmICghIChvdGhlciBpbnN0YW5jZW9mIHRyZWUuQ29sb3IpKSB7XG4gICAgICAgICAgICBvdGhlciA9IG90aGVyLnRvQ29sb3IoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGMgPSAwOyBjIDwgMzsgYysrKSB7XG4gICAgICAgICAgICByZXN1bHRbY10gPSB0cmVlLm9wZXJhdGUob3AsIHRoaXMucmdiW2NdLCBvdGhlci5yZ2JbY10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5Db2xvcihyZXN1bHQpO1xuICAgIH0sXG5cbiAgICB0b0hTTDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByID0gdGhpcy5yZ2JbMF0gLyAyNTUsXG4gICAgICAgICAgICBnID0gdGhpcy5yZ2JbMV0gLyAyNTUsXG4gICAgICAgICAgICBiID0gdGhpcy5yZ2JbMl0gLyAyNTUsXG4gICAgICAgICAgICBhID0gdGhpcy5hbHBoYTtcblxuICAgICAgICB2YXIgbWF4ID0gTWF0aC5tYXgociwgZywgYiksIG1pbiA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgICAgICB2YXIgaCwgcywgbCA9IChtYXggKyBtaW4pIC8gMiwgZCA9IG1heCAtIG1pbjtcblxuICAgICAgICBpZiAobWF4ID09PSBtaW4pIHtcbiAgICAgICAgICAgIGggPSBzID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHMgPSBsID4gMC41ID8gZCAvICgyIC0gbWF4IC0gbWluKSA6IGQgLyAobWF4ICsgbWluKTtcblxuICAgICAgICAgICAgc3dpdGNoIChtYXgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIHI6IGggPSAoZyAtIGIpIC8gZCArIChnIDwgYiA/IDYgOiAwKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBnOiBoID0gKGIgLSByKSAvIGQgKyAyOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIGI6IGggPSAociAtIGcpIC8gZCArIDQ7IGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaCAvPSA2O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IGg6IGggKiAzNjAsIHM6IHMsIGw6IGwsIGE6IGEgfTtcbiAgICB9XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5Db21tZW50ID0gZnVuY3Rpb24gQ29tbWVudCh2YWx1ZSwgc2lsZW50KSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuc2lsZW50ID0gISFzaWxlbnQ7XG59O1xuXG50cmVlLkNvbW1lbnQucHJvdG90eXBlID0ge1xuICAgIHRvU3RyaW5nOiBmdW5jdGlvbihlbnYpIHtcbiAgICAgICAgcmV0dXJuICc8IS0tJyArIHRoaXMudmFsdWUgKyAnLS0+JztcbiAgICB9LFxuICAgICdldic6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0JyksXG4gICAgXyA9IGdsb2JhbC5fIHx8IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuLy8gQSBkZWZpbml0aW9uIGlzIHRoZSBjb21iaW5hdGlvbiBvZiBhIHNlbGVjdG9yIGFuZCBydWxlcywgbGlrZVxuLy8gI2ZvbyB7XG4vLyAgICAgcG9seWdvbi1vcGFjaXR5OjEuMDtcbi8vIH1cbi8vXG4vLyBUaGUgc2VsZWN0b3IgY2FuIGhhdmUgZmlsdGVyc1xudHJlZS5EZWZpbml0aW9uID0gZnVuY3Rpb24gRGVmaW5pdGlvbihzZWxlY3RvciwgcnVsZXMpIHtcbiAgICB0aGlzLmVsZW1lbnRzID0gc2VsZWN0b3IuZWxlbWVudHM7XG4gICAgYXNzZXJ0Lm9rKHNlbGVjdG9yLmZpbHRlcnMgaW5zdGFuY2VvZiB0cmVlLkZpbHRlcnNldCk7XG4gICAgdGhpcy5ydWxlcyA9IHJ1bGVzO1xuICAgIHRoaXMucnVsZUluZGV4ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICgnem9vbScgaW4gdGhpcy5ydWxlc1tpXSkgdGhpcy5ydWxlc1tpXSA9IHRoaXMucnVsZXNbaV0uY2xvbmUoKTtcbiAgICAgICAgdGhpcy5ydWxlc1tpXS56b29tID0gc2VsZWN0b3Iuem9vbTtcbiAgICAgICAgdGhpcy5ydWxlSW5kZXhbdGhpcy5ydWxlc1tpXS51cGRhdGVJRCgpXSA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMuZmlsdGVycyA9IHNlbGVjdG9yLmZpbHRlcnM7XG4gICAgdGhpcy56b29tID0gc2VsZWN0b3Iuem9vbTtcbiAgICB0aGlzLmZyYW1lX29mZnNldCA9IHNlbGVjdG9yLmZyYW1lX29mZnNldDtcbiAgICB0aGlzLmF0dGFjaG1lbnQgPSBzZWxlY3Rvci5hdHRhY2htZW50IHx8ICdfX2RlZmF1bHRfXyc7XG4gICAgdGhpcy5zcGVjaWZpY2l0eSA9IHNlbGVjdG9yLnNwZWNpZmljaXR5KCk7XG59O1xuXG50cmVlLkRlZmluaXRpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0ciA9IHRoaXMuZmlsdGVycy50b1N0cmluZygpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBzdHIgKz0gJ1xcbiAgICAnICsgdGhpcy5ydWxlc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn07XG5cbnRyZWUuRGVmaW5pdGlvbi5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbihmaWx0ZXJzKSB7XG4gICAgaWYgKGZpbHRlcnMpIGFzc2VydC5vayhmaWx0ZXJzIGluc3RhbmNlb2YgdHJlZS5GaWx0ZXJzZXQpO1xuICAgIHZhciBjbG9uZSA9IE9iamVjdC5jcmVhdGUodHJlZS5EZWZpbml0aW9uLnByb3RvdHlwZSk7XG4gICAgY2xvbmUucnVsZXMgPSB0aGlzLnJ1bGVzLnNsaWNlKCk7XG4gICAgY2xvbmUucnVsZUluZGV4ID0gXy5jbG9uZSh0aGlzLnJ1bGVJbmRleCk7XG4gICAgY2xvbmUuZmlsdGVycyA9IGZpbHRlcnMgPyBmaWx0ZXJzIDogdGhpcy5maWx0ZXJzLmNsb25lKCk7XG4gICAgY2xvbmUuYXR0YWNobWVudCA9IHRoaXMuYXR0YWNobWVudDtcbiAgICByZXR1cm4gY2xvbmU7XG59O1xuXG50cmVlLkRlZmluaXRpb24ucHJvdG90eXBlLmFkZFJ1bGVzID0gZnVuY3Rpb24ocnVsZXMpIHtcbiAgICB2YXIgYWRkZWQgPSAwO1xuXG4gICAgLy8gQWRkIG9ubHkgdW5pcXVlIHJ1bGVzLlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCF0aGlzLnJ1bGVJbmRleFtydWxlc1tpXS5pZF0pIHtcbiAgICAgICAgICAgIHRoaXMucnVsZXMucHVzaChydWxlc1tpXSk7XG4gICAgICAgICAgICB0aGlzLnJ1bGVJbmRleFtydWxlc1tpXS5pZF0gPSB0cnVlO1xuICAgICAgICAgICAgYWRkZWQrKztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhZGRlZDtcbn07XG5cbi8vIERldGVybWluZSB3aGV0aGVyIHRoaXMgc2VsZWN0b3IgbWF0Y2hlcyBhIGdpdmVuIGlkXG4vLyBhbmQgYXJyYXkgb2YgY2xhc3NlcywgYnkgZGV0ZXJtaW5pbmcgd2hldGhlclxuLy8gYWxsIGVsZW1lbnRzIGl0IGNvbnRhaW5zIG1hdGNoLlxudHJlZS5EZWZpbml0aW9uLnByb3RvdHlwZS5hcHBsaWVzVG8gPSBmdW5jdGlvbihpZCwgY2xhc3Nlcykge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5lbGVtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIGVsZW0gPSB0aGlzLmVsZW1lbnRzW2ldO1xuICAgICAgICBpZiAoIShlbGVtLndpbGRjYXJkIHx8XG4gICAgICAgICAgICAoZWxlbS50eXBlID09PSAnY2xhc3MnICYmIGNsYXNzZXNbZWxlbS5jbGVhbl0pIHx8XG4gICAgICAgICAgICAoZWxlbS50eXBlID09PSAnaWQnICYmIGlkID09PSBlbGVtLmNsZWFuKSkpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5mdW5jdGlvbiBzeW1ib2xpemVyTmFtZShzeW1ib2xpemVyKSB7XG4gICAgZnVuY3Rpb24gY2FwaXRhbGl6ZShzdHIpIHsgcmV0dXJuIHN0clsxXS50b1VwcGVyQ2FzZSgpOyB9XG4gICAgcmV0dXJuIHN5bWJvbGl6ZXIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgK1xuICAgICAgICAgICBzeW1ib2xpemVyLnNsaWNlKDEpLnJlcGxhY2UoL1xcLS4vLCBjYXBpdGFsaXplKSArICdTeW1ib2xpemVyJztcbn1cblxuLy8gR2V0IGEgc2ltcGxlIGxpc3Qgb2YgdGhlIHN5bWJvbGl6ZXJzLCBpbiBvcmRlclxuZnVuY3Rpb24gc3ltYm9saXplckxpc3Qoc3ltX29yZGVyKSB7XG4gICAgcmV0dXJuIHN5bV9vcmRlci5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGFbMV0gLSBiWzFdOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uKHYpIHsgcmV0dXJuIHZbMF07IH0pO1xufVxuXG50cmVlLkRlZmluaXRpb24ucHJvdG90eXBlLnN5bWJvbGl6ZXJzVG9YTUwgPSBmdW5jdGlvbihlbnYsIHN5bWJvbGl6ZXJzLCB6b29tKSB7XG4gICAgdmFyIHhtbCA9IHpvb20udG9YTUwoZW52KS5qb2luKCcnKSArIHRoaXMuZmlsdGVycy50b1hNTChlbnYpO1xuXG4gICAgLy8gU29ydCBzeW1ib2xpemVycyBieSB0aGUgaW5kZXggb2YgdGhlaXIgZmlyc3QgcHJvcGVydHkgZGVmaW5pdGlvblxuICAgIHZhciBzeW1fb3JkZXIgPSBbXSwgaW5kZXhlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBzeW1ib2xpemVycykge1xuICAgICAgICBpbmRleGVzID0gW107XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc3ltYm9saXplcnNba2V5XSkge1xuICAgICAgICAgICAgaW5kZXhlcy5wdXNoKHN5bWJvbGl6ZXJzW2tleV1bcHJvcF0uaW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBtaW5faWR4ID0gTWF0aC5taW4uYXBwbHkoTWF0aCwgaW5kZXhlcyk7XG4gICAgICAgIHN5bV9vcmRlci5wdXNoKFtrZXksIG1pbl9pZHhdKTtcbiAgICB9XG5cbiAgICBzeW1fb3JkZXIgPSBzeW1ib2xpemVyTGlzdChzeW1fb3JkZXIpO1xuICAgIHZhciBzeW1fY291bnQgPSAwO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzeW1fb3JkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGF0dHJpYnV0ZXMgPSBzeW1ib2xpemVyc1tzeW1fb3JkZXJbaV1dO1xuICAgICAgICB2YXIgc3ltYm9saXplciA9IHN5bV9vcmRlcltpXS5zcGxpdCgnLycpLnBvcCgpO1xuXG4gICAgICAgIC8vIFNraXAgdGhlIG1hZ2ljYWwgKiBzeW1ib2xpemVyIHdoaWNoIGlzIHVzZWQgZm9yIHVuaXZlcnNhbCBwcm9wZXJ0aWVzXG4gICAgICAgIC8vIHdoaWNoIGFyZSBidWJibGVkIHVwIHRvIFN0eWxlIGVsZW1lbnRzIGludGVhZCBvZiBTeW1ib2xpemVyIGVsZW1lbnRzLlxuICAgICAgICBpZiAoc3ltYm9saXplciA9PT0gJyonKSBjb250aW51ZTtcbiAgICAgICAgc3ltX2NvdW50Kys7XG5cbiAgICAgICAgdmFyIGZhaWwgPSB0cmVlLlJlZmVyZW5jZS5yZXF1aXJlZFByb3BlcnRpZXMoc3ltYm9saXplciwgYXR0cmlidXRlcyk7XG4gICAgICAgIGlmIChmYWlsKSB7XG4gICAgICAgICAgICB2YXIgcnVsZSA9IGF0dHJpYnV0ZXNbT2JqZWN0LmtleXMoYXR0cmlidXRlcykuc2hpZnQoKV07XG4gICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGZhaWwsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHJ1bGUuaW5kZXgsXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IHJ1bGUuZmlsZW5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG5hbWUgPSBzeW1ib2xpemVyTmFtZShzeW1ib2xpemVyKTtcblxuICAgICAgICB2YXIgc2VsZmNsb3NpbmcgPSB0cnVlLCB0YWdjb250ZW50O1xuICAgICAgICB4bWwgKz0gJyAgICA8JyArIG5hbWUgKyAnICc7XG4gICAgICAgIGZvciAodmFyIGogaW4gYXR0cmlidXRlcykge1xuICAgICAgICAgICAgaWYgKHN5bWJvbGl6ZXIgPT09ICdtYXAnKSBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdNYXAgcHJvcGVydGllcyBhcmUgbm90IHBlcm1pdHRlZCBpbiBvdGhlciBydWxlcycsXG4gICAgICAgICAgICAgICAgaW5kZXg6IGF0dHJpYnV0ZXNbal0uaW5kZXgsXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IGF0dHJpYnV0ZXNbal0uZmlsZW5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHggPSB0cmVlLlJlZmVyZW5jZS5zZWxlY3RvcihhdHRyaWJ1dGVzW2pdLm5hbWUpO1xuICAgICAgICAgICAgaWYgKHggJiYgeC5zZXJpYWxpemF0aW9uICYmIHguc2VyaWFsaXphdGlvbiA9PT0gJ2NvbnRlbnQnKSB7XG4gICAgICAgICAgICAgICAgc2VsZmNsb3NpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0YWdjb250ZW50ID0gYXR0cmlidXRlc1tqXS5ldihlbnYpLnRvWE1MKGVudiwgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHggJiYgeC5zZXJpYWxpemF0aW9uICYmIHguc2VyaWFsaXphdGlvbiA9PT0gJ3RhZycpIHtcbiAgICAgICAgICAgICAgICBzZWxmY2xvc2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRhZ2NvbnRlbnQgPSBhdHRyaWJ1dGVzW2pdLmV2KGVudikudG9YTUwoZW52LCB0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgeG1sICs9IGF0dHJpYnV0ZXNbal0uZXYoZW52KS50b1hNTChlbnYpICsgJyAnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxmY2xvc2luZykge1xuICAgICAgICAgICAgeG1sICs9ICcvPlxcbic7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRhZ2NvbnRlbnQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIGlmICh0YWdjb250ZW50LmluZGV4T2YoJzwnKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIHhtbCArPSAnPicgKyB0YWdjb250ZW50ICsgJzwvJyArIG5hbWUgKyAnPlxcbic7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHhtbCArPSAnPjwhW0NEQVRBWycgKyB0YWdjb250ZW50ICsgJ11dPjwvJyArIG5hbWUgKyAnPlxcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFzeW1fY291bnQgfHwgIXhtbCkgcmV0dXJuICcnO1xuICAgIHJldHVybiAnICA8UnVsZT5cXG4nICsgeG1sICsgJyAgPC9SdWxlPlxcbic7XG59O1xuXG4vLyBUYWtlIGEgem9vbSByYW5nZSBvZiB6b29tcyBhbmQgJ2knLCB0aGUgaW5kZXggb2YgYSBydWxlIGluIHRoaXMucnVsZXMsXG4vLyBhbmQgZmluZHMgYWxsIGFwcGxpY2FibGUgc3ltYm9saXplcnNcbnRyZWUuRGVmaW5pdGlvbi5wcm90b3R5cGUuY29sbGVjdFN5bWJvbGl6ZXJzID0gZnVuY3Rpb24oem9vbXMsIGkpIHtcbiAgICB2YXIgc3ltYm9saXplcnMgPSB7fSwgY2hpbGQ7XG5cbiAgICBmb3IgKHZhciBqID0gaTsgaiA8IHRoaXMucnVsZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY2hpbGQgPSB0aGlzLnJ1bGVzW2pdO1xuICAgICAgICB2YXIga2V5ID0gY2hpbGQuaW5zdGFuY2UgKyAnLycgKyBjaGlsZC5zeW1ib2xpemVyO1xuICAgICAgICBpZiAoem9vbXMuY3VycmVudCAmIGNoaWxkLnpvb20gJiZcbiAgICAgICAgICAgKCEoa2V5IGluIHN5bWJvbGl6ZXJzKSB8fFxuICAgICAgICAgICAoIShjaGlsZC5uYW1lIGluIHN5bWJvbGl6ZXJzW2tleV0pKSkpIHtcbiAgICAgICAgICAgIHpvb21zLmN1cnJlbnQgJj0gY2hpbGQuem9vbTtcbiAgICAgICAgICAgIGlmICghKGtleSBpbiBzeW1ib2xpemVycykpIHtcbiAgICAgICAgICAgICAgICBzeW1ib2xpemVyc1trZXldID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzeW1ib2xpemVyc1trZXldW2NoaWxkLm5hbWVdID0gY2hpbGQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoT2JqZWN0LmtleXMoc3ltYm9saXplcnMpLmxlbmd0aCkge1xuICAgICAgICB6b29tcy5ydWxlICY9ICh6b29tcy5hdmFpbGFibGUgJj0gfnpvb21zLmN1cnJlbnQpO1xuICAgICAgICByZXR1cm4gc3ltYm9saXplcnM7XG4gICAgfVxufTtcblxuLy8gVGhlIHRyZWUuWm9vbS50b1N0cmluZyBmdW5jdGlvbiBpZ25vcmVzIHRoZSBob2xlcyBpbiB6b29tIHJhbmdlcyBhbmQgb3V0cHV0c1xuLy8gc2NhbGVkZW5vbWluYXRvcnMgdGhhdCBjb3ZlciB0aGUgd2hvbGUgcmFuZ2UgZnJvbSB0aGUgZmlyc3QgdG8gbGFzdCBiaXQgc2V0LlxuLy8gVGhpcyBhbGdvcml0aG0gY2FuIHByb2R1Y2VzIHpvb20gcmFuZ2VzIHRoYXQgbWF5IGhhdmUgaG9sZXMuIEhvd2V2ZXIsXG4vLyB3aGVuIHVzaW5nIHRoZSBmaWx0ZXItbW9kZT1cImZpcnN0XCIsIG1vcmUgc3BlY2lmaWMgem9vbSBmaWx0ZXJzIHdpbGwgYWx3YXlzXG4vLyBlbmQgdXAgYmVmb3JlIGJyb2FkZXIgcmFuZ2VzLiBUaGUgZmlsdGVyLW1vZGUgd2lsbCBwaWNrIHRob3NlIGZpcnN0IGJlZm9yZVxuLy8gcmVzb3J0aW5nIHRvIHRoZSB6b29tIHJhbmdlIHdpdGggdGhlIGhvbGUgYW5kIHN0b3AgcHJvY2Vzc2luZyBmdXJ0aGVyIHJ1bGVzLlxudHJlZS5EZWZpbml0aW9uLnByb3RvdHlwZS50b1hNTCA9IGZ1bmN0aW9uKGVudiwgZXhpc3RpbmcpIHtcbiAgICB2YXIgZmlsdGVyID0gdGhpcy5maWx0ZXJzLnRvU3RyaW5nKCk7XG4gICAgaWYgKCEoZmlsdGVyIGluIGV4aXN0aW5nKSkgZXhpc3RpbmdbZmlsdGVyXSA9IHRyZWUuWm9vbS5hbGw7XG5cbiAgICB2YXIgYXZhaWxhYmxlID0gdHJlZS5ab29tLmFsbCwgeG1sID0gJycsIHpvb20sIHN5bWJvbGl6ZXJzLFxuICAgICAgICB6b29tcyA9IHsgYXZhaWxhYmxlOiB0cmVlLlpvb20uYWxsIH07XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnJ1bGVzLmxlbmd0aCAmJiBhdmFpbGFibGU7IGkrKykge1xuICAgICAgICB6b29tcy5ydWxlID0gdGhpcy5ydWxlc1tpXS56b29tO1xuICAgICAgICBpZiAoIShleGlzdGluZ1tmaWx0ZXJdICYgem9vbXMucnVsZSkpIGNvbnRpbnVlO1xuXG4gICAgICAgIHdoaWxlICh6b29tcy5jdXJyZW50ID0gem9vbXMucnVsZSAmIGF2YWlsYWJsZSkge1xuICAgICAgICAgICAgaWYgKHN5bWJvbGl6ZXJzID0gdGhpcy5jb2xsZWN0U3ltYm9saXplcnMoem9vbXMsIGkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoZXhpc3RpbmdbZmlsdGVyXSAmIHpvb21zLmN1cnJlbnQpKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB4bWwgKz0gdGhpcy5zeW1ib2xpemVyc1RvWE1MKGVudiwgc3ltYm9saXplcnMsXG4gICAgICAgICAgICAgICAgICAgIChuZXcgdHJlZS5ab29tKCkpLnNldFpvb20oZXhpc3RpbmdbZmlsdGVyXSAmIHpvb21zLmN1cnJlbnQpKTtcbiAgICAgICAgICAgICAgICBleGlzdGluZ1tmaWx0ZXJdICY9IH56b29tcy5jdXJyZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHhtbDtcbn07XG5cbnRyZWUuRGVmaW5pdGlvbi5wcm90b3R5cGUudG9KUyA9IGZ1bmN0aW9uKGVudikge1xuICB2YXIgc2hhZGVyQXR0cnMgPSB7fTtcblxuICAvLyBtZXJnZSBjb25kaXRpb25zIGZyb20gZmlsdGVycyB3aXRoIHpvb20gY29uZGl0aW9uIG9mIHRoZVxuICAvLyBkZWZpbml0aW9uXG4gIHZhciB6b29tID0gXCIoXCIgKyB0aGlzLnpvb20gKyBcIiAmICgxIDw8IGN0eC56b29tKSlcIjtcbiAgdmFyIGZyYW1lX29mZnNldCA9IHRoaXMuZnJhbWVfb2Zmc2V0O1xuICB2YXIgX2lmID0gdGhpcy5maWx0ZXJzLnRvSlMoZW52KTtcbiAgdmFyIGZpbHRlcnMgPSBbem9vbV07XG4gIGlmKF9pZikgZmlsdGVycy5wdXNoKF9pZik7XG4gIGlmKGZyYW1lX29mZnNldCkgZmlsdGVycy5wdXNoKCdjdHhbXCJmcmFtZS1vZmZzZXRcIl0gPT09ICcgKyBmcmFtZV9vZmZzZXQpO1xuICBfaWYgPSBmaWx0ZXJzLmpvaW4oXCIgJiYgXCIpO1xuICBfLmVhY2godGhpcy5ydWxlcywgZnVuY3Rpb24ocnVsZSkge1xuICAgICAgaWYocnVsZSBpbnN0YW5jZW9mIHRyZWUuUnVsZSkge1xuICAgICAgICBzaGFkZXJBdHRyc1tydWxlLm5hbWVdID0gc2hhZGVyQXR0cnNbcnVsZS5uYW1lXSB8fCBbXTtcblxuICAgICAgICB2YXIgciA9IHtcbiAgICAgICAgICBpbmRleDogcnVsZS5pbmRleCxcbiAgICAgICAgICBzeW1ib2xpemVyOiBydWxlLnN5bWJvbGl6ZXJcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoX2lmKSB7XG4gICAgICAgICAgci5qcyA9IFwiaWYoXCIgKyBfaWYgKyBcIil7XCIgKyBydWxlLnZhbHVlLnRvSlMoZW52KSArIFwifVwiXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgci5qcyA9IHJ1bGUudmFsdWUudG9KUyhlbnYpO1xuICAgICAgICB9XG5cbiAgICAgICAgci5jb25zdGFudCA9IHJ1bGUudmFsdWUuZXYoZW52KS5pcyAhPT0gJ2ZpZWxkJztcbiAgICAgICAgci5maWx0ZXJlZCA9ICEhX2lmO1xuXG4gICAgICAgIHNoYWRlckF0dHJzW3J1bGUubmFtZV0ucHVzaChyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJ1bGVzZXQgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgLy9pZiAocnVsZSBpbnN0YW5jZW9mIHRyZWUuUnVsZXNldCkge1xuICAgICAgICAgIC8vdmFyIHNoID0gcnVsZS50b0pTKGVudik7XG4gICAgICAgICAgLy9mb3IodmFyIHYgaW4gc2gpIHtcbiAgICAgICAgICAgIC8vc2hhZGVyQXR0cnNbdl0gPSBzaGFkZXJBdHRyc1t2XSB8fCBbXTtcbiAgICAgICAgICAgIC8vZm9yKHZhciBhdHRyIGluIHNoW3ZdKSB7XG4gICAgICAgICAgICAgIC8vc2hhZGVyQXR0cnNbdl0ucHVzaChzaFt2XVthdHRyXSk7XG4gICAgICAgICAgICAvL31cbiAgICAgICAgICAvL31cbiAgICAgICAgLy99XG4gICAgICB9XG4gIH0pO1xuICByZXR1cm4gc2hhZGVyQXR0cnM7XG59O1xuXG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xudmFyIF8gPSBnbG9iYWwuXyB8fCByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG4vL1xuLy8gQSBudW1iZXIgd2l0aCBhIHVuaXRcbi8vXG50cmVlLkRpbWVuc2lvbiA9IGZ1bmN0aW9uIERpbWVuc2lvbih2YWx1ZSwgdW5pdCwgaW5kZXgpIHtcbiAgICB0aGlzLnZhbHVlID0gcGFyc2VGbG9hdCh2YWx1ZSk7XG4gICAgdGhpcy51bml0ID0gdW5pdCB8fCBudWxsO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbn07XG5cbnRyZWUuRGltZW5zaW9uLnByb3RvdHlwZSA9IHtcbiAgICBpczogJ2Zsb2F0JyxcbiAgICBwaHlzaWNhbF91bml0czogWydtJywgJ2NtJywgJ2luJywgJ21tJywgJ3B0JywgJ3BjJ10sXG4gICAgc2NyZWVuX3VuaXRzOiBbJ3B4JywgJyUnXSxcbiAgICBhbGxfdW5pdHM6IFsnbScsICdjbScsICdpbicsICdtbScsICdwdCcsICdwYycsICdweCcsICclJ10sXG4gICAgZGVuc2l0aWVzOiB7XG4gICAgICAgIG06IDAuMDI1NCxcbiAgICAgICAgbW06IDI1LjQsXG4gICAgICAgIGNtOiAyLjU0LFxuICAgICAgICBwdDogNzIsXG4gICAgICAgIHBjOiA2XG4gICAgfSxcbiAgICBldjogZnVuY3Rpb24gKGVudikge1xuICAgICAgICBpZiAodGhpcy51bml0ICYmICFfLmNvbnRhaW5zKHRoaXMuYWxsX3VuaXRzLCB0aGlzLnVuaXQpKSB7XG4gICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiSW52YWxpZCB1bml0OiAnXCIgKyB0aGlzLnVuaXQgKyBcIidcIixcbiAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4geyBpczogJ3VuZGVmaW5lZCcsIHZhbHVlOiAndW5kZWZpbmVkJyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm9ybWFsaXplIHVuaXRzIHdoaWNoIGFyZSBub3QgcHggb3IgJVxuICAgICAgICBpZiAodGhpcy51bml0ICYmIF8uY29udGFpbnModGhpcy5waHlzaWNhbF91bml0cywgdGhpcy51bml0KSkge1xuICAgICAgICAgICAgaWYgKCFlbnYucHBpKSB7XG4gICAgICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJwcGkgaXMgbm90IHNldCwgc28gbWV0cmljIHVuaXRzIGNhbid0IGJlIHVzZWRcIixcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXhcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBpczogJ3VuZGVmaW5lZCcsIHZhbHVlOiAndW5kZWZpbmVkJyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29udmVydCBhbGwgdW5pdHMgdG8gaW5jaFxuICAgICAgICAgICAgLy8gY29udmVydCBpbmNoIHRvIHB4IHVzaW5nIHBwaVxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9ICh0aGlzLnZhbHVlIC8gdGhpcy5kZW5zaXRpZXNbdGhpcy51bml0XSkgKiBlbnYucHBpO1xuICAgICAgICAgICAgdGhpcy51bml0ID0gJ3B4JztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcm91bmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gTWF0aC5yb3VuZCh0aGlzLnZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICB0b0NvbG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkNvbG9yKFt0aGlzLnZhbHVlLCB0aGlzLnZhbHVlLCB0aGlzLnZhbHVlXSk7XG4gICAgfSxcbiAgICByb3VuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSBNYXRoLnJvdW5kKHRoaXMudmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUudG9TdHJpbmcoKTtcbiAgICB9LFxuICAgIG9wZXJhdGU6IGZ1bmN0aW9uKGVudiwgb3AsIG90aGVyKSB7XG4gICAgICAgIGlmICh0aGlzLnVuaXQgPT09ICclJyAmJiBvdGhlci51bml0ICE9PSAnJScpIHtcbiAgICAgICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0lmIHR3byBvcGVyYW5kcyBkaWZmZXIsIHRoZSBmaXJzdCBtdXN0IG5vdCBiZSAlJyxcbiAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy51bml0ICE9PSAnJScgJiYgb3RoZXIudW5pdCA9PT0gJyUnKSB7XG4gICAgICAgICAgICBpZiAob3AgPT09ICcqJyB8fCBvcCA9PT0gJy8nIHx8IG9wID09PSAnJScpIHtcbiAgICAgICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnUGVyY2VudCB2YWx1ZXMgY2FuIG9ubHkgYmUgYWRkZWQgb3Igc3VidHJhY3RlZCBmcm9tIG90aGVyIHZhbHVlcycsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgaXM6ICd1bmRlZmluZWQnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuRGltZW5zaW9uKHRyZWUub3BlcmF0ZShvcCxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSwgdGhpcy52YWx1ZSAqIG90aGVyLnZhbHVlICogMC4wMSksXG4gICAgICAgICAgICAgICAgdGhpcy51bml0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vaGVyZSB0aGUgb3BlcmFuZHMgYXJlIGVpdGhlciB0aGUgc2FtZSAoJSBvciB1bmRlZmluZWQgb3IgcHgpLCBvciBvbmUgaXMgdW5kZWZpbmVkIGFuZCB0aGUgb3RoZXIgaXMgcHhcbiAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkRpbWVuc2lvbih0cmVlLm9wZXJhdGUob3AsIHRoaXMudmFsdWUsIG90aGVyLnZhbHVlKSxcbiAgICAgICAgICAgIHRoaXMudW5pdCB8fCBvdGhlci51bml0KTtcbiAgICB9XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxuLy8gQW4gZWxlbWVudCBpcyBhbiBpZCBvciBjbGFzcyBzZWxlY3RvclxudHJlZS5FbGVtZW50ID0gZnVuY3Rpb24gRWxlbWVudCh2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZS50cmltKCk7XG4gICAgaWYgKHRoaXMudmFsdWVbMF0gPT09ICcjJykge1xuICAgICAgICB0aGlzLnR5cGUgPSAnaWQnO1xuICAgICAgICB0aGlzLmNsZWFuID0gdGhpcy52YWx1ZS5yZXBsYWNlKC9eIy8sICcnKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudmFsdWVbMF0gPT09ICcuJykge1xuICAgICAgICB0aGlzLnR5cGUgPSAnY2xhc3MnO1xuICAgICAgICB0aGlzLmNsZWFuID0gdGhpcy52YWx1ZS5yZXBsYWNlKC9eXFwuLywgJycpO1xuICAgIH1cbiAgICBpZiAodGhpcy52YWx1ZS5pbmRleE9mKCcqJykgIT09IC0xKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICd3aWxkY2FyZCc7XG4gICAgfVxufTtcblxuLy8gRGV0ZXJtaW5lIHRoZSAnc3BlY2lmaWNpdHkgbWF0cml4JyBvZiB0aGlzXG4vLyBzcGVjaWZpYyBzZWxlY3RvclxudHJlZS5FbGVtZW50LnByb3RvdHlwZS5zcGVjaWZpY2l0eSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICh0aGlzLnR5cGUgPT09ICdpZCcpID8gMSA6IDAsIC8vIGFcbiAgICAgICAgKHRoaXMudHlwZSA9PT0gJ2NsYXNzJykgPyAxIDogMCAgLy8gYlxuICAgIF07XG59O1xuXG50cmVlLkVsZW1lbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnZhbHVlOyB9O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5FeHByZXNzaW9uID0gZnVuY3Rpb24gRXhwcmVzc2lvbih2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn07XG5cbnRyZWUuRXhwcmVzc2lvbi5wcm90b3R5cGUgPSB7XG4gICAgaXM6ICdleHByZXNzaW9uJyxcbiAgICBldjogZnVuY3Rpb24oZW52KSB7XG4gICAgICAgIGlmICh0aGlzLnZhbHVlLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5FeHByZXNzaW9uKHRoaXMudmFsdWUubWFwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZS5ldihlbnYpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVbMF0uZXYoZW52KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB0b1N0cmluZzogZnVuY3Rpb24oZW52KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICByZXR1cm4gZS50b1N0cmluZyhlbnYpO1xuICAgICAgICB9KS5qb2luKCcgJyk7XG4gICAgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuRmllbGQgPSBmdW5jdGlvbiBGaWVsZChjb250ZW50KSB7XG4gICAgdGhpcy52YWx1ZSA9IGNvbnRlbnQgfHwgJyc7XG59O1xuXG50cmVlLkZpZWxkLnByb3RvdHlwZSA9IHtcbiAgICBpczogJ2ZpZWxkJyxcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAnWycgKyB0aGlzLnZhbHVlICsgJ10nO1xuICAgIH0sXG4gICAgJ2V2JzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLkZpbHRlciA9IGZ1bmN0aW9uIEZpbHRlcihrZXksIG9wLCB2YWwsIGluZGV4LCBmaWxlbmFtZSkge1xuICAgIHRoaXMua2V5ID0ga2V5O1xuICAgIHRoaXMub3AgPSBvcDtcbiAgICB0aGlzLnZhbCA9IHZhbDtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5maWxlbmFtZSA9IGZpbGVuYW1lO1xuXG4gICAgdGhpcy5pZCA9IHRoaXMua2V5ICsgdGhpcy5vcCArIHRoaXMudmFsO1xufTtcblxuLy8geG1sc2FmZSwgbnVtZXJpYywgc3VmZml4XG52YXIgb3BzID0ge1xuICAgICc8JzogWycgJmx0OyAnLCAnbnVtZXJpYyddLFxuICAgICc+JzogWycgJmd0OyAnLCAnbnVtZXJpYyddLFxuICAgICc9JzogWycgPSAnLCAnYm90aCddLFxuICAgICchPSc6IFsnICE9ICcsICdib3RoJ10sXG4gICAgJzw9JzogWycgJmx0Oz0gJywgJ251bWVyaWMnXSxcbiAgICAnPj0nOiBbJyAmZ3Q7PSAnLCAnbnVtZXJpYyddLFxuICAgICc9fic6IFsnLm1hdGNoKCcsICdzdHJpbmcnLCAnKSddXG59O1xuXG50cmVlLkZpbHRlci5wcm90b3R5cGUuZXYgPSBmdW5jdGlvbihlbnYpIHtcbiAgICB0aGlzLmtleSA9IHRoaXMua2V5LmV2KGVudik7XG4gICAgdGhpcy52YWwgPSB0aGlzLnZhbC5ldihlbnYpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxudHJlZS5GaWx0ZXIucHJvdG90eXBlLnRvWE1MID0gZnVuY3Rpb24oZW52KSB7XG4gICAgaWYgKHRyZWUuUmVmZXJlbmNlLmRhdGEuZmlsdGVyKSB7XG4gICAgICAgIGlmICh0aGlzLmtleS5pcyA9PT0gJ2tleXdvcmQnICYmIC0xID09PSB0cmVlLlJlZmVyZW5jZS5kYXRhLmZpbHRlci52YWx1ZS5pbmRleE9mKHRoaXMua2V5LnRvU3RyaW5nKCkpKSB7XG4gICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHRoaXMua2V5LnRvU3RyaW5nKCkgKyAnIGlzIG5vdCBhIHZhbGlkIGtleXdvcmQgaW4gYSBmaWx0ZXIgZXhwcmVzc2lvbicsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMuZmlsZW5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnZhbC5pcyA9PT0gJ2tleXdvcmQnICYmIC0xID09PSB0cmVlLlJlZmVyZW5jZS5kYXRhLmZpbHRlci52YWx1ZS5pbmRleE9mKHRoaXMudmFsLnRvU3RyaW5nKCkpKSB7XG4gICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHRoaXMudmFsLnRvU3RyaW5nKCkgKyAnIGlzIG5vdCBhIHZhbGlkIGtleXdvcmQgaW4gYSBmaWx0ZXIgZXhwcmVzc2lvbicsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMuZmlsZW5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBrZXkgPSB0aGlzLmtleS50b1N0cmluZyhmYWxzZSk7XG4gICAgdmFyIHZhbCA9IHRoaXMudmFsLnRvU3RyaW5nKHRoaXMudmFsLmlzID09ICdzdHJpbmcnKTtcblxuICAgIGlmIChcbiAgICAgICAgKG9wc1t0aGlzLm9wXVsxXSA9PSAnbnVtZXJpYycgJiYgaXNOYU4odmFsKSAmJiB0aGlzLnZhbC5pcyAhPT0gJ2ZpZWxkJykgfHxcbiAgICAgICAgKG9wc1t0aGlzLm9wXVsxXSA9PSAnc3RyaW5nJyAmJiAodmFsKVswXSAhPSBcIidcIilcbiAgICApIHtcbiAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdDYW5ub3QgdXNlIG9wZXJhdG9yIFwiJyArIHRoaXMub3AgKyAnXCIgd2l0aCB2YWx1ZSAnICsgdGhpcy52YWwsXG4gICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBrZXkgKyBvcHNbdGhpcy5vcF1bMF0gKyB2YWwgKyAob3BzW3RoaXMub3BdWzJdIHx8ICcnKTtcbn07XG5cbnRyZWUuRmlsdGVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnWycgKyB0aGlzLmlkICsgJ10nO1xufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsInZhciB0cmVlID0gcmVxdWlyZSgnLi4vdHJlZScpO1xudmFyIF8gPSBnbG9iYWwuXyB8fCByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbnRyZWUuRmlsdGVyc2V0ID0gZnVuY3Rpb24gRmlsdGVyc2V0KCkge1xuICAgIHRoaXMuZmlsdGVycyA9IHt9O1xufTtcblxudHJlZS5GaWx0ZXJzZXQucHJvdG90eXBlLnRvWE1MID0gZnVuY3Rpb24oZW52KSB7XG4gICAgdmFyIGZpbHRlcnMgPSBbXTtcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLmZpbHRlcnMpIHtcbiAgICAgICAgZmlsdGVycy5wdXNoKCcoJyArIHRoaXMuZmlsdGVyc1tpZF0udG9YTUwoZW52KS50cmltKCkgKyAnKScpO1xuICAgIH1cbiAgICBpZiAoZmlsdGVycy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuICcgICAgPEZpbHRlcj4nICsgZmlsdGVycy5qb2luKCcgYW5kICcpICsgJzwvRmlsdGVyPlxcbic7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbn07XG5cbnRyZWUuRmlsdGVyc2V0LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcnIgPSBbXTtcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLmZpbHRlcnMpIGFyci5wdXNoKHRoaXMuZmlsdGVyc1tpZF0uaWQpO1xuICAgIHJldHVybiBhcnIuc29ydCgpLmpvaW4oJ1xcdCcpO1xufTtcblxudHJlZS5GaWx0ZXJzZXQucHJvdG90eXBlLmV2ID0gZnVuY3Rpb24oZW52KSB7XG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLmZpbHRlcnMpIHtcbiAgICAgICAgdGhpcy5maWx0ZXJzW2ldLmV2KGVudik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxudHJlZS5GaWx0ZXJzZXQucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNsb25lID0gbmV3IHRyZWUuRmlsdGVyc2V0KCk7XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgIGNsb25lLmZpbHRlcnNbaWRdID0gdGhpcy5maWx0ZXJzW2lkXTtcbiAgICB9XG4gICAgcmV0dXJuIGNsb25lO1xufTtcblxuLy8gTm90ZTogb3RoZXIgaGFzIHRvIGJlIGEgdHJlZS5GaWx0ZXJzZXQuXG50cmVlLkZpbHRlcnNldC5wcm90b3R5cGUuY2xvbmVXaXRoID0gZnVuY3Rpb24ob3RoZXIpIHtcbiAgICB2YXIgYWRkaXRpb25zID0gW107XG4gICAgZm9yICh2YXIgaWQgaW4gb3RoZXIuZmlsdGVycykge1xuICAgICAgICB2YXIgc3RhdHVzID0gdGhpcy5hZGRhYmxlKG90aGVyLmZpbHRlcnNbaWRdKTtcbiAgICAgICAgLy8gc3RhdHVzIGlzIHRydWUsIGZhbHNlIG9yIG51bGwuIGlmIGl0J3MgbnVsbCB3ZSBkb24ndCBmYWlsIHRoaXNcbiAgICAgICAgLy8gY2xvbmUgbm9yIGRvIHdlIGFkZCB0aGUgZmlsdGVyLlxuICAgICAgICBpZiAoc3RhdHVzID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0dXMgPT09IHRydWUpIHtcbiAgICAgICAgICAgIC8vIEFkZGluZyB0aGUgZmlsdGVyIHdpbGwgb3ZlcnJpZGUgYW5vdGhlciB2YWx1ZS5cbiAgICAgICAgICAgIGFkZGl0aW9ucy5wdXNoKG90aGVyLmZpbHRlcnNbaWRdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFkZGluZyB0aGUgb3RoZXIgZmlsdGVycyBkb2Vzbid0IG1ha2UgdGhpcyBmaWx0ZXJzZXQgaW52YWxpZCwgYnV0IGl0XG4gICAgLy8gZG9lc24ndCBhZGQgYW55dGhpbmcgdG8gaXQgZWl0aGVyLlxuICAgIGlmICghYWRkaXRpb25zLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBXZSBjYW4gc3VjY2Vzc2Z1bGx5IGFkZCBhbGwgZmlsdGVycy4gTm93IGNsb25lIHRoZSBmaWx0ZXJzZXQgYW5kIGFkZCB0aGVcbiAgICAvLyBuZXcgcnVsZXMuXG4gICAgdmFyIGNsb25lID0gbmV3IHRyZWUuRmlsdGVyc2V0KCk7XG5cbiAgICAvLyBXZSBjYW4gYWRkIHRoZSBydWxlcyB0aGF0IGFyZSBhbHJlYWR5IHByZXNlbnQgd2l0aG91dCBnb2luZyB0aHJvdWdoIHRoZVxuICAgIC8vIGFkZCBmdW5jdGlvbiBhcyBhIEZpbHRlcnNldCBpcyBhbHdheXMgaW4gaXQncyBzaW1wbGVzdCBjYW5vbmljYWwgZm9ybS5cbiAgICBmb3IgKGlkIGluIHRoaXMuZmlsdGVycykge1xuICAgICAgICBjbG9uZS5maWx0ZXJzW2lkXSA9IHRoaXMuZmlsdGVyc1tpZF07XG4gICAgfVxuXG4gICAgLy8gT25seSBhZGQgbmV3IGZpbHRlcnMgdGhhdCBhY3R1YWxseSBjaGFuZ2UgdGhlIGZpbHRlci5cbiAgICB3aGlsZSAoaWQgPSBhZGRpdGlvbnMuc2hpZnQoKSkge1xuICAgICAgICBjbG9uZS5hZGQoaWQpO1xuICAgIH1cblxuICAgIHJldHVybiBjbG9uZTtcbn07XG5cbnRyZWUuRmlsdGVyc2V0LnByb3RvdHlwZS50b0pTID0gZnVuY3Rpb24oZW52KSB7XG4gIHZhciBvcE1hcCA9IHtcbiAgICAnPSc6ICc9PT0nXG4gIH07XG4gIHJldHVybiBfLm1hcCh0aGlzLmZpbHRlcnMsIGZ1bmN0aW9uKGZpbHRlcikge1xuICAgIHZhciBvcCA9IGZpbHRlci5vcDtcbiAgICBpZihvcCBpbiBvcE1hcCkge1xuICAgICAgb3AgPSBvcE1hcFtvcF07XG4gICAgfVxuICAgIHZhciB2YWwgPSBmaWx0ZXIudmFsO1xuICAgIGlmKGZpbHRlci5fdmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhbCA9IGZpbHRlci5fdmFsLnRvU3RyaW5nKHRydWUpO1xuICAgIH1cbiAgICB2YXIgYXR0cnMgPSBcImRhdGFcIjtcbiAgICByZXR1cm4gYXR0cnMgKyBcIlsnXCIgKyBmaWx0ZXIua2V5LnZhbHVlICArIFwiJ10gXCIgKyBvcCArIFwiIFwiICsgKHZhbC5pcyA9PT0gJ3N0cmluZycgPyBcIidcIiArIHZhbC50b1N0cmluZygpLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKSArIFwiJ1wiIDogdmFsKTtcbiAgfSkuam9pbignICYmICcpO1xufTtcblxuLy8gUmV0dXJucyB0cnVlIHdoZW4gdGhlIG5ldyBmaWx0ZXIgY2FuIGJlIGFkZGVkLCBmYWxzZSBvdGhlcndpc2UuXG4vLyBJdCBjYW4gYWxzbyByZXR1cm4gbnVsbCwgYW5kIG9uIHRoZSBvdGhlciBzaWRlIHdlIHRlc3QgZm9yID09PSB0cnVlIG9yXG4vLyBmYWxzZVxudHJlZS5GaWx0ZXJzZXQucHJvdG90eXBlLmFkZGFibGUgPSBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICB2YXIga2V5ID0gZmlsdGVyLmtleS50b1N0cmluZygpLFxuICAgICAgICB2YWx1ZSA9IGZpbHRlci52YWwudG9TdHJpbmcoKTtcblxuICAgIGlmICh2YWx1ZS5tYXRjaCgvXlswLTldKyhcXC5bMC05XSopPyQvKSkgdmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKTtcblxuICAgIHN3aXRjaCAoZmlsdGVyLm9wKSB7XG4gICAgICAgIGNhc2UgJz0nOlxuICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgYWxyZWFkeSBmb289IGFuZCB3ZSdyZSBhZGRpbmcgZm9vPVxuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPSddICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc9J10udmFsLnRvU3RyaW5nKCkgIT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJyE9JyArIHZhbHVlXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc+J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz4nXS52YWwgPj0gdmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJzwnXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPCddLnZhbCA8PSB2YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXSAhPT0gdW5kZWZpbmVkICAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz49J10udmFsID4gdmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10gIT09IHVuZGVmaW5lZCAgJiYgdGhpcy5maWx0ZXJzW2tleSArICc8PSddLnZhbCA8IHZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBjYXNlICc9fic6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBjYXNlICchPSc6XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc9J10gIT09IHVuZGVmaW5lZCkgcmV0dXJuICh0aGlzLmZpbHRlcnNba2V5ICsgJz0nXS52YWwgPT0gdmFsdWUpID8gZmFsc2UgOiBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnIT0nICsgdmFsdWVdICE9PSB1bmRlZmluZWQpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPiddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc+J10udmFsID49IHZhbHVlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJzwnXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPCddLnZhbCA8PSB2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc+PSddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc+PSddLnZhbCA+IHZhbHVlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10udmFsIDwgdmFsdWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgY2FzZSAnPic6XG4gICAgICAgICAgICBpZiAoa2V5ICsgJz0nIGluIHRoaXMuZmlsdGVycykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz0nXS52YWwgPD0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJzwnXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPCddLnZhbCA8PSB2YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXSAhPT0gdW5kZWZpbmVkICAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10udmFsIDw9IHZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc+J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz4nXS52YWwgPj0gdmFsdWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXSAhPT0gdW5kZWZpbmVkICAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz49J10udmFsID4gdmFsdWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgY2FzZSAnPj0nOlxuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPScgXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gKHRoaXMuZmlsdGVyc1trZXkgKyAnPSddLnZhbCA8IHZhbHVlKSA/IGZhbHNlIDogbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJzwnIF0gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJzwnXS52YWwgPD0gdmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10udmFsIDwgdmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz4nIF0gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz4nXS52YWwgPj0gdmFsdWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXS52YWwgPj0gdmFsdWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgY2FzZSAnPCc6XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc9JyBdICE9PSB1bmRlZmluZWQpIHJldHVybiAodGhpcy5maWx0ZXJzW2tleSArICc9J10udmFsID49IHZhbHVlKSA/IGZhbHNlIDogbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz4nIF0gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz4nXS52YWwgPj0gdmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz49J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz49J10udmFsID49IHZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc8JyBdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc8J10udmFsIDw9IHZhbHVlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10udmFsIDwgdmFsdWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgY2FzZSAnPD0nOlxuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPScgXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gKHRoaXMuZmlsdGVyc1trZXkgKyAnPSddLnZhbCA+IHZhbHVlKSA/IGZhbHNlIDogbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz4nIF0gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz4nXS52YWwgPj0gdmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz49J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz49J10udmFsID4gdmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJzwnIF0gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJzwnXS52YWwgPD0gdmFsdWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXS52YWwgPD0gdmFsdWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufTtcblxuLy8gRG9lcyB0aGUgbmV3IGZpbHRlciBjb25zdGl0dXRlIGEgY29uZmxpY3Q/XG50cmVlLkZpbHRlcnNldC5wcm90b3R5cGUuY29uZmxpY3QgPSBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICB2YXIga2V5ID0gZmlsdGVyLmtleS50b1N0cmluZygpLFxuICAgICAgICB2YWx1ZSA9IGZpbHRlci52YWwudG9TdHJpbmcoKTtcblxuICAgIGlmICghaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZSkpKSB2YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpO1xuXG4gICAgLy8gaWYgKGE9YikgJiYgKGE9YylcbiAgICAvLyBpZiAoYT1iKSAmJiAoYSE9YilcbiAgICAvLyBvciAoYSE9YikgJiYgKGE9YilcbiAgICBpZiAoKGZpbHRlci5vcCA9PT0gJz0nICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPSddICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgdmFsdWUgIT0gdGhpcy5maWx0ZXJzW2tleSArICc9J10udmFsLnRvU3RyaW5nKCkpIHx8XG4gICAgICAgIChmaWx0ZXIub3AgPT09ICchPScgJiYgdGhpcy5maWx0ZXJzW2tleSArICc9J10gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICB2YWx1ZSA9PSB0aGlzLmZpbHRlcnNba2V5ICsgJz0nXS52YWwudG9TdHJpbmcoKSkgfHxcbiAgICAgICAgKGZpbHRlci5vcCA9PT0gJz0nICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnIT0nXSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIHZhbHVlID09IHRoaXMuZmlsdGVyc1trZXkgKyAnIT0nXS52YWwudG9TdHJpbmcoKSkpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci50b1N0cmluZygpICsgJyBhZGRlZCB0byAnICsgdGhpcy50b1N0cmluZygpICsgJyBwcm9kdWNlcyBhbiBpbnZhbGlkIGZpbHRlcic7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xufTtcblxuLy8gT25seSBjYWxsIHRoaXMgZnVuY3Rpb24gZm9yIGZpbHRlcnMgdGhhdCBoYXZlIGJlZW4gY2xlYXJlZCBieSAuYWRkYWJsZSgpLlxudHJlZS5GaWx0ZXJzZXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGZpbHRlciwgZW52KSB7XG4gICAgdmFyIGtleSA9IGZpbHRlci5rZXkudG9TdHJpbmcoKSxcbiAgICAgICAgaWQsXG4gICAgICAgIG9wID0gZmlsdGVyLm9wLFxuICAgICAgICBjb25mbGljdCA9IHRoaXMuY29uZmxpY3QoZmlsdGVyKSxcbiAgICAgICAgbnVtdmFsO1xuXG4gICAgaWYgKGNvbmZsaWN0KSByZXR1cm4gY29uZmxpY3Q7XG5cbiAgICBpZiAob3AgPT09ICc9Jykge1xuICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMuZmlsdGVycykge1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1tpXS5rZXkgPT0ga2V5KSBkZWxldGUgdGhpcy5maWx0ZXJzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmlsdGVyc1trZXkgKyAnPSddID0gZmlsdGVyO1xuICAgIH0gZWxzZSBpZiAob3AgPT09ICchPScpIHtcbiAgICAgICAgdGhpcy5maWx0ZXJzW2tleSArICchPScgKyBmaWx0ZXIudmFsXSA9IGZpbHRlcjtcbiAgICB9IGVsc2UgaWYgKG9wID09PSAnPX4nKSB7XG4gICAgICAgIHRoaXMuZmlsdGVyc1trZXkgKyAnPX4nICsgZmlsdGVyLnZhbF0gPSBmaWx0ZXI7XG4gICAgfSBlbHNlIGlmIChvcCA9PT0gJz4nKSB7XG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSBvdGhlciBmaWx0ZXJzIHRoYXQgYXJlIGFsc28gPlxuICAgICAgICAvLyBidXQgYXJlIGxlc3MgdGhhbiB0aGlzIG9uZSwgdGhleSBkb24ndCBtYXR0ZXIsIHNvXG4gICAgICAgIC8vIHJlbW92ZSB0aGVtLlxuICAgICAgICBmb3IgKHZhciBqIGluIHRoaXMuZmlsdGVycykge1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1tqXS5rZXkgPT0ga2V5ICYmIHRoaXMuZmlsdGVyc1tqXS52YWwgPD0gZmlsdGVyLnZhbCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbHRlcnNbal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maWx0ZXJzW2tleSArICc+J10gPSBmaWx0ZXI7XG4gICAgfSBlbHNlIGlmIChvcCA9PT0gJz49Jykge1xuICAgICAgICBmb3IgKHZhciBrIGluIHRoaXMuZmlsdGVycykge1xuICAgICAgICAgICAgbnVtdmFsID0gKCt0aGlzLmZpbHRlcnNba10udmFsLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trXS5rZXkgPT0ga2V5ICYmIG51bXZhbCA8IGZpbHRlci52YWwpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5maWx0ZXJzW2tdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJyE9JyArIGZpbHRlci52YWxdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbHRlcnNba2V5ICsgJyE9JyArIGZpbHRlci52YWxdO1xuICAgICAgICAgICAgZmlsdGVyLm9wID0gJz4nO1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJzW2tleSArICc+J10gPSBmaWx0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZpbHRlcnNba2V5ICsgJz49J10gPSBmaWx0ZXI7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9wID09PSAnPCcpIHtcbiAgICAgICAgZm9yICh2YXIgbCBpbiB0aGlzLmZpbHRlcnMpIHtcbiAgICAgICAgICAgIG51bXZhbCA9ICgrdGhpcy5maWx0ZXJzW2xdLnZhbC50b1N0cmluZygpKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNbbF0ua2V5ID09IGtleSAmJiBudW12YWwgPj0gZmlsdGVyLnZhbCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbHRlcnNbbF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maWx0ZXJzW2tleSArICc8J10gPSBmaWx0ZXI7XG4gICAgfSBlbHNlIGlmIChvcCA9PT0gJzw9Jykge1xuICAgICAgICBmb3IgKHZhciBtIGluIHRoaXMuZmlsdGVycykge1xuICAgICAgICAgICAgbnVtdmFsID0gKCt0aGlzLmZpbHRlcnNbbV0udmFsLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1ttXS5rZXkgPT0ga2V5ICYmIG51bXZhbCA+IGZpbHRlci52YWwpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5maWx0ZXJzW21dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJyE9JyArIGZpbHRlci52YWxdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbHRlcnNba2V5ICsgJyE9JyArIGZpbHRlci52YWxdO1xuICAgICAgICAgICAgZmlsdGVyLm9wID0gJzwnO1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJzW2tleSArICc8J10gPSBmaWx0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10gPSBmaWx0ZXI7XG4gICAgICAgIH1cbiAgICB9XG59O1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5fZ2V0Rm9udFNldCA9IGZ1bmN0aW9uKGVudiwgZm9udHMpIHtcbiAgICB2YXIgZm9udEtleSA9IGZvbnRzLmpvaW4oJycpO1xuICAgIGlmIChlbnYuX2ZvbnRNYXAgJiYgZW52Ll9mb250TWFwW2ZvbnRLZXldKSB7XG4gICAgICAgIHJldHVybiBlbnYuX2ZvbnRNYXBbZm9udEtleV07XG4gICAgfVxuXG4gICAgdmFyIG5ld19mb250c2V0ID0gbmV3IHRyZWUuRm9udFNldChlbnYsIGZvbnRzKTtcbiAgICBlbnYuZWZmZWN0cy5wdXNoKG5ld19mb250c2V0KTtcbiAgICBpZiAoIWVudi5fZm9udE1hcCkgZW52Ll9mb250TWFwID0ge307XG4gICAgZW52Ll9mb250TWFwW2ZvbnRLZXldID0gbmV3X2ZvbnRzZXQ7XG4gICAgcmV0dXJuIG5ld19mb250c2V0O1xufTtcblxudHJlZS5Gb250U2V0ID0gZnVuY3Rpb24gRm9udFNldChlbnYsIGZvbnRzKSB7XG4gICAgdGhpcy5mb250cyA9IGZvbnRzO1xuICAgIHRoaXMubmFtZSA9ICdmb250c2V0LScgKyBlbnYuZWZmZWN0cy5sZW5ndGg7XG59O1xuXG50cmVlLkZvbnRTZXQucHJvdG90eXBlLnRvWE1MID0gZnVuY3Rpb24oZW52KSB7XG4gICAgcmV0dXJuICc8Rm9udFNldCBuYW1lPVwiJyArXG4gICAgICAgIHRoaXMubmFtZSArXG4gICAgICAgICdcIj5cXG4nICtcbiAgICAgICAgdGhpcy5mb250cy5tYXAoZnVuY3Rpb24oZikge1xuICAgICAgICAgICAgcmV0dXJuICcgIDxGb250IGZhY2UtbmFtZT1cIicgKyBmICsnXCIvPic7XG4gICAgICAgIH0pLmpvaW4oJ1xcbicpICtcbiAgICAgICAgJ1xcbjwvRm9udFNldD4nO1xufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsInZhciB0cmVlID0gcmVxdWlyZSgnLi4vdHJlZScpO1xuXG4vLyBTdG9yYWdlIGZvciBGcmFtZSBvZmZzZXQgdmFsdWVcbi8vIGFuZCBzdG9yZXMgdGhlbSBhcyBiaXQtc2VxdWVuY2VzIHNvIHRoYXQgdGhleSBjYW4gYmUgY29tYmluZWQsXG4vLyBpbnZlcnRlZCwgYW5kIGNvbXBhcmVkIHF1aWNrbHkuXG50cmVlLkZyYW1lT2Zmc2V0ID0gZnVuY3Rpb24ob3AsIHZhbHVlLCBpbmRleCkge1xuICAgIHZhbHVlID0gcGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICBpZiAodmFsdWUgPiB0cmVlLkZyYW1lT2Zmc2V0Lm1heCB8fCB2YWx1ZSA8PSAwKSB7XG4gICAgICAgIHRocm93IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdPbmx5IGZyYW1lLW9mZnNldCBsZXZlbHMgYmV0d2VlbiAxIGFuZCAnICtcbiAgICAgICAgICAgICAgICB0cmVlLkZyYW1lT2Zmc2V0Lm1heCArICcgc3VwcG9ydGVkLicsXG4gICAgICAgICAgICBpbmRleDogaW5kZXhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAob3AgIT09ICc9Jykge1xuICAgICAgICB0aHJvdyB7XG4gICAgICAgICAgICBtZXNzYWdlOiAnb25seSA9IG9wZXJhdG9yIGlzIHN1cHBvcnRlZCBmb3IgZnJhbWUtb2Zmc2V0JyxcbiAgICAgICAgICAgIGluZGV4OiBpbmRleFxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59O1xuXG50cmVlLkZyYW1lT2Zmc2V0Lm1heCA9IDMyO1xudHJlZS5GcmFtZU9mZnNldC5ub25lID0gMDtcblxuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5JbWFnZUZpbHRlciA9IGZ1bmN0aW9uIEltYWdlRmlsdGVyKGZpbHRlciwgYXJncykge1xuICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyO1xuICAgIHRoaXMuYXJncyA9IGFyZ3MgfHwgbnVsbDtcbn07XG5cbnRyZWUuSW1hZ2VGaWx0ZXIucHJvdG90eXBlID0ge1xuICAgIGlzOiAnaW1hZ2VmaWx0ZXInLFxuICAgIGV2OiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0sXG5cbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbHRlciArICcoJyArIHRoaXMuYXJncy5qb2luKCcsJykgKyAnKSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXI7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24gKHRyZWUpIHtcbnRyZWUuSW52YWxpZCA9IGZ1bmN0aW9uIEludmFsaWQoY2h1bmssIGluZGV4LCBtZXNzYWdlKSB7XG4gICAgdGhpcy5jaHVuayA9IGNodW5rO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLnR5cGUgPSAnc3ludGF4JztcbiAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlIHx8IFwiSW52YWxpZCBjb2RlOiBcIiArIHRoaXMuY2h1bms7XG59O1xuXG50cmVlLkludmFsaWQucHJvdG90eXBlLmlzID0gJ2ludmFsaWQnO1xuXG50cmVlLkludmFsaWQucHJvdG90eXBlLmV2ID0gZnVuY3Rpb24oZW52KSB7XG4gICAgZW52LmVycm9yKHtcbiAgICAgICAgY2h1bms6IHRoaXMuY2h1bmssXG4gICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICB0eXBlOiAnc3ludGF4JyxcbiAgICAgICAgbWVzc2FnZTogdGhpcy5tZXNzYWdlIHx8IFwiSW52YWxpZCBjb2RlOiBcIiArIHRoaXMuY2h1bmtcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBpczogJ3VuZGVmaW5lZCdcbiAgICB9O1xufTtcbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLktleXdvcmQgPSBmdW5jdGlvbiBLZXl3b3JkKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHZhciBzcGVjaWFsID0ge1xuICAgICAgICAndHJhbnNwYXJlbnQnOiAnY29sb3InLFxuICAgICAgICAndHJ1ZSc6ICdib29sZWFuJyxcbiAgICAgICAgJ2ZhbHNlJzogJ2Jvb2xlYW4nXG4gICAgfTtcbiAgICB0aGlzLmlzID0gc3BlY2lhbFt2YWx1ZV0gPyBzcGVjaWFsW3ZhbHVlXSA6ICdrZXl3b3JkJztcbn07XG50cmVlLktleXdvcmQucHJvdG90eXBlID0ge1xuICAgIGV2OiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0sXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy52YWx1ZTsgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuTGF5ZXJYTUwgPSBmdW5jdGlvbihvYmosIHN0eWxlcykge1xuICAgIHZhciBkc29wdGlvbnMgPSBbXTtcbiAgICBmb3IgKHZhciBpIGluIG9iai5EYXRhc291cmNlKSB7XG4gICAgICAgIGRzb3B0aW9ucy5wdXNoKCc8UGFyYW1ldGVyIG5hbWU9XCInICsgaSArICdcIj48IVtDREFUQVsnICtcbiAgICAgICAgICAgIG9iai5EYXRhc291cmNlW2ldICsgJ11dPjwvUGFyYW1ldGVyPicpO1xuICAgIH1cblxuICAgIHZhciBwcm9wX3N0cmluZyA9ICcnO1xuICAgIGZvciAodmFyIHByb3AgaW4gb2JqLnByb3BlcnRpZXMpIHtcbiAgICAgICAgaWYgKHByb3AgPT09ICdtaW56b29tJykge1xuICAgICAgICAgICAgcHJvcF9zdHJpbmcgKz0gJyAgbWF4em9vbT1cIicgKyB0cmVlLlpvb20ucmFuZ2VzW29iai5wcm9wZXJ0aWVzW3Byb3BdXSArICdcIlxcbic7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ21heHpvb20nKSB7XG4gICAgICAgICAgICBwcm9wX3N0cmluZyArPSAnICBtaW56b29tPVwiJyArIHRyZWUuWm9vbS5yYW5nZXNbb2JqLnByb3BlcnRpZXNbcHJvcF0rMV0gKyAnXCJcXG4nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvcF9zdHJpbmcgKz0gJyAgJyArIHByb3AgKyAnPVwiJyArIG9iai5wcm9wZXJ0aWVzW3Byb3BdICsgJ1wiXFxuJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAnPExheWVyJyArXG4gICAgICAgICcgbmFtZT1cIicgKyBvYmoubmFtZSArICdcIlxcbicgK1xuICAgICAgICBwcm9wX3N0cmluZyArXG4gICAgICAgICgodHlwZW9mIG9iai5zdGF0dXMgPT09ICd1bmRlZmluZWQnKSA/ICcnIDogJyAgc3RhdHVzPVwiJyArIG9iai5zdGF0dXMgKyAnXCJcXG4nKSArXG4gICAgICAgICgodHlwZW9mIG9iai5zcnMgPT09ICd1bmRlZmluZWQnKSA/ICcnIDogJyAgc3JzPVwiJyArIG9iai5zcnMgKyAnXCInKSArICc+XFxuICAgICcgK1xuICAgICAgICBzdHlsZXMucmV2ZXJzZSgpLm1hcChmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICByZXR1cm4gJzxTdHlsZU5hbWU+JyArIHMgKyAnPC9TdHlsZU5hbWU+JztcbiAgICAgICAgfSkuam9pbignXFxuICAgICcpICtcbiAgICAgICAgKGRzb3B0aW9ucy5sZW5ndGggP1xuICAgICAgICAnXFxuICAgIDxEYXRhc291cmNlPlxcbiAgICAgICAnICtcbiAgICAgICAgZHNvcHRpb25zLmpvaW4oJ1xcbiAgICAgICAnKSArXG4gICAgICAgICdcXG4gICAgPC9EYXRhc291cmNlPlxcbidcbiAgICAgICAgOiAnJykgK1xuICAgICAgICAnICA8L0xheWVyPlxcbic7XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiLy8gQSBsaXRlcmFsIGlzIGEgbGl0ZXJhbCBzdHJpbmcgZm9yIE1hcG5payAtIHRoZVxuLy8gcmVzdWx0IG9mIHRoZSBjb21iaW5hdGlvbiBvZiBhIGB0cmVlLkZpZWxkYCB3aXRoIGFueVxuLy8gb3RoZXIgdHlwZS5cbihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuTGl0ZXJhbCA9IGZ1bmN0aW9uIEZpZWxkKGNvbnRlbnQpIHtcbiAgICB0aGlzLnZhbHVlID0gY29udGVudCB8fCAnJztcbiAgICB0aGlzLmlzID0gJ2ZpZWxkJztcbn07XG5cbnRyZWUuTGl0ZXJhbC5wcm90b3R5cGUgPSB7XG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9LFxuICAgICdldic6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiLy8gQW4gb3BlcmF0aW9uIGlzIGFuIGV4cHJlc3Npb24gd2l0aCBhbiBvcCBpbiBiZXR3ZWVuIHR3byBvcGVyYW5kcyxcbi8vIGxpa2UgMiArIDEuXG4oZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLk9wZXJhdGlvbiA9IGZ1bmN0aW9uIE9wZXJhdGlvbihvcCwgb3BlcmFuZHMsIGluZGV4KSB7XG4gICAgdGhpcy5vcCA9IG9wLnRyaW0oKTtcbiAgICB0aGlzLm9wZXJhbmRzID0gb3BlcmFuZHM7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xufTtcblxudHJlZS5PcGVyYXRpb24ucHJvdG90eXBlLmlzID0gJ29wZXJhdGlvbic7XG5cbnRyZWUuT3BlcmF0aW9uLnByb3RvdHlwZS5ldiA9IGZ1bmN0aW9uKGVudikge1xuICAgIHZhciBhID0gdGhpcy5vcGVyYW5kc1swXS5ldihlbnYpLFxuICAgICAgICBiID0gdGhpcy5vcGVyYW5kc1sxXS5ldihlbnYpLFxuICAgICAgICB0ZW1wO1xuXG4gICAgaWYgKGEuaXMgPT09ICd1bmRlZmluZWQnIHx8IGIuaXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpczogJ3VuZGVmaW5lZCcsXG4gICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIHRyZWUuRGltZW5zaW9uICYmIGIgaW5zdGFuY2VvZiB0cmVlLkNvbG9yKSB7XG4gICAgICAgIGlmICh0aGlzLm9wID09PSAnKicgfHwgdGhpcy5vcCA9PT0gJysnKSB7XG4gICAgICAgICAgICB0ZW1wID0gYiwgYiA9IGEsIGEgPSB0ZW1wO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcIk9wZXJhdGlvbkVycm9yXCIsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogXCJDYW4ndCBzdWJzdHJhY3Qgb3IgZGl2aWRlIGEgY29sb3IgZnJvbSBhIG51bWJlclwiLFxuICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE9ubHkgY29uY2F0ZW5hdGUgcGxhaW4gc3RyaW5ncywgYmVjYXVzZSB0aGlzIGlzIGVhc2lseVxuICAgIC8vIHByZS1wcm9jZXNzZWRcbiAgICBpZiAoYSBpbnN0YW5jZW9mIHRyZWUuUXVvdGVkICYmIGIgaW5zdGFuY2VvZiB0cmVlLlF1b3RlZCAmJiB0aGlzLm9wICE9PSAnKycpIHtcbiAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgbWVzc2FnZTogXCJDYW4ndCBzdWJ0cmFjdCwgZGl2aWRlLCBvciBtdWx0aXBseSBzdHJpbmdzLlwiLFxuICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgdHlwZTogJ3J1bnRpbWUnLFxuICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgIHZhbHVlOiAndW5kZWZpbmVkJ1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIEZpZWxkcywgbGl0ZXJhbHMsIGRpbWVuc2lvbnMsIGFuZCBxdW90ZWQgc3RyaW5ncyBjYW4gYmUgY29tYmluZWQuXG4gICAgaWYgKGEgaW5zdGFuY2VvZiB0cmVlLkZpZWxkIHx8IGIgaW5zdGFuY2VvZiB0cmVlLkZpZWxkIHx8XG4gICAgICAgIGEgaW5zdGFuY2VvZiB0cmVlLkxpdGVyYWwgfHwgYiBpbnN0YW5jZW9mIHRyZWUuTGl0ZXJhbCkge1xuICAgICAgICBpZiAoYS5pcyA9PT0gJ2NvbG9yJyB8fCBiLmlzID09PSAnY29sb3InKSB7XG4gICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgbWVzc2FnZTogXCJDYW4ndCBzdWJ0cmFjdCwgZGl2aWRlLCBvciBtdWx0aXBseSBjb2xvcnMgaW4gZXhwcmVzc2lvbnMuXCIsXG4gICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgICAgIHR5cGU6ICdydW50aW1lJyxcbiAgICAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaXM6ICd1bmRlZmluZWQnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5MaXRlcmFsKGEuZXYoZW52KS50b1N0cmluZyh0cnVlKSArIHRoaXMub3AgKyBiLmV2KGVudikudG9TdHJpbmcodHJ1ZSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGEub3BlcmF0ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgIG1lc3NhZ2U6ICdDYW5ub3QgZG8gbWF0aCB3aXRoIHR5cGUgJyArIGEuaXMgKyAnLicsXG4gICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICB0eXBlOiAncnVudGltZScsXG4gICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXM6ICd1bmRlZmluZWQnLFxuICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGEub3BlcmF0ZShlbnYsIHRoaXMub3AsIGIpO1xufTtcblxudHJlZS5vcGVyYXRlID0gZnVuY3Rpb24ob3AsIGEsIGIpIHtcbiAgICBzd2l0Y2ggKG9wKSB7XG4gICAgICAgIGNhc2UgJysnOiByZXR1cm4gYSArIGI7XG4gICAgICAgIGNhc2UgJy0nOiByZXR1cm4gYSAtIGI7XG4gICAgICAgIGNhc2UgJyonOiByZXR1cm4gYSAqIGI7XG4gICAgICAgIGNhc2UgJyUnOiByZXR1cm4gYSAlIGI7XG4gICAgICAgIGNhc2UgJy8nOiByZXR1cm4gYSAvIGI7XG4gICAgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuUXVvdGVkID0gZnVuY3Rpb24gUXVvdGVkKGNvbnRlbnQpIHtcbiAgICB0aGlzLnZhbHVlID0gY29udGVudCB8fCAnJztcbn07XG5cbnRyZWUuUXVvdGVkLnByb3RvdHlwZSA9IHtcbiAgICBpczogJ3N0cmluZycsXG5cbiAgICB0b1N0cmluZzogZnVuY3Rpb24ocXVvdGVzKSB7XG4gICAgICAgIHZhciBlc2NhcGVkVmFsdWUgPSB0aGlzLnZhbHVlXG4gICAgICAgICAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgICAgICB2YXIgeG1sdmFsdWUgPSBlc2NhcGVkVmFsdWVcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXCcvZywgJ1xcXFxcXCcnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcXCIvZywgJyZxdW90OycpXG4gICAgICAgICAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFw+L2csICcmZ3Q7Jyk7XG4gICAgICAgIHJldHVybiAocXVvdGVzID09PSB0cnVlKSA/IFwiJ1wiICsgeG1sdmFsdWUgKyBcIidcIiA6IGVzY2FwZWRWYWx1ZTtcbiAgICB9LFxuXG4gICAgJ2V2JzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBvcGVyYXRlOiBmdW5jdGlvbihlbnYsIG9wLCBvdGhlcikge1xuICAgICAgICByZXR1cm4gbmV3IHRyZWUuUXVvdGVkKHRyZWUub3BlcmF0ZShvcCwgdGhpcy50b1N0cmluZygpLCBvdGhlci50b1N0cmluZyh0aGlzLmNvbnRhaW5zX2ZpZWxkKSkpO1xuICAgIH1cbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIvLyBDYXJ0byBwdWxscyBpbiBhIHJlZmVyZW5jZSBmcm9tIHRoZSBgbWFwbmlrLXJlZmVyZW5jZWBcbi8vIG1vZHVsZS4gVGhpcyBmaWxlIGJ1aWxkcyBpbmRleGVzIGZyb20gdGhhdCBmaWxlIGZvciBpdHMgdmFyaW91c1xuLy8gb3B0aW9ucywgYW5kIHByb3ZpZGVzIHZhbGlkYXRpb24gbWV0aG9kcyBmb3IgcHJvcGVydHk6IHZhbHVlXG4vLyBjb21iaW5hdGlvbnMuXG4oZnVuY3Rpb24odHJlZSkge1xuXG52YXIgXyA9IGdsb2JhbC5fIHx8IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKSxcbiAgICByZWYgPSB7fTtcblxucmVmLnNldERhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgcmVmLmRhdGEgPSBkYXRhO1xuICAgIHJlZi5zZWxlY3Rvcl9jYWNoZSA9IGdlbmVyYXRlU2VsZWN0b3JDYWNoZShkYXRhKTtcbiAgICByZWYubWFwbmlrRnVuY3Rpb25zID0gZ2VuZXJhdGVNYXBuaWtGdW5jdGlvbnMoZGF0YSk7XG5cbiAgICByZWYubWFwbmlrRnVuY3Rpb25zLm1hdHJpeCA9IFs2XTtcbiAgICByZWYubWFwbmlrRnVuY3Rpb25zLnRyYW5zbGF0ZSA9IFsxLCAyXTtcbiAgICByZWYubWFwbmlrRnVuY3Rpb25zLnNjYWxlID0gWzEsIDJdO1xuICAgIHJlZi5tYXBuaWtGdW5jdGlvbnMucm90YXRlID0gWzEsIDNdO1xuICAgIHJlZi5tYXBuaWtGdW5jdGlvbnMuc2tld1ggPSBbMV07XG4gICAgcmVmLm1hcG5pa0Z1bmN0aW9ucy5za2V3WSA9IFsxXTtcblxuICAgIHJlZi5yZXF1aXJlZF9jYWNoZSA9IGdlbmVyYXRlUmVxdWlyZWRQcm9wZXJ0aWVzKGRhdGEpO1xufTtcblxucmVmLnNldFZlcnNpb24gPSBmdW5jdGlvbih2ZXJzaW9uKSB7XG4gICAgdmFyIG1hcG5pa19yZWZlcmVuY2UgPSByZXF1aXJlKCdtYXBuaWstcmVmZXJlbmNlJyk7XG4gICAgaWYgKG1hcG5pa19yZWZlcmVuY2UudmVyc2lvbi5oYXNPd25Qcm9wZXJ0eSh2ZXJzaW9uKSkge1xuICAgICAgICByZWYuc2V0RGF0YShtYXBuaWtfcmVmZXJlbmNlLnZlcnNpb25bdmVyc2lvbl0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufTtcblxucmVmLnNlbGVjdG9yRGF0YSA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBpKSB7XG4gICAgaWYgKHJlZi5zZWxlY3Rvcl9jYWNoZVtzZWxlY3Rvcl0pIHJldHVybiByZWYuc2VsZWN0b3JfY2FjaGVbc2VsZWN0b3JdW2ldO1xufTtcblxucmVmLnZhbGlkU2VsZWN0b3IgPSBmdW5jdGlvbihzZWxlY3RvcikgeyByZXR1cm4gISFyZWYuc2VsZWN0b3JfY2FjaGVbc2VsZWN0b3JdOyB9O1xucmVmLnNlbGVjdG9yTmFtZSA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7IHJldHVybiByZWYuc2VsZWN0b3JEYXRhKHNlbGVjdG9yLCAyKTsgfTtcbnJlZi5zZWxlY3RvciA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7IHJldHVybiByZWYuc2VsZWN0b3JEYXRhKHNlbGVjdG9yLCAwKTsgfTtcbnJlZi5zeW1ib2xpemVyID0gZnVuY3Rpb24oc2VsZWN0b3IpIHsgcmV0dXJuIHJlZi5zZWxlY3RvckRhdGEoc2VsZWN0b3IsIDEpOyB9O1xuXG5mdW5jdGlvbiBnZW5lcmF0ZVNlbGVjdG9yQ2FjaGUoZGF0YSkge1xuICAgIHZhciBpbmRleCA9IHt9O1xuICAgIGZvciAodmFyIGkgaW4gZGF0YS5zeW1ib2xpemVycykge1xuICAgICAgICBmb3IgKHZhciBqIGluIGRhdGEuc3ltYm9saXplcnNbaV0pIHtcbiAgICAgICAgICAgIGlmIChkYXRhLnN5bWJvbGl6ZXJzW2ldW2pdLmhhc093blByb3BlcnR5KCdjc3MnKSkge1xuICAgICAgICAgICAgICAgIGluZGV4W2RhdGEuc3ltYm9saXplcnNbaV1bal0uY3NzXSA9IFtkYXRhLnN5bWJvbGl6ZXJzW2ldW2pdLCBpLCBqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlTWFwbmlrRnVuY3Rpb25zKGRhdGEpIHtcbiAgICB2YXIgZnVuY3Rpb25zID0ge307XG4gICAgZm9yICh2YXIgaSBpbiBkYXRhLnN5bWJvbGl6ZXJzKSB7XG4gICAgICAgIGZvciAodmFyIGogaW4gZGF0YS5zeW1ib2xpemVyc1tpXSkge1xuICAgICAgICAgICAgaWYgKGRhdGEuc3ltYm9saXplcnNbaV1bal0udHlwZSA9PT0gJ2Z1bmN0aW9ucycpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGRhdGEuc3ltYm9saXplcnNbaV1bal0uZnVuY3Rpb25zLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IGRhdGEuc3ltYm9saXplcnNbaV1bal0uZnVuY3Rpb25zW2tdO1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbnNbZm5bMF1dID0gZm5bMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbnM7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlUmVxdWlyZWRQcm9wZXJ0aWVzKGRhdGEpIHtcbiAgICB2YXIgY2FjaGUgPSB7fTtcbiAgICBmb3IgKHZhciBzeW1ib2xpemVyX25hbWUgaW4gZGF0YS5zeW1ib2xpemVycykge1xuICAgICAgICBjYWNoZVtzeW1ib2xpemVyX25hbWVdID0gW107XG4gICAgICAgIGZvciAodmFyIGogaW4gZGF0YS5zeW1ib2xpemVyc1tzeW1ib2xpemVyX25hbWVdKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5zeW1ib2xpemVyc1tzeW1ib2xpemVyX25hbWVdW2pdLnJlcXVpcmVkKSB7XG4gICAgICAgICAgICAgICAgY2FjaGVbc3ltYm9saXplcl9uYW1lXS5wdXNoKGRhdGEuc3ltYm9saXplcnNbc3ltYm9saXplcl9uYW1lXVtqXS5jc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjYWNoZTtcbn1cblxucmVmLnJlcXVpcmVkUHJvcGVydGllcyA9IGZ1bmN0aW9uKHN5bWJvbGl6ZXJfbmFtZSwgcnVsZXMpIHtcbiAgICB2YXIgcmVxID0gcmVmLnJlcXVpcmVkX2NhY2hlW3N5bWJvbGl6ZXJfbmFtZV07XG4gICAgZm9yICh2YXIgaSBpbiByZXEpIHtcbiAgICAgICAgaWYgKCEocmVxW2ldIGluIHJ1bGVzKSkge1xuICAgICAgICAgICAgcmV0dXJuICdQcm9wZXJ0eSAnICsgcmVxW2ldICsgJyByZXF1aXJlZCBmb3IgZGVmaW5pbmcgJyArXG4gICAgICAgICAgICAgICAgc3ltYm9saXplcl9uYW1lICsgJyBzdHlsZXMuJztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8vIFRPRE86IGZpbmlzaCBpbXBsZW1lbnRhdGlvbiAtIHRoaXMgaXMgZGVhZCBjb2RlXG5yZWYuX3ZhbGlkYXRlVmFsdWUgPSB7XG4gICAgJ2ZvbnQnOiBmdW5jdGlvbihlbnYsIHZhbHVlKSB7XG4gICAgICAgIGlmIChlbnYudmFsaWRhdGlvbl9kYXRhICYmIGVudi52YWxpZGF0aW9uX2RhdGEuZm9udHMpIHtcbiAgICAgICAgICAgIHJldHVybiBlbnYudmFsaWRhdGlvbl9kYXRhLmZvbnRzLmluZGV4T2YodmFsdWUpICE9IC0xO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5yZWYuaXNGb250ID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gcmVmLnNlbGVjdG9yKHNlbGVjdG9yKS52YWxpZGF0ZSA9PSAnZm9udCc7XG59O1xuXG4vLyBodHRwczovL2dpc3QuZ2l0aHViLmNvbS85ODI5MjdcbnJlZi5lZGl0RGlzdGFuY2UgPSBmdW5jdGlvbihhLCBiKXtcbiAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiBiLmxlbmd0aDtcbiAgICBpZiAoYi5sZW5ndGggPT09IDApIHJldHVybiBhLmxlbmd0aDtcbiAgICB2YXIgbWF0cml4ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gYi5sZW5ndGg7IGkrKykgeyBtYXRyaXhbaV0gPSBbaV07IH1cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8PSBhLmxlbmd0aDsgaisrKSB7IG1hdHJpeFswXVtqXSA9IGo7IH1cbiAgICBmb3IgKGkgPSAxOyBpIDw9IGIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZm9yIChqID0gMTsgaiA8PSBhLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAoYi5jaGFyQXQoaS0xKSA9PSBhLmNoYXJBdChqLTEpKSB7XG4gICAgICAgICAgICAgICAgbWF0cml4W2ldW2pdID0gbWF0cml4W2ktMV1bai0xXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWF0cml4W2ldW2pdID0gTWF0aC5taW4obWF0cml4W2ktMV1bai0xXSArIDEsIC8vIHN1YnN0aXR1dGlvblxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbihtYXRyaXhbaV1bai0xXSArIDEsIC8vIGluc2VydGlvblxuICAgICAgICAgICAgICAgICAgICBtYXRyaXhbaS0xXVtqXSArIDEpKTsgLy8gZGVsZXRpb25cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0cml4W2IubGVuZ3RoXVthLmxlbmd0aF07XG59O1xuXG5mdW5jdGlvbiB2YWxpZGF0ZUZ1bmN0aW9ucyh2YWx1ZSwgc2VsZWN0b3IpIHtcbiAgICBpZiAodmFsdWUudmFsdWVbMF0uaXMgPT09ICdzdHJpbmcnKSByZXR1cm4gdHJ1ZTtcbiAgICBmb3IgKHZhciBpIGluIHZhbHVlLnZhbHVlKSB7XG4gICAgICAgIGZvciAodmFyIGogaW4gdmFsdWUudmFsdWVbaV0udmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS52YWx1ZVtpXS52YWx1ZVtqXS5pcyAhPT0gJ2NhbGwnKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB2YXIgZiA9IF8uZmluZChyZWZcbiAgICAgICAgICAgICAgICAuc2VsZWN0b3Ioc2VsZWN0b3IpLmZ1bmN0aW9ucywgZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geFswXSA9PSB2YWx1ZS52YWx1ZVtpXS52YWx1ZVtqXS5uYW1lO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCEoZiAmJiBmWzFdID09IC0xKSkge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgZmlsdGVyIGlzIHVua25vd24gb3IgZ2l2ZW4gYW4gaW5jb3JyZWN0IG51bWJlciBvZiBhcmd1bWVudHNcbiAgICAgICAgICAgICAgICBpZiAoIWYgfHwgZlsxXSAhPT0gdmFsdWUudmFsdWVbaV0udmFsdWVbal0uYXJncy5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVLZXl3b3JkKHZhbHVlLCBzZWxlY3Rvcikge1xuICAgIGlmICh0eXBlb2YgcmVmLnNlbGVjdG9yKHNlbGVjdG9yKS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gcmVmLnNlbGVjdG9yKHNlbGVjdG9yKS50eXBlXG4gICAgICAgICAgICAuaW5kZXhPZih2YWx1ZS52YWx1ZVswXS52YWx1ZSkgIT09IC0xO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGFsbG93IHVucXVvdGVkIGtleXdvcmRzIGFzIHN0cmluZ3NcbiAgICAgICAgcmV0dXJuIHJlZi5zZWxlY3RvcihzZWxlY3RvcikudHlwZSA9PT0gJ3N0cmluZyc7XG4gICAgfVxufVxuXG5yZWYudmFsaWRWYWx1ZSA9IGZ1bmN0aW9uKGVudiwgc2VsZWN0b3IsIHZhbHVlKSB7XG4gICAgdmFyIGksIGo7XG4gICAgLy8gVE9ETzogaGFuZGxlIGluIHJldXNhYmxlIHdheVxuICAgIGlmICghcmVmLnNlbGVjdG9yKHNlbGVjdG9yKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmICh2YWx1ZS52YWx1ZVswXS5pcyA9PSAna2V5d29yZCcpIHtcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRlS2V5d29yZCh2YWx1ZSwgc2VsZWN0b3IpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUudmFsdWVbMF0uaXMgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gY2F1Z2h0IGVhcmxpZXIgaW4gdGhlIGNoYWluIC0gaWdub3JlIGhlcmUgc28gdGhhdFxuICAgICAgICAvLyBlcnJvciBpcyBub3Qgb3ZlcnJpZGRlblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHJlZi5zZWxlY3RvcihzZWxlY3RvcikudHlwZSA9PSAnbnVtYmVycycpIHtcbiAgICAgICAgZm9yIChpIGluIHZhbHVlLnZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUudmFsdWVbaV0uaXMgIT09ICdmbG9hdCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmIChyZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLnR5cGUgPT0gJ3RhZ3MnKSB7XG4gICAgICAgIGlmICghdmFsdWUudmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCF2YWx1ZS52YWx1ZVswXS52YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnZhbHVlWzBdLmlzID09PSAndGFnJztcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdmFsdWUudmFsdWVbMF0udmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS52YWx1ZVswXS52YWx1ZVtpXS5pcyAhPT0gJ3RhZycpIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHJlZi5zZWxlY3RvcihzZWxlY3RvcikudHlwZSA9PSAnZnVuY3Rpb25zJykge1xuICAgICAgICAvLyBGb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHksIHlvdSBjYW4gc3BlY2lmeSBhIHN0cmluZyBmb3IgYGZ1bmN0aW9uc2AtY29tcGF0aWJsZVxuICAgICAgICAvLyB2YWx1ZXMsIHRob3VnaCB0aGV5IHdpbGwgbm90IGJlIHZhbGlkYXRlZC5cbiAgICAgICAgcmV0dXJuIHZhbGlkYXRlRnVuY3Rpb25zKHZhbHVlLCBzZWxlY3Rvcik7XG4gICAgfSBlbHNlIGlmIChyZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLnR5cGUgPT09ICd1bnNpZ25lZCcpIHtcbiAgICAgICAgaWYgKHZhbHVlLnZhbHVlWzBdLmlzID09PSAnZmxvYXQnKSB7XG4gICAgICAgICAgICB2YWx1ZS52YWx1ZVswXS5yb3VuZCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKChyZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLmV4cHJlc3Npb24pKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChyZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLnZhbGlkYXRlKSB7XG4gICAgICAgICAgICB2YXIgdmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB2YWx1ZS52YWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChyZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLnR5cGUgPT0gdmFsdWUudmFsdWVbaV0uaXMgJiZcbiAgICAgICAgICAgICAgICAgICAgcmVmXG4gICAgICAgICAgICAgICAgICAgICAgICAuX3ZhbGlkYXRlVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbcmVmLnNlbGVjdG9yKHNlbGVjdG9yKS52YWxpZGF0ZV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZW52LCB2YWx1ZS52YWx1ZVtpXS52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbGlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHJlZi5zZWxlY3RvcihzZWxlY3RvcikudHlwZSA9PSB2YWx1ZS52YWx1ZVswXS5pcztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbnRyZWUuUmVmZXJlbmNlID0gcmVmO1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcbi8vIGEgcnVsZSBpcyBhIHNpbmdsZSBwcm9wZXJ0eSBhbmQgdmFsdWUgY29tYmluYXRpb24sIG9yIHZhcmlhYmxlXG4vLyBuYW1lIGFuZCB2YWx1ZSBjb21iaW5hdGlvbiwgbGlrZVxuLy8gcG9seWdvbi1vcGFjaXR5OiAxLjA7IG9yIEBvcGFjaXR5OiAxLjA7XG50cmVlLlJ1bGUgPSBmdW5jdGlvbiBSdWxlKG5hbWUsIHZhbHVlLCBpbmRleCwgZmlsZW5hbWUpIHtcbiAgICB2YXIgcGFydHMgPSBuYW1lLnNwbGl0KCcvJyk7XG4gICAgdGhpcy5uYW1lID0gcGFydHMucG9wKCk7XG4gICAgdGhpcy5pbnN0YW5jZSA9IHBhcnRzLmxlbmd0aCA/IHBhcnRzWzBdIDogJ19fZGVmYXVsdF9fJztcbiAgICB0aGlzLnZhbHVlID0gKHZhbHVlIGluc3RhbmNlb2YgdHJlZS5WYWx1ZSkgP1xuICAgICAgICB2YWx1ZSA6IG5ldyB0cmVlLlZhbHVlKFt2YWx1ZV0pO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLnN5bWJvbGl6ZXIgPSB0cmVlLlJlZmVyZW5jZS5zeW1ib2xpemVyKHRoaXMubmFtZSk7XG4gICAgdGhpcy5maWxlbmFtZSA9IGZpbGVuYW1lO1xuICAgIHRoaXMudmFyaWFibGUgPSAobmFtZS5jaGFyQXQoMCkgPT09ICdAJyk7XG59O1xuXG50cmVlLlJ1bGUucHJvdG90eXBlLmlzID0gJ3J1bGUnO1xuXG50cmVlLlJ1bGUucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNsb25lID0gT2JqZWN0LmNyZWF0ZSh0cmVlLlJ1bGUucHJvdG90eXBlKTtcbiAgICBjbG9uZS5uYW1lID0gdGhpcy5uYW1lO1xuICAgIGNsb25lLnZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICBjbG9uZS5pbmRleCA9IHRoaXMuaW5kZXg7XG4gICAgY2xvbmUuaW5zdGFuY2UgPSB0aGlzLmluc3RhbmNlO1xuICAgIGNsb25lLnN5bWJvbGl6ZXIgPSB0aGlzLnN5bWJvbGl6ZXI7XG4gICAgY2xvbmUuZmlsZW5hbWUgPSB0aGlzLmZpbGVuYW1lO1xuICAgIGNsb25lLnZhcmlhYmxlID0gdGhpcy52YXJpYWJsZTtcbiAgICByZXR1cm4gY2xvbmU7XG59O1xuXG50cmVlLlJ1bGUucHJvdG90eXBlLnVwZGF0ZUlEID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuaWQgPSB0aGlzLnpvb20gKyAnIycgKyB0aGlzLmluc3RhbmNlICsgJyMnICsgdGhpcy5uYW1lO1xufTtcblxudHJlZS5SdWxlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnWycgKyB0cmVlLlpvb20udG9TdHJpbmcodGhpcy56b29tKSArICddICcgKyB0aGlzLm5hbWUgKyAnOiAnICsgdGhpcy52YWx1ZTtcbn07XG5cbmZ1bmN0aW9uIGdldE1lYW4obmFtZSkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0cmVlLlJlZmVyZW5jZS5zZWxlY3Rvcl9jYWNoZSkubWFwKGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgcmV0dXJuIFtmLCB0cmVlLlJlZmVyZW5jZS5lZGl0RGlzdGFuY2UobmFtZSwgZildO1xuICAgIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYVsxXSAtIGJbMV07IH0pO1xufVxuXG4vLyBzZWNvbmQgYXJndW1lbnQsIGlmIHRydWUsIG91dHB1dHMgdGhlIHZhbHVlIG9mIHRoaXNcbi8vIHJ1bGUgd2l0aG91dCB0aGUgdXN1YWwgYXR0cmlidXRlPVwiY29udGVudFwiIHdyYXBwaW5nLiBSaWdodFxuLy8gbm93IHRoaXMgaXMganVzdCBmb3IgdGhlIFRleHRTeW1ib2xpemVyLCBidXQgYXBwbGllcyB0byBvdGhlclxuLy8gcHJvcGVydGllcyBpbiByZWZlcmVuY2UuanNvbiB3aGljaCBzcGVjaWZ5IHNlcmlhbGl6YXRpb249Y29udGVudFxudHJlZS5SdWxlLnByb3RvdHlwZS50b1hNTCA9IGZ1bmN0aW9uKGVudiwgY29udGVudCwgc2VwLCBmb3JtYXQpIHtcbiAgICBpZiAoIXRyZWUuUmVmZXJlbmNlLnZhbGlkU2VsZWN0b3IodGhpcy5uYW1lKSkge1xuICAgICAgICB2YXIgbWVhbiA9IGdldE1lYW4odGhpcy5uYW1lKTtcbiAgICAgICAgdmFyIG1lYW5fbWVzc2FnZSA9ICcnO1xuICAgICAgICBpZiAobWVhblswXVsxXSA8IDMpIHtcbiAgICAgICAgICAgIG1lYW5fbWVzc2FnZSA9ICcuIERpZCB5b3UgbWVhbiAnICsgbWVhblswXVswXSArICc/JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZW52LmVycm9yKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiVW5yZWNvZ25pemVkIHJ1bGU6IFwiICsgdGhpcy5uYW1lICsgbWVhbl9tZXNzYWdlLFxuICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICB0eXBlOiAnc3ludGF4JyxcbiAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICgodGhpcy52YWx1ZSBpbnN0YW5jZW9mIHRyZWUuVmFsdWUpICYmXG4gICAgICAgICF0cmVlLlJlZmVyZW5jZS52YWxpZFZhbHVlKGVudiwgdGhpcy5uYW1lLCB0aGlzLnZhbHVlKSkge1xuICAgICAgICBpZiAoIXRyZWUuUmVmZXJlbmNlLnNlbGVjdG9yKHRoaXMubmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdVbnJlY29nbml6ZWQgcHJvcGVydHk6ICcgK1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3N5bnRheCcsXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMuZmlsZW5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHR5cGVuYW1lO1xuICAgICAgICAgICAgaWYgKHRyZWUuUmVmZXJlbmNlLnNlbGVjdG9yKHRoaXMubmFtZSkudmFsaWRhdGUpIHtcbiAgICAgICAgICAgICAgICB0eXBlbmFtZSA9IHRyZWUuUmVmZXJlbmNlLnNlbGVjdG9yKHRoaXMubmFtZSkudmFsaWRhdGU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0cmVlLlJlZmVyZW5jZS5zZWxlY3Rvcih0aGlzLm5hbWUpLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgdHlwZW5hbWUgPSAna2V5d29yZCAob3B0aW9uczogJyArIHRyZWUuUmVmZXJlbmNlLnNlbGVjdG9yKHRoaXMubmFtZSkudHlwZS5qb2luKCcsICcpICsgJyknO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0eXBlbmFtZSA9IHRyZWUuUmVmZXJlbmNlLnNlbGVjdG9yKHRoaXMubmFtZSkudHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIHZhbHVlIGZvciAnICtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJywgdGhlIHR5cGUgJyArIHR5cGVuYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJyBpcyBleHBlY3RlZC4gJyArIHRoaXMudmFsdWUgK1xuICAgICAgICAgICAgICAgICAgICAnIChvZiB0eXBlICcgKyB0aGlzLnZhbHVlLnZhbHVlWzBdLmlzICsgJykgJyArXG4gICAgICAgICAgICAgICAgICAgICcgd2FzIGdpdmVuLicsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3N5bnRheCcsXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMuZmlsZW5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudmFyaWFibGUpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH0gZWxzZSBpZiAodHJlZS5SZWZlcmVuY2UuaXNGb250KHRoaXMubmFtZSkgJiYgdGhpcy52YWx1ZS52YWx1ZS5sZW5ndGggPiAxKSB7XG4gICAgICAgIHZhciBmID0gdHJlZS5fZ2V0Rm9udFNldChlbnYsIHRoaXMudmFsdWUudmFsdWUpO1xuICAgICAgICByZXR1cm4gJ2ZvbnRzZXQtbmFtZT1cIicgKyBmLm5hbWUgKyAnXCInO1xuICAgIH0gZWxzZSBpZiAoY29udGVudCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZS50b1N0cmluZyhlbnYsIHRoaXMubmFtZSwgc2VwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHJlZS5SZWZlcmVuY2Uuc2VsZWN0b3JOYW1lKHRoaXMubmFtZSkgK1xuICAgICAgICAgICAgJz1cIicgK1xuICAgICAgICAgICAgdGhpcy52YWx1ZS50b1N0cmluZyhlbnYsIHRoaXMubmFtZSkgK1xuICAgICAgICAgICAgJ1wiJztcbiAgICB9XG59O1xuXG4vLyBUT0RPOiBSdWxlIGV2IGNoYWluIHNob3VsZCBhZGQgZm9udHNldHMgdG8gZW52LmZyYW1lc1xudHJlZS5SdWxlLnByb3RvdHlwZS5ldiA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICByZXR1cm4gbmV3IHRyZWUuUnVsZSh0aGlzLm5hbWUsXG4gICAgICAgIHRoaXMudmFsdWUuZXYoY29udGV4dCksXG4gICAgICAgIHRoaXMuaW5kZXgsXG4gICAgICAgIHRoaXMuZmlsZW5hbWUpO1xufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuUnVsZXNldCA9IGZ1bmN0aW9uIFJ1bGVzZXQoc2VsZWN0b3JzLCBydWxlcykge1xuICAgIHRoaXMuc2VsZWN0b3JzID0gc2VsZWN0b3JzO1xuICAgIHRoaXMucnVsZXMgPSBydWxlcztcbiAgICAvLyBzdGF0aWMgY2FjaGUgb2YgZmluZCgpIGZ1bmN0aW9uXG4gICAgdGhpcy5fbG9va3VwcyA9IHt9O1xufTtcbnRyZWUuUnVsZXNldC5wcm90b3R5cGUgPSB7XG4gICAgaXM6ICdydWxlc2V0JyxcbiAgICAnZXYnOiBmdW5jdGlvbihlbnYpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBydWxlc2V0ID0gbmV3IHRyZWUuUnVsZXNldCh0aGlzLnNlbGVjdG9ycywgdGhpcy5ydWxlcy5zbGljZSgwKSk7XG4gICAgICAgIHJ1bGVzZXQucm9vdCA9IHRoaXMucm9vdDtcblxuICAgICAgICAvLyBwdXNoIHRoZSBjdXJyZW50IHJ1bGVzZXQgdG8gdGhlIGZyYW1lcyBzdGFja1xuICAgICAgICBlbnYuZnJhbWVzLnVuc2hpZnQocnVsZXNldCk7XG5cbiAgICAgICAgLy8gRXZhbHVhdGUgZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIGZvciAoaSA9IDAsIHJ1bGU7IGkgPCBydWxlc2V0LnJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBydWxlID0gcnVsZXNldC5ydWxlc1tpXTtcbiAgICAgICAgICAgIHJ1bGVzZXQucnVsZXNbaV0gPSBydWxlLmV2ID8gcnVsZS5ldihlbnYpIDogcnVsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBvcCB0aGUgc3RhY2tcbiAgICAgICAgZW52LmZyYW1lcy5zaGlmdCgpO1xuXG4gICAgICAgIHJldHVybiBydWxlc2V0O1xuICAgIH0sXG4gICAgbWF0Y2g6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuICFhcmdzIHx8IGFyZ3MubGVuZ3RoID09PSAwO1xuICAgIH0sXG4gICAgdmFyaWFibGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3ZhcmlhYmxlcykgeyByZXR1cm4gdGhpcy5fdmFyaWFibGVzOyB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZhcmlhYmxlcyA9IHRoaXMucnVsZXMucmVkdWNlKGZ1bmN0aW9uKGhhc2gsIHIpIHtcbiAgICAgICAgICAgICAgICBpZiAociBpbnN0YW5jZW9mIHRyZWUuUnVsZSAmJiByLnZhcmlhYmxlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc2hbci5uYW1lXSA9IHI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBoYXNoO1xuICAgICAgICAgICAgfSwge30pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICB2YXJpYWJsZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy52YXJpYWJsZXMoKVtuYW1lXTtcbiAgICB9LFxuICAgIHJ1bGVzZXRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3J1bGVzZXRzKSB7IHJldHVybiB0aGlzLl9ydWxlc2V0czsgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ydWxlc2V0cyA9IHRoaXMucnVsZXMuZmlsdGVyKGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHIgaW5zdGFuY2VvZiB0cmVlLlJ1bGVzZXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGZpbmQ6IGZ1bmN0aW9uKHNlbGVjdG9yLCBzZWxmKSB7XG4gICAgICAgIHNlbGYgPSBzZWxmIHx8IHRoaXM7XG4gICAgICAgIHZhciBydWxlcyA9IFtdLCBydWxlLCBtYXRjaCxcbiAgICAgICAgICAgIGtleSA9IHNlbGVjdG9yLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgaWYgKGtleSBpbiB0aGlzLl9sb29rdXBzKSB7IHJldHVybiB0aGlzLl9sb29rdXBzW2tleV07IH1cblxuICAgICAgICB0aGlzLnJ1bGVzZXRzKCkuZm9yRWFjaChmdW5jdGlvbihydWxlKSB7XG4gICAgICAgICAgICBpZiAocnVsZSAhPT0gc2VsZikge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcnVsZS5zZWxlY3RvcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaChydWxlLnNlbGVjdG9yc1tqXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9yLmVsZW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShydWxlcywgcnVsZS5maW5kKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgdHJlZS5TZWxlY3RvcihudWxsLCBudWxsLCBudWxsLCBzZWxlY3Rvci5lbGVtZW50cy5zbGljZSgxKSksIHNlbGYpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVsZXMucHVzaChydWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvb2t1cHNba2V5XSA9IHJ1bGVzO1xuICAgIH0sXG4gICAgLy8gWm9vbXMgY2FuIHVzZSB2YXJpYWJsZXMuIFRoaXMgcmVwbGFjZXMgdHJlZS5ab29tIG9iamVjdHMgb24gc2VsZWN0b3JzXG4gICAgLy8gd2l0aCBzaW1wbGUgYml0LWFycmF5cyB0aGF0IHdlIGNhbiBjb21wYXJlIGVhc2lseS5cbiAgICBldlpvb21zOiBmdW5jdGlvbihlbnYpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHp2YWwgPSB0cmVlLlpvb20uYWxsO1xuICAgICAgICAgICAgZm9yICh2YXIgeiA9IDA7IHogPCB0aGlzLnNlbGVjdG9yc1tpXS56b29tLmxlbmd0aDsgeisrKSB7XG4gICAgICAgICAgICAgICAgenZhbCA9IHp2YWwgJiB0aGlzLnNlbGVjdG9yc1tpXS56b29tW3pdLmV2KGVudikuem9vbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2VsZWN0b3JzW2ldLnpvb20gPSB6dmFsO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBmbGF0dGVuOiBmdW5jdGlvbihyZXN1bHQsIHBhcmVudHMsIGVudikge1xuICAgICAgICB2YXIgc2VsZWN0b3JzID0gW10sIGksIGo7XG4gICAgICAgIGlmICh0aGlzLnNlbGVjdG9ycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGVudi5mcmFtZXMgPSBlbnYuZnJhbWVzLmNvbmNhdCh0aGlzLnJ1bGVzKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBldmFsdWF0ZSB6b29tIHZhcmlhYmxlcyBvbiB0aGlzIG9iamVjdC5cbiAgICAgICAgdGhpcy5ldlpvb21zKGVudik7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5zZWxlY3RvcnNbaV07XG5cbiAgICAgICAgICAgIGlmICghY2hpbGQuZmlsdGVycykge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IGlzIHRoaXMgaW50ZXJuYWwgaW5jb25zaXN0ZW5jeT9cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGFuIGludmFsaWQgZmlsdGVyc2V0LlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocGFyZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgcGFyZW50cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gcGFyZW50c1tqXTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbWVyZ2VkRmlsdGVycyA9IHBhcmVudC5maWx0ZXJzLmNsb25lV2l0aChjaGlsZC5maWx0ZXJzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1lcmdlZEZpbHRlcnMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbHRlcnMgY291bGQgYmUgYWRkZWQsIGJ1dCB0aGV5IGRpZG4ndCBjaGFuZ2UgdGhlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaWx0ZXJzLiBUaGlzIG1lYW5zIHRoYXQgd2Ugb25seSBoYXZlIHRvIGNsb25lIHdoZW5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSB6b29tIGxldmVscyBvciB0aGUgYXR0YWNobWVudCBpcyBkaWZmZXJlbnQgdG9vLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudC56b29tID09PSAocGFyZW50Lnpvb20gJiBjaGlsZC56b29tKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5mcmFtZV9vZmZzZXQgPT09IGNoaWxkLmZyYW1lX29mZnNldCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5hdHRhY2htZW50ID09PSBjaGlsZC5hdHRhY2htZW50ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LmVsZW1lbnRzLmpvaW4oKSA9PT0gY2hpbGQuZWxlbWVudHMuam9pbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0b3JzLnB1c2gocGFyZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VkRmlsdGVycyA9IHBhcmVudC5maWx0ZXJzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFtZXJnZWRGaWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgbWVyZ2VkIGZpbHRlcnMgYXJlIGludmFsaWQsIHRoYXQgbWVhbnMgd2UgZG9uJ3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhdmUgdG8gY2xvbmUuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbG9uZSA9IE9iamVjdC5jcmVhdGUodHJlZS5TZWxlY3Rvci5wcm90b3R5cGUpO1xuICAgICAgICAgICAgICAgICAgICBjbG9uZS5maWx0ZXJzID0gbWVyZ2VkRmlsdGVycztcbiAgICAgICAgICAgICAgICAgICAgY2xvbmUuem9vbSA9IHBhcmVudC56b29tICYgY2hpbGQuem9vbTtcbiAgICAgICAgICAgICAgICAgICAgY2xvbmUuZnJhbWVfb2Zmc2V0ID0gY2hpbGQuZnJhbWVfb2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICBjbG9uZS5lbGVtZW50cyA9IHBhcmVudC5lbGVtZW50cy5jb25jYXQoY2hpbGQuZWxlbWVudHMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50LmF0dGFjaG1lbnQgJiYgY2hpbGQuYXR0YWNobWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmUuYXR0YWNobWVudCA9IHBhcmVudC5hdHRhY2htZW50ICsgJy8nICsgY2hpbGQuYXR0YWNobWVudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGNsb25lLmF0dGFjaG1lbnQgPSBjaGlsZC5hdHRhY2htZW50IHx8IHBhcmVudC5hdHRhY2htZW50O1xuICAgICAgICAgICAgICAgICAgICBjbG9uZS5jb25kaXRpb25zID0gcGFyZW50LmNvbmRpdGlvbnMgKyBjaGlsZC5jb25kaXRpb25zO1xuICAgICAgICAgICAgICAgICAgICBjbG9uZS5pbmRleCA9IGNoaWxkLmluZGV4O1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcnMucHVzaChjbG9uZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RvcnMucHVzaChjaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcnVsZXMgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMucnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBydWxlID0gdGhpcy5ydWxlc1tpXTtcblxuICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgZmxhdHRlbiBhbnkgbmVzdGVkIHJ1bGVzZXRzXG4gICAgICAgICAgICBpZiAocnVsZSBpbnN0YW5jZW9mIHRyZWUuUnVsZXNldCkge1xuICAgICAgICAgICAgICAgIHJ1bGUuZmxhdHRlbihyZXN1bHQsIHNlbGVjdG9ycywgZW52KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocnVsZSBpbnN0YW5jZW9mIHRyZWUuUnVsZSkge1xuICAgICAgICAgICAgICAgIHJ1bGVzLnB1c2gocnVsZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJ1bGUgaW5zdGFuY2VvZiB0cmVlLkludmFsaWQpIHtcbiAgICAgICAgICAgICAgICBlbnYuZXJyb3IocnVsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaW5kZXggPSBydWxlcy5sZW5ndGggPyBydWxlc1swXS5pbmRleCA6IGZhbHNlO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAvLyBGb3Igc3BlY2lmaWNpdHkgc29ydCwgdXNlIHRoZSBwb3NpdGlvbiBvZiB0aGUgZmlyc3QgcnVsZSB0byBhbGxvd1xuICAgICAgICAgICAgLy8gZGVmaW5pbmcgYXR0YWNobWVudHMgdGhhdCBhcmUgdW5kZXIgY3VycmVudCBlbGVtZW50IGFzIGEgZGVzY2VuZGFudFxuICAgICAgICAgICAgLy8gc2VsZWN0b3IuXG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3JzW2ldLmluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucHVzaChuZXcgdHJlZS5EZWZpbml0aW9uKHNlbGVjdG9yc1tpXSwgcnVsZXMuc2xpY2UoKSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59O1xufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuU2VsZWN0b3IgPSBmdW5jdGlvbiBTZWxlY3RvcihmaWx0ZXJzLCB6b29tLCBmcmFtZV9vZmZzZXQsIGVsZW1lbnRzLCBhdHRhY2htZW50LCBjb25kaXRpb25zLCBpbmRleCkge1xuICAgIHRoaXMuZWxlbWVudHMgPSBlbGVtZW50cyB8fCBbXTtcbiAgICB0aGlzLmF0dGFjaG1lbnQgPSBhdHRhY2htZW50O1xuICAgIHRoaXMuZmlsdGVycyA9IGZpbHRlcnMgfHwge307XG4gICAgdGhpcy5mcmFtZV9vZmZzZXQgPSBmcmFtZV9vZmZzZXQ7XG4gICAgdGhpcy56b29tID0gdHlwZW9mIHpvb20gIT09ICd1bmRlZmluZWQnID8gem9vbSA6IHRyZWUuWm9vbS5hbGw7XG4gICAgdGhpcy5jb25kaXRpb25zID0gY29uZGl0aW9ucztcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG59O1xuXG4vLyBEZXRlcm1pbmUgdGhlIHNwZWNpZmljaXR5IG9mIHRoaXMgc2VsZWN0b3Jcbi8vIGJhc2VkIG9uIHRoZSBzcGVjaWZpY2l0eSBvZiBpdHMgZWxlbWVudHMgLSBjYWxsaW5nXG4vLyBFbGVtZW50LnNwZWNpZmljaXR5KCkgaW4gb3JkZXIgdG8gZG8gc29cbi8vXG4vLyBbSUQsIENsYXNzLCBGaWx0ZXJzLCBQb3NpdGlvbiBpbiBkb2N1bWVudF1cbnRyZWUuU2VsZWN0b3IucHJvdG90eXBlLnNwZWNpZmljaXR5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudHMucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIGUpIHtcbiAgICAgICAgdmFyIHNwZWMgPSBlLnNwZWNpZmljaXR5KCk7XG4gICAgICAgIG1lbW9bMF0gKz0gc3BlY1swXTtcbiAgICAgICAgbWVtb1sxXSArPSBzcGVjWzFdO1xuICAgICAgICByZXR1cm4gbWVtbztcbiAgICB9LCBbMCwgMCwgdGhpcy5jb25kaXRpb25zLCB0aGlzLmluZGV4XSk7XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcbnZhciBfID0gZ2xvYmFsLl8gfHwgcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG4vLyBHaXZlbiBhIHN0eWxlJ3MgbmFtZSwgYXR0YWNobWVudCwgZGVmaW5pdGlvbnMsIGFuZCBhbiBlbnZpcm9ubWVudCBvYmplY3QsXG4vLyByZXR1cm4gYSBzdHJpbmdpZmllZCBzdHlsZSBmb3IgTWFwbmlrXG50cmVlLlN0eWxlWE1MID0gZnVuY3Rpb24obmFtZSwgYXR0YWNobWVudCwgZGVmaW5pdGlvbnMsIGVudikge1xuICAgIHZhciBleGlzdGluZyA9IHt9O1xuICAgIHZhciBpbWFnZV9maWx0ZXJzID0gW10sIGltYWdlX2ZpbHRlcnNfaW5mbGF0ZSA9IFtdLCBkaXJlY3RfaW1hZ2VfZmlsdGVycyA9IFtdLCBjb21wX29wID0gW10sIG9wYWNpdHkgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVmaW5pdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkZWZpbml0aW9uc1tpXS5ydWxlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKGRlZmluaXRpb25zW2ldLnJ1bGVzW2pdLm5hbWUgPT09ICdpbWFnZS1maWx0ZXJzJykge1xuICAgICAgICAgICAgICAgIGltYWdlX2ZpbHRlcnMucHVzaChkZWZpbml0aW9uc1tpXS5ydWxlc1tqXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGVmaW5pdGlvbnNbaV0ucnVsZXNbal0ubmFtZSA9PT0gJ2ltYWdlLWZpbHRlcnMtaW5mbGF0ZScpIHtcbiAgICAgICAgICAgICAgICBpbWFnZV9maWx0ZXJzX2luZmxhdGUucHVzaChkZWZpbml0aW9uc1tpXS5ydWxlc1tqXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGVmaW5pdGlvbnNbaV0ucnVsZXNbal0ubmFtZSA9PT0gJ2RpcmVjdC1pbWFnZS1maWx0ZXJzJykge1xuICAgICAgICAgICAgICAgIGRpcmVjdF9pbWFnZV9maWx0ZXJzLnB1c2goZGVmaW5pdGlvbnNbaV0ucnVsZXNbal0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRlZmluaXRpb25zW2ldLnJ1bGVzW2pdLm5hbWUgPT09ICdjb21wLW9wJykge1xuICAgICAgICAgICAgICAgIGNvbXBfb3AucHVzaChkZWZpbml0aW9uc1tpXS5ydWxlc1tqXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGVmaW5pdGlvbnNbaV0ucnVsZXNbal0ubmFtZSA9PT0gJ29wYWNpdHknKSB7XG4gICAgICAgICAgICAgICAgb3BhY2l0eS5wdXNoKGRlZmluaXRpb25zW2ldLnJ1bGVzW2pdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBydWxlcyA9IGRlZmluaXRpb25zLm1hcChmdW5jdGlvbihkZWZpbml0aW9uKSB7XG4gICAgICAgIHJldHVybiBkZWZpbml0aW9uLnRvWE1MKGVudiwgZXhpc3RpbmcpO1xuICAgIH0pO1xuXG4gICAgdmFyIGF0dHJzX3htbCA9ICcnO1xuXG4gICAgaWYgKGltYWdlX2ZpbHRlcnMubGVuZ3RoKSB7XG4gICAgICAgIGF0dHJzX3htbCArPSAnIGltYWdlLWZpbHRlcnM9XCInICsgXy5jaGFpbihpbWFnZV9maWx0ZXJzKVxuICAgICAgICAgICAgLy8gcHJldmVudCBpZGVudGljYWwgZmlsdGVycyBmcm9tIGJlaW5nIGR1cGxpY2F0ZWQgaW4gdGhlIHN0eWxlXG4gICAgICAgICAgICAudW5pcShmdW5jdGlvbihpKSB7IHJldHVybiBpLmlkOyB9KS5tYXAoZnVuY3Rpb24oZikge1xuICAgICAgICAgICAgcmV0dXJuIGYuZXYoZW52KS50b1hNTChlbnYsIHRydWUsICcsJywgJ2ltYWdlLWZpbHRlcicpO1xuICAgICAgICB9KS52YWx1ZSgpLmpvaW4oJywnKSArICdcIic7XG4gICAgfVxuXG4gICAgaWYgKGltYWdlX2ZpbHRlcnNfaW5mbGF0ZS5sZW5ndGgpIHtcbiAgICAgICAgYXR0cnNfeG1sICs9ICcgaW1hZ2UtZmlsdGVycy1pbmZsYXRlPVwiJyArIGltYWdlX2ZpbHRlcnNfaW5mbGF0ZVswXS52YWx1ZS5ldihlbnYpLnRvU3RyaW5nKCkgKyAnXCInO1xuICAgIH1cblxuICAgIGlmIChkaXJlY3RfaW1hZ2VfZmlsdGVycy5sZW5ndGgpIHtcbiAgICAgICAgYXR0cnNfeG1sICs9ICcgZGlyZWN0LWltYWdlLWZpbHRlcnM9XCInICsgXy5jaGFpbihkaXJlY3RfaW1hZ2VfZmlsdGVycylcbiAgICAgICAgICAgIC8vIHByZXZlbnQgaWRlbnRpY2FsIGZpbHRlcnMgZnJvbSBiZWluZyBkdXBsaWNhdGVkIGluIHRoZSBzdHlsZVxuICAgICAgICAgICAgLnVuaXEoZnVuY3Rpb24oaSkgeyByZXR1cm4gaS5pZDsgfSkubWFwKGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgICAgIHJldHVybiBmLmV2KGVudikudG9YTUwoZW52LCB0cnVlLCAnLCcsICdkaXJlY3QtaW1hZ2UtZmlsdGVyJyk7XG4gICAgICAgIH0pLnZhbHVlKCkuam9pbignLCcpICsgJ1wiJztcbiAgICB9XG5cbiAgICBpZiAoY29tcF9vcC5sZW5ndGggJiYgY29tcF9vcFswXS52YWx1ZS5ldihlbnYpLnZhbHVlICE9ICdzcmMtb3ZlcicpIHtcbiAgICAgICAgYXR0cnNfeG1sICs9ICcgY29tcC1vcD1cIicgKyBjb21wX29wWzBdLnZhbHVlLmV2KGVudikudG9TdHJpbmcoKSArICdcIic7XG4gICAgfVxuXG4gICAgaWYgKG9wYWNpdHkubGVuZ3RoICYmIG9wYWNpdHlbMF0udmFsdWUuZXYoZW52KS52YWx1ZSAhPSAxKSB7XG4gICAgICAgIGF0dHJzX3htbCArPSAnIG9wYWNpdHk9XCInICsgb3BhY2l0eVswXS52YWx1ZS5ldihlbnYpLnRvU3RyaW5nKCkgKyAnXCInO1xuICAgIH1cbiAgICB2YXIgcnVsZV9zdHJpbmcgPSBydWxlcy5qb2luKCcnKTtcbiAgICBpZiAoIWF0dHJzX3htbCAmJiAhcnVsZV9zdHJpbmcpIHJldHVybiAnJztcbiAgICByZXR1cm4gJzxTdHlsZSBuYW1lPVwiJyArIG5hbWUgKyAnXCIgZmlsdGVyLW1vZGU9XCJmaXJzdFwiJyArIGF0dHJzX3htbCArICc+XFxuJyArIHJ1bGVfc3RyaW5nICsgJzwvU3R5bGU+Jztcbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLlVSTCA9IGZ1bmN0aW9uIFVSTCh2YWwsIHBhdGhzKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbDtcbiAgICB0aGlzLnBhdGhzID0gcGF0aHM7XG59O1xuXG50cmVlLlVSTC5wcm90b3R5cGUgPSB7XG4gICAgaXM6ICd1cmknLFxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUudG9TdHJpbmcoKTtcbiAgICB9LFxuICAgIGV2OiBmdW5jdGlvbihjdHgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlVSTCh0aGlzLnZhbHVlLmV2KGN0eCksIHRoaXMucGF0aHMpO1xuICAgIH1cbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLlZhbHVlID0gZnVuY3Rpb24gVmFsdWUodmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG59O1xuXG50cmVlLlZhbHVlLnByb3RvdHlwZSA9IHtcbiAgICBpczogJ3ZhbHVlJyxcbiAgICBldjogZnVuY3Rpb24oZW52KSB7XG4gICAgICAgIGlmICh0aGlzLnZhbHVlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVbMF0uZXYoZW52KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5WYWx1ZSh0aGlzLnZhbHVlLm1hcChmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHYuZXYoZW52KTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKGVudiwgc2VsZWN0b3IsIHNlcCwgZm9ybWF0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICByZXR1cm4gZS50b1N0cmluZyhlbnYsIGZvcm1hdCk7XG4gICAgICAgIH0pLmpvaW4oc2VwIHx8ICcsICcpO1xuICAgIH0sXG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgb2JqID0gT2JqZWN0LmNyZWF0ZSh0cmVlLlZhbHVlLnByb3RvdHlwZSk7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIG9iai52YWx1ZSA9IHRoaXMudmFsdWUuc2xpY2UoKTtcbiAgICAgICAgZWxzZSBvYmoudmFsdWUgPSB0aGlzLnZhbHVlO1xuICAgICAgICBvYmouaXMgPSB0aGlzLmlzO1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICB0b0pTOiBmdW5jdGlvbihlbnYpIHtcbiAgICAgIC8vdmFyIHYgPSB0aGlzLnZhbHVlWzBdLnZhbHVlWzBdO1xuICAgICAgdmFyIHZhbCA9IHRoaXMuZXYoZW52KTtcbiAgICAgIHZhciB2ID0gdmFsLnRvU3RyaW5nKCk7XG4gICAgICBpZih2YWwuaXMgPT09IFwiY29sb3JcIiB8fCB2YWwuaXMgPT09ICd1cmknIHx8IHZhbC5pcyA9PT0gJ3N0cmluZycgfHwgdmFsLmlzID09PSAna2V5d29yZCcpIHtcbiAgICAgICAgdiA9IFwiJ1wiICsgdiArIFwiJ1wiO1xuICAgICAgfSBlbHNlIGlmICh2YWwuaXMgPT09ICdmaWVsZCcpIHtcbiAgICAgICAgLy8gcmVwbGFjZSBbdmFyaWFibGVdIGJ5IGN0eFsndmFyaWFibGUnXVxuICAgICAgICB2ID0gdi5yZXBsYWNlKC9cXFsoLiopXFxdL2csIFwiZGF0YVsnJDEnXVwiKTtcbiAgICAgIH1lbHNlIGlmICh2YWwuaXMgPT09ICdjYWxsJykge1xuICAgICAgICB2ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgbmFtZTogdmFsLm5hbWUsXG4gICAgICAgICAgICBhcmdzOiB2YWwuYXJnc1xuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgcmV0dXJuIFwiX3ZhbHVlID0gXCIgKyB2ICsgXCI7XCI7XG4gICAgfVxuXG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5WYXJpYWJsZSA9IGZ1bmN0aW9uIFZhcmlhYmxlKG5hbWUsIGluZGV4LCBmaWxlbmFtZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMuZmlsZW5hbWUgPSBmaWxlbmFtZTtcbn07XG5cbnRyZWUuVmFyaWFibGUucHJvdG90eXBlID0ge1xuICAgIGlzOiAndmFyaWFibGUnLFxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZTtcbiAgICB9LFxuICAgIGV2OiBmdW5jdGlvbihlbnYpIHtcbiAgICAgICAgdmFyIHZhcmlhYmxlLFxuICAgICAgICAgICAgdixcbiAgICAgICAgICAgIG5hbWUgPSB0aGlzLm5hbWU7XG5cbiAgICAgICAgaWYgKHRoaXMuX2NzcykgcmV0dXJuIHRoaXMuX2NzcztcblxuICAgICAgICB2YXIgdGhpc2ZyYW1lID0gZW52LmZyYW1lcy5maWx0ZXIoZnVuY3Rpb24oZikge1xuICAgICAgICAgICAgcmV0dXJuIGYubmFtZSA9PSB0aGlzLm5hbWU7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIGlmICh0aGlzZnJhbWUubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc2ZyYW1lWzBdLnZhbHVlLmV2KGVudik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICd2YXJpYWJsZSAnICsgdGhpcy5uYW1lICsgJyBpcyB1bmRlZmluZWQnLFxuICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgIHR5cGU6ICdydW50aW1lJyxcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwidmFyIHRyZWUgPSByZXF1aXJlKCcuLi90cmVlJyk7XG5cbi8vIFN0b3JhZ2UgZm9yIHpvb20gcmFuZ2VzLiBPbmx5IHN1cHBvcnRzIGNvbnRpbnVvdXMgcmFuZ2VzLFxuLy8gYW5kIHN0b3JlcyB0aGVtIGFzIGJpdC1zZXF1ZW5jZXMgc28gdGhhdCB0aGV5IGNhbiBiZSBjb21iaW5lZCxcbi8vIGludmVydGVkLCBhbmQgY29tcGFyZWQgcXVpY2tseS5cbnRyZWUuWm9vbSA9IGZ1bmN0aW9uKG9wLCB2YWx1ZSwgaW5kZXgpIHtcbiAgICB0aGlzLm9wID0gb3A7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbn07XG5cbnRyZWUuWm9vbS5wcm90b3R5cGUuc2V0Wm9vbSA9IGZ1bmN0aW9uKHpvb20pIHtcbiAgICB0aGlzLnpvb20gPSB6b29tO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxudHJlZS5ab29tLnByb3RvdHlwZS5ldiA9IGZ1bmN0aW9uKGVudikge1xuICAgIHZhciBzdGFydCA9IDAsXG4gICAgICAgIGVuZCA9IEluZmluaXR5LFxuICAgICAgICB2YWx1ZSA9IHBhcnNlSW50KHRoaXMudmFsdWUuZXYoZW52KS50b1N0cmluZygpLCAxMCksXG4gICAgICAgIHpvb20gPSAwO1xuXG4gICAgaWYgKHZhbHVlID4gdHJlZS5ab29tLm1heFpvb20gfHwgdmFsdWUgPCAwKSB7XG4gICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICBtZXNzYWdlOiAnT25seSB6b29tIGxldmVscyBiZXR3ZWVuIDAgYW5kICcgK1xuICAgICAgICAgICAgICAgIHRyZWUuWm9vbS5tYXhab29tICsgJyBzdXBwb3J0ZWQuJyxcbiAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN3aXRjaCAodGhpcy5vcCkge1xuICAgICAgICBjYXNlICc9JzpcbiAgICAgICAgICAgIHRoaXMuem9vbSA9IDEgPDwgdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgY2FzZSAnPic6XG4gICAgICAgICAgICBzdGFydCA9IHZhbHVlICsgMTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc+PSc6XG4gICAgICAgICAgICBzdGFydCA9IHZhbHVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzwnOlxuICAgICAgICAgICAgZW5kID0gdmFsdWUgLSAxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzw9JzpcbiAgICAgICAgICAgIGVuZCA9IHZhbHVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHRyZWUuWm9vbS5tYXhab29tOyBpKyspIHtcbiAgICAgICAgaWYgKGkgPj0gc3RhcnQgJiYgaSA8PSBlbmQpIHtcbiAgICAgICAgICAgIHpvb20gfD0gKDEgPDwgaSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy56b29tID0gem9vbTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbnRyZWUuWm9vbS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy56b29tO1xufTtcblxuLy8gQ292ZXJzIGFsbCB6b29tbGV2ZWxzIGZyb20gMCB0byAyMlxudHJlZS5ab29tLmFsbCA9IDB4N0ZGRkZGO1xuXG50cmVlLlpvb20ubWF4Wm9vbSA9IDIyO1xuXG50cmVlLlpvb20ucmFuZ2VzID0ge1xuICAgICAwOiAxMDAwMDAwMDAwLFxuICAgICAxOiA1MDAwMDAwMDAsXG4gICAgIDI6IDIwMDAwMDAwMCxcbiAgICAgMzogMTAwMDAwMDAwLFxuICAgICA0OiA1MDAwMDAwMCxcbiAgICAgNTogMjUwMDAwMDAsXG4gICAgIDY6IDEyNTAwMDAwLFxuICAgICA3OiA2NTAwMDAwLFxuICAgICA4OiAzMDAwMDAwLFxuICAgICA5OiAxNTAwMDAwLFxuICAgIDEwOiA3NTAwMDAsXG4gICAgMTE6IDQwMDAwMCxcbiAgICAxMjogMjAwMDAwLFxuICAgIDEzOiAxMDAwMDAsXG4gICAgMTQ6IDUwMDAwLFxuICAgIDE1OiAyNTAwMCxcbiAgICAxNjogMTI1MDAsXG4gICAgMTc6IDUwMDAsXG4gICAgMTg6IDI1MDAsXG4gICAgMTk6IDE1MDAsXG4gICAgMjA6IDc1MCxcbiAgICAyMTogNTAwLFxuICAgIDIyOiAyNTAsXG4gICAgMjM6IDEwMFxufTtcblxuLy8gT25seSB3b3JrcyBmb3Igc2luZ2xlIHJhbmdlIHpvb21zLiBgW1hYWC4uLi5YWFhYWC4uLi4uLi4uLl1gIGlzIGludmFsaWQuXG50cmVlLlpvb20ucHJvdG90eXBlLnRvWE1MID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvbmRpdGlvbnMgPSBbXTtcbiAgICBpZiAodGhpcy56b29tICE9IHRyZWUuWm9vbS5hbGwpIHtcbiAgICAgICAgdmFyIHN0YXJ0ID0gbnVsbCwgZW5kID0gbnVsbDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gdHJlZS5ab29tLm1heFpvb207IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuem9vbSAmICgxIDw8IGkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0ID09PSBudWxsKSBzdGFydCA9IGk7XG4gICAgICAgICAgICAgICAgZW5kID0gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnQgPiAwKSBjb25kaXRpb25zLnB1c2goJyAgICA8TWF4U2NhbGVEZW5vbWluYXRvcj4nICtcbiAgICAgICAgICAgIHRyZWUuWm9vbS5yYW5nZXNbc3RhcnRdICsgJzwvTWF4U2NhbGVEZW5vbWluYXRvcj5cXG4nKTtcbiAgICAgICAgaWYgKGVuZCA8IDIyKSBjb25kaXRpb25zLnB1c2goJyAgICA8TWluU2NhbGVEZW5vbWluYXRvcj4nICtcbiAgICAgICAgICAgIHRyZWUuWm9vbS5yYW5nZXNbZW5kICsgMV0gKyAnPC9NaW5TY2FsZURlbm9taW5hdG9yPlxcbicpO1xuICAgIH1cbiAgICByZXR1cm4gY29uZGl0aW9ucztcbn07XG5cbnRyZWUuWm9vbS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RyID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gdHJlZS5ab29tLm1heFpvb207IGkrKykge1xuICAgICAgICBzdHIgKz0gKHRoaXMuem9vbSAmICgxIDw8IGkpKSA/ICdYJyA6ICcuJztcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwibmFtZVwiOiBcImNhcnRvXCIsXG4gIFwidmVyc2lvblwiOiBcIjAuMTUuMS1jZGIxXCIsXG4gIFwiZGVzY3JpcHRpb25cIjogXCJDYXJ0b0NTUyBTdHlsZXNoZWV0IENvbXBpbGVyXCIsXG4gIFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2NhcnRvZGIvY2FydG9cIixcbiAgXCJyZXBvc2l0b3J5XCI6IHtcbiAgICBcInR5cGVcIjogXCJnaXRcIixcbiAgICBcInVybFwiOiBcImh0dHA6Ly9naXRodWIuY29tL2NhcnRvZGIvY2FydG8uZ2l0XCJcbiAgfSxcbiAgXCJhdXRob3JcIjoge1xuICAgIFwibmFtZVwiOiBcIkNhcnRvREJcIixcbiAgICBcInVybFwiOiBcImh0dHA6Ly9jYXJ0b2RiLmNvbS9cIlxuICB9LFxuICBcImtleXdvcmRzXCI6IFtcbiAgICBcIm1hcHNcIixcbiAgICBcImNzc1wiLFxuICAgIFwic3R5bGVzaGVldHNcIlxuICBdLFxuICBcImNvbnRyaWJ1dG9yc1wiOiBbXG4gICAgXCJUb20gTWFjV3JpZ2h0IDxtYWN3cmlnaHRAZ21haWwuY29tPlwiLFxuICAgIFwiS29uc3RhbnRpbiBLw6RmZXJcIixcbiAgICBcIkFsZXhpcyBTZWxsaWVyIDxzZWxmQGNsb3VkaGVhZC5uZXQ+XCIsXG4gICAgXCJSYXVsIE9jaG9hIDxyb2Nob2FAY2FydG9kYi5jb20+XCIsXG4gICAgXCJKYXZpIFNhbnRhbmEgPGpzYW50YW5hQGNhcnRvZGIuY29tPlwiXG4gIF0sXG4gIFwibGljZW5zZXNcIjogW1xuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcIkFwYWNoZVwiXG4gICAgfVxuICBdLFxuICBcImJpblwiOiB7XG4gICAgXCJjYXJ0b1wiOiBcIi4vYmluL2NhcnRvXCJcbiAgfSxcbiAgXCJtYW5cIjogXCIuL21hbi9jYXJ0by4xXCIsXG4gIFwibWFpblwiOiBcIi4vbGliL2NhcnRvL2luZGV4XCIsXG4gIFwiZW5naW5lc1wiOiB7XG4gICAgXCJub2RlXCI6IFwiPj0wLjQueFwiXG4gIH0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcInVuZGVyc2NvcmVcIjogXCIxLjguM1wiLFxuICAgIFwibWFwbmlrLXJlZmVyZW5jZVwiOiBcIn42LjAuMlwiLFxuICAgIFwib3B0aW1pc3RcIjogXCJ+MC42LjBcIlxuICB9LFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJtb2NoYVwiOiBcIjEuMTIueFwiLFxuICAgIFwianNoaW50XCI6IFwiMC4yLnhcIixcbiAgICBcInNheFwiOiBcIjAuMS54XCIsXG4gICAgXCJpc3RhbmJ1bFwiOiBcIn4wLjIuMTRcIixcbiAgICBcImNvdmVyYWxsc1wiOiBcIn4yLjEwLjFcIixcbiAgICBcImJyb3dzZXJpZnlcIjogXCJ+Ny4wLjBcIixcbiAgICBcInVnbGlmeS1qc1wiOiBcIjEuMy4zXCJcbiAgfSxcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcInByZXRlc3RcIjogXCJucG0gaW5zdGFsbFwiLFxuICAgIFwidGVzdFwiOiBcIm1vY2hhIC1SIHNwZWNcIixcbiAgICBcImNvdmVyYWdlXCI6IFwiaXN0YW5idWwgY292ZXIgLi9ub2RlX21vZHVsZXMvLmJpbi9fbW9jaGEgJiYgY292ZXJhbGxzIDwgLi9jb3ZlcmFnZS9sY292LmluZm9cIlxuICB9XG59XG4iLCJ2YXIgZnMgPSByZXF1aXJlKCdmcycpLFxuICAgIHBhdGggPSByZXF1aXJlKCdwYXRoJyksXG4gICAgZXhpc3RzU3luYyA9IHJlcXVpcmUoJ2ZzJykuZXhpc3RzU3luYyB8fCByZXF1aXJlKCdwYXRoJykuZXhpc3RzU3luYztcblxuLy8gTG9hZCBhbGwgc3RhdGVkIHZlcnNpb25zIGludG8gdGhlIG1vZHVsZSBleHBvcnRzXG5tb2R1bGUuZXhwb3J0cy52ZXJzaW9uID0ge307XG5cbnZhciByZWZzID0gW1xuICcyLjAuMCcsXG4gJzIuMC4xJyxcbiAnMi4wLjInLFxuICcyLjEuMCcsXG4gJzIuMS4xJyxcbiAnMi4yLjAnLFxuICcyLjMuMCcsXG4gJzMuMC4wJ1xuXTtcblxucmVmcy5tYXAoZnVuY3Rpb24odmVyc2lvbikge1xuICAgIG1vZHVsZS5leHBvcnRzLnZlcnNpb25bdmVyc2lvbl0gPSByZXF1aXJlKHBhdGguam9pbihfX2Rpcm5hbWUsIHZlcnNpb24sICdyZWZlcmVuY2UuanNvbicpKTtcbiAgICB2YXIgZHNfcGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsIHZlcnNpb24sICdkYXRhc291cmNlcy5qc29uJyk7XG4gICAgaWYgKGV4aXN0c1N5bmMoZHNfcGF0aCkpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMudmVyc2lvblt2ZXJzaW9uXS5kYXRhc291cmNlcyA9IHJlcXVpcmUoZHNfcGF0aCkuZGF0YXNvdXJjZXM7XG4gICAgfVxufSk7XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxuLy8gJ3Jvb3QnIGlzIGp1c3QgYSBzbGFzaCwgb3Igbm90aGluZy5cbnZhciBzcGxpdFBhdGhSZSA9XG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XG52YXIgc3BsaXRQYXRoID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xufTtcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgcmVzdWx0ID0gc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcbiAgICAgIGRpciA9IHJlc3VsdFsxXTtcblxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWUgd2hhdHNvZXZlclxuICAgIHJldHVybiAnLic7XG4gIH1cblxuICBpZiAoZGlyKSB7XG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICBkaXIgPSBkaXIuc3Vic3RyKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiByb290ICsgZGlyO1xufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoKHBhdGgpWzJdO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aChwYXRoKVszXTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlciAoeHMsIGYpIHtcbiAgICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxudmFyIHN1YnN0ciA9ICdhYicuc3Vic3RyKC0xKSA9PT0gJ2InXG4gICAgPyBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7IHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pIH1cbiAgICA6IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pO1xuICAgIH1cbjtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvLyAgICAgVW5kZXJzY29yZS5qcyAxLjguM1xuLy8gICAgIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4vLyAgICAgKGMpIDIwMDktMjAxNSBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuLy8gICAgIFVuZGVyc2NvcmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbihmdW5jdGlvbigpIHtcblxuICAvLyBCYXNlbGluZSBzZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZXhwb3J0c2Agb24gdGhlIHNlcnZlci5cbiAgdmFyIHJvb3QgPSB0aGlzO1xuXG4gIC8vIFNhdmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBgX2AgdmFyaWFibGUuXG4gIHZhciBwcmV2aW91c1VuZGVyc2NvcmUgPSByb290Ll87XG5cbiAgLy8gU2F2ZSBieXRlcyBpbiB0aGUgbWluaWZpZWQgKGJ1dCBub3QgZ3ppcHBlZCkgdmVyc2lvbjpcbiAgdmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGUsIE9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZSwgRnVuY1Byb3RvID0gRnVuY3Rpb24ucHJvdG90eXBlO1xuXG4gIC8vIENyZWF0ZSBxdWljayByZWZlcmVuY2UgdmFyaWFibGVzIGZvciBzcGVlZCBhY2Nlc3MgdG8gY29yZSBwcm90b3R5cGVzLlxuICB2YXJcbiAgICBwdXNoICAgICAgICAgICAgID0gQXJyYXlQcm90by5wdXNoLFxuICAgIHNsaWNlICAgICAgICAgICAgPSBBcnJheVByb3RvLnNsaWNlLFxuICAgIHRvU3RyaW5nICAgICAgICAgPSBPYmpQcm90by50b1N0cmluZyxcbiAgICBoYXNPd25Qcm9wZXJ0eSAgID0gT2JqUHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbiAgLy8gQWxsICoqRUNNQVNjcmlwdCA1KiogbmF0aXZlIGZ1bmN0aW9uIGltcGxlbWVudGF0aW9ucyB0aGF0IHdlIGhvcGUgdG8gdXNlXG4gIC8vIGFyZSBkZWNsYXJlZCBoZXJlLlxuICB2YXJcbiAgICBuYXRpdmVJc0FycmF5ICAgICAgPSBBcnJheS5pc0FycmF5LFxuICAgIG5hdGl2ZUtleXMgICAgICAgICA9IE9iamVjdC5rZXlzLFxuICAgIG5hdGl2ZUJpbmQgICAgICAgICA9IEZ1bmNQcm90by5iaW5kLFxuICAgIG5hdGl2ZUNyZWF0ZSAgICAgICA9IE9iamVjdC5jcmVhdGU7XG5cbiAgLy8gTmFrZWQgZnVuY3Rpb24gcmVmZXJlbmNlIGZvciBzdXJyb2dhdGUtcHJvdG90eXBlLXN3YXBwaW5nLlxuICB2YXIgQ3RvciA9IGZ1bmN0aW9uKCl7fTtcblxuICAvLyBDcmVhdGUgYSBzYWZlIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yIHVzZSBiZWxvdy5cbiAgdmFyIF8gPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgXykgcmV0dXJuIG9iajtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgXykpIHJldHVybiBuZXcgXyhvYmopO1xuICAgIHRoaXMuX3dyYXBwZWQgPSBvYmo7XG4gIH07XG5cbiAgLy8gRXhwb3J0IHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgKipOb2RlLmpzKiosIHdpdGhcbiAgLy8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIHRoZSBvbGQgYHJlcXVpcmUoKWAgQVBJLiBJZiB3ZSdyZSBpblxuICAvLyB0aGUgYnJvd3NlciwgYWRkIGBfYCBhcyBhIGdsb2JhbCBvYmplY3QuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IF87XG4gICAgfVxuICAgIGV4cG9ydHMuXyA9IF87XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5fID0gXztcbiAgfVxuXG4gIC8vIEN1cnJlbnQgdmVyc2lvbi5cbiAgXy5WRVJTSU9OID0gJzEuOC4zJztcblxuICAvLyBJbnRlcm5hbCBmdW5jdGlvbiB0aGF0IHJldHVybnMgYW4gZWZmaWNpZW50IChmb3IgY3VycmVudCBlbmdpbmVzKSB2ZXJzaW9uXG4gIC8vIG9mIHRoZSBwYXNzZWQtaW4gY2FsbGJhY2ssIHRvIGJlIHJlcGVhdGVkbHkgYXBwbGllZCBpbiBvdGhlciBVbmRlcnNjb3JlXG4gIC8vIGZ1bmN0aW9ucy5cbiAgdmFyIG9wdGltaXplQ2IgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0LCBhcmdDb3VudCkge1xuICAgIGlmIChjb250ZXh0ID09PSB2b2lkIDApIHJldHVybiBmdW5jO1xuICAgIHN3aXRjaCAoYXJnQ291bnQgPT0gbnVsbCA/IDMgOiBhcmdDb3VudCkge1xuICAgICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCB2YWx1ZSk7XG4gICAgICB9O1xuICAgICAgY2FzZSAyOiByZXR1cm4gZnVuY3Rpb24odmFsdWUsIG90aGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwoY29udGV4dCwgdmFsdWUsIG90aGVyKTtcbiAgICAgIH07XG4gICAgICBjYXNlIDM6IHJldHVybiBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgICAgfTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGZ1bmN0aW9uKGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCBhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBBIG1vc3RseS1pbnRlcm5hbCBmdW5jdGlvbiB0byBnZW5lcmF0ZSBjYWxsYmFja3MgdGhhdCBjYW4gYmUgYXBwbGllZFxuICAvLyB0byBlYWNoIGVsZW1lbnQgaW4gYSBjb2xsZWN0aW9uLCByZXR1cm5pbmcgdGhlIGRlc2lyZWQgcmVzdWx0IOKAlCBlaXRoZXJcbiAgLy8gaWRlbnRpdHksIGFuIGFyYml0cmFyeSBjYWxsYmFjaywgYSBwcm9wZXJ0eSBtYXRjaGVyLCBvciBhIHByb3BlcnR5IGFjY2Vzc29yLlxuICB2YXIgY2IgPSBmdW5jdGlvbih2YWx1ZSwgY29udGV4dCwgYXJnQ291bnQpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIF8uaWRlbnRpdHk7XG4gICAgaWYgKF8uaXNGdW5jdGlvbih2YWx1ZSkpIHJldHVybiBvcHRpbWl6ZUNiKHZhbHVlLCBjb250ZXh0LCBhcmdDb3VudCk7XG4gICAgaWYgKF8uaXNPYmplY3QodmFsdWUpKSByZXR1cm4gXy5tYXRjaGVyKHZhbHVlKTtcbiAgICByZXR1cm4gXy5wcm9wZXJ0eSh2YWx1ZSk7XG4gIH07XG4gIF8uaXRlcmF0ZWUgPSBmdW5jdGlvbih2YWx1ZSwgY29udGV4dCkge1xuICAgIHJldHVybiBjYih2YWx1ZSwgY29udGV4dCwgSW5maW5pdHkpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIGZvciBjcmVhdGluZyBhc3NpZ25lciBmdW5jdGlvbnMuXG4gIHZhciBjcmVhdGVBc3NpZ25lciA9IGZ1bmN0aW9uKGtleXNGdW5jLCB1bmRlZmluZWRPbmx5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICBpZiAobGVuZ3RoIDwgMiB8fCBvYmogPT0gbnVsbCkgcmV0dXJuIG9iajtcbiAgICAgIGZvciAodmFyIGluZGV4ID0gMTsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF0sXG4gICAgICAgICAgICBrZXlzID0ga2V5c0Z1bmMoc291cmNlKSxcbiAgICAgICAgICAgIGwgPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgICBpZiAoIXVuZGVmaW5lZE9ubHkgfHwgb2JqW2tleV0gPT09IHZvaWQgMCkgb2JqW2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG9iajtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIGZvciBjcmVhdGluZyBhIG5ldyBvYmplY3QgdGhhdCBpbmhlcml0cyBmcm9tIGFub3RoZXIuXG4gIHZhciBiYXNlQ3JlYXRlID0gZnVuY3Rpb24ocHJvdG90eXBlKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KHByb3RvdHlwZSkpIHJldHVybiB7fTtcbiAgICBpZiAobmF0aXZlQ3JlYXRlKSByZXR1cm4gbmF0aXZlQ3JlYXRlKHByb3RvdHlwZSk7XG4gICAgQ3Rvci5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBDdG9yO1xuICAgIEN0b3IucHJvdG90eXBlID0gbnVsbDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIHZhciBwcm9wZXJ0eSA9IGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogPT0gbnVsbCA/IHZvaWQgMCA6IG9ialtrZXldO1xuICAgIH07XG4gIH07XG5cbiAgLy8gSGVscGVyIGZvciBjb2xsZWN0aW9uIG1ldGhvZHMgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYSBjb2xsZWN0aW9uXG4gIC8vIHNob3VsZCBiZSBpdGVyYXRlZCBhcyBhbiBhcnJheSBvciBhcyBhbiBvYmplY3RcbiAgLy8gUmVsYXRlZDogaHR0cDovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtdG9sZW5ndGhcbiAgLy8gQXZvaWRzIGEgdmVyeSBuYXN0eSBpT1MgOCBKSVQgYnVnIG9uIEFSTS02NC4gIzIwOTRcbiAgdmFyIE1BWF9BUlJBWV9JTkRFWCA9IE1hdGgucG93KDIsIDUzKSAtIDE7XG4gIHZhciBnZXRMZW5ndGggPSBwcm9wZXJ0eSgnbGVuZ3RoJyk7XG4gIHZhciBpc0FycmF5TGlrZSA9IGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcbiAgICB2YXIgbGVuZ3RoID0gZ2V0TGVuZ3RoKGNvbGxlY3Rpb24pO1xuICAgIHJldHVybiB0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInICYmIGxlbmd0aCA+PSAwICYmIGxlbmd0aCA8PSBNQVhfQVJSQVlfSU5ERVg7XG4gIH07XG5cbiAgLy8gQ29sbGVjdGlvbiBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUaGUgY29ybmVyc3RvbmUsIGFuIGBlYWNoYCBpbXBsZW1lbnRhdGlvbiwgYWthIGBmb3JFYWNoYC5cbiAgLy8gSGFuZGxlcyByYXcgb2JqZWN0cyBpbiBhZGRpdGlvbiB0byBhcnJheS1saWtlcy4gVHJlYXRzIGFsbFxuICAvLyBzcGFyc2UgYXJyYXktbGlrZXMgYXMgaWYgdGhleSB3ZXJlIGRlbnNlLlxuICBfLmVhY2ggPSBfLmZvckVhY2ggPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0ZWUgPSBvcHRpbWl6ZUNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB2YXIgaSwgbGVuZ3RoO1xuICAgIGlmIChpc0FycmF5TGlrZShvYmopKSB7XG4gICAgICBmb3IgKGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaXRlcmF0ZWUob2JqW2ldLCBpLCBvYmopO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpdGVyYXRlZShvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iaik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRlZSB0byBlYWNoIGVsZW1lbnQuXG4gIF8ubWFwID0gXy5jb2xsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHZhciBrZXlzID0gIWlzQXJyYXlMaWtlKG9iaikgJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoLFxuICAgICAgICByZXN1bHRzID0gQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgY3VycmVudEtleSA9IGtleXMgPyBrZXlzW2luZGV4XSA6IGluZGV4O1xuICAgICAgcmVzdWx0c1tpbmRleF0gPSBpdGVyYXRlZShvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaik7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIHJlZHVjaW5nIGZ1bmN0aW9uIGl0ZXJhdGluZyBsZWZ0IG9yIHJpZ2h0LlxuICBmdW5jdGlvbiBjcmVhdGVSZWR1Y2UoZGlyKSB7XG4gICAgLy8gT3B0aW1pemVkIGl0ZXJhdG9yIGZ1bmN0aW9uIGFzIHVzaW5nIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAvLyBpbiB0aGUgbWFpbiBmdW5jdGlvbiB3aWxsIGRlb3B0aW1pemUgdGhlLCBzZWUgIzE5OTEuXG4gICAgZnVuY3Rpb24gaXRlcmF0b3Iob2JqLCBpdGVyYXRlZSwgbWVtbywga2V5cywgaW5kZXgsIGxlbmd0aCkge1xuICAgICAgZm9yICg7IGluZGV4ID49IDAgJiYgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IGRpcikge1xuICAgICAgICB2YXIgY3VycmVudEtleSA9IGtleXMgPyBrZXlzW2luZGV4XSA6IGluZGV4O1xuICAgICAgICBtZW1vID0gaXRlcmF0ZWUobWVtbywgb2JqW2N1cnJlbnRLZXldLCBjdXJyZW50S2V5LCBvYmopO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIG1lbW8sIGNvbnRleHQpIHtcbiAgICAgIGl0ZXJhdGVlID0gb3B0aW1pemVDYihpdGVyYXRlZSwgY29udGV4dCwgNCk7XG4gICAgICB2YXIga2V5cyA9ICFpc0FycmF5TGlrZShvYmopICYmIF8ua2V5cyhvYmopLFxuICAgICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoLFxuICAgICAgICAgIGluZGV4ID0gZGlyID4gMCA/IDAgOiBsZW5ndGggLSAxO1xuICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBpbml0aWFsIHZhbHVlIGlmIG5vbmUgaXMgcHJvdmlkZWQuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgbWVtbyA9IG9ialtrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleF07XG4gICAgICAgIGluZGV4ICs9IGRpcjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpdGVyYXRvcihvYmosIGl0ZXJhdGVlLCBtZW1vLCBrZXlzLCBpbmRleCwgbGVuZ3RoKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gKipSZWR1Y2UqKiBidWlsZHMgdXAgYSBzaW5nbGUgcmVzdWx0IGZyb20gYSBsaXN0IG9mIHZhbHVlcywgYWthIGBpbmplY3RgLFxuICAvLyBvciBgZm9sZGxgLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGNyZWF0ZVJlZHVjZSgxKTtcblxuICAvLyBUaGUgcmlnaHQtYXNzb2NpYXRpdmUgdmVyc2lvbiBvZiByZWR1Y2UsIGFsc28ga25vd24gYXMgYGZvbGRyYC5cbiAgXy5yZWR1Y2VSaWdodCA9IF8uZm9sZHIgPSBjcmVhdGVSZWR1Y2UoLTEpO1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHZhciBrZXk7XG4gICAgaWYgKGlzQXJyYXlMaWtlKG9iaikpIHtcbiAgICAgIGtleSA9IF8uZmluZEluZGV4KG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5ID0gXy5maW5kS2V5KG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB9XG4gICAgaWYgKGtleSAhPT0gdm9pZCAwICYmIGtleSAhPT0gLTEpIHJldHVybiBvYmpba2V5XTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyB0aGF0IHBhc3MgYSB0cnV0aCB0ZXN0LlxuICAvLyBBbGlhc2VkIGFzIGBzZWxlY3RgLlxuICBfLmZpbHRlciA9IF8uc2VsZWN0ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHByZWRpY2F0ZSA9IGNiKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAocHJlZGljYXRlKHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHMucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIF8ubmVnYXRlKGNiKHByZWRpY2F0ZSkpLCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciBhbGwgb2YgdGhlIGVsZW1lbnRzIG1hdGNoIGEgdHJ1dGggdGVzdC5cbiAgLy8gQWxpYXNlZCBhcyBgYWxsYC5cbiAgXy5ldmVyeSA9IF8uYWxsID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBwcmVkaWNhdGUgPSBjYihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIHZhciBrZXlzID0gIWlzQXJyYXlMaWtlKG9iaikgJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBjdXJyZW50S2V5ID0ga2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXg7XG4gICAgICBpZiAoIXByZWRpY2F0ZShvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaikpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSBlbGVtZW50IGluIHRoZSBvYmplY3QgbWF0Y2hlcyBhIHRydXRoIHRlc3QuXG4gIC8vIEFsaWFzZWQgYXMgYGFueWAuXG4gIF8uc29tZSA9IF8uYW55ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBwcmVkaWNhdGUgPSBjYihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIHZhciBrZXlzID0gIWlzQXJyYXlMaWtlKG9iaikgJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBjdXJyZW50S2V5ID0ga2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXg7XG4gICAgICBpZiAocHJlZGljYXRlKG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKSkgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIGl0ZW0gKHVzaW5nIGA9PT1gKS5cbiAgLy8gQWxpYXNlZCBhcyBgaW5jbHVkZXNgIGFuZCBgaW5jbHVkZWAuXG4gIF8uY29udGFpbnMgPSBfLmluY2x1ZGVzID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCBpdGVtLCBmcm9tSW5kZXgsIGd1YXJkKSB7XG4gICAgaWYgKCFpc0FycmF5TGlrZShvYmopKSBvYmogPSBfLnZhbHVlcyhvYmopO1xuICAgIGlmICh0eXBlb2YgZnJvbUluZGV4ICE9ICdudW1iZXInIHx8IGd1YXJkKSBmcm9tSW5kZXggPSAwO1xuICAgIHJldHVybiBfLmluZGV4T2Yob2JqLCBpdGVtLCBmcm9tSW5kZXgpID49IDA7XG4gIH07XG5cbiAgLy8gSW52b2tlIGEgbWV0aG9kICh3aXRoIGFyZ3VtZW50cykgb24gZXZlcnkgaXRlbSBpbiBhIGNvbGxlY3Rpb24uXG4gIF8uaW52b2tlID0gZnVuY3Rpb24ob2JqLCBtZXRob2QpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgaXNGdW5jID0gXy5pc0Z1bmN0aW9uKG1ldGhvZCk7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHZhciBmdW5jID0gaXNGdW5jID8gbWV0aG9kIDogdmFsdWVbbWV0aG9kXTtcbiAgICAgIHJldHVybiBmdW5jID09IG51bGwgPyBmdW5jIDogZnVuYy5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgXy5wcm9wZXJ0eShrZXkpKTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaWx0ZXJgOiBzZWxlY3Rpbmcgb25seSBvYmplY3RzXG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8ud2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgXy5tYXRjaGVyKGF0dHJzKSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmluZGA6IGdldHRpbmcgdGhlIGZpcnN0IG9iamVjdFxuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLmZpbmRXaGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMpIHtcbiAgICByZXR1cm4gXy5maW5kKG9iaiwgXy5tYXRjaGVyKGF0dHJzKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtYXhpbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1heCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0ID0gLUluZmluaXR5LCBsYXN0Q29tcHV0ZWQgPSAtSW5maW5pdHksXG4gICAgICAgIHZhbHVlLCBjb21wdXRlZDtcbiAgICBpZiAoaXRlcmF0ZWUgPT0gbnVsbCAmJiBvYmogIT0gbnVsbCkge1xuICAgICAgb2JqID0gaXNBcnJheUxpa2Uob2JqKSA/IG9iaiA6IF8udmFsdWVzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhbHVlID0gb2JqW2ldO1xuICAgICAgICBpZiAodmFsdWUgPiByZXN1bHQpIHtcbiAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgICBjb21wdXRlZCA9IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgICAgIGlmIChjb21wdXRlZCA+IGxhc3RDb21wdXRlZCB8fCBjb21wdXRlZCA9PT0gLUluZmluaXR5ICYmIHJlc3VsdCA9PT0gLUluZmluaXR5KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgbGFzdENvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWluaW11bSBlbGVtZW50IChvciBlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgXy5taW4gPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdCA9IEluZmluaXR5LCBsYXN0Q29tcHV0ZWQgPSBJbmZpbml0eSxcbiAgICAgICAgdmFsdWUsIGNvbXB1dGVkO1xuICAgIGlmIChpdGVyYXRlZSA9PSBudWxsICYmIG9iaiAhPSBudWxsKSB7XG4gICAgICBvYmogPSBpc0FycmF5TGlrZShvYmopID8gb2JqIDogXy52YWx1ZXMob2JqKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFsdWUgPSBvYmpbaV07XG4gICAgICAgIGlmICh2YWx1ZSA8IHJlc3VsdCkge1xuICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICAgIGNvbXB1dGVkID0gaXRlcmF0ZWUodmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgICAgaWYgKGNvbXB1dGVkIDwgbGFzdENvbXB1dGVkIHx8IGNvbXB1dGVkID09PSBJbmZpbml0eSAmJiByZXN1bHQgPT09IEluZmluaXR5KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgbGFzdENvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFNodWZmbGUgYSBjb2xsZWN0aW9uLCB1c2luZyB0aGUgbW9kZXJuIHZlcnNpb24gb2YgdGhlXG4gIC8vIFtGaXNoZXItWWF0ZXMgc2h1ZmZsZV0oaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GaXNoZXLigJNZYXRlc19zaHVmZmxlKS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHNldCA9IGlzQXJyYXlMaWtlKG9iaikgPyBvYmogOiBfLnZhbHVlcyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBzZXQubGVuZ3RoO1xuICAgIHZhciBzaHVmZmxlZCA9IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwLCByYW5kOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgcmFuZCA9IF8ucmFuZG9tKDAsIGluZGV4KTtcbiAgICAgIGlmIChyYW5kICE9PSBpbmRleCkgc2h1ZmZsZWRbaW5kZXhdID0gc2h1ZmZsZWRbcmFuZF07XG4gICAgICBzaHVmZmxlZFtyYW5kXSA9IHNldFtpbmRleF07XG4gICAgfVxuICAgIHJldHVybiBzaHVmZmxlZDtcbiAgfTtcblxuICAvLyBTYW1wbGUgKipuKiogcmFuZG9tIHZhbHVlcyBmcm9tIGEgY29sbGVjdGlvbi5cbiAgLy8gSWYgKipuKiogaXMgbm90IHNwZWNpZmllZCwgcmV0dXJucyBhIHNpbmdsZSByYW5kb20gZWxlbWVudC5cbiAgLy8gVGhlIGludGVybmFsIGBndWFyZGAgYXJndW1lbnQgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgbWFwYC5cbiAgXy5zYW1wbGUgPSBmdW5jdGlvbihvYmosIG4sIGd1YXJkKSB7XG4gICAgaWYgKG4gPT0gbnVsbCB8fCBndWFyZCkge1xuICAgICAgaWYgKCFpc0FycmF5TGlrZShvYmopKSBvYmogPSBfLnZhbHVlcyhvYmopO1xuICAgICAgcmV0dXJuIG9ialtfLnJhbmRvbShvYmoubGVuZ3RoIC0gMSldO1xuICAgIH1cbiAgICByZXR1cm4gXy5zaHVmZmxlKG9iaikuc2xpY2UoMCwgTWF0aC5tYXgoMCwgbikpO1xuICB9O1xuXG4gIC8vIFNvcnQgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiBwcm9kdWNlZCBieSBhbiBpdGVyYXRlZS5cbiAgXy5zb3J0QnkgPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgcmV0dXJuIF8ucGx1Y2soXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICBjcml0ZXJpYTogaXRlcmF0ZWUodmFsdWUsIGluZGV4LCBsaXN0KVxuICAgICAgfTtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWE7XG4gICAgICB2YXIgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgaWYgKGEgIT09IGIpIHtcbiAgICAgICAgaWYgKGEgPiBiIHx8IGEgPT09IHZvaWQgMCkgcmV0dXJuIDE7XG4gICAgICAgIGlmIChhIDwgYiB8fCBiID09PSB2b2lkIDApIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsZWZ0LmluZGV4IC0gcmlnaHQuaW5kZXg7XG4gICAgfSksICd2YWx1ZScpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHVzZWQgZm9yIGFnZ3JlZ2F0ZSBcImdyb3VwIGJ5XCIgb3BlcmF0aW9ucy5cbiAgdmFyIGdyb3VwID0gZnVuY3Rpb24oYmVoYXZpb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGtleSA9IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgICAgYmVoYXZpb3IocmVzdWx0LCB2YWx1ZSwga2V5KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGtleSkge1xuICAgIGlmIChfLmhhcyhyZXN1bHQsIGtleSkpIHJlc3VsdFtrZXldLnB1c2godmFsdWUpOyBlbHNlIHJlc3VsdFtrZXldID0gW3ZhbHVlXTtcbiAgfSk7XG5cbiAgLy8gSW5kZXhlcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLCBzaW1pbGFyIHRvIGBncm91cEJ5YCwgYnV0IGZvclxuICAvLyB3aGVuIHlvdSBrbm93IHRoYXQgeW91ciBpbmRleCB2YWx1ZXMgd2lsbCBiZSB1bmlxdWUuXG4gIF8uaW5kZXhCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGtleSkge1xuICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gIH0pO1xuXG4gIC8vIENvdW50cyBpbnN0YW5jZXMgb2YgYW4gb2JqZWN0IHRoYXQgZ3JvdXAgYnkgYSBjZXJ0YWluIGNyaXRlcmlvbi4gUGFzc1xuICAvLyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlIHRvIGNvdW50IGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGVcbiAgLy8gY3JpdGVyaW9uLlxuICBfLmNvdW50QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBrZXkpIHtcbiAgICBpZiAoXy5oYXMocmVzdWx0LCBrZXkpKSByZXN1bHRba2V5XSsrOyBlbHNlIHJlc3VsdFtrZXldID0gMTtcbiAgfSk7XG5cbiAgLy8gU2FmZWx5IGNyZWF0ZSBhIHJlYWwsIGxpdmUgYXJyYXkgZnJvbSBhbnl0aGluZyBpdGVyYWJsZS5cbiAgXy50b0FycmF5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFvYmopIHJldHVybiBbXTtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikpIHJldHVybiBzbGljZS5jYWxsKG9iaik7XG4gICAgaWYgKGlzQXJyYXlMaWtlKG9iaikpIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGluIGFuIG9iamVjdC5cbiAgXy5zaXplID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gMDtcbiAgICByZXR1cm4gaXNBcnJheUxpa2Uob2JqKSA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gU3BsaXQgYSBjb2xsZWN0aW9uIGludG8gdHdvIGFycmF5czogb25lIHdob3NlIGVsZW1lbnRzIGFsbCBzYXRpc2Z5IHRoZSBnaXZlblxuICAvLyBwcmVkaWNhdGUsIGFuZCBvbmUgd2hvc2UgZWxlbWVudHMgYWxsIGRvIG5vdCBzYXRpc2Z5IHRoZSBwcmVkaWNhdGUuXG4gIF8ucGFydGl0aW9uID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBwcmVkaWNhdGUgPSBjYihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIHZhciBwYXNzID0gW10sIGZhaWwgPSBbXTtcbiAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBvYmopIHtcbiAgICAgIChwcmVkaWNhdGUodmFsdWUsIGtleSwgb2JqKSA/IHBhc3MgOiBmYWlsKS5wdXNoKHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gW3Bhc3MsIGZhaWxdO1xuICB9O1xuXG4gIC8vIEFycmF5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBHZXQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGZpcnN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgaGVhZGAgYW5kIGB0YWtlYC4gVGhlICoqZ3VhcmQqKiBjaGVja1xuICAvLyBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8uZmlyc3QgPSBfLmhlYWQgPSBfLnRha2UgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAobiA9PSBudWxsIHx8IGd1YXJkKSByZXR1cm4gYXJyYXlbMF07XG4gICAgcmV0dXJuIF8uaW5pdGlhbChhcnJheSwgYXJyYXkubGVuZ3RoIC0gbik7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgbGFzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEVzcGVjaWFsbHkgdXNlZnVsIG9uXG4gIC8vIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIGFsbCB0aGUgdmFsdWVzIGluXG4gIC8vIHRoZSBhcnJheSwgZXhjbHVkaW5nIHRoZSBsYXN0IE4uXG4gIF8uaW5pdGlhbCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAwLCBNYXRoLm1heCgwLCBhcnJheS5sZW5ndGggLSAobiA9PSBudWxsIHx8IGd1YXJkID8gMSA6IG4pKSk7XG4gIH07XG5cbiAgLy8gR2V0IHRoZSBsYXN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGxhc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LlxuICBfLmxhc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAobiA9PSBudWxsIHx8IGd1YXJkKSByZXR1cm4gYXJyYXlbYXJyYXkubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIF8ucmVzdChhcnJheSwgTWF0aC5tYXgoMCwgYXJyYXkubGVuZ3RoIC0gbikpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGZpcnN0IGVudHJ5IG9mIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgdGFpbGAgYW5kIGBkcm9wYC5cbiAgLy8gRXNwZWNpYWxseSB1c2VmdWwgb24gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgYW4gKipuKiogd2lsbCByZXR1cm5cbiAgLy8gdGhlIHJlc3QgTiB2YWx1ZXMgaW4gdGhlIGFycmF5LlxuICBfLnJlc3QgPSBfLnRhaWwgPSBfLmRyb3AgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgbiA9PSBudWxsIHx8IGd1YXJkID8gMSA6IG4pO1xuICB9O1xuXG4gIC8vIFRyaW0gb3V0IGFsbCBmYWxzeSB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cbiAgXy5jb21wYWN0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIF8uaWRlbnRpdHkpO1xuICB9O1xuXG4gIC8vIEludGVybmFsIGltcGxlbWVudGF0aW9uIG9mIGEgcmVjdXJzaXZlIGBmbGF0dGVuYCBmdW5jdGlvbi5cbiAgdmFyIGZsYXR0ZW4gPSBmdW5jdGlvbihpbnB1dCwgc2hhbGxvdywgc3RyaWN0LCBzdGFydEluZGV4KSB7XG4gICAgdmFyIG91dHB1dCA9IFtdLCBpZHggPSAwO1xuICAgIGZvciAodmFyIGkgPSBzdGFydEluZGV4IHx8IDAsIGxlbmd0aCA9IGdldExlbmd0aChpbnB1dCk7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHZhbHVlID0gaW5wdXRbaV07XG4gICAgICBpZiAoaXNBcnJheUxpa2UodmFsdWUpICYmIChfLmlzQXJyYXkodmFsdWUpIHx8IF8uaXNBcmd1bWVudHModmFsdWUpKSkge1xuICAgICAgICAvL2ZsYXR0ZW4gY3VycmVudCBsZXZlbCBvZiBhcnJheSBvciBhcmd1bWVudHMgb2JqZWN0XG4gICAgICAgIGlmICghc2hhbGxvdykgdmFsdWUgPSBmbGF0dGVuKHZhbHVlLCBzaGFsbG93LCBzdHJpY3QpO1xuICAgICAgICB2YXIgaiA9IDAsIGxlbiA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgb3V0cHV0Lmxlbmd0aCArPSBsZW47XG4gICAgICAgIHdoaWxlIChqIDwgbGVuKSB7XG4gICAgICAgICAgb3V0cHV0W2lkeCsrXSA9IHZhbHVlW2orK107XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIXN0cmljdCkge1xuICAgICAgICBvdXRwdXRbaWR4KytdID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG5cbiAgLy8gRmxhdHRlbiBvdXQgYW4gYXJyYXksIGVpdGhlciByZWN1cnNpdmVseSAoYnkgZGVmYXVsdCksIG9yIGp1c3Qgb25lIGxldmVsLlxuICBfLmZsYXR0ZW4gPSBmdW5jdGlvbihhcnJheSwgc2hhbGxvdykge1xuICAgIHJldHVybiBmbGF0dGVuKGFycmF5LCBzaGFsbG93LCBmYWxzZSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgdmVyc2lvbiBvZiB0aGUgYXJyYXkgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBzcGVjaWZpZWQgdmFsdWUocykuXG4gIF8ud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZGlmZmVyZW5jZShhcnJheSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGEgZHVwbGljYXRlLWZyZWUgdmVyc2lvbiBvZiB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgYWxyZWFkeVxuICAvLyBiZWVuIHNvcnRlZCwgeW91IGhhdmUgdGhlIG9wdGlvbiBvZiB1c2luZyBhIGZhc3RlciBhbGdvcml0aG0uXG4gIC8vIEFsaWFzZWQgYXMgYHVuaXF1ZWAuXG4gIF8udW5pcSA9IF8udW5pcXVlID0gZnVuY3Rpb24oYXJyYXksIGlzU29ydGVkLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGlmICghXy5pc0Jvb2xlYW4oaXNTb3J0ZWQpKSB7XG4gICAgICBjb250ZXh0ID0gaXRlcmF0ZWU7XG4gICAgICBpdGVyYXRlZSA9IGlzU29ydGVkO1xuICAgICAgaXNTb3J0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGl0ZXJhdGVlICE9IG51bGwpIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB2YXIgc2VlbiA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBnZXRMZW5ndGgoYXJyYXkpOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB2YWx1ZSA9IGFycmF5W2ldLFxuICAgICAgICAgIGNvbXB1dGVkID0gaXRlcmF0ZWUgPyBpdGVyYXRlZSh2YWx1ZSwgaSwgYXJyYXkpIDogdmFsdWU7XG4gICAgICBpZiAoaXNTb3J0ZWQpIHtcbiAgICAgICAgaWYgKCFpIHx8IHNlZW4gIT09IGNvbXB1dGVkKSByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIHNlZW4gPSBjb21wdXRlZDtcbiAgICAgIH0gZWxzZSBpZiAoaXRlcmF0ZWUpIHtcbiAgICAgICAgaWYgKCFfLmNvbnRhaW5zKHNlZW4sIGNvbXB1dGVkKSkge1xuICAgICAgICAgIHNlZW4ucHVzaChjb21wdXRlZCk7XG4gICAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFfLmNvbnRhaW5zKHJlc3VsdCwgdmFsdWUpKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgdGhlIHVuaW9uOiBlYWNoIGRpc3RpbmN0IGVsZW1lbnQgZnJvbSBhbGwgb2ZcbiAgLy8gdGhlIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8udW5pb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXy51bmlxKGZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlLCB0cnVlKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIGV2ZXJ5IGl0ZW0gc2hhcmVkIGJldHdlZW4gYWxsIHRoZVxuICAvLyBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIHZhciBhcmdzTGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gZ2V0TGVuZ3RoKGFycmF5KTsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaXRlbSA9IGFycmF5W2ldO1xuICAgICAgaWYgKF8uY29udGFpbnMocmVzdWx0LCBpdGVtKSkgY29udGludWU7XG4gICAgICBmb3IgKHZhciBqID0gMTsgaiA8IGFyZ3NMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoIV8uY29udGFpbnMoYXJndW1lbnRzW2pdLCBpdGVtKSkgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoaiA9PT0gYXJnc0xlbmd0aCkgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gVGFrZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIG9uZSBhcnJheSBhbmQgYSBudW1iZXIgb2Ygb3RoZXIgYXJyYXlzLlxuICAvLyBPbmx5IHRoZSBlbGVtZW50cyBwcmVzZW50IGluIGp1c3QgdGhlIGZpcnN0IGFycmF5IHdpbGwgcmVtYWluLlxuICBfLmRpZmZlcmVuY2UgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gZmxhdHRlbihhcmd1bWVudHMsIHRydWUsIHRydWUsIDEpO1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgZnVuY3Rpb24odmFsdWUpe1xuICAgICAgcmV0dXJuICFfLmNvbnRhaW5zKHJlc3QsIHZhbHVlKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBaaXAgdG9nZXRoZXIgbXVsdGlwbGUgbGlzdHMgaW50byBhIHNpbmdsZSBhcnJheSAtLSBlbGVtZW50cyB0aGF0IHNoYXJlXG4gIC8vIGFuIGluZGV4IGdvIHRvZ2V0aGVyLlxuICBfLnppcCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLnVuemlwKGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgLy8gQ29tcGxlbWVudCBvZiBfLnppcC4gVW56aXAgYWNjZXB0cyBhbiBhcnJheSBvZiBhcnJheXMgYW5kIGdyb3Vwc1xuICAvLyBlYWNoIGFycmF5J3MgZWxlbWVudHMgb24gc2hhcmVkIGluZGljZXNcbiAgXy51bnppcCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIGxlbmd0aCA9IGFycmF5ICYmIF8ubWF4KGFycmF5LCBnZXRMZW5ndGgpLmxlbmd0aCB8fCAwO1xuICAgIHZhciByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgcmVzdWx0W2luZGV4XSA9IF8ucGx1Y2soYXJyYXksIGluZGV4KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBDb252ZXJ0cyBsaXN0cyBpbnRvIG9iamVjdHMuIFBhc3MgZWl0aGVyIGEgc2luZ2xlIGFycmF5IG9mIGBba2V5LCB2YWx1ZV1gXG4gIC8vIHBhaXJzLCBvciB0d28gcGFyYWxsZWwgYXJyYXlzIG9mIHRoZSBzYW1lIGxlbmd0aCAtLSBvbmUgb2Yga2V5cywgYW5kIG9uZSBvZlxuICAvLyB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXMuXG4gIF8ub2JqZWN0ID0gZnVuY3Rpb24obGlzdCwgdmFsdWVzKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBnZXRMZW5ndGgobGlzdCk7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHZhbHVlcykge1xuICAgICAgICByZXN1bHRbbGlzdFtpXV0gPSB2YWx1ZXNbaV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbbGlzdFtpXVswXV0gPSBsaXN0W2ldWzFdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIEdlbmVyYXRvciBmdW5jdGlvbiB0byBjcmVhdGUgdGhlIGZpbmRJbmRleCBhbmQgZmluZExhc3RJbmRleCBmdW5jdGlvbnNcbiAgZnVuY3Rpb24gY3JlYXRlUHJlZGljYXRlSW5kZXhGaW5kZXIoZGlyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFycmF5LCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHByZWRpY2F0ZSA9IGNiKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgICB2YXIgbGVuZ3RoID0gZ2V0TGVuZ3RoKGFycmF5KTtcbiAgICAgIHZhciBpbmRleCA9IGRpciA+IDAgPyAwIDogbGVuZ3RoIC0gMTtcbiAgICAgIGZvciAoOyBpbmRleCA+PSAwICYmIGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSBkaXIpIHtcbiAgICAgICAgaWYgKHByZWRpY2F0ZShhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSkpIHJldHVybiBpbmRleDtcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9O1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgZmlyc3QgaW5kZXggb24gYW4gYXJyYXktbGlrZSB0aGF0IHBhc3NlcyBhIHByZWRpY2F0ZSB0ZXN0XG4gIF8uZmluZEluZGV4ID0gY3JlYXRlUHJlZGljYXRlSW5kZXhGaW5kZXIoMSk7XG4gIF8uZmluZExhc3RJbmRleCA9IGNyZWF0ZVByZWRpY2F0ZUluZGV4RmluZGVyKC0xKTtcblxuICAvLyBVc2UgYSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgdGhlIHNtYWxsZXN0IGluZGV4IGF0IHdoaWNoXG4gIC8vIGFuIG9iamVjdCBzaG91bGQgYmUgaW5zZXJ0ZWQgc28gYXMgdG8gbWFpbnRhaW4gb3JkZXIuIFVzZXMgYmluYXJ5IHNlYXJjaC5cbiAgXy5zb3J0ZWRJbmRleCA9IGZ1bmN0aW9uKGFycmF5LCBvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCwgMSk7XG4gICAgdmFyIHZhbHVlID0gaXRlcmF0ZWUob2JqKTtcbiAgICB2YXIgbG93ID0gMCwgaGlnaCA9IGdldExlbmd0aChhcnJheSk7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIHZhciBtaWQgPSBNYXRoLmZsb29yKChsb3cgKyBoaWdoKSAvIDIpO1xuICAgICAgaWYgKGl0ZXJhdGVlKGFycmF5W21pZF0pIDwgdmFsdWUpIGxvdyA9IG1pZCArIDE7IGVsc2UgaGlnaCA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbiAgfTtcblxuICAvLyBHZW5lcmF0b3IgZnVuY3Rpb24gdG8gY3JlYXRlIHRoZSBpbmRleE9mIGFuZCBsYXN0SW5kZXhPZiBmdW5jdGlvbnNcbiAgZnVuY3Rpb24gY3JlYXRlSW5kZXhGaW5kZXIoZGlyLCBwcmVkaWNhdGVGaW5kLCBzb3J0ZWRJbmRleCkge1xuICAgIHJldHVybiBmdW5jdGlvbihhcnJheSwgaXRlbSwgaWR4KSB7XG4gICAgICB2YXIgaSA9IDAsIGxlbmd0aCA9IGdldExlbmd0aChhcnJheSk7XG4gICAgICBpZiAodHlwZW9mIGlkeCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpZiAoZGlyID4gMCkge1xuICAgICAgICAgICAgaSA9IGlkeCA+PSAwID8gaWR4IDogTWF0aC5tYXgoaWR4ICsgbGVuZ3RoLCBpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxlbmd0aCA9IGlkeCA+PSAwID8gTWF0aC5taW4oaWR4ICsgMSwgbGVuZ3RoKSA6IGlkeCArIGxlbmd0aCArIDE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoc29ydGVkSW5kZXggJiYgaWR4ICYmIGxlbmd0aCkge1xuICAgICAgICBpZHggPSBzb3J0ZWRJbmRleChhcnJheSwgaXRlbSk7XG4gICAgICAgIHJldHVybiBhcnJheVtpZHhdID09PSBpdGVtID8gaWR4IDogLTE7XG4gICAgICB9XG4gICAgICBpZiAoaXRlbSAhPT0gaXRlbSkge1xuICAgICAgICBpZHggPSBwcmVkaWNhdGVGaW5kKHNsaWNlLmNhbGwoYXJyYXksIGksIGxlbmd0aCksIF8uaXNOYU4pO1xuICAgICAgICByZXR1cm4gaWR4ID49IDAgPyBpZHggKyBpIDogLTE7XG4gICAgICB9XG4gICAgICBmb3IgKGlkeCA9IGRpciA+IDAgPyBpIDogbGVuZ3RoIC0gMTsgaWR4ID49IDAgJiYgaWR4IDwgbGVuZ3RoOyBpZHggKz0gZGlyKSB7XG4gICAgICAgIGlmIChhcnJheVtpZHhdID09PSBpdGVtKSByZXR1cm4gaWR4O1xuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG4gIH1cblxuICAvLyBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuIGl0ZW0gaW4gYW4gYXJyYXksXG4gIC8vIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBjcmVhdGVJbmRleEZpbmRlcigxLCBfLmZpbmRJbmRleCwgXy5zb3J0ZWRJbmRleCk7XG4gIF8ubGFzdEluZGV4T2YgPSBjcmVhdGVJbmRleEZpbmRlcigtMSwgXy5maW5kTGFzdEluZGV4KTtcblxuICAvLyBHZW5lcmF0ZSBhbiBpbnRlZ2VyIEFycmF5IGNvbnRhaW5pbmcgYW4gYXJpdGhtZXRpYyBwcm9ncmVzc2lvbi4gQSBwb3J0IG9mXG4gIC8vIHRoZSBuYXRpdmUgUHl0aG9uIGByYW5nZSgpYCBmdW5jdGlvbi4gU2VlXG4gIC8vIFt0aGUgUHl0aG9uIGRvY3VtZW50YXRpb25dKGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS9mdW5jdGlvbnMuaHRtbCNyYW5nZSkuXG4gIF8ucmFuZ2UgPSBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuICAgIGlmIChzdG9wID09IG51bGwpIHtcbiAgICAgIHN0b3AgPSBzdGFydCB8fCAwO1xuICAgICAgc3RhcnQgPSAwO1xuICAgIH1cbiAgICBzdGVwID0gc3RlcCB8fCAxO1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcbiAgICB2YXIgcmFuZ2UgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgbGVuZ3RoOyBpZHgrKywgc3RhcnQgKz0gc3RlcCkge1xuICAgICAgcmFuZ2VbaWR4XSA9IHN0YXJ0O1xuICAgIH1cblxuICAgIHJldHVybiByYW5nZTtcbiAgfTtcblxuICAvLyBGdW5jdGlvbiAoYWhlbSkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIERldGVybWluZXMgd2hldGhlciB0byBleGVjdXRlIGEgZnVuY3Rpb24gYXMgYSBjb25zdHJ1Y3RvclxuICAvLyBvciBhIG5vcm1hbCBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBhcmd1bWVudHNcbiAgdmFyIGV4ZWN1dGVCb3VuZCA9IGZ1bmN0aW9uKHNvdXJjZUZ1bmMsIGJvdW5kRnVuYywgY29udGV4dCwgY2FsbGluZ0NvbnRleHQsIGFyZ3MpIHtcbiAgICBpZiAoIShjYWxsaW5nQ29udGV4dCBpbnN0YW5jZW9mIGJvdW5kRnVuYykpIHJldHVybiBzb3VyY2VGdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgIHZhciBzZWxmID0gYmFzZUNyZWF0ZShzb3VyY2VGdW5jLnByb3RvdHlwZSk7XG4gICAgdmFyIHJlc3VsdCA9IHNvdXJjZUZ1bmMuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgaWYgKF8uaXNPYmplY3QocmVzdWx0KSkgcmV0dXJuIHJlc3VsdDtcbiAgICByZXR1cm4gc2VsZjtcbiAgfTtcblxuICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBib3VuZCB0byBhIGdpdmVuIG9iamVjdCAoYXNzaWduaW5nIGB0aGlzYCwgYW5kIGFyZ3VtZW50cyxcbiAgLy8gb3B0aW9uYWxseSkuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBGdW5jdGlvbi5iaW5kYCBpZlxuICAvLyBhdmFpbGFibGUuXG4gIF8uYmluZCA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQpIHtcbiAgICBpZiAobmF0aXZlQmluZCAmJiBmdW5jLmJpbmQgPT09IG5hdGl2ZUJpbmQpIHJldHVybiBuYXRpdmVCaW5kLmFwcGx5KGZ1bmMsIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgaWYgKCFfLmlzRnVuY3Rpb24oZnVuYykpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0JpbmQgbXVzdCBiZSBjYWxsZWQgb24gYSBmdW5jdGlvbicpO1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBib3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4ZWN1dGVCb3VuZChmdW5jLCBib3VuZCwgY29udGV4dCwgdGhpcywgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgfTtcbiAgICByZXR1cm4gYm91bmQ7XG4gIH07XG5cbiAgLy8gUGFydGlhbGx5IGFwcGx5IGEgZnVuY3Rpb24gYnkgY3JlYXRpbmcgYSB2ZXJzaW9uIHRoYXQgaGFzIGhhZCBzb21lIG9mIGl0c1xuICAvLyBhcmd1bWVudHMgcHJlLWZpbGxlZCwgd2l0aG91dCBjaGFuZ2luZyBpdHMgZHluYW1pYyBgdGhpc2AgY29udGV4dC4gXyBhY3RzXG4gIC8vIGFzIGEgcGxhY2Vob2xkZXIsIGFsbG93aW5nIGFueSBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMgdG8gYmUgcHJlLWZpbGxlZC5cbiAgXy5wYXJ0aWFsID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciBib3VuZEFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcG9zaXRpb24gPSAwLCBsZW5ndGggPSBib3VuZEFyZ3MubGVuZ3RoO1xuICAgICAgdmFyIGFyZ3MgPSBBcnJheShsZW5ndGgpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBhcmdzW2ldID0gYm91bmRBcmdzW2ldID09PSBfID8gYXJndW1lbnRzW3Bvc2l0aW9uKytdIDogYm91bmRBcmdzW2ldO1xuICAgICAgfVxuICAgICAgd2hpbGUgKHBvc2l0aW9uIDwgYXJndW1lbnRzLmxlbmd0aCkgYXJncy5wdXNoKGFyZ3VtZW50c1twb3NpdGlvbisrXSk7XG4gICAgICByZXR1cm4gZXhlY3V0ZUJvdW5kKGZ1bmMsIGJvdW5kLCB0aGlzLCB0aGlzLCBhcmdzKTtcbiAgICB9O1xuICAgIHJldHVybiBib3VuZDtcbiAgfTtcblxuICAvLyBCaW5kIGEgbnVtYmVyIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFJlbWFpbmluZyBhcmd1bWVudHNcbiAgLy8gYXJlIHRoZSBtZXRob2QgbmFtZXMgdG8gYmUgYm91bmQuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdCBhbGwgY2FsbGJhY2tzXG4gIC8vIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGksIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsIGtleTtcbiAgICBpZiAobGVuZ3RoIDw9IDEpIHRocm93IG5ldyBFcnJvcignYmluZEFsbCBtdXN0IGJlIHBhc3NlZCBmdW5jdGlvbiBuYW1lcycpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAga2V5ID0gYXJndW1lbnRzW2ldO1xuICAgICAgb2JqW2tleV0gPSBfLmJpbmQob2JqW2tleV0sIG9iaik7XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gTWVtb2l6ZSBhbiBleHBlbnNpdmUgZnVuY3Rpb24gYnkgc3RvcmluZyBpdHMgcmVzdWx0cy5cbiAgXy5tZW1vaXplID0gZnVuY3Rpb24oZnVuYywgaGFzaGVyKSB7XG4gICAgdmFyIG1lbW9pemUgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBjYWNoZSA9IG1lbW9pemUuY2FjaGU7XG4gICAgICB2YXIgYWRkcmVzcyA9ICcnICsgKGhhc2hlciA/IGhhc2hlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDoga2V5KTtcbiAgICAgIGlmICghXy5oYXMoY2FjaGUsIGFkZHJlc3MpKSBjYWNoZVthZGRyZXNzXSA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBjYWNoZVthZGRyZXNzXTtcbiAgICB9O1xuICAgIG1lbW9pemUuY2FjaGUgPSB7fTtcbiAgICByZXR1cm4gbWVtb2l6ZTtcbiAgfTtcblxuICAvLyBEZWxheXMgYSBmdW5jdGlvbiBmb3IgdGhlIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMsIGFuZCB0aGVuIGNhbGxzXG4gIC8vIGl0IHdpdGggdGhlIGFyZ3VtZW50cyBzdXBwbGllZC5cbiAgXy5kZWxheSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfSwgd2FpdCk7XG4gIH07XG5cbiAgLy8gRGVmZXJzIGEgZnVuY3Rpb24sIHNjaGVkdWxpbmcgaXQgdG8gcnVuIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwgc3RhY2sgaGFzXG4gIC8vIGNsZWFyZWQuXG4gIF8uZGVmZXIgPSBfLnBhcnRpYWwoXy5kZWxheSwgXywgMSk7XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCB3aGVuIGludm9rZWQsIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgYXQgbW9zdCBvbmNlXG4gIC8vIGR1cmluZyBhIGdpdmVuIHdpbmRvdyBvZiB0aW1lLiBOb3JtYWxseSwgdGhlIHRocm90dGxlZCBmdW5jdGlvbiB3aWxsIHJ1blxuICAvLyBhcyBtdWNoIGFzIGl0IGNhbiwgd2l0aG91dCBldmVyIGdvaW5nIG1vcmUgdGhhbiBvbmNlIHBlciBgd2FpdGAgZHVyYXRpb247XG4gIC8vIGJ1dCBpZiB5b3UnZCBsaWtlIHRvIGRpc2FibGUgdGhlIGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlLCBwYXNzXG4gIC8vIGB7bGVhZGluZzogZmFsc2V9YC4gVG8gZGlzYWJsZSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2UsIGRpdHRvLlxuICBfLnRocm90dGxlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICAgIHZhciBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG4gICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgIHZhciBwcmV2aW91cyA9IDA7XG4gICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG4gICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBwcmV2aW91cyA9IG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UgPyAwIDogXy5ub3coKTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIGlmICghdGltZW91dCkgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5vdyA9IF8ubm93KCk7XG4gICAgICBpZiAoIXByZXZpb3VzICYmIG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UpIHByZXZpb3VzID0gbm93O1xuICAgICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xuICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQpIHtcbiAgICAgICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGlmICghdGltZW91dCkgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgfSBlbHNlIGlmICghdGltZW91dCAmJiBvcHRpb25zLnRyYWlsaW5nICE9PSBmYWxzZSkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgcmVtYWluaW5nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIGFzIGxvbmcgYXMgaXQgY29udGludWVzIHRvIGJlIGludm9rZWQsIHdpbGwgbm90XG4gIC8vIGJlIHRyaWdnZXJlZC4gVGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZCBmb3JcbiAgLy8gTiBtaWxsaXNlY29uZHMuIElmIGBpbW1lZGlhdGVgIGlzIHBhc3NlZCwgdHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlXG4gIC8vIGxlYWRpbmcgZWRnZSwgaW5zdGVhZCBvZiB0aGUgdHJhaWxpbmcuXG4gIF8uZGVib3VuY2UgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcbiAgICB2YXIgdGltZW91dCwgYXJncywgY29udGV4dCwgdGltZXN0YW1wLCByZXN1bHQ7XG5cbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsYXN0ID0gXy5ub3coKSAtIHRpbWVzdGFtcDtcblxuICAgICAgaWYgKGxhc3QgPCB3YWl0ICYmIGxhc3QgPj0gMCkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIGlmICghaW1tZWRpYXRlKSB7XG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aW1lc3RhbXAgPSBfLm5vdygpO1xuICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBpZiAoIXRpbWVvdXQpIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICAgIGlmIChjYWxsTm93KSB7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIGZpcnN0IGZ1bmN0aW9uIHBhc3NlZCBhcyBhbiBhcmd1bWVudCB0byB0aGUgc2Vjb25kLFxuICAvLyBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGFyZ3VtZW50cywgcnVuIGNvZGUgYmVmb3JlIGFuZCBhZnRlciwgYW5kXG4gIC8vIGNvbmRpdGlvbmFsbHkgZXhlY3V0ZSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24uXG4gIF8ud3JhcCA9IGZ1bmN0aW9uKGZ1bmMsIHdyYXBwZXIpIHtcbiAgICByZXR1cm4gXy5wYXJ0aWFsKHdyYXBwZXIsIGZ1bmMpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBuZWdhdGVkIHZlcnNpb24gb2YgdGhlIHBhc3NlZC1pbiBwcmVkaWNhdGUuXG4gIF8ubmVnYXRlID0gZnVuY3Rpb24ocHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICFwcmVkaWNhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgIHZhciBzdGFydCA9IGFyZ3MubGVuZ3RoIC0gMTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaSA9IHN0YXJ0O1xuICAgICAgdmFyIHJlc3VsdCA9IGFyZ3Nbc3RhcnRdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB3aGlsZSAoaS0tKSByZXN1bHQgPSBhcmdzW2ldLmNhbGwodGhpcywgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgb24gYW5kIGFmdGVyIHRoZSBOdGggY2FsbC5cbiAgXy5hZnRlciA9IGZ1bmN0aW9uKHRpbWVzLCBmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tdGltZXMgPCAxKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgdXAgdG8gKGJ1dCBub3QgaW5jbHVkaW5nKSB0aGUgTnRoIGNhbGwuXG4gIF8uYmVmb3JlID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICB2YXIgbWVtbztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA+IDApIHtcbiAgICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aW1lcyA8PSAxKSBmdW5jID0gbnVsbDtcbiAgICAgIHJldHVybiBtZW1vO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCBhdCBtb3N0IG9uZSB0aW1lLCBubyBtYXR0ZXIgaG93XG4gIC8vIG9mdGVuIHlvdSBjYWxsIGl0LiBVc2VmdWwgZm9yIGxhenkgaW5pdGlhbGl6YXRpb24uXG4gIF8ub25jZSA9IF8ucGFydGlhbChfLmJlZm9yZSwgMik7XG5cbiAgLy8gT2JqZWN0IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gS2V5cyBpbiBJRSA8IDkgdGhhdCB3b24ndCBiZSBpdGVyYXRlZCBieSBgZm9yIGtleSBpbiAuLi5gIGFuZCB0aHVzIG1pc3NlZC5cbiAgdmFyIGhhc0VudW1CdWcgPSAhe3RvU3RyaW5nOiBudWxsfS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgndG9TdHJpbmcnKTtcbiAgdmFyIG5vbkVudW1lcmFibGVQcm9wcyA9IFsndmFsdWVPZicsICdpc1Byb3RvdHlwZU9mJywgJ3RvU3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAncHJvcGVydHlJc0VudW1lcmFibGUnLCAnaGFzT3duUHJvcGVydHknLCAndG9Mb2NhbGVTdHJpbmcnXTtcblxuICBmdW5jdGlvbiBjb2xsZWN0Tm9uRW51bVByb3BzKG9iaiwga2V5cykge1xuICAgIHZhciBub25FbnVtSWR4ID0gbm9uRW51bWVyYWJsZVByb3BzLmxlbmd0aDtcbiAgICB2YXIgY29uc3RydWN0b3IgPSBvYmouY29uc3RydWN0b3I7XG4gICAgdmFyIHByb3RvID0gKF8uaXNGdW5jdGlvbihjb25zdHJ1Y3RvcikgJiYgY29uc3RydWN0b3IucHJvdG90eXBlKSB8fCBPYmpQcm90bztcblxuICAgIC8vIENvbnN0cnVjdG9yIGlzIGEgc3BlY2lhbCBjYXNlLlxuICAgIHZhciBwcm9wID0gJ2NvbnN0cnVjdG9yJztcbiAgICBpZiAoXy5oYXMob2JqLCBwcm9wKSAmJiAhXy5jb250YWlucyhrZXlzLCBwcm9wKSkga2V5cy5wdXNoKHByb3ApO1xuXG4gICAgd2hpbGUgKG5vbkVudW1JZHgtLSkge1xuICAgICAgcHJvcCA9IG5vbkVudW1lcmFibGVQcm9wc1tub25FbnVtSWR4XTtcbiAgICAgIGlmIChwcm9wIGluIG9iaiAmJiBvYmpbcHJvcF0gIT09IHByb3RvW3Byb3BdICYmICFfLmNvbnRhaW5zKGtleXMsIHByb3ApKSB7XG4gICAgICAgIGtleXMucHVzaChwcm9wKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBSZXRyaWV2ZSB0aGUgbmFtZXMgb2YgYW4gb2JqZWN0J3Mgb3duIHByb3BlcnRpZXMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBPYmplY3Qua2V5c2BcbiAgXy5rZXlzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBbXTtcbiAgICBpZiAobmF0aXZlS2V5cykgcmV0dXJuIG5hdGl2ZUtleXMob2JqKTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICAgIC8vIEFoZW0sIElFIDwgOS5cbiAgICBpZiAoaGFzRW51bUJ1ZykgY29sbGVjdE5vbkVudW1Qcm9wcyhvYmosIGtleXMpO1xuICAgIHJldHVybiBrZXlzO1xuICB9O1xuXG4gIC8vIFJldHJpZXZlIGFsbCB0aGUgcHJvcGVydHkgbmFtZXMgb2YgYW4gb2JqZWN0LlxuICBfLmFsbEtleXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIFtdO1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikga2V5cy5wdXNoKGtleSk7XG4gICAgLy8gQWhlbSwgSUUgPCA5LlxuICAgIGlmIChoYXNFbnVtQnVnKSBjb2xsZWN0Tm9uRW51bVByb3BzKG9iaiwga2V5cyk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cbiAgLy8gUmV0cmlldmUgdGhlIHZhbHVlcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICBfLnZhbHVlcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciB2YWx1ZXMgPSBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbHVlc1tpXSA9IG9ialtrZXlzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRlZSB0byBlYWNoIGVsZW1lbnQgb2YgdGhlIG9iamVjdFxuICAvLyBJbiBjb250cmFzdCB0byBfLm1hcCBpdCByZXR1cm5zIGFuIG9iamVjdFxuICBfLm1hcE9iamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9ICBfLmtleXMob2JqKSxcbiAgICAgICAgICBsZW5ndGggPSBrZXlzLmxlbmd0aCxcbiAgICAgICAgICByZXN1bHRzID0ge30sXG4gICAgICAgICAgY3VycmVudEtleTtcbiAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgY3VycmVudEtleSA9IGtleXNbaW5kZXhdO1xuICAgICAgICByZXN1bHRzW2N1cnJlbnRLZXldID0gaXRlcmF0ZWUob2JqW2N1cnJlbnRLZXldLCBjdXJyZW50S2V5LCBvYmopO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gQ29udmVydCBhbiBvYmplY3QgaW50byBhIGxpc3Qgb2YgYFtrZXksIHZhbHVlXWAgcGFpcnMuXG4gIF8ucGFpcnMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgcGFpcnMgPSBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHBhaXJzW2ldID0gW2tleXNbaV0sIG9ialtrZXlzW2ldXV07XG4gICAgfVxuICAgIHJldHVybiBwYWlycztcbiAgfTtcblxuICAvLyBJbnZlcnQgdGhlIGtleXMgYW5kIHZhbHVlcyBvZiBhbiBvYmplY3QuIFRoZSB2YWx1ZXMgbXVzdCBiZSBzZXJpYWxpemFibGUuXG4gIF8uaW52ZXJ0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdFtvYmpba2V5c1tpXV1dID0ga2V5c1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBzb3J0ZWQgbGlzdCBvZiB0aGUgZnVuY3Rpb24gbmFtZXMgYXZhaWxhYmxlIG9uIHRoZSBvYmplY3QuXG4gIC8vIEFsaWFzZWQgYXMgYG1ldGhvZHNgXG4gIF8uZnVuY3Rpb25zID0gXy5tZXRob2RzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIG5hbWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmpba2V5XSkpIG5hbWVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzLnNvcnQoKTtcbiAgfTtcblxuICAvLyBFeHRlbmQgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgaW4gcGFzc2VkLWluIG9iamVjdChzKS5cbiAgXy5leHRlbmQgPSBjcmVhdGVBc3NpZ25lcihfLmFsbEtleXMpO1xuXG4gIC8vIEFzc2lnbnMgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIG93biBwcm9wZXJ0aWVzIGluIHRoZSBwYXNzZWQtaW4gb2JqZWN0KHMpXG4gIC8vIChodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9PYmplY3QvYXNzaWduKVxuICBfLmV4dGVuZE93biA9IF8uYXNzaWduID0gY3JlYXRlQXNzaWduZXIoXy5rZXlzKTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBrZXkgb24gYW4gb2JqZWN0IHRoYXQgcGFzc2VzIGEgcHJlZGljYXRlIHRlc3RcbiAgXy5maW5kS2V5ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBwcmVkaWNhdGUgPSBjYihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaiksIGtleTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAga2V5ID0ga2V5c1tpXTtcbiAgICAgIGlmIChwcmVkaWNhdGUob2JqW2tleV0sIGtleSwgb2JqKSkgcmV0dXJuIGtleTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IG9ubHkgY29udGFpbmluZyB0aGUgd2hpdGVsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5waWNrID0gZnVuY3Rpb24ob2JqZWN0LCBvaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0ID0ge30sIG9iaiA9IG9iamVjdCwgaXRlcmF0ZWUsIGtleXM7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChfLmlzRnVuY3Rpb24ob2l0ZXJhdGVlKSkge1xuICAgICAga2V5cyA9IF8uYWxsS2V5cyhvYmopO1xuICAgICAgaXRlcmF0ZWUgPSBvcHRpbWl6ZUNiKG9pdGVyYXRlZSwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleXMgPSBmbGF0dGVuKGFyZ3VtZW50cywgZmFsc2UsIGZhbHNlLCAxKTtcbiAgICAgIGl0ZXJhdGVlID0gZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqKSB7IHJldHVybiBrZXkgaW4gb2JqOyB9O1xuICAgICAgb2JqID0gT2JqZWN0KG9iaik7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgIHZhciB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgaWYgKGl0ZXJhdGVlKHZhbHVlLCBrZXksIG9iaikpIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCB3aXRob3V0IHRoZSBibGFja2xpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLm9taXQgPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihpdGVyYXRlZSkpIHtcbiAgICAgIGl0ZXJhdGVlID0gXy5uZWdhdGUoaXRlcmF0ZWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIga2V5cyA9IF8ubWFwKGZsYXR0ZW4oYXJndW1lbnRzLCBmYWxzZSwgZmFsc2UsIDEpLCBTdHJpbmcpO1xuICAgICAgaXRlcmF0ZWUgPSBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIHJldHVybiAhXy5jb250YWlucyhrZXlzLCBrZXkpO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIF8ucGljayhvYmosIGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBGaWxsIGluIGEgZ2l2ZW4gb2JqZWN0IHdpdGggZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICBfLmRlZmF1bHRzID0gY3JlYXRlQXNzaWduZXIoXy5hbGxLZXlzLCB0cnVlKTtcblxuICAvLyBDcmVhdGVzIGFuIG9iamVjdCB0aGF0IGluaGVyaXRzIGZyb20gdGhlIGdpdmVuIHByb3RvdHlwZSBvYmplY3QuXG4gIC8vIElmIGFkZGl0aW9uYWwgcHJvcGVydGllcyBhcmUgcHJvdmlkZWQgdGhlbiB0aGV5IHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4gIC8vIGNyZWF0ZWQgb2JqZWN0LlxuICBfLmNyZWF0ZSA9IGZ1bmN0aW9uKHByb3RvdHlwZSwgcHJvcHMpIHtcbiAgICB2YXIgcmVzdWx0ID0gYmFzZUNyZWF0ZShwcm90b3R5cGUpO1xuICAgIGlmIChwcm9wcykgXy5leHRlbmRPd24ocmVzdWx0LCBwcm9wcyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBDcmVhdGUgYSAoc2hhbGxvdy1jbG9uZWQpIGR1cGxpY2F0ZSBvZiBhbiBvYmplY3QuXG4gIF8uY2xvbmUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIG9iajtcbiAgICByZXR1cm4gXy5pc0FycmF5KG9iaikgPyBvYmouc2xpY2UoKSA6IF8uZXh0ZW5kKHt9LCBvYmopO1xuICB9O1xuXG4gIC8vIEludm9rZXMgaW50ZXJjZXB0b3Igd2l0aCB0aGUgb2JqLCBhbmQgdGhlbiByZXR1cm5zIG9iai5cbiAgLy8gVGhlIHByaW1hcnkgcHVycG9zZSBvZiB0aGlzIG1ldGhvZCBpcyB0byBcInRhcCBpbnRvXCIgYSBtZXRob2QgY2hhaW4sIGluXG4gIC8vIG9yZGVyIHRvIHBlcmZvcm0gb3BlcmF0aW9ucyBvbiBpbnRlcm1lZGlhdGUgcmVzdWx0cyB3aXRoaW4gdGhlIGNoYWluLlxuICBfLnRhcCA9IGZ1bmN0aW9uKG9iaiwgaW50ZXJjZXB0b3IpIHtcbiAgICBpbnRlcmNlcHRvcihvYmopO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmV0dXJucyB3aGV0aGVyIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBzZXQgb2YgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8uaXNNYXRjaCA9IGZ1bmN0aW9uKG9iamVjdCwgYXR0cnMpIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhhdHRycyksIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuICFsZW5ndGg7XG4gICAgdmFyIG9iaiA9IE9iamVjdChvYmplY3QpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgaWYgKGF0dHJzW2tleV0gIT09IG9ialtrZXldIHx8ICEoa2V5IGluIG9iaikpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIFtIYXJtb255IGBlZ2FsYCBwcm9wb3NhbF0oaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsKS5cbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT09IDEgLyBiO1xuICAgIC8vIEEgc3RyaWN0IGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5IGJlY2F1c2UgYG51bGwgPT0gdW5kZWZpbmVkYC5cbiAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkgcmV0dXJuIGEgPT09IGI7XG4gICAgLy8gVW53cmFwIGFueSB3cmFwcGVkIG9iamVjdHMuXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBfKSBhID0gYS5fd3JhcHBlZDtcbiAgICBpZiAoYiBpbnN0YW5jZW9mIF8pIGIgPSBiLl93cmFwcGVkO1xuICAgIC8vIENvbXBhcmUgYFtbQ2xhc3NdXWAgbmFtZXMuXG4gICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSk7XG4gICAgaWYgKGNsYXNzTmFtZSAhPT0gdG9TdHJpbmcuY2FsbChiKSkgcmV0dXJuIGZhbHNlO1xuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICAvLyBTdHJpbmdzLCBudW1iZXJzLCByZWd1bGFyIGV4cHJlc3Npb25zLCBkYXRlcywgYW5kIGJvb2xlYW5zIGFyZSBjb21wYXJlZCBieSB2YWx1ZS5cbiAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAvLyBSZWdFeHBzIGFyZSBjb2VyY2VkIHRvIHN0cmluZ3MgZm9yIGNvbXBhcmlzb24gKE5vdGU6ICcnICsgL2EvaSA9PT0gJy9hL2knKVxuICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgICAgLy8gUHJpbWl0aXZlcyBhbmQgdGhlaXIgY29ycmVzcG9uZGluZyBvYmplY3Qgd3JhcHBlcnMgYXJlIGVxdWl2YWxlbnQ7IHRodXMsIGBcIjVcImAgaXNcbiAgICAgICAgLy8gZXF1aXZhbGVudCB0byBgbmV3IFN0cmluZyhcIjVcIilgLlxuICAgICAgICByZXR1cm4gJycgKyBhID09PSAnJyArIGI7XG4gICAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOlxuICAgICAgICAvLyBgTmFOYHMgYXJlIGVxdWl2YWxlbnQsIGJ1dCBub24tcmVmbGV4aXZlLlxuICAgICAgICAvLyBPYmplY3QoTmFOKSBpcyBlcXVpdmFsZW50IHRvIE5hTlxuICAgICAgICBpZiAoK2EgIT09ICthKSByZXR1cm4gK2IgIT09ICtiO1xuICAgICAgICAvLyBBbiBgZWdhbGAgY29tcGFyaXNvbiBpcyBwZXJmb3JtZWQgZm9yIG90aGVyIG51bWVyaWMgdmFsdWVzLlxuICAgICAgICByZXR1cm4gK2EgPT09IDAgPyAxIC8gK2EgPT09IDEgLyBiIDogK2EgPT09ICtiO1xuICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6XG4gICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1lcmljIHByaW1pdGl2ZSB2YWx1ZXMuIERhdGVzIGFyZSBjb21wYXJlZCBieSB0aGVpclxuICAgICAgICAvLyBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnMuIE5vdGUgdGhhdCBpbnZhbGlkIGRhdGVzIHdpdGggbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zXG4gICAgICAgIC8vIG9mIGBOYU5gIGFyZSBub3QgZXF1aXZhbGVudC5cbiAgICAgICAgcmV0dXJuICthID09PSArYjtcbiAgICB9XG5cbiAgICB2YXIgYXJlQXJyYXlzID0gY2xhc3NOYW1lID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIGlmICghYXJlQXJyYXlzKSB7XG4gICAgICBpZiAodHlwZW9mIGEgIT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgIT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcblxuICAgICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzIG9yIGBBcnJheWBzXG4gICAgICAvLyBmcm9tIGRpZmZlcmVudCBmcmFtZXMgYXJlLlxuICAgICAgdmFyIGFDdG9yID0gYS5jb25zdHJ1Y3RvciwgYkN0b3IgPSBiLmNvbnN0cnVjdG9yO1xuICAgICAgaWYgKGFDdG9yICE9PSBiQ3RvciAmJiAhKF8uaXNGdW5jdGlvbihhQ3RvcikgJiYgYUN0b3IgaW5zdGFuY2VvZiBhQ3RvciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uaXNGdW5jdGlvbihiQ3RvcikgJiYgYkN0b3IgaW5zdGFuY2VvZiBiQ3RvcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgKCdjb25zdHJ1Y3RvcicgaW4gYSAmJiAnY29uc3RydWN0b3InIGluIGIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gQXNzdW1lIGVxdWFsaXR5IGZvciBjeWNsaWMgc3RydWN0dXJlcy4gVGhlIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGN5Y2xpY1xuICAgIC8vIHN0cnVjdHVyZXMgaXMgYWRhcHRlZCBmcm9tIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMsIGFic3RyYWN0IG9wZXJhdGlvbiBgSk9gLlxuXG4gICAgLy8gSW5pdGlhbGl6aW5nIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIC8vIEl0J3MgZG9uZSBoZXJlIHNpbmNlIHdlIG9ubHkgbmVlZCB0aGVtIGZvciBvYmplY3RzIGFuZCBhcnJheXMgY29tcGFyaXNvbi5cbiAgICBhU3RhY2sgPSBhU3RhY2sgfHwgW107XG4gICAgYlN0YWNrID0gYlN0YWNrIHx8IFtdO1xuICAgIHZhciBsZW5ndGggPSBhU3RhY2subGVuZ3RoO1xuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgLy8gTGluZWFyIHNlYXJjaC4gUGVyZm9ybWFuY2UgaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mXG4gICAgICAvLyB1bmlxdWUgbmVzdGVkIHN0cnVjdHVyZXMuXG4gICAgICBpZiAoYVN0YWNrW2xlbmd0aF0gPT09IGEpIHJldHVybiBiU3RhY2tbbGVuZ3RoXSA9PT0gYjtcbiAgICB9XG5cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG5cbiAgICAvLyBSZWN1cnNpdmVseSBjb21wYXJlIG9iamVjdHMgYW5kIGFycmF5cy5cbiAgICBpZiAoYXJlQXJyYXlzKSB7XG4gICAgICAvLyBDb21wYXJlIGFycmF5IGxlbmd0aHMgdG8gZGV0ZXJtaW5lIGlmIGEgZGVlcCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeS5cbiAgICAgIGxlbmd0aCA9IGEubGVuZ3RoO1xuICAgICAgaWYgKGxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgIC8vIERlZXAgY29tcGFyZSB0aGUgY29udGVudHMsIGlnbm9yaW5nIG5vbi1udW1lcmljIHByb3BlcnRpZXMuXG4gICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgaWYgKCFlcShhW2xlbmd0aF0sIGJbbGVuZ3RoXSwgYVN0YWNrLCBiU3RhY2spKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIERlZXAgY29tcGFyZSBvYmplY3RzLlxuICAgICAgdmFyIGtleXMgPSBfLmtleXMoYSksIGtleTtcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgICAgLy8gRW5zdXJlIHRoYXQgYm90aCBvYmplY3RzIGNvbnRhaW4gdGhlIHNhbWUgbnVtYmVyIG9mIHByb3BlcnRpZXMgYmVmb3JlIGNvbXBhcmluZyBkZWVwIGVxdWFsaXR5LlxuICAgICAgaWYgKF8ua2V5cyhiKS5sZW5ndGggIT09IGxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIC8vIERlZXAgY29tcGFyZSBlYWNoIG1lbWJlclxuICAgICAgICBrZXkgPSBrZXlzW2xlbmd0aF07XG4gICAgICAgIGlmICghKF8uaGFzKGIsIGtleSkgJiYgZXEoYVtrZXldLCBiW2tleV0sIGFTdGFjaywgYlN0YWNrKSkpIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVtb3ZlIHRoZSBmaXJzdCBvYmplY3QgZnJvbSB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnBvcCgpO1xuICAgIGJTdGFjay5wb3AoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBQZXJmb3JtIGEgZGVlcCBjb21wYXJpc29uIHRvIGNoZWNrIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbC5cbiAgXy5pc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBlcShhLCBiKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIGFycmF5LCBzdHJpbmcsIG9yIG9iamVjdCBlbXB0eT9cbiAgLy8gQW4gXCJlbXB0eVwiIG9iamVjdCBoYXMgbm8gZW51bWVyYWJsZSBvd24tcHJvcGVydGllcy5cbiAgXy5pc0VtcHR5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoaXNBcnJheUxpa2Uob2JqKSAmJiAoXy5pc0FycmF5KG9iaikgfHwgXy5pc1N0cmluZyhvYmopIHx8IF8uaXNBcmd1bWVudHMob2JqKSkpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIHJldHVybiBfLmtleXMob2JqKS5sZW5ndGggPT09IDA7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIERPTSBlbGVtZW50P1xuICBfLmlzRWxlbWVudCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiAhIShvYmogJiYgb2JqLm5vZGVUeXBlID09PSAxKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGFuIGFycmF5P1xuICAvLyBEZWxlZ2F0ZXMgdG8gRUNNQTUncyBuYXRpdmUgQXJyYXkuaXNBcnJheVxuICBfLmlzQXJyYXkgPSBuYXRpdmVJc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSBhbiBvYmplY3Q/XG4gIF8uaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBvYmo7XG4gICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgdHlwZSA9PT0gJ29iamVjdCcgJiYgISFvYmo7XG4gIH07XG5cbiAgLy8gQWRkIHNvbWUgaXNUeXBlIG1ldGhvZHM6IGlzQXJndW1lbnRzLCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAsIGlzRXJyb3IuXG4gIF8uZWFjaChbJ0FyZ3VtZW50cycsICdGdW5jdGlvbicsICdTdHJpbmcnLCAnTnVtYmVyJywgJ0RhdGUnLCAnUmVnRXhwJywgJ0Vycm9yJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBfWydpcycgKyBuYW1lXSA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRGVmaW5lIGEgZmFsbGJhY2sgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIGluIGJyb3dzZXJzIChhaGVtLCBJRSA8IDkpLCB3aGVyZVxuICAvLyB0aGVyZSBpc24ndCBhbnkgaW5zcGVjdGFibGUgXCJBcmd1bWVudHNcIiB0eXBlLlxuICBpZiAoIV8uaXNBcmd1bWVudHMoYXJndW1lbnRzKSkge1xuICAgIF8uaXNBcmd1bWVudHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICdjYWxsZWUnKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gT3B0aW1pemUgYGlzRnVuY3Rpb25gIGlmIGFwcHJvcHJpYXRlLiBXb3JrIGFyb3VuZCBzb21lIHR5cGVvZiBidWdzIGluIG9sZCB2OCxcbiAgLy8gSUUgMTEgKCMxNjIxKSwgYW5kIGluIFNhZmFyaSA4ICgjMTkyOSkuXG4gIGlmICh0eXBlb2YgLy4vICE9ICdmdW5jdGlvbicgJiYgdHlwZW9mIEludDhBcnJheSAhPSAnb2JqZWN0Jykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT0gJ2Z1bmN0aW9uJyB8fCBmYWxzZTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXMgYSBnaXZlbiBvYmplY3QgYSBmaW5pdGUgbnVtYmVyP1xuICBfLmlzRmluaXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIGlzRmluaXRlKG9iaikgJiYgIWlzTmFOKHBhcnNlRmxvYXQob2JqKSk7XG4gIH07XG5cbiAgLy8gSXMgdGhlIGdpdmVuIHZhbHVlIGBOYU5gPyAoTmFOIGlzIHRoZSBvbmx5IG51bWJlciB3aGljaCBkb2VzIG5vdCBlcXVhbCBpdHNlbGYpLlxuICBfLmlzTmFOID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8uaXNOdW1iZXIob2JqKSAmJiBvYmogIT09ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgZXF1YWwgdG8gbnVsbD9cbiAgXy5pc051bGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBudWxsO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgdW5kZWZpbmVkP1xuICBfLmlzVW5kZWZpbmVkID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xuICB9O1xuXG4gIC8vIFNob3J0Y3V0IGZ1bmN0aW9uIGZvciBjaGVja2luZyBpZiBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gcHJvcGVydHkgZGlyZWN0bHlcbiAgLy8gb24gaXRzZWxmIChpbiBvdGhlciB3b3Jkcywgbm90IG9uIGEgcHJvdG90eXBlKS5cbiAgXy5oYXMgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgfTtcblxuICAvLyBVdGlsaXR5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJ1biBVbmRlcnNjb3JlLmpzIGluICpub0NvbmZsaWN0KiBtb2RlLCByZXR1cm5pbmcgdGhlIGBfYCB2YXJpYWJsZSB0byBpdHNcbiAgLy8gcHJldmlvdXMgb3duZXIuIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICByb290Ll8gPSBwcmV2aW91c1VuZGVyc2NvcmU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gS2VlcCB0aGUgaWRlbnRpdHkgZnVuY3Rpb24gYXJvdW5kIGZvciBkZWZhdWx0IGl0ZXJhdGVlcy5cbiAgXy5pZGVudGl0eSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIC8vIFByZWRpY2F0ZS1nZW5lcmF0aW5nIGZ1bmN0aW9ucy4gT2Z0ZW4gdXNlZnVsIG91dHNpZGUgb2YgVW5kZXJzY29yZS5cbiAgXy5jb25zdGFudCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG4gIH07XG5cbiAgXy5ub29wID0gZnVuY3Rpb24oKXt9O1xuXG4gIF8ucHJvcGVydHkgPSBwcm9wZXJ0eTtcblxuICAvLyBHZW5lcmF0ZXMgYSBmdW5jdGlvbiBmb3IgYSBnaXZlbiBvYmplY3QgdGhhdCByZXR1cm5zIGEgZ2l2ZW4gcHJvcGVydHkuXG4gIF8ucHJvcGVydHlPZiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT0gbnVsbCA/IGZ1bmN0aW9uKCl7fSA6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIG9ialtrZXldO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIHByZWRpY2F0ZSBmb3IgY2hlY2tpbmcgd2hldGhlciBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gc2V0IG9mXG4gIC8vIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLm1hdGNoZXIgPSBfLm1hdGNoZXMgPSBmdW5jdGlvbihhdHRycykge1xuICAgIGF0dHJzID0gXy5leHRlbmRPd24oe30sIGF0dHJzKTtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gXy5pc01hdGNoKG9iaiwgYXR0cnMpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KE1hdGgubWF4KDAsIG4pKTtcbiAgICBpdGVyYXRlZSA9IG9wdGltaXplQ2IoaXRlcmF0ZWUsIGNvbnRleHQsIDEpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSBhY2N1bVtpXSA9IGl0ZXJhdGVlKGkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiBhbmQgbWF4IChpbmNsdXNpdmUpLlxuICBfLnJhbmRvbSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PSBudWxsKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbWluICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKTtcbiAgfTtcblxuICAvLyBBIChwb3NzaWJseSBmYXN0ZXIpIHdheSB0byBnZXQgdGhlIGN1cnJlbnQgdGltZXN0YW1wIGFzIGFuIGludGVnZXIuXG4gIF8ubm93ID0gRGF0ZS5ub3cgfHwgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICB9O1xuXG4gICAvLyBMaXN0IG9mIEhUTUwgZW50aXRpZXMgZm9yIGVzY2FwaW5nLlxuICB2YXIgZXNjYXBlTWFwID0ge1xuICAgICcmJzogJyZhbXA7JyxcbiAgICAnPCc6ICcmbHQ7JyxcbiAgICAnPic6ICcmZ3Q7JyxcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjeDI3OycsXG4gICAgJ2AnOiAnJiN4NjA7J1xuICB9O1xuICB2YXIgdW5lc2NhcGVNYXAgPSBfLmludmVydChlc2NhcGVNYXApO1xuXG4gIC8vIEZ1bmN0aW9ucyBmb3IgZXNjYXBpbmcgYW5kIHVuZXNjYXBpbmcgc3RyaW5ncyB0by9mcm9tIEhUTUwgaW50ZXJwb2xhdGlvbi5cbiAgdmFyIGNyZWF0ZUVzY2FwZXIgPSBmdW5jdGlvbihtYXApIHtcbiAgICB2YXIgZXNjYXBlciA9IGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICByZXR1cm4gbWFwW21hdGNoXTtcbiAgICB9O1xuICAgIC8vIFJlZ2V4ZXMgZm9yIGlkZW50aWZ5aW5nIGEga2V5IHRoYXQgbmVlZHMgdG8gYmUgZXNjYXBlZFxuICAgIHZhciBzb3VyY2UgPSAnKD86JyArIF8ua2V5cyhtYXApLmpvaW4oJ3wnKSArICcpJztcbiAgICB2YXIgdGVzdFJlZ2V4cCA9IFJlZ0V4cChzb3VyY2UpO1xuICAgIHZhciByZXBsYWNlUmVnZXhwID0gUmVnRXhwKHNvdXJjZSwgJ2cnKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICBzdHJpbmcgPSBzdHJpbmcgPT0gbnVsbCA/ICcnIDogJycgKyBzdHJpbmc7XG4gICAgICByZXR1cm4gdGVzdFJlZ2V4cC50ZXN0KHN0cmluZykgPyBzdHJpbmcucmVwbGFjZShyZXBsYWNlUmVnZXhwLCBlc2NhcGVyKSA6IHN0cmluZztcbiAgICB9O1xuICB9O1xuICBfLmVzY2FwZSA9IGNyZWF0ZUVzY2FwZXIoZXNjYXBlTWFwKTtcbiAgXy51bmVzY2FwZSA9IGNyZWF0ZUVzY2FwZXIodW5lc2NhcGVNYXApO1xuXG4gIC8vIElmIHRoZSB2YWx1ZSBvZiB0aGUgbmFtZWQgYHByb3BlcnR5YCBpcyBhIGZ1bmN0aW9uIHRoZW4gaW52b2tlIGl0IHdpdGggdGhlXG4gIC8vIGBvYmplY3RgIGFzIGNvbnRleHQ7IG90aGVyd2lzZSwgcmV0dXJuIGl0LlxuICBfLnJlc3VsdCA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHksIGZhbGxiYWNrKSB7XG4gICAgdmFyIHZhbHVlID0gb2JqZWN0ID09IG51bGwgPyB2b2lkIDAgOiBvYmplY3RbcHJvcGVydHldO1xuICAgIGlmICh2YWx1ZSA9PT0gdm9pZCAwKSB7XG4gICAgICB2YWx1ZSA9IGZhbGxiYWNrO1xuICAgIH1cbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlLmNhbGwob2JqZWN0KSA6IHZhbHVlO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGEgdW5pcXVlIGludGVnZXIgaWQgKHVuaXF1ZSB3aXRoaW4gdGhlIGVudGlyZSBjbGllbnQgc2Vzc2lvbikuXG4gIC8vIFVzZWZ1bCBmb3IgdGVtcG9yYXJ5IERPTSBpZHMuXG4gIHZhciBpZENvdW50ZXIgPSAwO1xuICBfLnVuaXF1ZUlkID0gZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgdmFyIGlkID0gKytpZENvdW50ZXIgKyAnJztcbiAgICByZXR1cm4gcHJlZml4ID8gcHJlZml4ICsgaWQgOiBpZDtcbiAgfTtcblxuICAvLyBCeSBkZWZhdWx0LCBVbmRlcnNjb3JlIHVzZXMgRVJCLXN0eWxlIHRlbXBsYXRlIGRlbGltaXRlcnMsIGNoYW5nZSB0aGVcbiAgLy8gZm9sbG93aW5nIHRlbXBsYXRlIHNldHRpbmdzIHRvIHVzZSBhbHRlcm5hdGl2ZSBkZWxpbWl0ZXJzLlxuICBfLnRlbXBsYXRlU2V0dGluZ3MgPSB7XG4gICAgZXZhbHVhdGUgICAgOiAvPCUoW1xcc1xcU10rPyklPi9nLFxuICAgIGludGVycG9sYXRlIDogLzwlPShbXFxzXFxTXSs/KSU+L2csXG4gICAgZXNjYXBlICAgICAgOiAvPCUtKFtcXHNcXFNdKz8pJT4vZ1xuICB9O1xuXG4gIC8vIFdoZW4gY3VzdG9taXppbmcgYHRlbXBsYXRlU2V0dGluZ3NgLCBpZiB5b3UgZG9uJ3Qgd2FudCB0byBkZWZpbmUgYW5cbiAgLy8gaW50ZXJwb2xhdGlvbiwgZXZhbHVhdGlvbiBvciBlc2NhcGluZyByZWdleCwgd2UgbmVlZCBvbmUgdGhhdCBpc1xuICAvLyBndWFyYW50ZWVkIG5vdCB0byBtYXRjaC5cbiAgdmFyIG5vTWF0Y2ggPSAvKC4pXi87XG5cbiAgLy8gQ2VydGFpbiBjaGFyYWN0ZXJzIG5lZWQgdG8gYmUgZXNjYXBlZCBzbyB0aGF0IHRoZXkgY2FuIGJlIHB1dCBpbnRvIGFcbiAgLy8gc3RyaW5nIGxpdGVyYWwuXG4gIHZhciBlc2NhcGVzID0ge1xuICAgIFwiJ1wiOiAgICAgIFwiJ1wiLFxuICAgICdcXFxcJzogICAgICdcXFxcJyxcbiAgICAnXFxyJzogICAgICdyJyxcbiAgICAnXFxuJzogICAgICduJyxcbiAgICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICAgJ1xcdTIwMjknOiAndTIwMjknXG4gIH07XG5cbiAgdmFyIGVzY2FwZXIgPSAvXFxcXHwnfFxccnxcXG58XFx1MjAyOHxcXHUyMDI5L2c7XG5cbiAgdmFyIGVzY2FwZUNoYXIgPSBmdW5jdGlvbihtYXRjaCkge1xuICAgIHJldHVybiAnXFxcXCcgKyBlc2NhcGVzW21hdGNoXTtcbiAgfTtcblxuICAvLyBKYXZhU2NyaXB0IG1pY3JvLXRlbXBsYXRpbmcsIHNpbWlsYXIgdG8gSm9obiBSZXNpZydzIGltcGxlbWVudGF0aW9uLlxuICAvLyBVbmRlcnNjb3JlIHRlbXBsYXRpbmcgaGFuZGxlcyBhcmJpdHJhcnkgZGVsaW1pdGVycywgcHJlc2VydmVzIHdoaXRlc3BhY2UsXG4gIC8vIGFuZCBjb3JyZWN0bHkgZXNjYXBlcyBxdW90ZXMgd2l0aGluIGludGVycG9sYXRlZCBjb2RlLlxuICAvLyBOQjogYG9sZFNldHRpbmdzYCBvbmx5IGV4aXN0cyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gIF8udGVtcGxhdGUgPSBmdW5jdGlvbih0ZXh0LCBzZXR0aW5ncywgb2xkU2V0dGluZ3MpIHtcbiAgICBpZiAoIXNldHRpbmdzICYmIG9sZFNldHRpbmdzKSBzZXR0aW5ncyA9IG9sZFNldHRpbmdzO1xuICAgIHNldHRpbmdzID0gXy5kZWZhdWx0cyh7fSwgc2V0dGluZ3MsIF8udGVtcGxhdGVTZXR0aW5ncyk7XG5cbiAgICAvLyBDb21iaW5lIGRlbGltaXRlcnMgaW50byBvbmUgcmVndWxhciBleHByZXNzaW9uIHZpYSBhbHRlcm5hdGlvbi5cbiAgICB2YXIgbWF0Y2hlciA9IFJlZ0V4cChbXG4gICAgICAoc2V0dGluZ3MuZXNjYXBlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5pbnRlcnBvbGF0ZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuZXZhbHVhdGUgfHwgbm9NYXRjaCkuc291cmNlXG4gICAgXS5qb2luKCd8JykgKyAnfCQnLCAnZycpO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgdGVtcGxhdGUgc291cmNlLCBlc2NhcGluZyBzdHJpbmcgbGl0ZXJhbHMgYXBwcm9wcmlhdGVseS5cbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzb3VyY2UgPSBcIl9fcCs9J1wiO1xuICAgIHRleHQucmVwbGFjZShtYXRjaGVyLCBmdW5jdGlvbihtYXRjaCwgZXNjYXBlLCBpbnRlcnBvbGF0ZSwgZXZhbHVhdGUsIG9mZnNldCkge1xuICAgICAgc291cmNlICs9IHRleHQuc2xpY2UoaW5kZXgsIG9mZnNldCkucmVwbGFjZShlc2NhcGVyLCBlc2NhcGVDaGFyKTtcbiAgICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuXG4gICAgICBpZiAoZXNjYXBlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgZXNjYXBlICsgXCIpKT09bnVsbD8nJzpfLmVzY2FwZShfX3QpKStcXG4nXCI7XG4gICAgICB9IGVsc2UgaWYgKGludGVycG9sYXRlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgaW50ZXJwb2xhdGUgKyBcIikpPT1udWxsPycnOl9fdCkrXFxuJ1wiO1xuICAgICAgfSBlbHNlIGlmIChldmFsdWF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInO1xcblwiICsgZXZhbHVhdGUgKyBcIlxcbl9fcCs9J1wiO1xuICAgICAgfVxuXG4gICAgICAvLyBBZG9iZSBWTXMgbmVlZCB0aGUgbWF0Y2ggcmV0dXJuZWQgdG8gcHJvZHVjZSB0aGUgY29ycmVjdCBvZmZlc3QuXG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG4gICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgIC8vIElmIGEgdmFyaWFibGUgaXMgbm90IHNwZWNpZmllZCwgcGxhY2UgZGF0YSB2YWx1ZXMgaW4gbG9jYWwgc2NvcGUuXG4gICAgaWYgKCFzZXR0aW5ncy52YXJpYWJsZSkgc291cmNlID0gJ3dpdGgob2JqfHx7fSl7XFxuJyArIHNvdXJjZSArICd9XFxuJztcblxuICAgIHNvdXJjZSA9IFwidmFyIF9fdCxfX3A9JycsX19qPUFycmF5LnByb3RvdHlwZS5qb2luLFwiICtcbiAgICAgIFwicHJpbnQ9ZnVuY3Rpb24oKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyk7fTtcXG5cIiArXG4gICAgICBzb3VyY2UgKyAncmV0dXJuIF9fcDtcXG4nO1xuXG4gICAgdHJ5IHtcbiAgICAgIHZhciByZW5kZXIgPSBuZXcgRnVuY3Rpb24oc2V0dGluZ3MudmFyaWFibGUgfHwgJ29iaicsICdfJywgc291cmNlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgdmFyIHRlbXBsYXRlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIHJlbmRlci5jYWxsKHRoaXMsIGRhdGEsIF8pO1xuICAgIH07XG5cbiAgICAvLyBQcm92aWRlIHRoZSBjb21waWxlZCBzb3VyY2UgYXMgYSBjb252ZW5pZW5jZSBmb3IgcHJlY29tcGlsYXRpb24uXG4gICAgdmFyIGFyZ3VtZW50ID0gc2V0dGluZ3MudmFyaWFibGUgfHwgJ29iaic7XG4gICAgdGVtcGxhdGUuc291cmNlID0gJ2Z1bmN0aW9uKCcgKyBhcmd1bWVudCArICcpe1xcbicgKyBzb3VyY2UgKyAnfSc7XG5cbiAgICByZXR1cm4gdGVtcGxhdGU7XG4gIH07XG5cbiAgLy8gQWRkIGEgXCJjaGFpblwiIGZ1bmN0aW9uLiBTdGFydCBjaGFpbmluZyBhIHdyYXBwZWQgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8uY2hhaW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgaW5zdGFuY2UgPSBfKG9iaik7XG4gICAgaW5zdGFuY2UuX2NoYWluID0gdHJ1ZTtcbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH07XG5cbiAgLy8gT09QXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuICAvLyBJZiBVbmRlcnNjb3JlIGlzIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLCBpdCByZXR1cm5zIGEgd3JhcHBlZCBvYmplY3QgdGhhdFxuICAvLyBjYW4gYmUgdXNlZCBPTy1zdHlsZS4gVGhpcyB3cmFwcGVyIGhvbGRzIGFsdGVyZWQgdmVyc2lvbnMgb2YgYWxsIHRoZVxuICAvLyB1bmRlcnNjb3JlIGZ1bmN0aW9ucy4gV3JhcHBlZCBvYmplY3RzIG1heSBiZSBjaGFpbmVkLlxuXG4gIC8vIEhlbHBlciBmdW5jdGlvbiB0byBjb250aW51ZSBjaGFpbmluZyBpbnRlcm1lZGlhdGUgcmVzdWx0cy5cbiAgdmFyIHJlc3VsdCA9IGZ1bmN0aW9uKGluc3RhbmNlLCBvYmopIHtcbiAgICByZXR1cm4gaW5zdGFuY2UuX2NoYWluID8gXyhvYmopLmNoYWluKCkgOiBvYmo7XG4gIH07XG5cbiAgLy8gQWRkIHlvdXIgb3duIGN1c3RvbSBmdW5jdGlvbnMgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm1peGluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgXy5lYWNoKF8uZnVuY3Rpb25zKG9iaiksIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBmdW5jID0gX1tuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3RoaXMuX3dyYXBwZWRdO1xuICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQodGhpcywgZnVuYy5hcHBseShfLCBhcmdzKSk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEFkZCBhbGwgb2YgdGhlIFVuZGVyc2NvcmUgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyIG9iamVjdC5cbiAgXy5taXhpbihfKTtcblxuICAvLyBBZGQgYWxsIG11dGF0b3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBfLmVhY2goWydwb3AnLCAncHVzaCcsICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3Vuc2hpZnQnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0gdGhpcy5fd3JhcHBlZDtcbiAgICAgIG1ldGhvZC5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoKG5hbWUgPT09ICdzaGlmdCcgfHwgbmFtZSA9PT0gJ3NwbGljZScpICYmIG9iai5sZW5ndGggPT09IDApIGRlbGV0ZSBvYmpbMF07XG4gICAgICByZXR1cm4gcmVzdWx0KHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIF8uZWFjaChbJ2NvbmNhdCcsICdqb2luJywgJ3NsaWNlJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJlc3VsdCh0aGlzLCBtZXRob2QuYXBwbHkodGhpcy5fd3JhcHBlZCwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRXh0cmFjdHMgdGhlIHJlc3VsdCBmcm9tIGEgd3JhcHBlZCBhbmQgY2hhaW5lZCBvYmplY3QuXG4gIF8ucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3dyYXBwZWQ7XG4gIH07XG5cbiAgLy8gUHJvdmlkZSB1bndyYXBwaW5nIHByb3h5IGZvciBzb21lIG1ldGhvZHMgdXNlZCBpbiBlbmdpbmUgb3BlcmF0aW9uc1xuICAvLyBzdWNoIGFzIGFyaXRobWV0aWMgYW5kIEpTT04gc3RyaW5naWZpY2F0aW9uLlxuICBfLnByb3RvdHlwZS52YWx1ZU9mID0gXy5wcm90b3R5cGUudG9KU09OID0gXy5wcm90b3R5cGUudmFsdWU7XG5cbiAgXy5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJycgKyB0aGlzLl93cmFwcGVkO1xuICB9O1xuXG4gIC8vIEFNRCByZWdpc3RyYXRpb24gaGFwcGVucyBhdCB0aGUgZW5kIGZvciBjb21wYXRpYmlsaXR5IHdpdGggQU1EIGxvYWRlcnNcbiAgLy8gdGhhdCBtYXkgbm90IGVuZm9yY2UgbmV4dC10dXJuIHNlbWFudGljcyBvbiBtb2R1bGVzLiBFdmVuIHRob3VnaCBnZW5lcmFsXG4gIC8vIHByYWN0aWNlIGZvciBBTUQgcmVnaXN0cmF0aW9uIGlzIHRvIGJlIGFub255bW91cywgdW5kZXJzY29yZSByZWdpc3RlcnNcbiAgLy8gYXMgYSBuYW1lZCBtb2R1bGUgYmVjYXVzZSwgbGlrZSBqUXVlcnksIGl0IGlzIGEgYmFzZSBsaWJyYXJ5IHRoYXQgaXNcbiAgLy8gcG9wdWxhciBlbm91Z2ggdG8gYmUgYnVuZGxlZCBpbiBhIHRoaXJkIHBhcnR5IGxpYiwgYnV0IG5vdCBiZSBwYXJ0IG9mXG4gIC8vIGFuIEFNRCBsb2FkIHJlcXVlc3QuIFRob3NlIGNhc2VzIGNvdWxkIGdlbmVyYXRlIGFuIGVycm9yIHdoZW4gYW5cbiAgLy8gYW5vbnltb3VzIGRlZmluZSgpIGlzIGNhbGxlZCBvdXRzaWRlIG9mIGEgbG9hZGVyIHJlcXVlc3QuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ3VuZGVyc2NvcmUnLCBbXSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gXztcbiAgICB9KTtcbiAgfVxufS5jYWxsKHRoaXMpKTtcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsImltcG9ydCBDYXJ0byBmcm9tICdjYXJ0byc7XG5cbmNvbnN0IFNZTUJPTFlaRVJTID0ge1xuICBtYXJrZXI6ICdwb2ludHMnLFxuICBwb2x5Z29uOiAncG9seWdvbnMnLFxuICBsaW5lOiAnbGluZXMnXG59O1xuXG5jb25zdCBUWVBFUyA9IHtcbiAgcG9seWdvbjoge1xuICAgIGNvbG9yOiAnZmlsbCdcbiAgfSxcbiAgbGluZToge1xuICAgIGNvbG9yOiAnY29sb3InXG4gIH0sXG4gIG1hcmtlcjoge1xuICAgIGNvbG9yOiAnY29sb3InXG4gIH1cbn07XG5cbmNvbnN0IENDU1MgPSBuZXcgQ2FydG8uUmVuZGVyZXJKUygpO1xuXG5jb25zdCB0cmFuc2xhdGVTeW1OYW1lID0gZnVuY3Rpb24gKHN5bU5hbWUpIHtcbiAgcmV0dXJuIFNZTUJPTFlaRVJTW3N5bU5hbWVdO1xufTtcblxuY29uc3QgZ2V0QXR0cmlidXRlTmFtZSA9IGZ1bmN0aW9uIChzeW0sIGZlYXR1cmUpIHtcbiAgcmV0dXJuIHN5bSArICctJyArIGZlYXR1cmU7XG59O1xuXG5jb25zdCBhZGRGdW5jdGlvbiA9IGZ1bmN0aW9uIChpbm5lckNvZGUpIHtcbiAgcmV0dXJuIGBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIF92YWx1ZSA9IG51bGw7XG4gICAgJHtpbm5lckNvZGV9XG4gICAgcmV0dXJuIF92YWx1ZTtcbiAgfWA7XG59O1xuXG5jb25zdCBtYWtlVGFuZ3JhbUNvbmQgPSBmdW5jdGlvbiAoY29uZCkge1xuICByZXR1cm4gY29uZFxuICAgIC5yZXBsYWNlKC9jdHguem9vbS9nLCAnJHpvb20nKVxuICAgIC5yZXBsYWNlKC9kYXRhXFxbL2csICdmZWF0dXJlWycpO1xufTtcblxuY29uc3Qgc3RyaW5nRnVuY3Rpb24gPSBmdW5jdGlvbiAoZm4sIGRlZiwgLi4uYXJncykge1xuICBpZiAoIWZuKSByZXR1cm4gZnVuY3Rpb24gKCkge3JldHVybiBkZWY7fTtcblxuICBmbiA9IGByZXR1cm4gKCR7Zm59KCkpO2A7XG5cbiAgcmV0dXJuIG5ldyBGdW5jdGlvbiguLi5hcmdzLCBmbik7XG59O1xuXG5jb25zdCBnZXRQcm9wZXJ0eU5hbWUgPSBmdW5jdGlvbiAocHJvcCwgdHlwZSkge1xuICByZXR1cm4gVFlQRVNbcHJvcF1bdHlwZV07XG59O1xuXG5jb25zdCBnZXRBdHRyaWJ1dGVGZWF0dXJlID0gZnVuY3Rpb24gKHN5bSwgZmVhdHVyZSwgbHkpIHtcbiAgbGV0IGF0dHIgPSBseVtnZXRBdHRyaWJ1dGVOYW1lKHN5bSwgZmVhdHVyZSldO1xuICBpZiAoIWF0dHIpIHJldHVybiAnJztcblxuICBsZXQganMgPSBhdHRyLmpzLFxuICAgICAgZm5Cb2R5ID0gJyc7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBqcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Zm5Cb2R5ICs9IG1ha2VUYW5ncmFtQ29uZChqc1tpXSk7XG4gIH1cblxuICByZXR1cm4gYWRkRnVuY3Rpb24oZm5Cb2R5KTtcbn07XG5cbmNvbnN0IGdldFN5bWJvbGl6ZXJzID0gZnVuY3Rpb24gKGxheWVyKSB7XG4gIGxldCBkcmF3ID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGF5ZXIuc3ltYm9saXplcnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCBzeW0gPSBsYXllci5zeW1ib2xpemVyc1tpXTtcblx0XHRcdGRyYXdbdHJhbnNsYXRlU3ltTmFtZShzeW0pXSA9IHtcblx0XHRcdFx0XHRjb2xvcjogZ2V0QXR0cmlidXRlRmVhdHVyZShzeW0sIGdldFByb3BlcnR5TmFtZShzeW0sICdjb2xvcicpLCBsYXllciksXG5cdFx0XHRcdFx0c2l6ZTogZ2V0QXR0cmlidXRlRmVhdHVyZShzeW0sICdzaXplJywgbGF5ZXIpLFxuXHRcdFx0XHRcdHdpZHRoOiBzdHJpbmdGdW5jdGlvbihnZXRBdHRyaWJ1dGVGZWF0dXJlKHN5bSwgJ3dpZHRoJywgbGF5ZXIpLCAnJywgJ2ZlYXR1cmUnLCAnJHpvb20nKSh7fSwgMTApICsgJ3B4J1xuXHRcdFx0fTtcbiAgfVxuXG4gIHJldHVybiBkcmF3O1xufTtcblxuY29uc3QgZXh0cmFjdEZlYXR1cmVzID0gZnVuY3Rpb24gKGNjc3MpIHtcbiAgbGV0IGxheWVycyA9IENDU1MucmVuZGVyKGNjc3MpLmdldExheWVycygpLFxuICAgICAgZHJhd3MgPSB7fTtcblxuICAvLyBOT1RFOiB0aGlzIGlzIHdyb25nLCB3ZSBoYXZlIHRvIHNlcGFyYXRlIHRoZSBsYXllcnMuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsZXQgbHkgPSBsYXllcnNbaV0uc2hhZGVyO1xuXG5cdFx0XHRkcmF3cyA9IGdldFN5bWJvbGl6ZXJzKGx5KTtcbiAgfVxuXG4gIHJldHVybiBkcmF3cztcbn07XG5cbnZhciBDMlk7XG5cbmV4cG9ydCBkZWZhdWx0IEMyWSA9IHtcbiAgZXh0cmFjdEZlYXR1cmVzXG59O1xuIiwiaW1wb3J0IENDU1MgZnJvbSAnLi9jYXJ0byc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjYXJ0bzJEcmF3OiBDQ1NTLmV4dHJhY3RGZWF0dXJlcyxcblx0fTtcbiJdfQ==
