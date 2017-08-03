const ramda = require('ramda');
const curry = ramda.curry;
const compose = ramda.compose;
const replace = ramda.replace;
const reduce = ramda.reduce;
const split = ramda.split;
const map = ramda.map;

var Utils = {};


const geometries = {
  '1': '"point"',
  '2': '"line"',
  '3': '"polygon"',
  '4': '"dot"'
};

Utils.curryCompose3 = function (compose) {
  return curry((a, b, c) => compose(a, b, c));
};

Utils.wrapCodeInFunction = function (innerCode, attr = [' ']) {
  attr = attr.join(',');

  return `function (${attr}) {
var _value = null;
${innerCode}
return _value;
}`.replace(/(\t)/g, '');
};

Utils.functionString = function (fn) {
  let args = fn
      .substring(fn.indexOf('(') + 1, fn.indexOf(')'))
      .replace(/\s/g, '');

  args = args ? args.split(',') : [];

  let body = fn.substring(fn.indexOf('{') + 1, fn.lastIndexOf('}'));
  let func = new Function(...args, body);

  func.toString = function () {
    return fn;
  };

  return func;
};

Utils.transpile2Tangram = compose(
  replace(/ctx.zoom/g, '$zoom'),
  replace(/data\[/g, 'feature['),
  replace(/data\['mapnik::geometry_type'\] === (\d)/g, ($0, $1) => {
    return '$geometry === ' + geometries[$1];
  })
);

Utils.buildCCSSFn = function (js, attr) {
  let fn = '';

  for (var i = 0; i < js.length; i++) {
    fn += Utils.transpile2Tangram(js[i]);
  }

  return Utils.functionString(Utils.wrapCodeInFunction(fn, attr));
};

Utils.cleanForExecuting = replace(/data\['.*'\] (===|>|<|>=|<=) ('?(.+)(?='|\)| &&))/g, 'true');

Utils.buildAndExecuteFn = function (js) {
  return Utils.buildCCSSFn(
    map(
      Utils.cleanForExecuting,
      js
      ),
      ['$zoom']
    )(10);
};

Utils.generateDefault = function (val) {
  return `return ${val};`;
};

Utils.pick = curry((path, obj) => {
  return reduce((accumulator, key) => {
    return accumulator[key];
  }, obj, split('.', path));
});

module.exports = Utils;
