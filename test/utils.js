const tangramReference = require('tangram-reference').load();

function getReferenceDefaultMarkerValue(propertyName) {
    return tangramReference.symbolizers.markers[propertyName]['default-value'];
}

function evalFunctionString(functionString, feature) {
    // jshint unused:false
    // `feature` and `$zoom` variables are required within the eval context.
    const $zoom = 3;
    return eval(`(${functionString})`)();
}

function evalIfNeeded(yamlProperty, feature) {
    if ((typeof yamlProperty === 'string' || yamlProperty instanceof String) && yamlProperty.startsWith('function')) {
        return evalFunctionString(yamlProperty, feature);
    }
    return yamlProperty;
}

module.exports = {
    getReferenceDefaultMarkerValue,
    evalFunctionString,
    evalIfNeeded,
};
