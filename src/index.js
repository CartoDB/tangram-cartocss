const tangramReference = require('tangram-reference').load();
const color = require('./color.js');

//getReferenceIndexedByCSS returns a reference based on ref indexed by the CSS property name instead of the reference original property name
//it does a shallow copy of each property, therefore, it's possible to change the returned reference by changing the original one, don't do it
function getReferenceIndexedByCSS(ref) {
    var newRef = {};
    for (var symb in ref.symbolizers) {
        for (var property in ref.symbolizers[symb]) {
            newRef[ref.symbolizers[symb][property].css] = ref.symbolizers[symb][property];
        }
    }
    return newRef;
}
const referenceCSS = getReferenceIndexedByCSS(tangramReference);


function wrapFn(functionBody) {
    return 'function (){var data=feature; var ctx={zoom: $zoom};' + functionBody + '}';
}
function getReferenceDefault(property) {
    return referenceCSS[property]['default-value'];
}
function getLiteralFromShaderValue(shaderValue) {
    const ctx = { zoom: 10 };
    var _value = null;
    shaderValue.js.forEach(function (code) {
        eval(code);
    });
    return _value;
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
function getOverridedColorFromLiteral(yamlDrawGroup, colorLiteral, isFill) {
    //override opacity as needed. if opacity is callback => output callback, else => override now
    const opacity = getOpacityOverride(yamlDrawGroup, isFill);
    const c = color.unmarshall(colorLiteral, tangramReference);
    if (opacity) {
        if (isNumeric(opacity)) {
            c.a = opacity;
            return color.marshall(c);
        } else {
            const c = color.unmarshall(colorLiteral, tangramReference);
            return wrapFn(`return \'rgba(${c.r},${c.g},${c.b},'+${opacity}()+')';`);
        }
    } else {
        return color.marshall(c);
    }
}

function getOverrideCode(yamlDrawGroup, isFill) {
    const opacity = getOpacityOverride(yamlDrawGroup, isFill);
    if (opacity) {
        if (isNumeric(opacity)) {
            return `var c=${color.unmarshall.toString()}(_value);c.a=${opacity};_value=${color.marshall.toString()}(c);`;
        } else {
            return `var opacity=${opacity}(); var c=${color.unmarshall.toString()}(_value);c.a=opacity;_value=${color.marshall.toString()}(c);`;
        }
    } else {
        return '';
    }
}

//Returns a function string that sets the value to the default one and then executes the shader value code
function getFunctionFromDefaultAndShaderValue(yamlDrawGroup, ccssProperty, defaultValue, shaderValue) {
    var fn = `var _value='${defaultValue}';`;
    shaderValue.js.forEach(function (code) {
        fn += code;
    });
    //TODO: if color, override opacity as needed. If opacity is not null => (if opacity is fn, append it to code, else, override to literal in code)
    if (referenceCSS[ccssProperty].type === 'color') {
        fn += getOverrideCode(yamlDrawGroup, ccssProperty.indexOf('fill') >= 0);
    }
    fn += 'return _value;';
    return wrapFn(fn);
}

//Translates a ccssValue from the reference standard to the Tangram standard
function translateValue(yamlDrawGroup, ccssProperty, ccssValue) {
    if (ccssProperty.indexOf('comp-op') >= 0) {
        switch (ccssValue) {
            case 'src-over':
                return 'overlay';
            case 'plus':
                return 'add';
            default:
                return ccssValue;
        }
    }
    if (referenceCSS[ccssProperty].type === 'color') {
        return getOverridedColorFromLiteral(yamlDrawGroup, ccssValue, ccssProperty.indexOf('fill') >= 0);
    }
    return ccssValue;
}

//Sets a YAML property, managing special cases (outlines and opacities)
function setYAMLProperty(yamlDrawGroup, tangramName, value) {
    if (tangramName.startsWith('outline:')) {
        if (yamlDrawGroup.outline === undefined) {
            yamlDrawGroup.outline = {};
        }
        yamlDrawGroup.outline[tangramName.slice(tangramName.indexOf(':') + 1)] = value;
    } else if (tangramName.startsWith('opacity:')) {
        yamlDrawGroup._hidden[tangramName] = value;
    } else {
        yamlDrawGroup[tangramName] = value;
    }
}

//Returns the final opacity override selecting between fill-opacity and outline-opacity.
//Returned value can be a float or a function string to be called at Tangram's runtime if the override is active
//A falseable value will be returned if the override is not active
function getOpacityOverride(yamlDrawGroup, isFill) {
    var opacity;
    if (isFill) {
        opacity = yamlDrawGroup._hidden['opacity:fill'];
    } else {
        opacity = yamlDrawGroup._hidden['opacity:outline'];
    }
    opacity = yamlDrawGroup._hidden['opacity:general'] || opacity;
    return opacity;
}

//Define a YAML draw style property originally contained in layer, named ccssName (in referenceCSS), with the related tangramName
function defProperty(yamlDrawGroup, layer, ccssName, tangramName) {
    const defaultValue = getReferenceDefault(ccssName);
    const shaderValue = layer.shader[ccssName];
    var value;
    if (shaderValue === undefined) {
        value = translateValue(yamlDrawGroup, ccssName, defaultValue);
    } else if (!shaderValue.filtered && shaderValue.constant) {
        value = translateValue(yamlDrawGroup, ccssName, getLiteralFromShaderValue(shaderValue));
    } else {
        value = getFunctionFromDefaultAndShaderValue(yamlDrawGroup, ccssName, defaultValue, shaderValue);
    }
    setYAMLProperty(yamlDrawGroup, tangramName, value);
}

//Returns a function string that dynamically filters symbolizer based on conditional properties
function getFilterFn(layer, symbolizer) {
    //TODO: optimize, not need to set a callback when at least one property is not filtered (i.e. it always activates the symbolizer)
    var fn = 'var _value = null;';
    for (var property in layer.shader) {
        if (layer.shader[property].symbolizer === symbolizer) {
            layer.shader[property].js.forEach(function (code) {
                fn += code;
            });
        }
    }
    fn += 'return _value!==null';
    return wrapFn(fn);
}

function processPoints(yaml, layer) {
    if (layer.shader.symbolizers.indexOf('markers') >= 0) {
        yaml.filter = getFilterFn(layer, 'markers');

        yaml.draw.points = { _hidden: {} };
        //for each yaml property
        //opacity *must* be processed first
        defProperty(yaml.draw.points, layer, 'marker-opacity', 'opacity:general');
        defProperty(yaml.draw.points, layer, 'marker-line-opacity', 'opacity:outline');
        defProperty(yaml.draw.points, layer, 'marker-fill-opacity', 'opacity:fill');

        defProperty(yaml.draw.points, layer, 'marker-fill', 'color');
        defProperty(yaml.draw.points, layer, 'marker-allow-overlap', 'collide');
        defProperty(yaml.draw.points, layer, 'marker-width', 'size');
        defProperty(yaml.draw.points, layer, 'marker-comp-op', 'blend');
        defProperty(yaml.draw.points, layer, 'marker-line-color', 'outline:color');
        defProperty(yaml.draw.points, layer, 'marker-line-width', 'outline:width');

        delete yaml.draw.points._hidden;
    }
}

function layerToYAML(layer, layerOrder = 0) {
    var yaml = {
        draw: {},
        styles: {},
        textures: {}
    };
    //console.log('\nlayerToYAML:\n', JSON.stringify(layer, null, 4));
    //TODO: for each symbolizer
    processPoints(yaml, layer);

    return yaml;
}
module.exports.layerToYAML = layerToYAML;
