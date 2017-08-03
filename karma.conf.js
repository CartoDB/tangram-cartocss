/*jshint node: true*/
'use strict';
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['browserify', 'mocha', 'sinon'],
    files: [
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.1/leaflet.js',
      'dist/tangram-cartocss.js',
      'test/**/*.js'
    ],

    exclude: [],
    preprocessors: {
      'test/**/*.js': ['browserify']
    },
    browserify: {
      debug: true,
      transform: ['babelify', 'brfs']
    },

    plugins: [
      'karma-mocha',
      'karma-sinon',
      'karma-chrome-launcher',
      'karma-mocha-reporter',
      'karma-browserify'
    ],
    reporters: ['mocha'],

    port: 9876,
    colors: true,

    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeNoSandbox'],

    singleRun: true,

    // Travis fails in sandbox mode so we create a launcher with the no-sandbox flag.
    customLaunchers: {
      ChromeNoSandbox: {
        base: 'Chrome',
        flags: [
          '--no-sandbox',
        ]
      }
    },

  });
};
