// Karma configuration
// Generated on Sat May 09 2015 01:51:50 GMT+0200 (W. Europe Summer Time)
module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['qunit', 'commonjs', 'jquery-2.1.0', 'sinon'],
    plugins: [
      'karma-jquery',
      'karma-qunit',
      'karma-sinon',
      'karma-chrome-launcher',
      'karma-commonjs',
      'karma-coverage'
    ],
    files: [
      'index.js',
      'helpers.js',
      'document.js',
      'article.js',
      {pattern: 'test/public/jquery.js'},
      {pattern: 'basics/**/*.js'},
      {pattern: 'data/**/*.js'},
      {pattern: 'document/**/*.js'},
      {pattern: 'operator/**/*.js'},
      {pattern: 'ui/**/*.js'},
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
      'basics/**/*.js': ["commonjs"],
      'data/**/*.js': ["commonjs", "coverage"],
      'document/**/*.js': ["commonjs", "coverage"],
      'operator/**/*.js': ["commonjs", "coverage"],
      'ui/**/*.js': ["commonjs", "coverage"],
      "test/**/*.js": ["commonjs"],
      "node_modules/lodash/**/*.js": ["commonjs"],
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
