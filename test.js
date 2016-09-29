var karma = require('karma');
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
        var fails = 0
        var server = new karma.Server({
          configFile: __dirname + '/karma.conf.js',
          browsers: [browser],
          singleRun: true,
          failOnEmptyTestSuite: false
        }, function() {
          // why is exitCode always == 1?
          if (fails > 0) {
            process.exit(1)
          } else {
            resolve()
          }
        })
        server.on('run_complete', function(browsers, results) {
          if (results && results.failed > 0) {
            fails += results.failed
          }
        })
        server.start()
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
          } else {
            resolve()
          }
        })
      });
    }
  })
})

b.task('default', ['build', 'server', 'browser'])
