const tangramReference = require('tangram-reference').load();

function getReferenceDefaultMarkerValue(propertyName) {
    return tangramReference.symbolizers.markers[propertyName]['default-value'];
}
function evalFunctionString(functionString, feature) {
    const $zoom = 3;
    const data = feature;
    eval('var fn = ' + functionString + ';');
    return fn();
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
