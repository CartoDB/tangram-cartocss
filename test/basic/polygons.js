/* globals describe, it */
import Utils from '../utils/utils';
import chai from 'chai';
let assert = chai.assert;

import Polygon from '../../src/basic/polygons';

let polygonCCSS =
  ` // polygons
  #layer {
    polygon-fill: #F00;

    [height > 10] {
      polygon-opacity: 0.6;
    }

    [height > 15] {
      polygon-opacity: 0.3;
    }

  }
`;

describe('Polygon', () => {
  const c3ss = Utils.getShader(polygonCCSS);

  describe('.getDraw()', () => {
    let polygon = Polygon.getDraw(c3ss).polygons_blend;

    it('should have color', () => {
      assert.property(polygon, 'color');
    });

    describe('.color: ', () => {
      it('should be rgba(255, 0, 0, 1)', () => {
        assert.equal(Utils.eval(polygon.color)({}, 10), 'rgba(255, 0, 0, 1)');
      });

      it('should be rgba(255, 0, 0, 0.6) with height > 10', () => {
        assert.equal(Utils.eval(polygon.color)({
          height: 11
        }, 10), 'rgba(255, 0, 0, 0.6)');
      });

      it('should be rgba(255, 0, 0, 0.3) with height > 15', () => {
        assert.equal(Utils.eval(polygon.color)({
          height: 16
        }, 10), 'rgba(255, 0, 0, 0.3)');
      });
    });

    it('should not have size', () => {
      assert.notProperty(polygon, 'size');
    });

    it('should not have width', () => {
      assert.notProperty(polygon, 'width');
    });

  });

  describe('.getStyle()', () => {
    let polygon = Polygon.getStyle(c3ss);

    it('should have polygons_blend property', () => {
      assert.property(polygon, 'polygons_blend');
    });

    describe('.polygons_blend', () => {
      it('should have base property', () => {
        assert.property(polygon.polygons_blend, 'base');
      });

      it('shoul have blend property', () => {
        assert.property(polygon.polygons_blend, 'blend');
      });

      it('should have base property equal to polygons', () => {
        assert.equal(polygon.polygons_blend.base, 'polygons');
      });

      it('should have blend property equal to overlay', () => {
        assert.equal(polygon.polygons_blend.blend, 'overlay');
      });
    });
  });
});
