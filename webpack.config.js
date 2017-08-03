var path = require('path');

module.exports = {
  entry: './src/module.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'tangram-cartocss.js',
  },
  node: {
    fs: 'empty', // carto library was originally designed to run in nodejs
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        }
      }
    ]
  }
};
