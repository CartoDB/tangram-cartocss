import Carto from './lib/carto-helpers';
import TH from './lib/tangram-helper';

var map = L.map( 'map' );

L.tileLayer( 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '<a href="http://carto.com">CARTO</a> © 2016',
    maxZoom: 18
} ).addTo( map );

window.sceneLayer = TH.startTangram(map);

var app = new Vue({
	el: '#gui',
	data: {
		uri: 'http://flo.localhost.lan:3000/builder/0ee34530-b2f3-11e6-9bd5-f45c89cdaa2d/',
		layers: [
		]
	},

	methods: {
		send: function (ly) {
			TH.setLayerDraw(window.sceneLayer, ly);
			window.sceneLayer.updateConfig();
		},
		loadVizJSON: function (uri) {
			let vizUri = Carto.generateVizUri(uri),
					vizJSON = Carto.getVizJSON(vizUri);

			vizJSON.then(viz => {
				console.log(viz);

				TH.addSource(window.sceneLayer, Carto.generateSource(viz.datasource));

				viz.layers.forEach(ly => {
					if (ly.type === 'CartoDB') {
						let layer = {
							id: ly.id,
							opened: false,
							cartocss: '#layer {polygon-fill: #06c;}',
							name: ly.options.layer_name
						};

						this.layers.push(layer);
						TH.addLayer(window.sceneLayer, layer);
						TH.setLayerDraw(window.sceneLayer, layer);
					}
				});

			});
		}
	}
});


map.setView( [ 40.7, -74.009 ], 8 );
