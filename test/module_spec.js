/* globals describe, it */
import Utils from './utils/utils';
import chai from 'chai';
let assert = chai.assert;

import CCSS from '../src/module';

describe('CCSS', () => {
  const CartoCSS = `
    #layer {
      polygon-fill: #ffa000;
      [height<20] {
        polygon-fill: #bb55ff;
      }
      [height>20] {
        polygon-fill: #f50;
      }
    }`;

  describe('.carto2Draw', () => {
    it('should transfrom CCSS into a draw object with only a polygons property', () => {
      let draw = CCSS.carto2Draw(CartoCSS);

      assert.property(draw, 'polygons');
      assert.notProperty(draw, 'lines');
					});
    it('should have a color property', () => {
      let draw = CCSS.carto2Draw(CartoCSS);

      assert.notEqual(draw.polygons.color, '');
      assert.equal(draw.polygons.size, '');
      assert.notEqual(draw.polygons.width, '');
					});
			});

  describe('.color function', () => {
					let draw = CCSS.carto2Draw(CartoCSS);

					it('should be a string', () => {
							assert.isString(draw.polygons.color);
						});

					it('should be eval into a function', () => {
							let fn = '(' + draw.polygons.color + ')';
							assert.isFunction(eval(fn));
						});

					it('should return #ffa000 if height === 20', () => {
							let fn = Utils.eval(draw.polygons.color);
							let res = fn({ height: 20 }, 10);
							assert.equal(res, '#ffa000');
						});

					it('should return #bb55ff with height < 20', () => {
							let fn = Utils.eval(draw.polygons.color);
							let res = fn({ height: 10 }, 10);
							assert.equal(res, '#bb55ff');
						});

					it('should return #ff5500 with height > 20', () => {
						let fn = Utils.eval(draw.polygons.color);
						let res = fn({ height: 22 }, 10);
						assert.equal(res, '#ff5500');
					});
    });
	});
