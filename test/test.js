const Utils = require('./utils/utils');
const MD5 = require('md5');

const Point = require('../src/basic/points');

let pointCCSS =
`#layer {
  marker-fill: #F00;
}`;

const id = MD5(pointCCSS);
const c3ss = Utils.getShader(pointCCSS);

let point = Point.getDraw(c3ss, id);

