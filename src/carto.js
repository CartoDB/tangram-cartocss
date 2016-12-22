import Carto from 'carto';
import Points from './basic/points';
import Polygons from './basic/polygons';
import Lines from './basic/lines';

const CartoCSSRenderer = new Carto.RendererJS();

const extractFeatures = function (ccss) {
  let layers = CartoCSSRenderer.render(ccss).getLayers(),
      draw = {},
      styles = {},
      textures = {};

  // NOTE: this is wrong, we have to separate the layers.
  for (var i = 0; i < layers.length; i++) {
		let ly = layers[i].shader;

    Object.assign(
        draw,
        Points.getDraw(ly),
        Polygons.getDraw(ly),
        Lines.getDraw(ly)
      );

    Object.assign(
        textures,
        Points.getTextures(ly)
      );

    Object.assign(
        styles,
        Points.getStyle(ly),
        Polygons.getStyle(ly),
        Lines.getStyle(ly)
      );
  }

  return {textures, draw, styles};
};

var C2T;

export default C2T = {
  extractFeatures
};
