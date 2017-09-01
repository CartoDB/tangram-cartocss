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
    return !isNaN(parseFloat(n)) && Number.isFinite(n);
}
function getColorFromLiteral(yamlDrawGroup, colorLiteral, isFill) {
    const opacity = getOpacityOverride(yamlDrawGroup, isFill);
    const c = color.unmarshall(colorLiteral, tangramReference);
    if (opacity) {
        if (isNumeric(opacity)) {
            c.a = opacity;
            return color.marshall(c);
        } else {
            return wrapFn(`return 'rgba(${c.r},${c.g},${c.b},'+${opacity}()+')';`);
        }
    } else {
        //This marshall is needed to normalize the literal, if we just return c and it is one of the reference defined colors
        //tangram won't understand it
        return color.marshall(c);
    }
}

function getColorOverrideCode(yamlDrawGroup, isFill) {
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
    if (referenceCSS[ccssProperty].type === 'color') {
        fn += getColorOverrideCode(yamlDrawGroup, ccssProperty.indexOf('fill') >= 0);
    }
    if (ccssProperty.indexOf('width') >= 0) {
        fn += '_value=_value*$meters_per_pixel;';
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
        return getColorFromLiteral(yamlDrawGroup, ccssValue, ccssProperty.indexOf('fill') >= 0);
    }
    if (ccssProperty.indexOf('width') >= 0) {
        ccssValue += 'px';
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

//Define a YAML draw style property originally contained in layer, named ccssName (in referenceCSS), with the related tangramName
function defProperty(yamlDrawGroup, layer, ccssName, tangramName) {
    const defaultValue = getReferenceDefault(ccssName);
    const shaderValue = layer.shader[ccssName];
    var value;
    if (shaderValue === undefined) {
        if (ccssName.indexOf('dash')>=0){
            return;
        }
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
    const fn = Object.keys(layer.shader)
        .filter(property => layer.shader[property].symbolizer === symbolizer)
        .map((property) => layer.shader[property].js)
        .reduce((all, arr) => all.concat(arr), [])
        .join('');

    return wrapFn(`var _value = null; ${fn} return _value !== null;`);
}

function processPoints(yaml, layer, drawGroupName) {
    if (layer.shader.symbolizers.indexOf('markers') >= 0) {
        yaml.filter = getFilterFn(layer, 'markers');

        yaml.draw[drawGroupName] = { _hidden: {} };
        yaml.styles[drawGroupName] = { base: 'points' };
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
        yaml.styles[drawGroupName] = { base: 'lines' };
        const drawGroup = yaml.draw[drawGroupName];
        //for each yaml property
        //opacity *must* be processed first
        defProperty(drawGroup, layer, 'line-opacity', 'opacity:general');

        defProperty(drawGroup, layer, 'line-color', 'color');
        defProperty(drawGroup, layer, 'line-width', 'width');
        defProperty(drawGroup, layer, 'line-join', 'join');
        defProperty(drawGroup, layer, 'line-cap', 'cap');
        defProperty(drawGroup, layer, 'line-comp-op', 'blend');
        defProperty(drawGroup, layer, 'line-dasharray', 'dash');
        delete drawGroup._hidden;
    }
}

function processPolys(yaml, layer, drawGroupName) {
    if (layer.shader.symbolizers.indexOf('polygon') >= 0) {
        yaml.filter = getFilterFn(layer, 'polygon');

        yaml.draw[drawGroupName] = { _hidden: {} };
        yaml.styles[drawGroupName] = { base: 'polygons' };
        const drawGroup = yaml.draw[drawGroupName];
        //for each yaml property
        //opacity *must* be processed first
        defProperty(drawGroup, layer, 'polygon-opacity', 'opacity:general');

        defProperty(drawGroup, layer, 'polygon-fill', 'color');
        defProperty(drawGroup, layer, 'polygon-comp-op', 'blend');

        delete drawGroup._hidden;
    }
}

function processStyle(yaml, drawGroupName, layerOrder) {
    yaml.styles[drawGroupName].blend = yaml.draw[drawGroupName].blend;
    yaml.styles[drawGroupName].blend_order = layerOrder;
    delete yaml.draw[drawGroupName].blend;
}

function layerToYAML(layer, layerOrder) {
    var yaml = {
        draw: {},
        styles: {},
        textures: {}
    };
    if (layer.shader.symbolizers.length > 1) {
        throw new Error('Multiple symbolizer on one layer is not supported');
    } else if (layer.shader.symbolizers.length === 1) {
        const drawGroupName = `drawGroup${layerOrder}`;
        processPoints(yaml, layer, drawGroupName);
        processLines(yaml, layer, drawGroupName);
        processPolys(yaml, layer, drawGroupName);

        processStyle(yaml, drawGroupName, layerOrder);
    }
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
const css = `
  #layer {
    line-dasharray: 2,3
  }`;
const layers = CartoCSSRenderer.render(css).getLayers();
console.log(layers[0]);
console.log(layers[1]);

console.log('YAML');
//console.log('\nlayerToYAML:\n', JSON.stringify(layerToYAML(layers[0], 0), null, 4));
console.log('\nlayerToYAML:\n', JSON.stringify(layerToYAML(layers[1], 1), null, 4));
*/