import yamljs from 'yamljs';
import CSS from './css_helper';

const SOURCES = {
    mapnik: {
        type: 'MVT',
        url: function( datasource ) {
            return datasource.maps_api_template.replace( '{user}', datasource.user_name ) +
                '/api/v1/map/named/' +
                datasource.template_name +
                '/mapnik/{z}/{x}/{y}.mvt';
        }
    },

    http: { // tile map base
        type: 'tile',
        url: function() {
            return 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
        }
    },
};

const SCENE = {
    background: {
        color: function( layer ) {
            return layer.options.color;
        }
    }
};

const getBaseProperties = function getBaseProperties() {
    return {
        global: {
            language: 'en'
        },

        cameras: {
            prespective: {
                type: 'perspective',
                vanishing_point: [ '0', '-250px' ],
                active: true
            },

            isometric: {
                type: 'isometric',
                axis: [ 0, 1 ],
                active: true
            },
            flat: {
                type: 'flat',
                active: true
            }
        },

        scene: {
            background: {
                color: ''
            }
        },

        fonts: {
            Montserrat: {
                url: 'https://fonts.gstatic.com/s/montserrat/v7/zhcz-_WihjSQC0oHJ9TCYL3hpw3pgy2gAi-Ip7WPMi0.woff'
            }
        },

        styles: {},

        sources: {},

        layers: {}
    };
};

const generateSources = function generateSource( vizJSON, jsonp ) {
    let sources = {};

    for ( var i = 0; i < jsonp.metadata.layers.length; i++ ) {
        let jLayer = jsonp.metadata.layers[ i ],
            vizLayer = vizJSON.layers[ i ],
            source = SOURCES[ jLayer.type ];

        if ( !source ) continue;

        if ( !sources[ vizLayer.type ] ) {
            sources[ vizLayer.type ] = {
                type: source.type,
                url: source.url( vizJSON.datasource )
            };
        }
    }

    return sources;
}

const generateLayer = function generateLayer( vizLayer, jsonpLayer ) {
    let layer = {
        name: vizLayer.options.layer_name,
        layer: {
            data: {
                source: vizLayer.type,
                layer: jsonpLayer.id,
            },
            draw: CSS.getDrawFromCSS( jsonpLayer.meta.cartocss )
        }
    };

    return layer;
};

const generateLayers = function( vizJSON, jsonp ) {
    let vizLayers = vizJSON.layers,
        jsonLayers = jsonp.metadata.layers,
        yamlLayers = {};

    for ( var i = jsonLayers.length - 1; i > 0; i-- ) {
        let layer = generateLayer( vizLayers[ i ], jsonLayers[ i ] );

        yamlLayers[ layer.name ] = layer.layer;
    }

    return yamlLayers;
};

const generateYAML = function( vizJSON, jsonp ) {
    let base = getBaseProperties();

    base.sources = generateSources( vizJSON, jsonp );
    base.layers = generateLayers( vizJSON, jsonp );

    return yamljs.stringify( base, 7 );
};

var YAML;

export default YAML = {
    generateYAML
};
