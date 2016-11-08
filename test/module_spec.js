/* globals describe, it */

import chai from 'chai';
let assert = chai.assert;

import CCSS from '../src/module';

describe('CCSS', () => {
  describe('.carto2Draw', () => {
    it('should transfrom CCSS into a draw object with only a polygons property', () => {
      const CartoCSS = `
        #layer {
          polygon-fill: orange;
          [height<20] {
            polygon-fill: #b5f;
          }
          [height>20] {
            polygon-fill: #f50;
          }
        }`;

      let draw = CCSS.carto2Draw(CartoCSS);

      assert.property(draw, 'polygons');
					});
			});
	});
