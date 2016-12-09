import Utils from './utils';

var Carto;

export default Carto =  {};

Carto.generateVizUri = function (url) {
  console.log(url);
  let com = url.indexOf('.com') + 4,
      lan = url.indexOf('.lan') + 4,
      domain = com !== 3 ? url.substring(0, com) : url.substring( 0, lan) + ':3000';
      console.log(domain);
  return domain + '/api/v3/viz/' + /\/([\w*\-A-z0-9]*\-[A-z0-9]*)\//g.exec( url )[ 1 ] + '/viz.json';
}

Carto.getVizJSON = function (url) {
  return Utils.spawn( function*() {
    return yield new Promise( function ( resolve, reject ) {
      Utils.jsonp( url, function ( vizJSON ) {
        if (vizJSON) {
          resolve(vizJSON);
        }
        else {
          reject('Cannot load vizJSON');
        }
      });
    });
  });
};

Carto.generateJSONPUri = function (vizJSON) {
  let source = Carto.generateSource(vizJSON.datasource);

  return source.substring(0, source.indexOf('mapnik')).replace(/-/g, '_') + 'jsonp?stat_tag=' + vizJSON.datasource.stat_tag;
}

Carto.getJSONP = function (url) {
  return Utils.spawn( function*(){
    return yield new Promise( function (resolve, reject) {
      Utils.jsonp(url, function (jsonp) {
        if (jsonp) {
          resolve(jsonp);
        }
        else {
          reject('Cannot load jsonp');
        }
      });
    });
  });
}

Carto.generateSource = function (datasource) {
  let id = datasource.template_name || 'tpl_' + datasource.stat_tag;
  return datasource.maps_api_template.replace( '{user}', datasource.user_name ) +
                '/api/v1/map/named/' +
                id.replace(/-/g, '_') +
                '/mapnik/{z}/{x}/{y}.mvt';
}
