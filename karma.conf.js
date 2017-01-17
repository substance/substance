module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['tap'],
    files: [
      '.test/test.browser.js',
      '.test/tests.js',
    ],
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeTravis: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    singleRun: true,
    reporters: ['tape', 'coverage'],
  });
};