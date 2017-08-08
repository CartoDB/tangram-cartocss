module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist/',
    filename: 'tangram-cartocss.debug.js',
    libraryTarget: 'umd',
    library: 'CCSS',
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
