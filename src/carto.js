const Carto = require('carto');
const Points = require('./basic/points');
const Polygons = require('./basic/polygons');
const Lines = require('./basic/lines');
const TextPoints = require('./basic/text');
const tangramReference = require('tangram-reference');
const MD5 = require('md5');

const ref = tangramReference.load('1.0.0');
const CartoCSSRenderer = new Carto.RendererJS({
  reference: ref,
  strict: true
});

const carto2Draw = function (ccss, index) {
  let layers = CartoCSSRenderer.render(ccss).getLayers(),
      id = MD5(ccss),
      tLy = [];

  // NOTE: this is wrong, we have to separate the layers.
  for (var i = 0; i < layers.length; i++) {
		let ly = layers[i].shader,
        draw = {},
        textures = {},
        styles = {};

    Object.assign(
        draw,
        Points.getDraw(ly, id),
        Polygons.getDraw(ly, id),
        Lines.getDraw(ly, id),
        TextPoints.getDraw(ly, id)
      );

    Object.assign(
        textures,
        Points.getTextures(ly),
        Polygons.getTextures(ly)
      );

    Object.assign(
        styles,
        Points.getStyle(ly, id, index),
        Polygons.getStyle(ly, id, index),
        Lines.getStyle(ly, id, index),
        TextPoints.getStyle(ly, id, index)
      );

    tLy.push({textures, draw, styles, name:ly.attachment});
  }

  return tLy;
};

module.exports = {
  carto2Draw: carto2Draw,
};
