
//rgba() format use the following ranges: [0-255] for RGB and [0-1] for the alpha channel

function marshall(color) {
    return `rgba(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)},${color.a})`;
}
module.exports.marshall = marshall;

function unmarshall(color, reference) {
    function hexToInt(hex) {
        return parseInt('0x' + hex);
    }
    var result = {};
    if (color[0] === '#') {
        result.r = hexToInt(color.substr(1, 2));
        result.g = hexToInt(color.substr(3, 2));
        result.b = hexToInt(color.substr(5, 2));
        result.a = 1;
    } else if (color.startsWith('rgb(')) {
        var rgb = color.match(/\d+/g);
        result.r = parseInt(rgb[0]);
        result.g = parseInt(rgb[1]);
        result.b = parseInt(rgb[2]);
        result.a = 1;
    } else if (color.startsWith('rgba(')) {
        var rgba = color.slice(5,-1).split(',');
        result.r = parseInt(rgba[0]);
        result.g = parseInt(rgba[1]);
        result.b = parseInt(rgba[2]);
        result.a = parseFloat(rgba[3]);
    } else if (reference && reference.colors[color]) {
        var rgbArray = reference.colors[color];
        result.r = rgbArray[0];
        result.g = rgbArray[1];
        result.b = rgbArray[2];
        result.a = 1;
    } else {
        throw new Error(`color format not recognized, color: ${color}`);
    }
    return result;
}
module.exports.unmarshall = unmarshall;

function normalize(color, reference) {
    return marshall(unmarshall(color, reference));
}

module.exports.normalize = normalize;
