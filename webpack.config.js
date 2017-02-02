const webpack = require('webpack');

module.exports = {
  entry: './src/module.js',
  output: {
    path: './wpdist/',
    filename: 'tangram-cartocss.bundle.js'
  },
  externals: [
    'fs'
  ],
  module: {
    loaders: [{
      // test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }
    }]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
    }),
  ]
};
