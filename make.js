let b = require('substance-bundler')
let eslint = require('eslint')

// Constants
// ---------

const TEST ='.test/'
const NPM = '.npm/'
const NPMDIST = NPM+'dist/'
const STUFF = [
  'package.json',
  'LICENSE.md',
  'README.md',
  'CHANGELOG.md',
  'make.js'
]

// Helpers
// -------
// Doing the actual work

// creates a browser bundle
function _browser(DIST, transpileToES5) {
  b.js('./index.es.js', {
    target: {
      dest: DIST+'substance.js',
      format: 'umd', moduleName: 'substance',
      sourceMapRoot: __dirname, sourceMapPrefix: 'substance',
      useStrict: !transpileToES5,
    },
    ignore: ['substance-cheerio'],
    buble: transpileToES5,
    eslint: eslint
  })
  b.css('substance.css', DIST+'substance.css', { variables: true })
  b.css('substance.css', DIST+'substance.next.css')
  b.css('substance-pagestyle.css', DIST+'substance-pagestyle.css', {variables: true})
  b.css('substance-pagestyle.css', DIST+'substance-pagestyle.next.css')
  b.css('substance-reset.css', DIST+'substance-reset.css', {variables: true})
  b.css('substance-reset.css', DIST+'substance-reset.next.css')
}

// creates a server bundle
function _server(DIST, transpileToES5) {
  b.js('./index.es.js', {
    target: {
      dest: DIST+'substance.cjs.js',
      format: 'cjs',
      sourceMapRoot: __dirname, sourceMapPrefix: 'substance'
    },
    buble: transpileToES5,
    external: [ 'substance-cheerio' ],
    eslint: eslint
  })
}

// bundles the test suite to be run in a browser
function _testBrowser(transpileToES5) {
  b.js('./test/index.js', {
    target: {
      dest: TEST+'tests.js',
      format: 'umd', moduleName: 'tests'
    },
    buble: transpileToES5,
    ignore: [ 'substance-cheerio' ],
    external: [ 'substance-test' ]
  })
}

// bundles the test suite to be run in node
function _testServer() {
  b.js('./test/index.js', {
    target: {
      dest: TEST+'tests.cjs.js',
      format: 'cjs'
    },
    // buble necessary here, for nodejs
    buble: true,
    external: [ 'substance-test', 'util', 'events', 'stream', 'buffer' ],
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

// Tasks
// -----

b.task('clean', function() {
  b.rm('./dist')
  b.rm('./.test')
  b.rm('./.docs')
  b.rm('./.npm')
})

b.task('browser:pure', function() {
  _browser('./dist/', false)
})

b.task('browser', function() {
  _browser('./dist/', true)
})

b.task('server', function() {
  // for the time being we transpile the cjs bundle
  // so it works in node 4 too
  _server('./dist/', true)
})

b.task('server:pure', function() {
  // for the time being we transpile the cjs bundle
  // so it works in node 4 too
  _server('./dist/', false)
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

b.task('test:server', function() {
  _testServer()
})

b.task('npm:clean', function() {
  b.rm(NPM)
})

b.task('npm:copy:sources', function() {
  b.copy('index.es.js', NPM)
  b.copy('collab/*.js', NPM)
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
  _browser(NPMDIST, true)
})

b.task('npm:server', function() {
  _server(NPMDIST, true)
})

b.task('build', ['clean', 'browser', 'server'])

b.task('build:pure', ['clean', 'browser:pure', 'server:pure'])

b.task('test', ['test:clean', 'test:assets', 'test:browser', 'test:server'])

b.task('npm', ['npm:clean', 'npm:copy:sources', 'npm:docs', 'npm:browser', 'npm:server'])

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
