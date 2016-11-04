# Cartogram

## API

### *Cartoyaml* object

#### .carto2Draw

```
/**
 * Transform a cartocss into a Tangram draw layer config object.
 * @param  {String} cartocss   string with cartocsm
 * @return {Object}            return a draw object with the style functions
 */
var cartocss = '#layer { polygon-fill: '#DF038A';}';

var draw = Cartoyaml.carto2draw(cartocss);

draw = {
  polygons: {
    color: 'function () { var toRet = null;  toRet = "#DF038A";  return toRet;}'
  }
};
```
