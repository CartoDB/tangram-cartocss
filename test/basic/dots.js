/* globals describe, it */
import Utils from '../utils/utils';
import chai from 'chai';
import MD5 from 'md5';
let assert = chai.assert;

import Dots from '../../src/basic/dots';

let dotCCSS =
` // Dot
  #layer {
    dot-fill: #F00;
    dot-width: 15px;
    dot-height: 10px;

    [height > 10] {
      dot-width: 20px;
      dot-opacity: 0.6;
    }

    [height > 15] {
      dot-width: 30px;
      dot-opacity: 0.3;
    }
  }
`;

describe('Dot', () => {
  const c3ss = Utils.getShader(dotCCSS);
  const id = MD5(dotCCSS);

  describe('.getDraw()', () => {
    let dot = Dots.getDraw(c3ss, id)['dots_' + id];

    it('should not have collide', () => {
      assert.equal(dot.collide, false);
    });

    describe('width ', () => {
      it('should have size', () => {
        assert.property(dot, 'size');
      });

      it('should be 15px by default', () => {
        assert.equal(Utils.eval(dot.size)({}, 10), '15');
      });

      it('should be 20px when zoom > 10', () => {
        assert.equal(Utils.eval(dot.size)({height: 12}, 10), '20');
      });

      it('should be 30px when zoom > 15', () => {
        assert.equal(Utils.eval(dot.size)({height: 18}, 10), '30');
      });
    });

    describe('fill ', () => {
      it('should have fill', () => {
        assert.property(dot, 'color');
      });

      it('should be #f00 by default', () => {
        assert.equal(Utils.eval(dot.color)({}, 10), 'rgba(255, 0, 0, 1)');
      });

      it('should be rgba(255, 0, 0, 0.6) with height > 10', () => {
        assert.equal(Utils.eval(dot.color)({height: 12}, 10), 'rgba(255, 0, 0, 0.6)');
      });

      it('should be rgba(255, 0, 0, 0.3) with height > 15', () => {
        assert.equal(Utils.eval(dot.color)({height: 18}, 10), 'rgba(255, 0, 0, 0.3)');
      });
    });
  });

  describe('.getStyle()', () => {
    let dot = Dots.getStyle(c3ss, id);

    it('should have dots_id property', () => {
      assert.property(dot, 'dots_' + id);
    });

    describe('blend', () => {
      let dot_blend = dot['dots_' + id];

      it('should have base property', () => {
        assert.property(dot_blend, 'base');
      });

      it('shoul have blend property', () => {
        assert.property(dot_blend, 'blend');
      });

      it('should have base property equal to points', () => {
        assert.equal(dot_blend.base, 'points');
      });

      it('should have blend property equal to overlay', () => {
        assert.equal(dot_blend.blend, 'overlay');
      });
    });
  });
});
