import Carto from 'carto';
import Points from './basic/points';
import Polygons from './basic/polygons';
import Lines from './basic/lines';
import TextPoints from './basic/text';
import tangramReference from 'tangram-reference';
import MD5 from 'md5';

const ref = tangramReference.load('1.0.0');
const CartoCSSRenderer = new Carto.RendererJS({
  reference: ref,
  strict: true
});

const extractFeatures = function (ccss, index) {
  let layers = CartoCSSRenderer.render(ccss).getLayers();
  let id = MD5(ccss);
  let tLy = [];

  // NOTE: this is wrong, we have to separate the layers.
  for (var i = 0; i < layers.length; i++) {
    let ly = layers[i].shader;
    let draw = {};
    let textures = {};
    let styles = {};

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

    tLy.push({textures, draw, styles, name: ly.attachment});
  }

  return tLy;
};

export default {
  extractFeatures
};
