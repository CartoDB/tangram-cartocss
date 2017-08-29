/* globals describe, it */
import Utils from '../utils/utils';
import chai from 'chai';
let expect = chai.expect;

import { getCollide, getBlending } from '../../src/basic/points';

describe('Points', () => {
  describe('.getCollide', () => {
    it('Should return true when marker-allow-overlap is not defined', () => {
      const c3ss = Utils.getShader('#layer {  marker-line-color: #FFF; }');
      expect(getCollide(c3ss)).to.equal(true);
    });
    it('Should return false when marker-allow-overlap is true', () => {
      const c3ss = Utils.getShader('#layer { marker-allow-overlap: true; }');
      expect(getCollide(c3ss)).to.equal(false);
    });
    it('Should return true when marker-allow-overlap is false', () => {
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
  describe('.getBlending', () => {
    it('Should return "overlay" (default value) when marker-comp-op is not defined', () => {
      const c3ss = Utils.getShader('#layer {  marker-line-color: #FFF; }');
      expect(getBlending(c3ss)).to.equal('overlay');
    });
    it('Should return "multiply" when marker-comp-op is "multiply"', () => {
      const c3ss = Utils.getShader('#layer {  marker-comp-op: multiply; }');
      expect(getBlending(c3ss)).to.equal('multiply');
    });
    // This test fails because a bug in the tangram-reference.
    xit('Should return "add" when marker-comp-op is "plus"', () => {
      const c3ss = Utils.getShader('#layer {  marker-comp-op: plus; }');
      expect(getBlending(c3ss)).to.equal('add');
    });
    it('Should throw an error when marker-comp-op is filtered', () => {
      const c3ss = Utils.getShader('#layer { marker-fill: red; [foo > 100]{ marker-comp-op: multiply; }}');
      expect(() => getBlending(c3ss)).to.throw(/marker-comp-op is not supported inside filters/);
    });
  });
});
