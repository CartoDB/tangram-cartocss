var assert = require('assert');

const tangramReference = require('tangram-reference').load();
const Carto = require('carto');
const CartoCSSRenderer = new Carto.RendererJS({
    reference: tangramReference,
    strict: true
});

const tangram_carto = require('../main.js');

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

describe('Markers', function () {
    var scenarios = [
        {
            name: 'all default',
            ccss: `
            #layer{
                marker-type: ellipse;
            }
            `,
            expected: {
                color: getReferenceDefaultMarkerValue('fill'),
                collide: getReferenceDefaultMarkerValue('allow-overlap'),
                size: getReferenceDefaultMarkerValue('width'),
                blend: 'overlay',
                outlineColor: getReferenceDefaultMarkerValue('stroke'),
                outlineSize: getReferenceDefaultMarkerValue('stroke-width')
            }
        },

        {
            name: 'color literal, opacity literal',
            ccss: `
            #layer{
                marker-type: ellipse;
                marker-opacity: 0.5;
                marker-fill: green;
            }
            `,
            expected: {
                color: 'rgba(0,128,0,0.5)',
                collide: getReferenceDefaultMarkerValue('allow-overlap'),
                size: getReferenceDefaultMarkerValue('width'),
                blend: 'overlay',
                outlineColor: 'rgba(0,0,0,0.5)',
                outlineSize: getReferenceDefaultMarkerValue('stroke-width')
            }
        }

        ,
        {
            name: 'color literal, opacity callback',
            ccss: `
                #layer{
                    marker-type: ellipse;
                    marker-opacity: 0.5;
                    marker-fill: green;
                    [a>2]{
                        marker-opacity: 0.1;
                    }
                }
                `,
            feature: { a: 0 },
            expected: {
                color: 'rgba(0,128,0,0.5)',
                collide: getReferenceDefaultMarkerValue('allow-overlap'),
                size: getReferenceDefaultMarkerValue('width'),
                blend: 'overlay',
                outlineColor: 'rgba(0,0,0,0.5)',
                outlineSize: getReferenceDefaultMarkerValue('stroke-width')
            }
        }
        ,
        {
            name: 'color literal, opacity callback',
            ccss: `
                #layer{
                    marker-type: ellipse;
                    marker-opacity: 0.5;
                    marker-fill: green;
                    [a>2]{
                        marker-opacity: 0.1;
                    }
                }
                `,
            feature: { a: 5 },
            expected: {
                color: 'rgba(0,128,0,0.1)',
                collide: getReferenceDefaultMarkerValue('allow-overlap'),
                size: getReferenceDefaultMarkerValue('width'),
                blend: 'overlay',
                outlineColor: 'rgba(0,0,0,0.1)',
                outlineSize: getReferenceDefaultMarkerValue('stroke-width')
            }
        }

        ,
        {
            name: 'color callback, opacity literal',
            ccss: `
                #layer{
                    marker-type: ellipse;
                    marker-opacity: 0.5;
                    marker-fill: #FFF;
                    [a>2]{
                        marker-fill: #000;
                    }
                }
                `,
            feature: { a: 0 },
            expected: {
                color: 'rgba(255,255,255,0.5)',
                collide: getReferenceDefaultMarkerValue('allow-overlap'),
                size: getReferenceDefaultMarkerValue('width'),
                blend: 'overlay',
                outlineColor: 'rgba(0,0,0,0.5)',
                outlineSize: getReferenceDefaultMarkerValue('stroke-width')
            }
        },
        {
            name: 'color callback, opacity literal',
            ccss: `
                #layer{
                    marker-type: ellipse;
                    marker-opacity: 0.5;
                    marker-fill: #FFF;
                    [a>2]{
                        marker-fill: #000;
                    }
                }
                `,
            feature: { a: 5 },
            expected: {
                color: 'rgba(0,0,0,0.5)',
                collide: getReferenceDefaultMarkerValue('allow-overlap'),
                size: getReferenceDefaultMarkerValue('width'),
                blend: 'overlay',
                outlineColor: 'rgba(0,0,0,0.5)',
                outlineSize: getReferenceDefaultMarkerValue('stroke-width')
            }
        }

        ,
        {
            name: 'color callback, opacity callback',
            ccss: `
                #layer{
                    marker-type: ellipse;
                    marker-opacity: 0.5;
                    marker-fill: #FFF;
                    [a>2]{
                        marker-fill: #000;
                    }
                    [b>2]{
                        marker-opacity: 0.1;
                    }
                }
                `,
            feature: { a: 0, b:0 },
            expected: {
                color: 'rgba(255,255,255,0.5)',
                collide: getReferenceDefaultMarkerValue('allow-overlap'),
                size: getReferenceDefaultMarkerValue('width'),
                blend: 'overlay',
                outlineColor: 'rgba(0,0,0,0.5)',
                outlineSize: getReferenceDefaultMarkerValue('stroke-width')
            }
        }

        //TODO Test opacity overrides opacity-outline & opacity-fill

        //TODO Test plus (blending)

        //TODO Test unsupported

        //TODO Test complex
    ];

    scenarios.forEach(function (scenario) {
        describe(scenario.name, function () {
            const expected = scenario.expected;
            const output = tangram_carto.layerToYAML(CartoCSSRenderer.render(scenario.ccss).getLayers()[0]);
            //console.log(JSON.stringify(output, null, 4));
            describe('.draw', function () {
                it('should have color', function () {
                    assert.strictEqual(evalIfNeeded(output.draw.points.color, scenario.feature), expected.color);
                });
                it('should have collide', function () {
                    assert.strictEqual(evalIfNeeded(output.draw.points.collide, scenario.feature), expected.collide);
                });
                it('should have size', function () {
                    assert.strictEqual(evalIfNeeded(output.draw.points.size, scenario.feature), expected.size);
                });
                it('should have blend mode: src-over, called overlay in Tangram', function () {
                    assert.strictEqual(evalIfNeeded(output.draw.points.blend, scenario.feature), expected.blend);
                });
                describe('.outline', function () {
                    it('should have color', function () {
                        assert.strictEqual(evalIfNeeded(output.draw.points.outline.color, scenario.feature), expected.outlineColor);
                    });
                    it('should have size', function () {
                        assert.strictEqual(evalIfNeeded(output.draw.points.outline.width, scenario.feature), expected.outlineSize);
                    });
                });
            });
        });
    });
});
