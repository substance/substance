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
  } else {
    var fs = require('fs');
    if (fs.existsSync(__dirname + "/karma.conf.local.js")) {
      var localConfig = require('./karma.conf.local');
      var merge = require('./util/merge');
      merge(config, localConfig, { array: 'replace' });
    }
  }
};
