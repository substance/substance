var b = require('substance-bundler')

b.task('clean', function() {
  b.rm('./dist');
  b.rm('./.test');
  b.rm('./.docs');
  b.rm('./.npm');
});

function _css(DIST) {
  b.copy('*.css', DIST)
  b.copy('packages/**/*.css', DIST)
}

b.task('css', function() {
  _css('dist/')
})

function _browser(DIST, transpileToES5) {
  b.js('./index.es.js', {
    buble: transpileToES5,

    ignore: ['substance-cheerio'],
    commonjs: { include: ['node_modules/lodash/**'] },
    targets: [{
      useStrict: !transpileToES5,
      dest: DIST+'substance.js',
      format: 'umd', moduleName: 'substance', sourceMapRoot: __dirname, sourceMapPrefix: 'substance'
    }]
  })
}

b.task('browser:pure', function() {
  _browser('./dist/', false)
})

b.task('browser', function() {
  _browser('./dist/', true)
})


function _server(DIST, transpileToES5) {
  b.js('./index.es.js', {
    buble: transpileToES5,
    commonjs: { include: [
      'node_modules/lodash/**'
    ] },
    external: [ 'substance-cheerio' ],
    targets: [{
      dest: DIST+'substance.cjs.js',
      format: 'cjs', sourceMapRoot: __dirname, sourceMapPrefix: 'substance'
    }]
  })
}

b.task('server', function() {
  // for the time being we transpile the cjs bundle
  // so it works in node 4 too
  _server('./dist/', true)
})

var TEST ='.test/'

b.task('test:clean', function() {
  b.rm(TEST)
})

b.task('test:assets', function() {
  // TODO: it would be nice to treat such glob patterns
  // differently, so that we do not need to specify glob root
  b.copy('./node_modules/substance-test/dist/*', TEST, { root: './node_modules/substance-test/dist' })
})


function _testBrowser(transpileToES5) {
  b.js('./test/index.js', {

    buble: transpileToES5,
    ignore: ['substance-cheerio'],
    external: ['substance-test'],
    commonjs: { include: ['node_modules/lodash/**'] },
    targets: [
      { dest: TEST+'tests.js', format: 'umd', moduleName: 'tests' }
    ]
  })
}

b.task('test:browser', function() {
  // buble necessary here, as travis has old browser versions
  _testBrowser(true)
})

b.task('test:browser:pure', function() {
  // Pure ES6, and no buble here, for better dev experience
  _testBrowser(false)
})

b.task('test:server', function() {
  b.js('./test/index.js', {
    // buble necessary here, for nodejs
    buble: true,
    external: ['substance-test'],
    commonjs: {
      include: [
        '/**/lodash/**',
        '/**/substance-cheerio/**'
      ]
    },
    targets: [
      { dest: TEST+'tests.cjs.js', format: 'cjs' },
    ]
  })
})

var NPM = '.npm/'
var NPMDIST = NPM+'dist/'

b.task('npm:clean', function() {
  b.rm(NPM)
  b.rm(NPM+'docs')
})

b.task('npm:copy:js', function() {
  b.copy('index.es.js', NPM)
  b.copy('collab/*.js', NPM)
  b.copy('model/**/*.js', NPM)
  b.copy('packages/**/*.js', NPM)
  b.copy('ui/*.js', NPM)
  b.copy('util/*.js', NPM)
})

b.task('npm:copy:css', function() {
  _css(NPM)
  _css(NPMDIST)
})

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

b.task('docs', function() {
  // creates a data.js file with prebuilt documentation
  // this gives the best trade-off between build and load time
  _docs('json', '.docs/')
})

b.task('npm:docs', function() {
  _docs('site', NPM+'docs/')
})

b.task('npm:js', function() {
  _browser(NPMDIST, true)
  _server(NPMDIST, true)
})

var stuff = [
  'package.json',
  'LICENSE.md',
  'README.md',
  'CHANGELOG.md',
  'make.js'
]
b.task('npm:stuff', function() {
  stuff.forEach(function(f) {
    b.copy(f, NPM)
  })
})

b.task('build', ['clean', 'css', 'browser', 'server'])

b.task('test', ['test:clean', 'test:assets', 'test:browser', 'test:server'])

b.task('npm', ['npm:clean', 'npm:copy:js', 'npm:copy:css', 'npm:docs', 'npm:js', 'npm:stuff'])

b.task('default', ['build'])

// Default dev mode, only browser bundles are made and no ES5 transpilation happens
b.task('dev', ['clean', 'css', 'browser:pure', 'test:assets', 'test:browser:pure' , 'docs'])

// SERVER

// starts a server when CLI argument '-s' is set
b.setServerPort(5550)
b.serve({ static: true, route: '/', folder: 'dist' })
b.serve({ static: true, route: '/test/', folder: '.test' })
b.serve({ static: true, route: '/docs/', folder: '.docs' })
