# [DEPRECATED] Tangram-cartocss [![Build Status](https://travis-ci.org/CartoDB/tangram-cartocss.svg?branch=master)](https://travis-ci.org/CartoDB/tangram-cartocss) ![No Maintenance Intended](https://img.shields.io/badge/No%20Maintenance%20Intended-%E2%9C%95-red.svg)

This is no longer supported.

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

## Limitations

Currently, this doesn't support texts, although Tangram supports it.

There are other limitations, but they are imposed by Tangram and tangram-reference.
