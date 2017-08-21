/* globals describe, it */
import Utils from '../utils/utils';
import chai from 'chai';
let expect = chai.expect;

import { getCollide } from '../../src/basic/points';


describe('Points', () => {
  describe('.getCollide', () => {
    it('Should return false when marker-allow-overlap is not defined', () => {
      const c3ss = Utils.getShader('#layer {  marker-line-color: #FFF; }');
      expect(getCollide(c3ss)).to.equal(false);
    });
    it('Should return true when marker-allow-overlap is true', () => {
      const c3ss = Utils.getShader('#layer { marker-allow-overlap: true; }');
      expect(getCollide(c3ss)).to.equal(false);
    });
    it('Should return false when marker-allow-overlap is false', () => {
      const c3ss = Utils.getShader('#layer { marker-allow-overlap: false; }');
      expect(getCollide(c3ss)).to.equal(true);
    });
    describe('Should throw an error when marker-allow-overlap is filtered', () => {
      it('Case 0', () => {
        const c3ss = Utils.getShader('#layer { marker-fill: red; [foo > 100]{ marker-allow-overlap: true; }}');
        expect(() => getCollide(c3ss)).to.throw(/marker-allow-overlap is not supported inside filters/);
      });
      it('Case 1', () => {
        const c3ss = Utils.getShader('#layer { marker-allow-overlap: false; [foo > 100]{ marker-allow-overlap: true; }}');
        expect(() => getCollide(c3ss)).to.throw(/marker-allow-overlap is not supported inside filters/);
      });
      it('Case 2', () => {
        const c3ss = Utils.getShader('#layer [foo > 100]{ marker-allow-overlap: true; }');
        expect(() => getCollide(c3ss)).to.throw(/marker-allow-overlap is not supported inside filters/);
      });
    });
  });
});
