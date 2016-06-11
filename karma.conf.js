module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['browserify', 'tap'],
    files: [
      'test/**/*.test.js',
      { pattern: 'test/fixtures/**/*.html', included: false, served: true },
    ],
    preprocessors: {
      'test/**/*.js': ['browserify']
    },
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeTravis: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    reporters: ['tape'],
    singleRun: true,
    browserify: {
      debug: true // include inline source maps
    }
  });
};