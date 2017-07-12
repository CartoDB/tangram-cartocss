/* globals describe, it */
import Utils from '../utils/utils';
import chai from 'chai';
import MD5 from 'md5';
let assert = chai.assert;

import Dots from '../../src/basic/dots';

let dotCCSS =
` // Marker with global opacity and border
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

describe( 'Point', () => {
  const c3ss = Utils.getShader(dotCCSS);
  const id = MD5(dotCCSS);

  describe('.getDraw()', () => {
    let dot = Dots.getDraw(c3ss, id)['dots_' + id];

    it('should have size', () => {
      assert.property(dot, 'size');
    });
  });
});
