module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['tap'],
    files: [
      'node_modules/substance-test/dist/test.browser.js',
      'tmp/substance.istanbul.js',
      'tmp/tests.js'
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
    },
    logLevel: config.LOG_DISABLE
  })
}
