/* globals describe, it */
import Utils from '../utils/utils';
import chai from 'chai';
import MD5 from 'md5';

let assert = chai.assert;

import TextPoint from '../../src/basic/text';

let textCCSS =
  ` // Text
  #layer {
    text-fill: #F00;
    text-size: 15px;
    text-name: 'Hola';
    [height > 10] {
      text-size: 20px;
      text-opacity: 0.6;
    }

    [height > 15] {
      text-size: 30px;
      text-opacity: 0.3;
    }
  }
`;


describe('Text', () => {
  const c3ss = Utils.getShader(textCCSS);
  const id = MD5(textCCSS);

  describe('.getDraw()', () => {
    let text = TextPoint.getDraw(c3ss, id)['text_' + id].text;

    it('should have font', () => {
      assert.property(text, 'font');
    });

    it('should have fill', () => {
      assert.property(text.font, 'fill');
    });

    describe('.fill: ', () => {
      it('should be rgba(255, 0, 0, 1)', () => {
        assert.equal(Utils.eval(text.font.fill)({}, 10), 'rgba(255, 0, 0, 1)');
      });

      it('should be rgba(255, 0, 0, 0.6) with height > 10', () => {
        assert.equal(Utils.eval(text.font.fill)({
          height: 11
        }, 10), 'rgba(255, 0, 0, 0.6)');
      });

      it('should be rgba(255, 0, 0, 0.3) with height > 15', () => {
        assert.equal(Utils.eval(text.font.fill)({
          height: 16
        }, 10), 'rgba(255, 0, 0, 0.3)');
      });
    });

    it('should not have width', () => {
      assert.notProperty(text.font, 'width');
    });

    it('should have size', () => {
      assert.property(text.font, 'size');
    });

    describe('.size: ', () => {
      it('should be 15', () => {
        assert.equal(Utils.eval(text.font.size)({}, 10), '15');
      });

      it('should be 20 with height > 10', () => {
        assert.equal(Utils.eval(text.font.size)({
          height: 11
        }, 10), '20');
      });

      it('should be 30 with height > 15', () => {
        assert.equal(Utils.eval(text.font.size)({
          height: 16
        }, 10), '30');
      });
    });

  });

  describe('.getStyle()', () => {
    let text = TextPoint.getStyle(c3ss, id);
    it('should have text_id property', () => {
      assert.property(text, 'text_' + id);
    });

    describe('.text_blend', () => {
      let text_blend = text['text_' + id];
      it('should have base property', () => {
        assert.property(text_blend, 'base');
      });

      it('shoul have blend property', () => {
        assert.property(text_blend, 'blend');
      });

      it('should have base property equal to text', () => {
        assert.equal(text_blend.base, 'points');
      });

      it('should have blend property equal to overlay', () => {
        assert.equal(text_blend.blend, 'overlay');
      });
    });
  });
});
