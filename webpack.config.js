module.exports = {
  entry: './src/module.js',
  output: {
    path: __dirname + '/dist/',
    filename: 'tangram-cartocss.debug.js',
    libraryTarget: "umd"
  },
  node: {
    fs: "empty"
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
