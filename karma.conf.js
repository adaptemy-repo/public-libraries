const webpack = require('./webpack.conf');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai', 'sinon'],
    files: [
      { pattern: 'karma.bundle.js', watched: false }
    ],
    exclude: [],
    preprocessors: {
      'index.js': ['webpack', 'sourcemap'],
      'karma.bundle.js': ['webpack', 'sourcemap']
    },
    webpack: webpack,
    webpackServer: {
      noInfo: true // prevent console spamming when running in Karma!
    },
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'], // @TODO Change to Chrome at some point?
    singleRun: true
  });
};
