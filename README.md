# Cartogram

## Installation & usage

```bash
me$ npm i cartogram
// or
me$ yarn add cartogram
```

```javascript
import Cartogram from 'cartogram';
```
## API

### *Cartogram* object

#### `.carto2Draw`

```javascript
/**
 * Transform a cartocss string into a Tangram draw layer config object.
 * @param  {String} cartocss   string with cartocsm
 * @return {Object}            return a draw object with the style functions
 */
var cartocss = '#layer { polygon-fill: '#DF038A';}';

var draw = Cartogram.carto2draw(cartocss);

draw == {
  polygons: {
    color: 'function () { var toRet = null;  toRet = "#DF038A";  return toRet;}'
  }
};
```


## Contributing

```sh
me$ git clone $repo_url
cd into_folder
yarn
yarn start
```

It will print the dev url to try the demos.

```sh
[0001] info  Server running at http://192.168.0.12:8000/ (connect)
[0001] info  LiveReload running on 35729
[0003] 43ms       1115B GET    200 /
[0003] 7ms         886B GET    200 /demos/css/main.css
[0004] 220ms       12KB GET    200 /demos/main.js
```

We use ES6 and Node > 6.X, I'm using 7.0 right now.
