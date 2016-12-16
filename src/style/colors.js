import Utils from '../utils/utils';
var Colors = {};

export default Colors;

let C = Colors;

Colors._isHex = Utils.functionString(
	`function isHex (c) {
		return c.indexOf('#') >= 0;
	}`
);

Colors._isRGB = Utils.functionString(
	`function (c) {
		return c.indexOf('rgb') >= 0;
	}`
);

Colors._isRGBA = Utils.functionString(
	`function (c) {
		return c.indexOf('rgba') >= 0;
	}`
);

Colors.toSixHex = Utils.functionString(
		`function (c) {
			if (c.length === 7) {
				return c;
			}
			else {
				var r = c[1],
					g = c[2],
					b = c[3];

				return '#' + r + r + g + g + b + b;
			}
		}`
	);

Colors.hexToInt = Utils.functionString(
	`function (hex) {
		return parseInt('0x' + hex);
	}`
);

Colors.toRGB = Utils.functionString(
	`function (c) {
		var r = ${C.hexToInt}(c.substr(1, 2)) + ', ',
			g = ${C.hexToInt}(c.substr(3, 2)) + ', ',
			b = ${C.hexToInt}(c.substr(5, 2));

		return 'rgb(' + r + g + b + ')';
	}`
);

Colors.toRGBA = Utils.functionString(
	`function (rgb, alpha) {
		return rgb.replace('rgb', 'rgba').replace(')', ', ' + alpha + ')');
	}`
);

Colors.getAlphaColorFn = Utils.functionString(
	`function (color, opacity) {
		if ( ${C._isRGBA}(color) ) {
			return color;
		}
		else {
			if ( ${C._isHex}(color) ) {
				return ${C.toRGBA}( ${C.toRGB}( ${C.toSixHex}(color) ), opacity );
			}
			else if ( ${C._isRGB}(color) ) {
				return ${C.toRGBA}(color);
			}
		}
	}`
);

Colors.getAlphaColor = function (color, opacity) {
	if (color && typeof opacity !== 'number') {
		return Utils.functionString(
				`function () {
					return ${C.getAlphaColorFn}(${color}(), ${opacity}() || 1.);
				}`
			);
	}

	return color;
};
