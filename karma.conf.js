module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['browserify', 'source-map-support', 'qunit'],
    files: [
      'test/unit/**/*.test.js',
      { pattern: 'test/fixtures/**/*.html', included: false, served: true },
    ],
    preprocessors: {
      'test/unit/**/*.test.js': ['browserify']
    },
    browsers: ['Chrome'],
    singleRun: true,
    browserify: {
      debug: true // include inline source maps
    }
  });
};
