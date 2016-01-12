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
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
          flags: ['--no-sandbox']
      }
    },
    singleRun: true,
    browserify: {
      debug: true // include inline source maps
    }
  });

  if(process.env.TRAVIS){
      config.browsers = ['Chrome_travis_ci', 'Firefox'];
  }
};
