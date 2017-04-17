import { assert } from 'chai';
import Utils from '../../src/utils/utils';

describe('Utils', () => {
  describe('.generateDefault()', () => {
    it('should return the return line.', () => {
      assert.equal(Utils.generateDefault('#ff0000'), 'return #ff0000;');
    });
  });

  describe('.transpile2Tangram()', () => {

    it('should transpile a ctx.zoom property into a $zoom variable and data into feature.', () => {
      const jsLine = 'if((8388607 & (1 << ctx.zoom)) && data[\'calificacion\'] === \'GRAVE\'){_value = true;}';
      const validTangramJS = 'if((8388607 & (1 << $zoom)) && feature[\'calificacion\'] === \'GRAVE\'){_value = true;}';

      assert.equal(Utils.transpile2Tangram(jsLine), validTangramJS);
    });

    it('should transform mapnik::geometry_type into $geometry and 1 into point', () => {
      const jsLine = 'if((8388607 & (1 << ctx.zoom)) && data[\'calificacion\'] === \'GRAVE\' && data[\'mapnik::geometry_type\'] === 1){_value = true;}';
      const validTangramJS = 'if((8388607 & (1 << $zoom)) && feature[\'calificacion\'] === \'GRAVE\' && $geometry === "point"){_value = true;}';

      assert.equal(Utils.transpile2Tangram(jsLine), validTangramJS);
    });

    it('should transform mapnik::geometry_type into $geometry and 2 into line', () => {
      const jsLine = 'if((8388607 & (1 << ctx.zoom)) && data[\'calificacion\'] === \'GRAVE\' && data[\'mapnik::geometry_type\'] === 2){_value = true;}';
      const validTangramJS = 'if((8388607 & (1 << $zoom)) && feature[\'calificacion\'] === \'GRAVE\' && $geometry === "line"){_value = true;}';

      assert.equal(Utils.transpile2Tangram(jsLine), validTangramJS);
    });

    it('should transform mapnik::geometry_type into $geometry and 3 into polygon', () => {
      const jsLine = 'if((8388607 & (1 << ctx.zoom)) && data[\'calificacion\'] === \'GRAVE\' && data[\'mapnik::geometry_type\'] === 3){_value = true;}';
      const validTangramJS = 'if((8388607 & (1 << $zoom)) && feature[\'calificacion\'] === \'GRAVE\' && $geometry === "polygon"){_value = true;}';

      assert.equal(Utils.transpile2Tangram(jsLine), validTangramJS);
    });
  });

  describe('.wrapCodeInFunction()', () => {
    const jsLine = 'if((8388607 & (1 << ctx.zoom)) && data[\'calificacion\'] === \'GRAVE\' && data[\'mapnik::geometry_type\'] === 3){_value = true;}';

    it('should return a complete function string', () => {
      const wrap = 'function ( ) {\nvar _value = null;\nif((8388607 & (1 << ctx.zoom)) && data[\'calificacion\'] === \'GRAVE\' && data[\'mapnik::geometry_type\'] === 3){_value = true;}\nreturn _value;\n}';
      assert.equal(Utils.wrapCodeInFunction(jsLine), wrap);
    });

    it('should return a complete function string with argument $zoom', () => {
      const wrap = 'function ($zoom) {\nvar _value = null;\nif((8388607 & (1 << ctx.zoom)) && data[\'calificacion\'] === \'GRAVE\' && data[\'mapnik::geometry_type\'] === 3){_value = true;}\nreturn _value;\n}';
      assert.equal(Utils.wrapCodeInFunction(jsLine, ['$zoom']), wrap);
    });
  });

  describe('.functionString()', () => {
    const strFunction = 'function ( ) {\nvar _value = null;\nif((8388607 & (1 << ctx.zoom)) && data[\'calificacion\'] === \'GRAVE\' && data[\'mapnik::geometry_type\'] === 3){_value = true;}\nreturn _value;\n}';

    it('should return an executable js function', () => {
      assert.typeOf(Utils.functionString(strFunction), 'function');
    });

    it('should return an executable function with a custom toString', () => {
      const strFn = Utils.functionString(strFunction).toString();
      assert.equal(strFunction, strFn);
    });
  });

  describe('.buildCCSSFn()', () => {
    const jsLines = [
      'if((8388607 & (1 << ctx.zoom)) && feature[\'calificacion\'] === \'GRAVE\'){_value = true;}',
      'if((8388607 & (1 << ctx.zoom)) && feature[\'calificacion\'] === 34){_value = false;}'
    ];

    it('should build an executable function from an array of js lines', () => {
      assert.typeOf(Utils.buildCCSSFn(jsLines), 'function');
    });

    it('should build an executable function with a custom toString', () => {
      const strFn = 'function ( ) {\nvar _value = null;\nif((8388607 & (1 << $zoom)) && feature[\'calificacion\'] === \'GRAVE\'){_value = true;}if((8388607 & (1 << $zoom)) && feature[\'calificacion\'] === 34){_value = false;}\nreturn _value;\n}';
      assert.equal(Utils.buildCCSSFn(jsLines).toString(), strFn);
    });

    it('should build an executable function with a custom toString with no data variable in it', () => {
      const strFn = 'function ( ) {\nvar _value = null;\nif((8388607 & (1 << $zoom)) && data[\'calificacion\'] === \'GRAVE\'){_value = true;}if((8388607 & (1 << $zoom)) && data[\'calificacion\'] === 34){_value = false;}\nreturn _value;\n}';
      assert.notEqual(Utils.buildCCSSFn(jsLines).toString(), strFn);
    });

    it('should build an executable function with a custom toString and a feature param', () => {
      const strFn = 'function (feature) {\nvar _value = null;\nif((8388607 & (1 << $zoom)) && feature[\'calificacion\'] === \'GRAVE\'){_value = true;}if((8388607 & (1 << $zoom)) && feature[\'calificacion\'] === 34){_value = false;}\nreturn _value;\n}';
      assert.equal(Utils.buildCCSSFn(jsLines, ['feature']).toString(), strFn);
    });

    it('should build an executable function that can be executed and return false', () => {
      const fn = Utils.buildCCSSFn(jsLines, ['feature', '$zoom']);
      assert.equal(fn({calificacion: 34}, 10), false);
    });
  });

  describe('.cleanForExecuting()', () => {
    it('should clean the code to be executed', () => {
      const jsLine = 'if((8388607 & (1 << ctx.zoom)) && data[\'calificacion\'] === \'GRAVE\'){_value = true;}';

      assert.equal(Utils.cleanForExecuting(jsLine), 'if((8388607 & (1 << ctx.zoom)) && true){_value = true;}');
    });
  });

  describe('.buildAndExecuteFn()', () => {
    const jsLines = [
      'if((8388607 & (1 << ctx.zoom)) && data[\'calificacion\'] === \'GRAVE\'){_value = true;}',
      'if((8388607 & (1 << ctx.zoom)) && data[\'calificacion\'] === 34){_value = false;}'
    ];

    it('should build an executable function and return the value of the execution', () => {
      assert.equal(Utils.buildAndExecuteFn(jsLines), false);
    });
  });


});
