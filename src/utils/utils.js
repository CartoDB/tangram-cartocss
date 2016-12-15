var Utils = {};

export default Utils;

Utils.wrapCodeInFunction = function(innerCode, attr = [' ']) {
	attr = attr.join(',');

	return `function (${attr}) {
				var _value = null;
				${innerCode}
				return _value;
			}`.replace(/\t/g, '');
};

Utils.functionString = function(fn) {
	let args = fn
			.substring( fn.indexOf('(') + 1, fn.indexOf(')') )
			.replace(/\s/g, '')
			.split(',');

	let body = fn.substring( fn.indexOf('{') + 1, fn.lastIndexOf('}'));
	let func = new Function(...args, body);

	func.toString = function() {
		return fn;
	};

	return func;
};

Utils.transpile2Tangram = function(cond) {
	return cond
		.replace(/ctx.zoom/g, '$zoom')
		.replace(/data\[/g, 'feature[');
};

Utils.buildCCSSFn = function(js, attr) {
	let fn = '';

	for (var i = 0; i < js.length; i++) {
		fn += Utils.transpile2Tangram(js[i]);
	}

	return Utils.functionString(Utils.wrapCodeInFunction(fn, attr));
}

Utils.generateDefault = function(val) {
	return Utils.wrapCodeInFunction(`return ${val};`);
};