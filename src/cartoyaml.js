import Utils from './utils/utils';
import YAML from './yaml_helper';

const buildUri = function buildUri( vizJSON ) {
    if ( !vizJSON ) return;
    const datasource = vizJSON.datasource;

    let baseUri = datasource.maps_api_template,
        templateName = datasource.template_name || 'tpl_' + datasource.stat_tag.replace( /-/g, '_' ),
        userName = datasource.user_name;

    return baseUri.replace( '{user}', userName ) + '/api/v1/map/named/' + templateName + '/jsonp?callback=anonymousCb';
};

const extractJsonFromFn = function extractJsonFromFn( jsonp ) {
    let start = jsonp.indexOf( 'anonymousCb(' ) + 12;

    return JSON.parse( jsonp.substring( start, jsonp.length - 2 ).replace( /\n*/g, '' ) );
};

function getJsonp( url ) {
    return Utils.spawn( function*() {
        let data = yield Utils.io( url, 60000 );

        data = extractJsonFromFn( data );

        return data;
    } );
}



var YamlGenerator;

export default YamlGenerator = {
    fromCarto: function( vizJSON ) {
        return Utils.spawn( function*() {
            let jsonp = yield getJsonp( buildUri( vizJSON ) );
            return YAML.generateYAML( vizJSON, jsonp );
        } );
    }
};
