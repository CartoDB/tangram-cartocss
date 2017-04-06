import R from 'ramda';

var Utils = {};

export default Utils;

const replace = R.curry(R.replace);

const geometries = {
  '1': '"point"',
  '2': '"line"',
  '3': '"polygon"'
};

Utils.curryCompose3 = function (compose) {
  return R.curry((a,b,c) => compose(a,b,c));
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


Utils.transpile2Tangram = R.compose(
  replace(/ctx.zoom/g, '$zoom'),
  replace(/data\[/g, 'feature['),
  replace(/data\['mapnik::geometry_type'\] === (\d)/g, ($0, $1) => {
    return '$geometry === ' + geometries[$1];
  })
);

Utils.buildCCSSFn = function(js, attr) {
	let fn = '';

	for (var i = 0; i < js.length; i++) {
		fn += Utils.transpile2Tangram(js[i]);
	}

	return Utils.functionString(Utils.wrapCodeInFunction(fn, attr));
};

Utils.cleanForExecuting = replace(/data\['.*'\] (===|>|<|>=|<=) ('?(.+)(?='|\)| &&))/g, 'true');

Utils.buildAndExecuteFn =  function (js) {
  return Utils.buildCCSSFn(
    R.map(
      Utils.cleanForExecuting,
      js
      ),
      ['$zoom']
    )(10);
};

Utils.generateDefault = function(val) {
	return `return ${val};`;
};

Utils.pick = R.curry((path, obj) => {
  return R.reduce((accumulator, key) => {
    return accumulator[key];
  }, obj, R.split('.', path));
});
