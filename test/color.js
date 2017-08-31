const assert = require('assert');

const color = require('../src/color.js');
const tangramReference = require('tangram-reference').load();

describe('color.js', function () {
    it('marshall', function () {
        assert.strictEqual(color.marshall({ r: 120.1, g: 120, b: 119.9, a: 0.123 }), 'rgba(120,120,120,0.123)')
    });
    it('unmarshall rgb', function () {
        assert.deepEqual(color.unmarshall('rgb(127,126,125)'), { r: 127, g: 126, b: 125, a: 1 });
    });
    it('unmarshall rgba', function () {
        assert.deepEqual(color.unmarshall('rgba(127,126,125, 0.123)'), { r: 127, g: 126, b: 125, a: 0.123 });
    });
    it('unmarshall string', function () {
        assert.deepEqual(color.unmarshall('blue', tangramReference), { r: 0, g: 0, b: 255, a: 1 });
    });
    it('unmarshall bad input', function () {
        assert.throws(function () { color.unmarshall('bad input') });
    });
    it('normalize', function () {
        assert.equal(color.normalize('blue', tangramReference), 'rgba(0,0,255,1)');
    });
});