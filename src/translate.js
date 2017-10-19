const color = require('./color.js');
const tangramReference = require('tangram-reference').load();

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
    return `function (){var data=feature; var ctx={zoom: $zoom};${functionBody}}`;
}
function getReferenceDefault(property) {
    return referenceCSS[property]['default-value'];
}

function getLiteralFromShaderValue(shaderValue) {
    // jshint ignore:start
    // required within the eval context
    const ctx = { zoom: 10 };
    // jshint ignore:end
    var _value = null;
    shaderValue.js.forEach(function (code) {
        eval(code);
    });
    return _value;
}

//Returns the final opacity override selecting between fill-opacity and outline-opacity.
//Returned value can be a float or a function string to be called at Tangram's runtime if the override is active
//A falseable value will be returned if the override is not active
function getOpacityOverride(sceneDrawGroup, isFill) {
    var opacity;
    if (isFill) {
        opacity = sceneDrawGroup._hidden['opacity:fill'];
    } else {
        opacity = sceneDrawGroup._hidden['opacity:outline'];
    }
    if (sceneDrawGroup._hidden['opacity:general'] !== undefined) {
        opacity = sceneDrawGroup._hidden['opacity:general'];
    }
    return opacity;
}

function getColorFromLiteral(sceneDrawGroup, colorLiteral, isFill) {
    const opacity = getOpacityOverride(sceneDrawGroup, isFill);
    const c = color.unmarshall(colorLiteral, tangramReference);
    if (opacity !== undefined) {
        if (Number.isFinite(opacity)) {
            c.a = opacity;
            return color.marshall(c);
        } else {
            return wrapFn(`var opacity=${opacity}();return opacity===undefined? 'rgba(${c.r},${c.g},${c.b},${c.a})': 'rgba(${c.r},${c.g},${c.b},'+opacity+')';`);
        }
    } else {
        //This marshall is needed to normalize the literal, if we just return c and it is one of the reference defined colors
        //tangram won't understand it
        return color.marshall(c);
    }
}

function getColorOverrideCode(sceneDrawGroup, isFill) {
    const opacity = getOpacityOverride(sceneDrawGroup, isFill);
    if (opacity !== undefined) {
        if (Number.isFinite(opacity)) {
            return `var c=${color.unmarshall.toString()}(_value);c.a=${opacity};_value=${color.marshall.toString()}(c);`;
        } else {
            return `var opacity=${opacity}(); var c=${color.unmarshall.toString()}(_value);c.a=opacity===undefined?c.a:opacity;_value=${color.marshall.toString()}(c);`;
        }
    } else {
        return '';
    }
}

//Returns a function string that sets the value to the default one and then executes the shader value code
function getFunctionFromDefaultAndShaderValue(sceneDrawGroup, ccssProperty, defaultValue, shaderValue) {
    if (referenceCSS[ccssProperty].type === 'color') {
        defaultValue = `'${color.normalize(defaultValue, tangramReference)}'`;
    }
    var fn = `var _value=${defaultValue};`;
    shaderValue.js.forEach(function (code) {
        fn += code;
    });
    if (referenceCSS[ccssProperty].type === 'color') {
        fn += getColorOverrideCode(sceneDrawGroup, ccssProperty.indexOf('fill') >= 0);
    }
    if (ccssProperty === 'line-width') {
        fn += '_value=_value*$meters_per_pixel;';
    }
    fn += 'return _value;';
    return wrapFn(fn);
}

//Translates a ccssValue from the reference standard to the Tangram standard
function translateValue(sceneDrawGroup, ccssProperty, ccssValue) {
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
        return getColorFromLiteral(sceneDrawGroup, ccssValue, ccssProperty.indexOf('fill') >= 0);
    }
    if (ccssProperty.indexOf('width') >= 0) {
        ccssValue += 'px';
    }
    if (ccssProperty.indexOf('allow-overlap') >= 0) {
        ccssValue = !ccssValue;
    }
    return ccssValue;
}

//Sets a scene property, managing special cases (outlines and opacities)
function setSceneProperty(sceneDrawGroup, tangramName, value) {
    if (tangramName.startsWith('outline:')) {
        if (sceneDrawGroup.outline === undefined) {
            sceneDrawGroup.outline = {};
        }
        sceneDrawGroup.outline[tangramName.slice(tangramName.indexOf(':') + 1)] = value;
    } else if (tangramName.startsWith('opacity:')) {
        sceneDrawGroup._hidden[tangramName] = value;
    } else {
        sceneDrawGroup[tangramName] = value;
    }
}

//Define a scene draw style property originally contained in layer, named ccssName (in referenceCSS), with the related tangramName
function defProperty(sceneDrawGroup, layer, ccssName, tangramName) {
    const defaultValue = getReferenceDefault(ccssName);
    const shaderValue = layer.shader[ccssName];
    var value;
    if (shaderValue === undefined) {
        if (ccssName.indexOf('dash') >= 0) {
            return;
        }
        value = translateValue(sceneDrawGroup, ccssName, defaultValue);
    } else if (!shaderValue.filtered && shaderValue.constant) {
        value = translateValue(sceneDrawGroup, ccssName, getLiteralFromShaderValue(shaderValue));
    } else {
        if (!referenceCSS[ccssName].expression) {
            throw new Error(`Unsupported CartoCSS: expression-controlled ${ccssName}`);
        }
        value = getFunctionFromDefaultAndShaderValue(sceneDrawGroup, ccssName, defaultValue, shaderValue);
    }
    setSceneProperty(sceneDrawGroup, tangramName, value);
}

//Returns a function string that dynamically filters symbolizer based on conditional properties
function getFilterFn(layer, symbolizer) {
    const symbolizers = Object.keys(layer.shader)
        .filter(property => layer.shader[property].symbolizer === symbolizer);

    //No need to set a callback when at least one property is not filtered (i.e. it always activates the symbolizer)
    const alwaysActive = symbolizers
        .reduce((a, property) => a || !layer.shader[property].filtered, false);

    if (alwaysActive) {
        return undefined;
    }

    const fn = symbolizers
        .map((property) => layer.shader[property].js)
        .reduce((all, arr) => all.concat(arr), [])
        .join('');

    return wrapFn(`var _value = null; ${fn} return _value !== null;`);
}

module.exports = {
    getOpacityOverride: getOpacityOverride,
    getColorFromLiteral: getColorFromLiteral,
    getColorOverrideCode: getColorOverrideCode,
    getFunctionFromDefaultAndShaderValue: getFunctionFromDefaultAndShaderValue,
    translateValue: translateValue,
    setSceneProperty: setSceneProperty,
    defProperty: defProperty,
    getFilterFn: getFilterFn
};