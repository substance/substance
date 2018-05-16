module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['tap'],
    files: [
      'tmp/substance.cov.js',
      'node_modules/substance-test/dist/test.browser.js',
      'tmp/tests.js',
    ],
    browsers: ['Firefox', 'Chrome'],
    customLaunchers: {
      ChromeTravis: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    singleRun: true,
    reporters: ['tape', 'coverage'],
    coverageReporter: {
      reporters: [{type: 'lcov'}]
    }
  });
};
