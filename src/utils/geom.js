var Geom = {};

export default Geom;

Geom.px2Meters = function (fn) {
  return `
  	function () {
  		var val = (${fn}());
  		return val / ($zoom * 0.0003);
  	}
  `.replace(/(\t)/g, '');
};