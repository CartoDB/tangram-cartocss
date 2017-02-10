/* globals describe, it */
import Utils from '../utils/utils';
import chai from 'chai';
import MD5 from 'md5';
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
  const id = MD5(polygonCCSS);

  describe('.getDraw()', () => {
    let polygon = Polygon.getDraw(c3ss, id)['polygons_' + id];

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
    let polygon = Polygon.getStyle(c3ss, id);

    it('should have polygons_blend property', () => {
      assert.property(polygon, 'polygons_' + id);
    });

    describe('.polygons_blend', () => {
      let polygons_blend = polygon['polygons_' + id];
      it('should have base property', () => {
        assert.property(polygons_blend, 'base');
      });

      it('shoul have blend property', () => {
        assert.property(polygons_blend, 'blend');
      });

      it('should have base property equal to polygons', () => {
        assert.equal(polygons_blend.base, 'polygons');
      });

      it('should have blend property equal to overlay', () => {
        assert.equal(polygons_blend.blend, 'overlay');
      });
    });
  });
});
