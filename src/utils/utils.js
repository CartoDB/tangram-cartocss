import { curry, compose, replace, reduce, split, map } from 'ramda';

var Utils = {};

export default Utils;

const geometries = {
  '1': '"point"',
  '2': '"line"',
  '3': '"polygon"'
};

Utils.curryCompose3 = function (compose) {
  return curry((a,b,c) => compose(a,b,c));
};

Utils.wrapCodeInFunction = function(innerCode, attr = [' '], defaultValue = null) {
	attr = attr.join(',');

	return `function (${attr}) {
				var _value = ${defaultValue};
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
  replace(/ctx.zoom/g, '$zoom'),
  replace(/data\[/g, 'feature['),
  replace(/data\['mapnik::geometry_type'\] === (\d)/g, ($0, $1) => {
    return '$geometry === ' + geometries[$1];
  })
);

export function buildCCSSFn(js, attr, defaultValue = null) {
	let fn = '';

	for (var i = 0; i < js.length; i++) {
		fn += Utils.transpile2Tangram(js[i]);
	}

	return Utils.functionString(Utils.wrapCodeInFunction(fn, attr, defaultValue));
}

Utils.buildCCSSFn = buildCCSSFn;

Utils.cleanForExecuting = replace(/data\['.*'\] (===|>|<|>=|<=) ('?(.+)(?='|\)| &&))/g, 'true');

Utils.buildAndExecuteFn =  function (js) {
  return Utils.buildCCSSFn(
    map(
      Utils.cleanForExecuting,
      js
      ),
      ['$zoom']
    )(10);
};

Utils.generateDefault = function(val) {
	return `return ${val};`;
};

/**
 * Get the value from an object given the value path.
 *
 * let user = {
 *   name : {
 *    first: 'John',
 *    last: 'Doe
 *   },
 *   age: 20,
 * }
 *
 * Utils.pick('name.last', user) // Doe
 * Utils.pick('age', user) // 20
 */
Utils.pick = curry((path, obj) => {
  return reduce((accumulator, key) => {
    return accumulator[key];
  }, obj, split('.', path));
});
