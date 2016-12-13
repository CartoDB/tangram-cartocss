var Utils = {};

export default Utils;

Utils.wrapCodeInFunction = function(innerCode) {
	return `function () {
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