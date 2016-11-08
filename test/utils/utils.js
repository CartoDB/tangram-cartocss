var Utils = {};

Utils.wrapEval = function (fn) {
  return `
    (function (feature, $zoom) {
      return (${fn}());
    })
  `;
	};

Utils.eval = function (fns) {
  let fn = eval(Utils.wrapEval(fns));

  return fn;
	};

export default Utils;
