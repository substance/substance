// Karma configuration
// Generated on Sat May 09 2015 01:51:50 GMT+0200 (W. Europe Summer Time)
module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['qunit', 'commonjs', 'jquery-2.1.0'],
    plugins: [
      'karma-jquery',
      'karma-qunit',
      'karma-chrome-launcher',
      'karma-commonjs',
      'karma-coverage'
    ],
    files: [
      'index.js',
      'helpers.js',
      'document.js',
      {pattern: 'test/public/jquery.js'},
      {pattern: 'src/**/*.js'},
      {pattern: 'node_modules/lodash/**/*.js'},
      {pattern: 'test/fixtures/*.js'},
      {pattern: 'test/test_article/*.js'},
      {pattern: 'test/unit/*.js'},
      {pattern: 'test/unit/**/*.test.js'}
    ],
    exclude: [
    ],
    preprocessors: {
      "*.js": ["commonjs"],
      "src/**/*.js": ["commonjs"],
      "test/**/*.js": ["commonjs"],
      "node_modules/lodash/**/*.js": ["commonjs"],
      // compute test coverage only for the real modules
      "src/!(basics)/**/!(index).js": ["coverage"],
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['Chrome'],
    singleRun: true
  });
};
