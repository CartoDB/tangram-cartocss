const tangramReference = require('tangram-reference').load();

function getReferenceDefaultMarkerValue(propertyName) {
    return tangramReference.symbolizers.markers[propertyName]['default-value'];
}
function getReferenceDefaultLineValue(propertyName) {
    return tangramReference.symbolizers.line[propertyName]['default-value'];
}
function getReferenceDefaultPolygonValue(propertyName) {
    return tangramReference.symbolizers.polygon[propertyName]['default-value'];
}
function evalFunctionString(functionString, feature, metersPerPixel = 1) {
    // jshint unused:false
    // `feature` and `$zoom` variables are required within the eval context.
    const $zoom = 3;
    const $meters_per_pixel = metersPerPixel;
    return eval(`(${functionString})`)();
}

function evalIfNeeded(yamlProperty, feature, metersPerPixel) {
    if ((typeof yamlProperty === 'string' || yamlProperty instanceof String) && yamlProperty.startsWith('function')) {
        return evalFunctionString(yamlProperty, feature, metersPerPixel);
    }
    return yamlProperty;
}

module.exports = {
    getReferenceDefaultPolygonValue,
    getReferenceDefaultLineValue,
    getReferenceDefaultMarkerValue,
    evalFunctionString,
    evalIfNeeded,
};
