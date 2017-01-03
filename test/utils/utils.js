import Carto from 'carto';

var Utils = {};

Utils.wrapEval = function (fn) {
  return `
    (function (feature, $zoom) {
      return (${fn}());
    })
  `;
};

Utils.eval = function (fns) {
  let fn = eval(Utils.wrapEval(fns));

  return fn;
};

Utils.getShader = function (ccss) {
  return new Carto.RendererJS()
    .render(ccss).getLayers()[0].shader;
};

export default Utils;
