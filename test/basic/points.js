/* globals describe, it */
import Utils from '../utils/utils';
import chai from 'chai';
import MD5 from 'md5';
let assert = chai.assert;

import Point from '../../src/basic/points';

let pointCCSS =
` // Marker with global opacity and border
  #layer {
    marker-fill: #F00;
    marker-width: 15px;
    marker-line-width: 2px;
    marker-line-color: #00F;

    [height > 10] {
      marker-width: 20px;
      marker-line-width: 4px;
      marker-opacity: 0.6;
      marker-line-opacity: 0.6;
    }

    [height > 15] {
      marker-width: 30px;
      marker-line-width: 6px;
      marker-opacity: 0.3;
      marker-line-opacity: 0.3;
    }

  }
`;

describe('Point', () => {
  const c3ss = Utils.getShader(pointCCSS);
  const id = MD5(pointCCSS);

  describe('.getDraw()', () => {
    let point = Point.getDraw(c3ss, id)['points_' + id];

    it('should have color', () => {
      assert.property(point, 'color');
    });

    describe('.color: ', () => {
      it('should be rgba(255, 0, 0, 1)', () => {
        assert.equal(Utils.eval(point.color)({}, 10), 'rgba(255, 0, 0, 1)');
      });

      it('should be rgba(255, 0, 0, 0.6) with height > 10', () => {
        assert.equal(Utils.eval(point.color)({height: 11}, 10), 'rgba(255, 0, 0, 0.6)');
      });

      it('should be rgba(255, 0, 0, 0.3) with height > 15', () => {
        assert.equal(Utils.eval(point.color)({height: 16}, 10), 'rgba(255, 0, 0, 0.3)');
      });
    });

    it('should have size', () => {
      assert.property(point, 'size');
    });

    describe('.size: ', () => {
      it('should be 15', () => {
        assert.equal(Utils.eval(point.size)({}, 10), '15');
      });

      it('should be 20 with height > 10', () => {
        assert.equal(Utils.eval(point.size)({height: 11}, 10), '20');
      });

      it('should be 30 with height > 15', () => {
        assert.equal(Utils.eval(point.size)({height: 16}, 10), '30');
      });
    });

    it('should have outline.width', () => {
      assert.property(point, 'outline');
      assert.property(point.outline, 'width');
    });

    describe('.outline.width: ', () => {
      it('should be 2', () => {
        assert.equal(Utils.eval(point.outline.width)({}, 10), '2');
      });

      it('should be 4 with height > 10', () => {
        assert.equal(Utils.eval(point.outline.width)({height: 11}, 10), '4');
      });

      it('should be 6 with height > 15', () => {
        assert.equal(Utils.eval(point.outline.width)({height: 16}, 10), '6');
      });
    });

    it('should have outline.color', () => {
      assert.property(point, 'outline');
      assert.property(point.outline, 'color');
    });

    describe('.outline.color: ', () => {
      it('should be rgba(0, 0, 255, 1)', () => {
        assert.equal(Utils.eval(point.outline.color)({}, 10), 'rgba(0, 0, 255, 1)');
      });

      it('should be rgba(0, 0, 255, 0.6) with height > 10', () => {
        assert.equal(Utils.eval(point.outline.color)({height: 11}, 10), 'rgba(0, 0, 255, 0.6)');
      });

      it('should be rgba(0, 0, 255, 0.3) with height > 15', () => {
        assert.equal(Utils.eval(point.outline.color)({height: 16}, 10), 'rgba(0, 0, 255, 0.3)');
      });
    });

    it('should not have collide', () => {
      assert.equal(point.collide, false);
    });
  });

  describe('.getStyle()', () => {
    let point = Point.getStyle(c3ss, id);

    it('should have points_blend property', () => {
      assert.property(point, 'points_' + id);
    });

    describe('.points_blend', () => {
      let points_blend = point['points_' + id];
      it('should have base property', () => {
        assert.property(points_blend, 'base');
      });

      it('shoul have blend property', () => {
        assert.property(points_blend, 'blend');
      });

      it('should have base property equal to points', () => {
        assert.equal(points_blend.base, 'points');
      });

      it('should have blend property equal to overlay', () => {
        assert.equal(points_blend.blend, 'overlay');
      });
    });
  });
});
