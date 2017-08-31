var assert = require('assert');

const tangramReference = require('tangram-reference').load();
const Carto = require('carto');
const CartoCSSRenderer = new Carto.RendererJS({
    reference: tangramReference,
    strict: true
});
const color = require('../src/color.js');

const tangram_carto = require('../src/index.js');
const scenarios = require('./scenarios.js');
const { evalIfNeeded, getReferenceDefaultLineValue, getReferenceDefaultPolygonValue } = require('./utils.js');

describe('Markers', function () {
    scenarios.forEach(function (scenario) {
        describe(scenario.name, function () {
            const expected = scenario.expected;
            const output = tangram_carto.layerToYAML(CartoCSSRenderer.render(scenario.ccss).getLayers()[0], 0);
            //console.log(JSON.stringify(output, null, 4));
            describe('.draw', function () {
                it('should have color', function () {
                    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.color, scenario.feature), color.normalize(expected.color, tangramReference));
                });
                it('should have collide', function () {
                    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.collide, scenario.feature), expected.collide);
                });
                it('should have size', function () {
                    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.size, scenario.feature), expected.size);
                });
                it('should have blend mode: src-over, called overlay in Tangram', function () {
                    assert.strictEqual(evalIfNeeded(output.styles.style0.blend, scenario.feature), expected.blend);
                });
                //TODO test blend_order
                describe('.outline', function () {
                    it('should have color', function () {
                        assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.outline.color, scenario.feature), color.normalize(expected.outlineColor, tangramReference));
                    });
                    it('should have size', function () {
                        assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.outline.width, scenario.feature), expected.outlineSize);
                    });
                });
            });
        });
    });
    it('should be empty when symbolizer is not active', function () {
        const ccss = '#layer{}';
        const output = tangram_carto.layerToYAML(CartoCSSRenderer.render(ccss).getLayers()[0], 0);
        assert.ok(output.draw.drawGroup0 === undefined);
    });
});

it('polygon default', function () {
    const ccss = `
    #layer {
      polygon-opacity: 1;
    }
    `;
    const output = tangram_carto.layerToYAML(CartoCSSRenderer.render(ccss).getLayers()[0], 0);
    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.color),
        color.normalize(getReferenceDefaultPolygonValue('fill')));

    assert.strictEqual(evalIfNeeded(output.styles.style0.blend),
        'overlay');

    assert.strictEqual(evalIfNeeded(output.styles.style0.blend_order),
        0);
});
it('polygon all defined', function () {
    const ccss = `
    #layer {
        polygon-fill: red;
        polygon-opacity: 0.1;
        polygon-comp-op: src-over;
    }
    `;
    const output = tangram_carto.layerToYAML(CartoCSSRenderer.render(ccss).getLayers()[0], 0);

    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.color),
        'rgba(255,0,0,0.1)');

    assert.strictEqual(evalIfNeeded(output.styles.style0.blend),
        'overlay');

    assert.strictEqual(evalIfNeeded(output.styles.style0.blend_order),
        0);
});


it('line default', function () {
    const ccss = `
    #layer {
      line-opacity: 1;
    }
    `;
    const output = tangram_carto.layerToYAML(CartoCSSRenderer.render(ccss).getLayers()[0], 0);
    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.color),
        color.normalize(getReferenceDefaultLineValue('stroke')));

    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.width),
        getReferenceDefaultLineValue('stroke-width'));

    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.join),
        getReferenceDefaultLineValue('stroke-linejoin'));

    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.cap),
        getReferenceDefaultLineValue('stroke-linecap'));

    assert.strictEqual(evalIfNeeded(output.styles.style0.blend),
        'overlay');

    assert.strictEqual(evalIfNeeded(output.styles.style0.blend_order),
        0);
});
it('line all defined', function () {
    const ccss = `
    #layer {
        line-color: red;
        line-width: 0.1;
        line-opacity: 0.2;
        line-join: round;
        line-cap: square;
        line-comp-op: plus;
    }
    `;
    const output = tangram_carto.layerToYAML(CartoCSSRenderer.render(ccss).getLayers()[0], 0);
    console.log(output)
    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.color),
        'rgba(255,0,0,0.2)');

    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.width),
        0.1);

    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.join),
        'round');

    assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.cap),
        'square');

    assert.strictEqual(evalIfNeeded(output.styles.style0.blend),
        'add');

    assert.strictEqual(evalIfNeeded(output.styles.style0.blend_order),
        0);
});

//TODO test blend_order with layer>0