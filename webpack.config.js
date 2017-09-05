const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(path.resolve('.'), 'dist'),
    filename: 'tangram-cartocss.js',
    libraryTarget: 'this'
  },
  node: {
    fs: 'empty'
  },
  module: {
    loaders: [{
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }
    }]
  }
};
