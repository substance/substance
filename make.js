/*
  IMPORTANT: Don't use ES6 here, as some people are still on Node 4.
*/
/* globals __dirname, process */

var b = require('substance-bundler')
var path = require('path')
var fork = require('substance-bundler/extensions/fork')
var runKarma = require('substance-bundler/extensions/karma')

// Constants
// ---------

var DIST = 'dist/'
var TMP = 'tmp/'
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
    alias: {
      'lodash-es': path.join(__dirname, 'vendor/lodash.js')
    },
    buble: transpileToES5,
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
    alias: {
      'lodash-es': path.join(__dirname, 'vendor/lodash.js')
    },
    buble: transpileToES5,
    cleanup: Boolean(production)
  })
}

// bundles the test suite to be run in a browser
function _buildTestsBrowser(transpileToES5, coverage) {
  b.js('./test/index.js', {
    target: {
      dest: TMP+'tests.js',
      format: 'umd', moduleName: 'tests'
    },
    buble: transpileToES5,
    alias: {
      'lodash-es': path.join(__dirname, 'vendor/lodash.js')
    },
    external: {
      'substance-test': 'substanceTest'
    },
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

function _buildTestsNode() {
  b.js('./test/index.js', {
    target: {
      dest: TMP+'tests.cjs.js',
      format: 'cjs'
    },
    alias: {
      'lodash-es': path.join(__dirname, 'vendor/lodash.js')
    },
    external: ['substance-test'],
    buble: true,
    commonjs: true
  })
}

function _runTestsNode() {
  fork(b, require.resolve('substance-test/bin/test'), './tmp/tests.cjs.js', { verbose: true })
}

function _runTestBrowser() {
  runKarma(b, {
    browsers: process.env.TRAVIS?['ChromeTravis']:['Chrome']
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

function _vendor_lodash() {
  b.js('./vendor/_lodash.es.js', {
    dest: './vendor/lodash.js',
    format: 'es',
    debug: false
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

// builds the test suite to be run in browser
b.task('test:browser', function() {
  // buble necessary here, as travis has old browser versions
  _buildTestsBrowser(true)
})
.describe('builds tests for the browser test-suite')

// builds the test suite to be run in browser (without transpilation)
b.task('test:browser:pure', function() {
  // Pure ES6, and no buble here, for better dev experience
  _buildTestsBrowser(false)
})
.describe('same as test:browser but without transpilation')

b.task('test:browser', function() {
  _buildTestsBrowser(true, false)
  _runTestBrowser()
})

b.task('test:browser:coverage', function() {
  _buildTestsBrowser(true, true)
  _runTestBrowser()
})

b.task('test:node', function() {
  _buildTestsNode()
  _runTestsNode()
})
.describe('runs the test-suite in node')

b.task('test', ['test:node', 'test:browser'])
.describe('runs the test suites on all platforms')

b.task('cover', ['test:browser:coverage'])
.describe('generates a coverage report')

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
.describe('copies all sources into .npm folder')

b.task('docs', function() {
  // creates a data.js file with prebuilt documentation
  // this gives the best trade-off between build and load time
  _docs('json', '.docs/')
})
.describe('generates API documentation')

b.task('npm:docs', function() {
  _docs('site', NPM+'docs/')
})
.describe('generates API documentation into .npm folder')

b.task('npm:browser', function() {
  _css(NPMDIST)
  _browser(NPMDIST, true, true)
})

b.task('npm:server', function() {
  _server(NPMDIST, true, true)
})

b.task('build', ['clean', 'browser', 'server'])
.describe('builds the library')

b.task('build:pure', ['clean', 'browser:pure', 'server:pure'])
.describe('builds the library without transpilation')

b.task('npm', ['npm:clean', 'npm:copy:sources', 'npm:docs', 'npm:browser', 'npm:server'])
.describe('creates the npm bundle')

b.task('vendor:lodash', _vendor_lodash)
.describe('pre-bundles lodash')

b.task('vendor:xdom', _vendor_xdom)
.describe('pre-bundles the dependencies for the memory DOM implementation')

b.task('default', ['build'])

// Default dev mode, only browser bundles are made and no ES5 transpilation happens
b.task('dev', ['clean', 'browser:pure', 'test:browser:pure' , 'docs'])

// HTTP server
// -----------

// starts a server when CLI argument '-s' is set
b.setServerPort(5550)
b.serve({ static: true, route: '/', folder: 'dist' })
b.serve({ static: true, route: '/test/', folder: '.test' })
b.serve({ static: true, route: '/docs/', folder: '.docs' })
