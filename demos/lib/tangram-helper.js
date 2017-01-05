import CCSS from '../../src/module.js';

var TH = {};

export default TH;

TH.startTangram = function (map) {
  return Tangram.leafletLayer({
    scene: '../demos/scene.yaml',
    logLevel: 'debug'
  }).addTo(map).scene;
};

TH.setLayerDraw = function (scene, layer) {
  let draw = CCSS.carto2Draw(layer.cartocss);
  scene.config.layers[layer.id].draw = draw.draw;
  Object.assign(scene.config.textures, draw.textures);
  Object.assign(scene.config.styles, draw.styles);
  scene.updateConfig();
};

TH.addLayer = function (scene, layer) {
  scene.config.layers[layer.id] = {
    data: {
      layer: layer.id,
      source: 'CartoDB'
    }
  };
};

TH.addSource = function (scene, url) {
  scene.config.sources['CartoDB'] = {
    id: 1,
    type: 'MVT',
    rasters: ['normals'],
    url: url
  };
}
