import Carto from './lib/carto-helpers';
import TH from './lib/tangram-helper';
import Utils from './lib/utils';

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
			let self = this;
			return Utils.spawn(function*() {

				let vizUri = Carto.generateVizUri(uri),
						viz = yield Carto.getVizJSON(vizUri),
						jpUri = Carto.generateJSONPUri(viz),
						jsonP = yield Carto.getJSONP(jpUri);

				console.log(viz, jsonP);

				TH.addSource(window.sceneLayer, Carto.generateSource(viz.datasource));
				let jpLayers = jsonP.metadata.layers;
				viz.layers.reverse();
				jpLayers.reverse();
				viz.layers.forEach((ly, i) => {
					if (ly.type === 'CartoDB') {
						let layer = {
							id: jpLayers[i].id,
							opened: false,
							cartocss: jpLayers[i].meta.cartocss,
							name: ly.options.layer_name
						};

						self.layers.push(layer);
						TH.addLayer(window.sceneLayer, layer);
						TH.setLayerDraw(window.sceneLayer, layer);
					}
				});

			});
		}
	}
});


map.setView( [ 40.7, -74.009 ], 8 );
