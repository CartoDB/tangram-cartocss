const assert = require('assert');
const translate = require('../src/translate.js');
const { evalFunctionString } = require('./utils.js');


describe('getColorFromLiteral', function () {
    it('should return normalized color with an undefined opacity', function () {
        assert.strictEqual(translate.getColorFromLiteral({ _hidden: {} }, 'black', true), 'rgba(0,0,0,1)');
    });
    it('should return literal color with a constant opacity', function () {
        assert.strictEqual(translate.getColorFromLiteral({
            _hidden: {
                'opacity:general': 0.5
            }
        }, 'black', true), 'rgba(0,0,0,0.5)');
    });
    it('should return callback with embed opacity callback that can override', function () {
        const ev = evalFunctionString(translate.getColorFromLiteral({
            _hidden: {
                'opacity:general': 'function(){return 0.5;}'
            }
        },
            'black', true));
        assert.strictEqual(ev, 'rgba(0,0,0,0.5)');
    });
    it('should return callback with embed opacity callback that can avoid the override', function () {
        const ev = evalFunctionString(translate.getColorFromLiteral({
            _hidden: {
                'opacity:general': 'function(){return undefined;}'
            }
        },
            'black', true));
        assert.strictEqual(ev, 'rgba(0,0,0,1)');
    });
});

describe('getColorOverrideCode', function () {
    it('should return an empty string with undefined opacity', function () {
        assert.strictEqual(translate.getColorOverrideCode({ _hidden: {} }, true), '');
    });
    it('should generate code that overrides _value opacity with an opacity literal', function () {
        var _value='rgba(0,0,0,0.1)';
        eval(translate.getColorOverrideCode(
            { _hidden: { 'opacity:general': 0.5 } },
            true));
        assert.strictEqual(_value, 'rgba(0,0,0,0.5)');
    });
    it('should generate code that overrides _value opacity with an opacity callback', function () {
        var _value='rgba(0,0,0,0.1)';
        eval(translate.getColorOverrideCode(
            { _hidden: { 'opacity:general': 'function(){return 0.5;}' } },
            true));
        assert.strictEqual(_value, 'rgba(0,0,0,0.5)');
    });
});