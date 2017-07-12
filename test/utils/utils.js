import Carto from 'carto';
import tangramReference from 'tangram-reference';
const ref = tangramReference.load('1.0.0');

var Utils = {};

Utils.wrapEval = function (fn) {
  return `
    (function (feature, $zoom) {
      var $meters_per_pixel = 5000;
      return (${fn}());
    })
  `;
};

Utils.eval = function (fns) {
  let fn = eval(Utils.wrapEval(fns));

  return fn;
};

Utils.getShader = function (ccss) {
  return new Carto.RendererJS({
    reference: ref
  }).render(ccss).getLayers()[0].shader;
};

export default Utils;
