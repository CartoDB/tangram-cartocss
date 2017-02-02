import { curry, compose, replace, reduce, split }from 'ramda';

var Utils = {};

export default Utils;

const repl = curry(replace);

Utils.curryCompose3 = function (compose) {
  return curry((a,b,c) => compose(a,b,c));
};

Utils.wrapCodeInFunction = function(innerCode, attr = [' ']) {
	attr = attr.join(',');

	return `function (${attr}) {
				var _value = null;
				${innerCode}
				return _value;
			}`.replace(/(\t)/g, '');
};

Utils.functionString = function(fn) {
	let args = fn
			.substring( fn.indexOf('(') + 1, fn.indexOf(')') )
			.replace(/\s/g, '');

	args = args ? args.split(',') : [];

	let body = fn.substring( fn.indexOf('{') + 1, fn.lastIndexOf('}'));
	let func = new Function(...args, body);

	func.toString = function() {
		return fn;
	};

	return func;
};


Utils.transpile2Tangram = compose(
  repl(/ctx.zoom/g, '$zoom'),
  repl(/data\[/g, 'feature['),
  repl(/&& data\['mapnik::geometry_type'\] === \d/g, '')
);

Utils.buildCCSSFn = function(js, attr) {
	let fn = '';

	for (var i = 0; i < js.length; i++) {
		fn += Utils.transpile2Tangram(js[i]);
	}

	return Utils.functionString(Utils.wrapCodeInFunction(fn, attr));
};

Utils.buildAndExecuteFn =  function (js) {
  return Utils.buildCCSSFn(js, ['$zoom'])(10);
};

Utils.generateDefault = function(val) {
	return `return ${val};`;
};

Utils.pick = curry((path, obj) => {
  return reduce((accumulator, key) => {
    return accumulator[key];
  }, obj, split('.', path));
});
