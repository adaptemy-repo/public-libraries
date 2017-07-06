module.exports = function(config) {
  config.set({
    plugins: [
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-chai',
      'karma-babel-preprocessor',
      'karma-phantomjs-launcher',
    ],
    frameworks: ['mocha', 'chai'],
    reporters: ['mocha'],
    preprocessors: {
      'src/**/*.js': ['babel'],
    },
    files: [
      'src/**/*.test.js'
    ],
    browsers: ['PhantomJS']
  });
}
