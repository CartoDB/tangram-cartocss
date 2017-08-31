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
    //TODO tangram probably expects width and size in a different unit
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

function processPoints(yaml, layer, drawGroupName) {
    if (layer.shader.symbolizers.indexOf('markers') >= 0) {
        yaml.filter = getFilterFn(layer, 'markers');

        yaml.draw[drawGroupName] = { _hidden: {} };
        const drawGroup = yaml.draw[drawGroupName];
        //for each yaml property
        //opacity *must* be processed first
        defProperty(drawGroup, layer, 'marker-opacity', 'opacity:general');
        defProperty(drawGroup, layer, 'marker-line-opacity', 'opacity:outline');
        defProperty(drawGroup, layer, 'marker-fill-opacity', 'opacity:fill');

        defProperty(drawGroup, layer, 'marker-fill', 'color');
        defProperty(drawGroup, layer, 'marker-allow-overlap', 'collide');
        defProperty(drawGroup, layer, 'marker-width', 'size');
        defProperty(drawGroup, layer, 'marker-comp-op', 'blend');
        defProperty(drawGroup, layer, 'marker-line-color', 'outline:color');
        defProperty(drawGroup, layer, 'marker-line-width', 'outline:width');

        delete drawGroup._hidden;
    }
}

function processLines(yaml, layer, drawGroupName) {
    if (layer.shader.symbolizers.indexOf('line') >= 0) {
        yaml.filter = getFilterFn(layer, 'line');

        yaml.draw[drawGroupName] = { _hidden: {} };
        const drawGroup = yaml.draw[drawGroupName];
        //for each yaml property
        //opacity *must* be processed first
        defProperty(drawGroup, layer, 'line-opacity', 'opacity:general');

        defProperty(drawGroup, layer, 'line-color', 'color');
        defProperty(drawGroup, layer, 'line-width', 'width');
        defProperty(drawGroup, layer, 'line-join', 'join');
        defProperty(drawGroup, layer, 'line-cap', 'cap');
        defProperty(drawGroup, layer, 'line-comp-op', 'blend');
        //TODO line-dasharray???
        delete drawGroup._hidden;
    }
}

function processPolys(yaml, layer, drawGroupName) {
    if (layer.shader.symbolizers.indexOf('polygon') >= 0) {
        yaml.filter = getFilterFn(layer, 'polygon');

        yaml.draw[drawGroupName] = { _hidden: {} };
        const drawGroup = yaml.draw[drawGroupName];
        //for each yaml property
        //opacity *must* be processed first
        defProperty(drawGroup, layer, 'polygon-opacity', 'opacity:general');

        defProperty(drawGroup, layer, 'polygon-fill', 'color');
        defProperty(drawGroup, layer, 'polygon-comp-op', 'blend');

        delete drawGroup._hidden;
    }
}

function processStyle(yaml, drawGroupName, styleName, layerOrder) {
    if (yaml.draw[drawGroupName]) {
        yaml.styles[styleName] = {
            blend: yaml.draw[drawGroupName].blend,
            blend_order: layerOrder
        };
        delete yaml.draw[drawGroupName].blend;
    }
}

function layerToYAML(layer, layerOrder) {
    var yaml = {
        draw: {},
        styles: {},
        textures: {}
    };
    //TODO: what to do if multiple symbolizers are active for the same layer??
    const drawGroupName = "drawGroup" + layerOrder;
    const styleName = "style" + layerOrder;
    processPoints(yaml, layer, drawGroupName);
    processLines(yaml, layer, drawGroupName);
    processPolys(yaml, layer, drawGroupName);

    processStyle(yaml, drawGroupName, styleName, layerOrder);
    return yaml;
}
module.exports.layerToYAML = layerToYAML;
module.exports.carto2Draw = layerToYAML;


/*
//Usage example
const Carto = require('carto');
const CartoCSSRenderer = new Carto.RendererJS({
    reference: tangramReference,
    strict: true
});
const css = `#layer {
    polygon-fill: #374c70;
    polygon-opacity: 0.5;
  }
  #layer::outline {
    line-width: 3.5;
    line-color: #FFF;
    line-opacity: 0.5;
  }`;
const layers = CartoCSSRenderer.render(css).getLayers();
console.log(layers[0]);
console.log(layers[1]);

console.log('YAML');
console.log('\nlayerToYAML:\n', JSON.stringify(layerToYAML(layers[0], 0), null, 4));
console.log('\nlayerToYAML:\n', JSON.stringify(layerToYAML(layers[1], 1), null, 4));
*/