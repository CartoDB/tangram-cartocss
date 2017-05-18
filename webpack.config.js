module.exports = {
  entry: './src/module.js',
  output: {
    path: __dirname + '/dist/',
    filename: 'tangram-cartocss.debug.js',
    libraryTarget: "this"
  },
  node: {
    fs: "empty"
  },
  externals: {
    './torque-reference': 'window'
  },
  module: {
    loaders: [{
      // test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015', 'stage-0']
      }
    }]
  }
};
