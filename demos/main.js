let vizJSON = JSON.parse( '{\"bounds\":[[-85.0511,-179.0],[85.0511,179.0]],\"center\":\"[0.0,0.0]\",\"datasource\":{\"user_name\":\"eduardorodes\",\"maps_api_template\":\"https://{user}.carto.com:443\",\"stat_tag\":\"71f9a9aa-906d-11e6-8c9f-0e98b61680bf\",\"template_name\":\"tpl_71f9a9aa_906d_11e6_8c9f_0e98b61680bf\"},\"description\":\"<p>Sunshine hours in European Cities. Data from: https://www.currentresults.com/Weather/Europe/Cities/sunshine-annual-average.php<\/p>\\n\",\"options\":{\"legends\":true,\"scrollwheel\":true,\"layer_selector\":false,\"dashboard_menu\":true},\"id\":\"71f9a9aa-906d-11e6-8c9f-0e98b61680bf\",\"layers\":[{\"id\":\"9f0f0822-f3ad-459f-9d5b-48e5e87f2875\",\"type\":\"background\",\"options\":{\"default\":false,\"url\":\"https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png\",\"subdomains\":\"\",\"minZoom\":0,\"maxZoom\":32,\"name\":\"\",\"className\":\"plain\",\"attribution\":null,\"labels\":null,\"urlTemplate\":\"\",\"type\":\"Plain\",\"tms\":false,\"category\":\"Color\",\"selected\":true,\"val\":\"plain\",\"label\":\"plain\",\"highlighted\":true,\"color\":\"#f4f4f4\",\"image\":\"\"}},{\"id\":\"ab7761f4-10da-4809-96be-709cb7982634\",\"type\":\"CartoDB\",\"visible\":true,\"options\":{\"layer_name\":\"ne_adm0_europe\",\"attribution\":\"\",\"source\":\"b0\"},\"legends\":[]},{\"id\":\"4899a25d-cca4-42ee-b90d-86b7cd44e74a\",\"type\":\"CartoDB\",\"visible\":true,\"options\":{\"layer_name\":\"Sunshine hours per year\",\"attribution\":\"\",\"source\":\"a1\"},\"infowindow\":{\"template_name\":\"infowindow_light\",\"fields\":[{\"name\":\"city\",\"title\":true,\"position\":null},{\"name\":\"sunshine_hours\",\"title\":true,\"position\":null},{\"name\":\"country\",\"title\":true,\"position\":null}],\"maxHeight\":180,\"template\":\"<div class=\\\"CDB-infowindow CDB-infowindow--light js-infowindow\\\">\\n  <div class=\\\"CDB-infowindow-close js-close\\\"><\/div>\\n  <div class=\\\"CDB-infowindow-container\\\">\\n    <div class=\\\"CDB-infowindow-bg\\\">\\n      <div class=\\\"CDB-infowindow-inner\\\">\\n        {{#loading}}\\n          <div class=\\\"CDB-Loader js-loader is-visible\\\"><\/div>\\n        {{/loading}}\\n        <ul class=\\\"CDB-infowindow-list js-content\\\">\\n          {{#content.fields}}\\n          <li class=\\\"CDB-infowindow-listItem\\\">\\n            {{#title}}<h5 class=\\\"CDB-infowindow-subtitle\\\">{{title}}<\/h5>{{/title}}\\n            {{#value}}<h4 class=\\\"CDB-infowindow-title\\\">{{{ value }}}<\/h4>{{/value}}\\n            {{^value}}<h4 class=\\\"CDB-infowindow-title\\\">null<\/h4>{{/value}}\\n          <\/li>\\n          {{/content.fields}}\\n        <\/ul>\\n      <\/div>\\n    <\/div>\\n    <div class=\\\"CDB-hook\\\">\\n      <div class=\\\"CDB-hook-inner\\\"><\/div>\\n    <\/div>\\n  <\/div>\\n<\/div>\\n\",\"alternative_names\":{},\"width\":226,\"headerColor\":{\"color\":{\"fixed\":\"#35AAE5\",\"opacity\":1}},\"template_type\":\"mustache\"},\"legends\":[{\"created_at\":null,\"definition\":{\"prefix\":\"\",\"suffix\":\"\"},\"id\":null,\"layer_id\":null,\"post_html\":\"\",\"pre_html\":\"\",\"title\":\"\",\"type\":\"choropleth\",\"updated_at\":null}]}],\"likes\":0,\"map_provider\":\"leaflet\",\"overlays\":[{\"type\":\"share\",\"order\":1,\"options\":{\"display\":true,\"x\":20,\"y\":20},\"template\":\"\"},{\"type\":\"search\",\"order\":2,\"options\":null,\"template\":null},{\"type\":\"zoom\",\"order\":3,\"options\":null,\"template\":null},{\"type\":\"loader\",\"order\":4,\"options\":{\"display\":true,\"x\":20,\"y\":150},\"template\":\"<div class=\\\"loader\\\" original-title=\\\"\\\"><\/div>\"},{\"type\":\"logo\",\"order\":5,\"options\":{\"display\":true,\"x\":10,\"y\":40},\"template\":\"\"}],\"title\":\"Europe Sunshine\",\"updated_at\":\"2016-10-16T18:39:16+00:00\",\"user\":{\"fullname\":\"Eduardo\",\"avatar_url\":\"https://s3.amazonaws.com/com.cartodb.users-assets.production/production/eduardorodes/assets/20160929111926B3jODkhIIAA6eDK.jpg\",\"profile_url\":\"https://team.carto.com/u/eduardorodes\"},\"version\":\"3.0.0\",\"widgets\":[{\"id\":\"59967ce4-988c-478b-80a9-6d4d5712b899\",\"type\":\"formula\",\"title\":\"Number of cities\",\"order\":0,\"layer_id\":\"4899a25d-cca4-42ee-b90d-86b7cd44e74a\",\"options\":{\"column\":\"cartodb_id\",\"operation\":\"count\",\"sync_on_data_change\":true,\"sync_on_bbox_change\":true},\"source\":{\"id\":\"a1\"}},{\"id\":\"acc07416-929b-40ed-a127-c8e7cca1a01f\",\"type\":\"histogram\",\"title\":\"Sunshine hours\",\"order\":1,\"layer_id\":\"4899a25d-cca4-42ee-b90d-86b7cd44e74a\",\"options\":{\"column\":\"sunshine_hours\",\"bins\":\"12\",\"sync_on_data_change\":true,\"sync_on_bbox_change\":true},\"source\":{\"id\":\"a1\"}},{\"id\":\"7a1e9bc6-c12a-4c5a-af31-1c873ed5923b\",\"type\":\"category\",\"title\":\"City\",\"order\":2,\"layer_id\":\"4899a25d-cca4-42ee-b90d-86b7cd44e74a\",\"options\":{\"column\":\"city\",\"aggregation_column\":\"city\",\"aggregation\":\"count\",\"sync_on_data_change\":true,\"sync_on_bbox_change\":true},\"source\":{\"id\":\"a1\"}}],\"zoom\":1,\"analyses\":[{\"id\":\"b0\",\"type\":\"source\",\"options\":{\"table_name\":\"ne_adm0_europe\",\"simple_geom\":\"polygon\"}},{\"id\":\"a1\",\"type\":\"georeference-city\",\"params\":{\"source\":{\"id\":\"a0\",\"type\":\"source\",\"options\":{\"table_name\":\"sunshine_hours\"}},\"city_column\":\"city\",\"country_column\":\"country\"}}],\"vector\":false}' );
// let vizJSON = JSON.parse( '{\"bounds\":[[21.0922,-158.319],[49.1348,-70.3436]],\"center\":\"[40.25145,-112.1011]\",\"datasource\":{\"user_name\":\"flo\",\"maps_api_template\":\"http://{user}.localhost.lan:8181\",\"stat_tag\":\"4392da48-9b65-11e6-8723-f45c89cdaa2d\",\"template_name\":\"tpl_4392da48_9b65_11e6_8723_f45c89cdaa2d\"},\"description\":null,\"options\":{\"dashboard_menu\":true,\"layer_selector\":false,\"legends\":true,\"scrollwheel\":false},\"id\":\"4392da48-9b65-11e6-8723-f45c89cdaa2d\",\"layers\":[{\"id\":\"225476d5-c692-439b-a94f-1525ba7ea59e\",\"type\":\"tiled\",\"options\":{\"default\":true,\"url\":\"http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png\",\"subdomains\":\"abcd\",\"minZoom\":\"0\",\"maxZoom\":\"18\",\"name\":\"Positron\",\"className\":\"positron_rainbow_labels\",\"attribution\":\"\\u00a9 <a href=\\\"http://www.openstreetmap.org/copyright\\\">OpenStreetMap<\/a> contributors \\u00a9 <a href=\\\"https://carto.com/attributions\\\">CARTO<\/a>\",\"labels\":{\"url\":\"http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png\"},\"urlTemplate\":\"http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png\"}},{\"id\":\"9935b469-c8b6-4993-b767-2a041b148848\",\"type\":\"CartoDB\",\"visible\":true,\"options\":{\"layer_name\":\"feds2\",\"attribution\":\"\",\"source\":\"a0\"},\"legends\":[]},{\"id\":\"1bd7d121-1438-4b63-8cec-e184f9037569\",\"type\":\"tiled\",\"options\":{\"default\":true,\"url\":\"http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png\",\"subdomains\":\"abcd\",\"minZoom\":\"0\",\"maxZoom\":\"18\",\"attribution\":\"\\u00a9 <a href=\\\"http://www.openstreetmap.org/copyright\\\">OpenStreetMap<\/a> contributors \\u00a9 <a href=\\\"https://carto.com/attributions\\\">CARTO<\/a>\",\"urlTemplate\":\"http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png\",\"type\":\"Tiled\",\"name\":\"Positron Labels\"}}],\"likes\":0,\"map_provider\":\"leaflet\",\"overlays\":[{\"type\":\"share\",\"order\":1,\"options\":{\"display\":true,\"x\":20,\"y\":20},\"template\":\"\"},{\"type\":\"search\",\"order\":2,\"options\":{\"display\":true,\"x\":60,\"y\":20},\"template\":\"\"},{\"type\":\"zoom\",\"order\":3,\"options\":{\"display\":true,\"x\":20,\"y\":20},\"template\":\"<a href=\\\"#zoom_in\\\" class=\\\"zoom_in\\\">+<\/a> <a href=\\\"#zoom_out\\\" class=\\\"zoom_out\\\">-<\/a>\"},{\"type\":\"loader\",\"order\":4,\"options\":{\"display\":true,\"x\":20,\"y\":150},\"template\":\"<div class=\\\"loader\\\" original-title=\\\"\\\"><\/div>\"},{\"type\":\"logo\",\"order\":5,\"options\":{\"display\":true,\"x\":10,\"y\":40},\"template\":\"\"}],\"title\":\"Untitled Map 15\",\"updated_at\":\"2016-10-26T18:03:46+02:00\",\"user\":{\"fullname\":\"flo\",\"avatar_url\":\"example.com/avatars/avatar_stars_red.png\",\"profile_url\":\"http://flo.localhost.lan:3000\"},\"version\":\"3.0.0\",\"widgets\":[{\"id\":\"3073f97e-c1c0-4eb5-80ea-47837d887c1d\",\"type\":\"category\",\"title\":\"flight_id\",\"order\":0,\"layer_id\":\"9935b469-c8b6-4993-b767-2a041b148848\",\"options\":{\"column\":\"flight_id\",\"aggregation_column\":\"flight_id\",\"aggregation\":\"count\",\"sync_on_data_change\":true,\"sync_on_bbox_change\":true},\"style\":{\"widget_style\":{\"definition\":{\"color\":{\"fixed\":\"#9DE0AD\",\"opacity\":1}}},\"auto_style\":{\"custom\":false,\"allowed\":true}},\"source\":{\"id\":\"a0\"}},{\"id\":\"6e0d1db1-7910-4149-8576-61db4945235f\",\"type\":\"time-series\",\"title\":\"timestamp\",\"order\":1,\"layer_id\":\"9935b469-c8b6-4993-b767-2a041b148848\",\"options\":{\"column\":\"timestamp\",\"bins\":\"256\",\"sync_on_data_change\":true,\"sync_on_bbox_change\":true},\"style\":{\"widget_style\":{\"definition\":{\"color\":{\"fixed\":\"#42712b\",\"opacity\":1}}},\"auto_style\":{\"custom\":true,\"allowed\":true,\"definition\":{\"color\":{\"attribute\":\"timestamp\",\"quantification\":\"quantiles\",\"range\":[\"#ffc6c4\",\"#f4a3a8\",\"#e38191\",\"#cc607d\",\"#ad466c\",\"#8b3058\",\"#672044\"]}}}},\"source\":{\"id\":\"a0\"}}],\"zoom\":2,\"analyses\":[{\"id\":\"a0\",\"type\":\"source\",\"options\":{\"table_name\":\"feds2\",\"simple_geom\":\"point\"}}],\"vector\":false}' );
var scene_url = '';

var map = L.map( 'map' );

L.tileLayer( 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '<a href="http://carto.com">CARTO</a> © 2016',
    maxZoom: 18
} ).addTo( map );

map.setView( [ 40, 0 ], 5 );

function loadCartoLayer( vizJSON ) {
    Cartoyaml.fromCarto( vizJSON ).then( ( yamlFile ) => {
        yamlFile = yamlFile.replace( /"function \(/g, '|\n                    function (' ).replace( /\}"/g, '}' ).replace( /\\n/g, '\n                  ' );
        console.log( yamlFile );
        scene_url = URL.createObjectURL( new Blob( [ yamlFile ] ) );

        layerScene = Tangram.leafletLayer( {
            scene: scene_url,
            attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a> | Based on <a href="https://github.com/tangrams/simple-demo">Tangram\'s Simple Demo</a>'
        } ).addTo( map );


        map.setView( vizJSON.center.replace( /[\[\]]/g, '' ).split( ',' ).map( v => {
            return parseFloat( v );
        } ), vizJSON.zoom );
    } );
};

function extractSourceFromUri( url ) {
    return url.substring( 0, url.indexOf( '.com' ) + 4 ) + '/api/v3/viz/' + /\/([\w*\-A-z0-9]*\-[A-z0-9]*)\//g.exec( url )[ 1 ] + '/viz.json';
}

function generateVizUri( sources ) {
    return sources.url.replace( '{user}', sources.user ) + '/api/v3/viz/' + sources.id + '/viz.json';
}

function jsonp( url, callback ) {
    var callbackName = 'jsonp_callback_' + Math.round( 100000 * Math.random() );
    window[ callbackName ] = function( data ) {
        delete window[ callbackName ];
        document.body.removeChild( script );
        callback( data );
    };

    var script = document.createElement( 'script' );
    script.src = url + ( url.indexOf( '?' ) >= 0 ? '&' : '?' ) + 'callback=' + callbackName;
    document.body.appendChild( script );
}

function getVizJSON( cb ) {
    let inputs = document.getElementsByTagName( 'input' );

    jsonp( extractSourceFromUri( inputs[ 0 ].value ), cb );
}

document.getElementById( 'send' ).addEventListener( 'click', function( e ) {
    getVizJSON( loadCartoLayer );
} );
