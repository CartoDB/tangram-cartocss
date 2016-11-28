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
  scene.config.layers[layer.name].draw = CCSS.carto2Draw(layer.cartocss);
  scene.updateConfig();
};

TH.addLayer = function (scene, layer) {
  scene.config.layers[layer.name] = {
    data: {
      layer: 'layer0',
      source: 'CartoDB'
    }
  };
};

TH.addSource = function (scene, url) {
  scene.config.sources['CartoDB'] = {
    id: 1,
    type: 'MVT',
    url: url
  };
}
