module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['browserify', 'tap'],
    files: [
      'tests/**/*.test.js',
      { pattern: 'tests/fixtures/**/*.html', included: false, served: true },
    ],
    preprocessors: {
      'tests/**/*.test.js': ['browserify']
    },
    browsers: ['Chrome'],
    customLaunchers: {
      Chrome_travis_ci: {
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

  if(process.env.TRAVIS){
    config.browsers = ['Chrome_travis_ci', 'Firefox'];
  }
};