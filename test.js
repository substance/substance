var Karma = require('karma').Server;
var path = require('path')
var cp = require('child_process')
var b = require('substance-bundler')

b.task('build', function() {
  b.make(require.resolve('./make.js'), 'test')
})

b.task('browser', function() {
  b.custom('Running browser tests...', {
    execute: function() {
      var browser = process.env.TRAVIS ? 'ChromeTravis': 'Chrome'
      return new Promise(function(resolve) {
        new Karma({
          configFile: __dirname + '/karma.conf.js',
          browsers: [browser],
          singleRun: true
        }, function(exitCode) {
          if (exitCode !== 0) {
            process.exit(exitCode)
          }
        }).start();
      });
    }
  })
})

// TODO: tape is exiting the process when done :(
// so this task must be called at last
b.task('server', function() {
  b.custom('Running nodejs tests...', {
    execute: function() {
      return new Promise(function(resolve, reject) {
        const child = cp.fork(path.join(__dirname, 'dist/test/run-tests.js'))
        child.on('message', function(msg) {
          if (msg === 'done') { resolve() }
        })
        child.on('error', function(error) {
          reject(new Error(error))
        })
        child.on('close', function(exitCode) {
          if (exitCode !== 0) {
            process.exit(exitCode)
          }
        })
      });
    }
  })
})

b.task('default', ['build', 'browser', 'server'])
