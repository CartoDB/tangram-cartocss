var app = new Vue({
	el: '#gui',
	data: {
		layers: [
			{
				id: 'layer0',
				opened: true
			},
			{
				id: 'layer1',
				opened: false
			}
		]
	}
});

var map = L.map( 'map' );


L.tileLayer( 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '<a href="http://carto.com">CARTO</a> © 2016',
    maxZoom: 18
} ).addTo( map );

scene_layer = Tangram.leafletLayer({
  scene: 'demos/scene.yaml',
  logLevel: 'debug'
}).addTo(map);

map.setView( [ 40.7, -74.009 ], 8 );

document.getElementById('send').addEventListener('click', function (e) {
  let val = document.getElementsByTagName('textarea')[0].value;
  console.log(CCSS.carto2Draw(val));
  scene_layer.scene.config.layers.state_county_merge.draw = CCSS.carto2Draw(val);
  scene_layer.scene.updateConfig();
});
