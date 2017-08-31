
//rgba() format use the following ranges: [0-255] for RGB and [0-1] for the alpha channel

function marshall(color) {
    return 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + color.a + ')';
}
module.exports.marshall = marshall;

function unmarshall(color, reference = null) {
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
        var rgb = c.match(/\d+/g);
        result.r = parseInt(rgb[0]);
        result.g = parseInt(rgb[1]);
        result.b = parseInt(rgb[2]);
    } else if (color.startsWith('rgba(')) {
        var rgba = c.match(/\d+/g);
        result.r = parseInt(rgb[0]);
        result.g = parseInt(rgb[1]);
        result.b = parseInt(rgb[2]);
        result.a = parseInt(rgb[3]);
    } else if (reference && reference.colors[color]) {
        var rgbArray = reference.colors[color];
        result.r = rgbArray[0];
        result.g = rgbArray[0];
        result.b = rgbArray[0];
        result.a = 1;
    } else {
        throw new Error('color format not recognized, color: ' + color);
    }
    return result;
}

module.exports.unmarshall = unmarshall;
