import Carto from './lib/carto-helpers';
import TH from './lib/tangram-helper';
import Utils from './lib/utils';

var map = L.map( 'map' );

L.tileLayer( 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '<a href="http://carto.com">CARTO</a> © 2016',
    maxZoom: 18
} ).addTo( map );

window.sceneLayer = TH.startTangram(map);

var app = new Vue({
	el: '#gui',
	data: {
		uri: 'https://eduardorodes.carto.com/builder/2c212118-b711-11e6-9e07-0ef7f98ade21/embed',
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


map.setView( [ 48.8, 2.349 ], 8 );
