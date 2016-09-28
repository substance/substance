module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['tap'],
    files: [
      'dist/test/test.browser.js',
      'dist/test/tests.js',
    ],
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeTravis: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    singleRun: true,
    reporters: ['tape'],
  });
};