import Carto from 'carto';
import MD5 from 'md5';
import Points from './basic/points';
import Polygons from './basic/polygons';

const CCSS = new Carto.RendererJS();

const extractFeatures = function (ccss) {
  let layers = CCSS.render(ccss).getLayers(),
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
        );

      Object.assign(
          textures,
          Points.getTextures(ly)
        );

      Object.assign(
          styles,
          Points.getStyle(ly),
          Polygons.getStyle(ly)
        );
  }

  return {textures, draw, styles};
};

var C2T;

export default C2T = {
  extractFeatures
};
