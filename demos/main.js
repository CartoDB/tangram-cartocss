var map = L.map( 'map' );

scene_layer = Tangram.leafletLayer({
  scene: 'demos/scene.yaml',
  logLevel: 'debug'
}).addTo(map);

map.setView( [ 40.7, -74.009 ], 14 );

document.getElementById('send').addEventListener('click', function (e) {
  let val = document.getElementsByTagName('textarea')[0].value;

  scene_layer.scene.config.layers.buildings.draw = CCSS.carto2Draw(val);
  scene_layer.scene.updateConfig();
});
