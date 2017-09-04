# Tangram-cartocss [![Build Status](https://travis-ci.org/CartoDB/tangram-carto.svg?branch=master)](https://travis-ci.org/CartoDB/tangram-carto)

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
const Carto = require('carto');
const CartoCSSRenderer = new Carto.RendererJS({
    reference: tangramReference,
    strict: true
});
const css = `
  #layer {
    line-dasharray: 2,3
  }`;
const layers = CartoCSSRenderer.render(css).getLayers();
console.log('\nlayerToYAML:\n', JSON.stringify(layerToYAML(layers[1], 1), null, 4));
```

