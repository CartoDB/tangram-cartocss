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
            const output = tangram_carto.layerToScene(CartoCSSRenderer.render(scenario.ccss).getLayers()[0], 0);
            //console.log(JSON.stringify(output, null, 4));
            it('.draw', function () {
                assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.color, scenario.feature), color.normalize(expected.color, tangramReference));
                assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.size, scenario.feature), expected.size + 'px');
                assert.strictEqual(output.draw.drawGroup0.collide, expected.collide);
            });
            it('.draw.drawGroup0.outline', function () {
                assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.outline.color, scenario.feature), color.normalize(expected.outlineColor, tangramReference));
                assert.strictEqual(evalIfNeeded(output.draw.drawGroup0.outline.width, scenario.feature), expected.outlineSize + 'px');
            });
            it('.styles', function () {
                assert.strictEqual(output.styles.drawGroup0.blend, expected.blend);
                assert.strictEqual(output.styles.drawGroup0.blend_order, 0);
                assert.strictEqual(output.styles.drawGroup0.base, 'points');
            });
            if (expected.filter !== undefined) {
                it('.filter', function () {
                    assert.strictEqual(evalIfNeeded(output.filter, scenario.feature), expected.filter);
                });
            }
        });
    });
    it('should be empty when symbolizer is not active', function () {
        const ccss = '#layer{}';
        const output = tangram_carto.layerToScene(CartoCSSRenderer.render(ccss).getLayers()[0], 0);
        assert.ok(output.draw.drawGroup0 === undefined);
    });
});

it('polygon default', function () {
    const ccss = `
    #layer {
      polygon-opacity: 1;
    }
    `;
    const output = tangram_carto.layerToScene(CartoCSSRenderer.render(ccss).getLayers()[0], 0);
    assert.strictEqual(output.draw.drawGroup0.color, color.normalize(getReferenceDefaultPolygonValue('fill')));
    assert.strictEqual(output.styles.drawGroup0.blend, 'overlay');
    assert.strictEqual(output.styles.drawGroup0.blend_order, 0);
    assert.strictEqual(output.styles.drawGroup0.base, 'polygons');
});
it('polygon all defined', function () {
    const ccss = `
    #layer {
        polygon-fill: red;
        polygon-opacity: 0.1;
        polygon-comp-op: src-over;
    }
    `;
    const output = tangram_carto.layerToScene(CartoCSSRenderer.render(ccss).getLayers()[0], 0);

    assert.strictEqual(output.draw.drawGroup0.color, 'rgba(255,0,0,0.1)');
    assert.strictEqual(output.styles.drawGroup0.blend, 'overlay');
    assert.strictEqual(output.styles.drawGroup0.blend_order, 0);
    assert.strictEqual(output.styles.drawGroup0.base, 'polygons');
});


it('line default', function () {
    const ccss = `
    #layer {
      line-opacity: 1;
    }
    `;
    const output = tangram_carto.layerToScene(CartoCSSRenderer.render(ccss).getLayers()[0], 0);
    assert.strictEqual(output.draw.drawGroup0.color,
        color.normalize(getReferenceDefaultLineValue('stroke')));
    assert.strictEqual(output.draw.drawGroup0.width, getReferenceDefaultLineValue('stroke-width') + 'px');
    assert.strictEqual(output.draw.drawGroup0.join, getReferenceDefaultLineValue('stroke-linejoin'));
    assert.strictEqual(output.draw.drawGroup0.cap, getReferenceDefaultLineValue('stroke-linecap'));
    assert.strictEqual(output.styles.drawGroup0.blend, 'overlay');
    assert.strictEqual(output.styles.drawGroup0.blend_order, 0);
    assert.strictEqual(output.styles.drawGroup0.base, 'lines');
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
    const output = tangram_carto.layerToScene(CartoCSSRenderer.render(ccss).getLayers()[0], 0);
    assert.strictEqual(output.draw.drawGroup0.color, 'rgba(255,0,0,0.2)');
    assert.strictEqual(output.draw.drawGroup0.width, 0.1 + 'px');
    assert.strictEqual(output.draw.drawGroup0.join, 'round');
    assert.strictEqual(output.draw.drawGroup0.cap, 'square');
    assert.strictEqual(output.styles.drawGroup0.blend, 'add');
    assert.strictEqual(output.styles.drawGroup0.blend_order, 0);
    assert.strictEqual(output.styles.drawGroup0.base, 'lines');
});


it('multiple layers', function () {
    const ccss = `
    #layer {
        line-opacity: 1;
    }
    #layer2 {
        line-opacity: 1;
      }
    `;
    const output = tangram_carto.layerToScene(CartoCSSRenderer.render(ccss).getLayers()[1], 1);
    assert.strictEqual(output.draw.drawGroup1.color, color.normalize(getReferenceDefaultLineValue('stroke')));
    assert.strictEqual(output.draw.drawGroup1.width, getReferenceDefaultLineValue('stroke-width') + 'px');
    assert.strictEqual(output.draw.drawGroup1.join, getReferenceDefaultLineValue('stroke-linejoin'));
    assert.strictEqual(output.draw.drawGroup1.cap, getReferenceDefaultLineValue('stroke-linecap'));
    assert.strictEqual(output.styles.drawGroup1.blend, 'overlay');
    assert.strictEqual(output.styles.drawGroup1.blend_order, 1);
});

it('metersperpixel', function () {
    const ccss = `
    #layer {
        line-width: 2;
        [j>2]{
            line-width: 3;
        }
    }
    `;
    const output = tangram_carto.layerToScene(CartoCSSRenderer.render(ccss).getLayers()[0], 1);
    assert.strictEqual(output.draw.drawGroup1.color, color.normalize(getReferenceDefaultLineValue('stroke')));
    assert.strictEqual(evalIfNeeded(output.draw.drawGroup1.width, { j: 1 }, 5), 10);
    assert.strictEqual(output.draw.drawGroup1.join, getReferenceDefaultLineValue('stroke-linejoin'));
    assert.strictEqual(output.draw.drawGroup1.cap, getReferenceDefaultLineValue('stroke-linecap'));
    assert.strictEqual(output.styles.drawGroup1.blend, 'overlay');
    assert.strictEqual(output.styles.drawGroup1.blend_order, 1);
});

it('dash', function () {
    const ccss = `
    #layer {
        line-dasharray: 2,3;
    }
    `;
    const output = tangram_carto.layerToScene(CartoCSSRenderer.render(ccss).getLayers()[0], 1);
    assert.strictEqual(output.draw.drawGroup1.color, color.normalize(getReferenceDefaultLineValue('stroke')));
    assert.strictEqual(output.draw.drawGroup1.width, getReferenceDefaultLineValue('stroke-width') + 'px');
    assert.strictEqual(output.draw.drawGroup1.join, getReferenceDefaultLineValue('stroke-linejoin'));
    assert.strictEqual(output.draw.drawGroup1.cap, getReferenceDefaultLineValue('stroke-linecap'));
    assert.deepEqual(output.draw.drawGroup1.dash, [2, 3]);
    assert.strictEqual(output.styles.drawGroup1.blend, 'overlay');
    assert.strictEqual(output.styles.drawGroup1.blend_order, 1);
});


it('multiple symbolizers on one layer should generate an exception', function () {
    const ccss = `
    #layer {
        line-width: 2;
        marker-fill: red;
    }
    `;
    assert.throws(() => tangram_carto.layerToScene(CartoCSSRenderer.render(ccss).getLayers()[0], 1));
});

it('conditional blending should generate an exception', function () {
    const ccss = `
    #layer{
        [a>2]{
            marker-comp-op: plus;
        }
    }`;
    assert.throws(() => tangram_carto.layerToScene(CartoCSSRenderer.render(ccss).getLayers()[0], 0));
});

it('dynamic marker-allow-overlap should generate an exception', function () {
    const ccss = `
    #layer{
        marker-allow-overlap: false;
        [a>2]{
            marker-allow-overlap: true;
        }
    }`;
    assert.throws(() => tangram_carto.layerToScene(CartoCSSRenderer.render(ccss).getLayers()[0], 0));
});
