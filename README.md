# Tangram-cartocss ![build](https://travis-ci.org/CartoDB/tangram-carto.svg?branch=api-def-carto)

![Conditional Style](/demos/images/conditionals.png)
## Installation & usage

```bash
me$ npm i tangram-cartocss
// or
me$ yarn add tangram-cartocss
```

```javascript
import CCSS from 'tangram-cartocss';
```
## API

### *CCSS* object

#### `.carto2Draw`

```javascript
/**
 * Transform a cartocss string into a Tangram draw layer config object.
 * @param  {String} cartocss   string with cartocsm
 * @return {Object}            return a draw object with the style functions
 */
var cartocss = '#layer { polygon-fill: '#DF038A';}';

var draw = CCSS.carto2draw(cartocss);

draw == {
  polygons: {
    color: 'function () { var toRet = null;  toRet = "#DF038A";  return toRet;}'
  }
};
```

## How to try with tangram

```javascript
var cartocss = `
  #layer {
   marker-fill: red;
   marker-width: 10;
  }
  `;
scene_layer = Tangram.leafletLayer({
  scene: 'demos/scene.yaml',
  logLevel: 'debug'
}).addTo(map);

map.setView( [ 40.7, -74.009 ], 14 );
  scene_layer.scene.config.layers.buildings.draw = CCSS.carto2Draw(cartocss);
  scene_layer.scene.updateConfig();
});
```
