/*
  IMPORTANT: Don't use ES6 here, as some people are still on Node 4.
*/

var b = require('substance-bundler')
var path = require('path')

// Constants
// ---------

var DIST = 'dist/'
var TEST ='.test/'
var NPM = '.npm/'
var NPMDIST = NPM+'dist/'
var STUFF = [
  'package.json',
  'LICENSE.md',
  'README.md',
  'CHANGELOG.md',
  'make.js'
]

// Helpers
// -------
// Doing the actual work

function _css(DIST) {
  b.css('substance.css', DIST+'substance.css', { variables: true })
  b.css('substance.css', DIST+'substance.next.css')
  b.css('substance-pagestyle.css', DIST+'substance-pagestyle.css', {variables: true})
  b.css('substance-pagestyle.css', DIST+'substance-pagestyle.next.css')
  b.css('substance-reset.css', DIST+'substance-reset.css', {variables: true})
  b.css('substance-reset.css', DIST+'substance-reset.next.css')
}

// creates a browser bundle
function _browser(DIST, transpileToES5, production) {
  b.js('./index.es.js', {
    target: {
      dest: DIST+'substance.js',
      format: 'umd', moduleName: 'substance',
      sourceMapRoot: __dirname, sourceMapPrefix: 'substance',
      useStrict: !transpileToES5,
    },
    buble: transpileToES5,
    eslint: { exclude: [ 'dom/vendor.js' ] },
    cleanup: Boolean(production)
  })
}

// creates a server bundle
function _server(DIST, transpileToES5, production) {
  b.js('./index.es.js', {
    target: {
      dest: DIST+'substance.cjs.js',
      format: 'cjs',
      sourceMapRoot: __dirname, sourceMapPrefix: 'substance'
    },
    buble: transpileToES5,
    eslint: { exclude: [ 'dom/vendor.js' ] },
    cleanup: Boolean(production)
  })
}

// bundles the test suite to be run in a browser
function _testBrowser(transpileToES5, coverage) {

  b.js('./test/index.js', {
    target: {
      dest: TEST+'tests.js',
      format: 'umd', moduleName: 'tests'
    },
    buble: transpileToES5,
    external: { 'substance-test': 'substanceTest' },
    istanbul: coverage ? {
      include: [
        'collab/*.js',
        'dom/*.js',
        'model/**/*.js',
        // 'packages/**/*.js',
        'ui/*.js',
        // 'util/*.js'
      ],
      exclude: [ 'dom/vendor.js' ]
    } : false
  })
}

function _testNode() {
  b.js('./test/index.js', {
    target: {
      dest: TEST+'tests.cjs.js',
      format: 'cjs'
    },
    external: ['substance-test'],
    buble: true,
    commonjs: true
  })
}

function _runTestBrowser() {
  b.custom('Running browser tests...', {
    execute: function() {
      let karma = require('karma')
      const browser = process.env.TRAVIS ? 'ChromeTravis': 'Chrome'
      return new Promise(function(resolve) {
        let fails = 0
        const server = new karma.Server({
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
      })
    }
  })
}

// generates API documentation
function _docs(mode, dest) {
  var docgen = require('substance-docgen')
  docgen.bundle(b, {
    src: [
      './*.md',
      './doc/*.md',
      './collab/*.js',
      './dom/*.js',
      './model/**/*.js',
      './packages/**/*.js',
      './ui/*.js',
      './util/*.js',
    ],
    dest: dest,
    config: './.docgenrc.js',
    mode: mode // one of: 'source', 'json', 'site' (default: 'json')
  })
}

function _vendor_xdom() {
  b.js('./dom/_vendor.js', {
    target: {
      dest: './dom/vendor.js',
      format: 'es'
    },
    ignore: [ 'events', 'entities' ],
    alias: {
      'domutils': path.join(__dirname, 'dom/domUtils/index.js'),
      'dom-serializer': path.join(__dirname, 'dom/_domSerializer.js'),
      'inherits': path.join(__dirname, 'dom/_stub.js')
    },
    commonjs: true,
    json: true
  })
}

// Tasks
// -----

b.task('clean', function() {
  b.rm('./dist')
  b.rm('./.test')
  b.rm('./.docs')
  b.rm('./.npm')
})

b.task('css', function() {
  _css(DIST)
})

b.task('browser:pure', ['css'], function() {
  _browser(DIST, false)
})

b.task('browser', ['css'], function() {
  _browser(DIST, true)
})

b.task('server', function() {
  // for the time being we transpile the cjs bundle
  // so it works in node 4 too
  _server(DIST, true)
})

b.task('server:pure', function() {
  // for the time being we transpile the cjs bundle
  // so it works in node 4 too
  _server(DIST, false)
})

b.task('test:clean', function() {
  b.rm(TEST)
})

b.task('test:assets', function() {
  // TODO: it would be nice to treat such glob patterns
  // differently, so that we do not need to specify glob root
  b.copy('./node_modules/substance-test/dist/*', TEST, { root: './node_modules/substance-test/dist' })
})

b.task('test:browser', ['test:clean', 'test:assets'], function() {
  // buble necessary here, as travis has old browser versions
  _testBrowser(true)
})

b.task('test:browser:pure', ['test:clean', 'test:assets'], function() {
  // Pure ES6, and no buble here, for better dev experience
  _testBrowser(false)
})

b.task('test:browser:coverage', ['test:clean', 'test:assets'], function() {
  _testBrowser(true, true)
})

b.task('test:node', ['test:clean', 'test:assets'], _testNode)

b.task('build:test', ['test:clean', 'test:assets', 'test:browser', 'test:node'])

b.task('run:test:browser', ['test:browser'], _runTestBrowser)

b.task('run:test:coverage', ['test:browser:coverage'], _runTestBrowser)

b.task('run:test', ['build:test'], _runTestBrowser)


b.task('npm:clean', function() {
  b.rm(NPM)
})

b.task('npm:copy:sources', function() {
  b.copy('index.es.js', NPM)
  b.copy('collab/*.js', NPM)
  b.copy('dom/**/*.js', NPM)
  b.copy('model/**/*.js', NPM)
  b.copy('packages/**/*.js', NPM)
  b.copy('ui/*.js', NPM)
  b.copy('util/*.js', NPM)
  b.copy('test/**/*.js', NPM)
  b.copy('*.css', NPM)
  b.copy('packages/**/*.css', NPM)
  STUFF.forEach(function(f) {
    b.copy(f, NPM)
  })
})

b.task('docs', function() {
  // creates a data.js file with prebuilt documentation
  // this gives the best trade-off between build and load time
  _docs('json', '.docs/')
})

b.task('npm:docs', function() {
  _docs('site', NPM+'docs/')
})

b.task('npm:browser', function() {
  _css(NPMDIST)
  _browser(NPMDIST, true, true)
})

b.task('npm:server', function() {
  _server(NPMDIST, true, true)
})

b.task('build', ['clean', 'browser', 'server'])

b.task('build:pure', ['clean', 'browser:pure', 'server:pure'])

b.task('npm', ['npm:clean', 'npm:copy:sources', 'npm:docs', 'npm:browser', 'npm:server'])

b.task('vendor:xdom', _vendor_xdom)

b.task('default', ['build'])

// Default dev mode, only browser bundles are made and no ES5 transpilation happens
b.task('dev', ['clean', 'browser:pure', 'test:assets', 'test:browser:pure' , 'docs'])

// HTTP server
// -----------

// starts a server when CLI argument '-s' is set
b.setServerPort(5550)
b.serve({ static: true, route: '/', folder: 'dist' })
b.serve({ static: true, route: '/test/', folder: '.test' })
b.serve({ static: true, route: '/docs/', folder: '.docs' })
