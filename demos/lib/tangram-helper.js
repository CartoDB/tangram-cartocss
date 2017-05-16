import CCSS from '../../src/module.js';

var TH = {};

export default TH;

TH.startTangram = function (map) {
  return Tangram.leafletLayer({
    scene: '../demos/scene.yaml',
    logLevel: 'debug',
    events: {
      hover: function (e) {
        console.log('Hover', e);
      },
      click: function (e) {
        console.log('click', e);
      }
    }
  }).addTo(map).scene;
};

TH.setLayerDraw = function (scene, layer, index) {
  let draw = CCSS.carto2Draw(layer.cartocss, index);
  scene.config.layers[layer.id].draw = {};

  draw.forEach(l => {
    Object.assign(scene.config.layers[layer.id].draw, l.draw);
    Object.assign(scene.config.textures, l.textures);
    Object.assign(scene.config.styles, l.styles);
  });

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
