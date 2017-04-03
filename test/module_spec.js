/* globals describe, it */
import Utils from './utils/utils';
import chai from 'chai';
import MD5 from 'md5';
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

	let configs = CCSS.carto2Draw(CartoCSS);
  const id = MD5(CartoCSS);
  configs.forEach(conf => {
    describe('.carto2Draw', () => {

        it('should transfrom CCSS into a conf object with styles, textures and draw properties', () => {

          assert.property(conf, 'styles');
          assert.property(conf, 'textures');
          assert.property(conf, 'draw');
        });

        it('should have an empty textures object', () => {
          assert.notStrictEqual(conf.textures, {});
      });

        describe('.draw', () => {

          it('should have a polygons_id property', () => {
            assert.property(conf.draw, 'polygons_' + id);
          });


          describe('.polygons_blend', () => {
            let pb = conf.draw['polygons_' + id];
            it('should have a color property', () => {
              assert.property(pb, 'color');
            });

            it('should not have a size property', () => {
              assert.notProperty(pb, 'size');
            });

            it('should not have a collide property', () => {
              assert.notProperty(pb, 'collide');
            });
          });

          it('should not have a lines_blend property', () => {
            assert.notProperty(conf.draw, 'lines_blend');
          });

          describe('.lines_blend', () => {
            it('should have an empty lines_blend object', () => {
              assert.notStrictEqual(conf.draw.lines_blend, {});
            });
          });

          it('should not have a points_blend property', () => {
            assert.notProperty(conf.draw, 'points_blend');
          });

          describe('.points_blend', () => {
            it('should have an empty points_blend object', () => {
              assert.notStrictEqual(conf.draw.points_blend, {});
            });
          });
        });

    });

    describe('.color porperty', () => {
      let color = conf.draw['polygons_' + id].color;

      it('should be a function', () => {
        assert.isFunction(color);
      });

      it('should fail if it is executed without context', () => {
        assert.throws(color);
      });

      it('should return rgba(255, 160, 0, 1) if height === 20', () => {
        let fn = Utils.eval(color);
        let res = fn({ height: 20 }, 10);
        assert.equal(res, 'rgba(255, 160, 0, 1)');
      });

      it('should return rgba(187, 85, 255, 1) with height < 20', () => {
        let fn = Utils.eval(color);
        let res = fn({ height: 10 }, 10);
        assert.equal(res, 'rgba(187, 85, 255, 1)');
      });

      it('should return rgba(255, 85, 0, 1) with height > 20', () => {
        let fn = Utils.eval(color);
        let res = fn({ height: 22 }, 10);
        assert.equal(res, 'rgba(255, 85, 0, 1)');
      });
    });
  });
});
