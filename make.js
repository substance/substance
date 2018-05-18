/* globals __dirname, process */
const b = require('substance-bundler')
const path = require('path')
const install = require('substance-bundler/extensions/install')
const fork = require('substance-bundler/extensions/fork')
const karma = require('substance-bundler/extensions/karma')
const rng = require('substance-bundler/extensions/rng')

const UGLIFY_VERSION = '^3.3.9'

// Constants
// ---------

const DIST = 'dist/'

// Helpers
// -------
// Doing the actual work

function css () {
  b.css('substance.css', DIST + 'substance.css', { variables: true })
  b.css('substance.css', DIST + 'substance.next.css')
  b.css('substance-pagestyle.css', DIST + 'substance-pagestyle.css', {variables: true})
  b.css('substance-pagestyle.css', DIST + 'substance-pagestyle.next.css')
  b.css('substance-reset.css', DIST + 'substance-reset.css', {variables: true})
  b.css('substance-reset.css', DIST + 'substance-reset.next.css')
}

function buildLib (target, production) {
  let targets = []
  const useStrict = production
  if (target === 'browser' || target === 'all') {
    targets.push({
      file: DIST + 'substance.js',
      format: 'umd',
      name: 'substance',
      sourcemapRoot: __dirname,
      sourcemapPrefix: 'substance'
    })
  }
  if (target === 'browser:legacy') {
    targets.push({
      file: DIST + 'substance.es5.js',
      format: 'umd',
      name: 'substance',
      sourcemapRoot: __dirname,
      sourcemapPrefix: 'substance',
      strict: useStrict
    })
  }
  if (target === 'node' || target === 'all') {
    targets.push({
      file: DIST + 'substance.cjs.js',
      format: 'cjs',
      sourcemapRoot: __dirname,
      sourcemapPrefix: 'substance'
    })
  }
  if (target === 'es' || target === 'all') {
    targets.push({
      file: DIST + 'substance.es.js',
      format: 'es',
      sourcemapRoot: __dirname,
      sourcemapPrefix: 'substance'
    })
  }
  if (target === 'coverage') {
    targets.push({
      file: 'tmp/substance.cov.js',
      format: 'umd',
      name: 'substance',
      sourcemapRoot: __dirname,
      sourcemapPrefix: 'substance'
    })
  }
  const config = {
    output: targets,
    alias: {
      'domutils': path.join(__dirname, 'vendor/domutils.js'),
      'entities': path.join(__dirname, 'vendor/entities.js'),
      'lodash-es': path.join(__dirname, 'vendor/lodash-es.js')
    },
    commonjs: {
      include: [
        'node_modules/boolbase/**/*',
        'node_modules/css-what/**/*',
        'node_modules/domelementtype/**/*',
        'node_modules/nth-check/**/*'
      ]
    }
  }
  if (target === 'coverage') {
    config.istanbul = {
      include: [
        'collab/*.js',
        'dar/*.js',
        'dom/*.js',
        'model/**/*.js',
        'packages/**/*.js',
        'util/*.js',
        'ui/*.js',
        'xml/*.js'
      ]
    }
  }
  if (target === 'browser:legacy') {
    config.buble = true
  }
  if (production) {
    config.cleanup = true
  }
  b.js('./index.es.js', config)
}

function buildTestsBrowser () {
  b.js('test/**/*.test.js', {
    output: [{
      file: 'tmp/tests.js',
      format: 'umd',
      name: 'tests',
      globals: {
        'substance': 'window.substance',
        'substance-test': 'window.substanceTest'
      }
    }],
    external: [ 'substance', 'substance-test' ]
  })
}

function buildTestsNode () {
  b.js('test/**/*.test.js', {
    output: [{
      file: 'tmp/tests.cjs.js',
      format: 'cjs'
    }],
    external: ['substance-test'],
    alias: {
      'substance': path.join(__dirname, 'dist/substance.es.js')
    }
  })
}

function buildVendor () {
  install(b, 'uglify-es', UGLIFY_VERSION)
  const CLEANUP = true
  const MINIFY = false
  vendorRollup('entities', {
    commonjs: true,
    json: true,
    cleanup: CLEANUP,
    minify: MINIFY
  })
  vendorRollup('css-select', {
    external: [
      'domelementtype', 'entities', 'boolbase',
      'css-what', 'domutils', 'nth-check'
    ],
    commonjs: {
      include: ['vendor/css-select/**']
    },
    json: true,
    cleanup: CLEANUP,
    minify: MINIFY
  })
  vendorRollup('htmlparser2', {
    commonjs: {
      include: ['node_modules/**', 'vendor/htmlparser2/**']
    },
    ignore: ['events'],
    // attention: the order is important:
    // first the more specific ones
    alias: {
      'entities/lib/decode_codepoint.js':
        path.join(__dirname, 'vendor/_entities_decodeCodepoint.js'),
      'entities/maps/entities.json':
        path.join(__dirname, 'vendor/_entities_entitiesJSON.js'),
      'entities/maps/legacy.json':
        path.join(__dirname, 'vendor/_entities_legacyJSON.js'),
      'entities/maps/xml.json':
        path.join(__dirname, 'vendor/_entities_xmlJSON.js'),
      'entities':
        path.join(__dirname, 'vendor/entities.js'),
      'inherits':
        path.join(__dirname, 'vendor/_inherits.js')
    },
    json: true,
    cleanup: CLEANUP,
    minify: MINIFY
  })
  vendorRollup('lodash-es', {
    commonjs: true,
    cleanup: CLEANUP,
    minify: MINIFY
  })
}

function vendorRollup (name, opts = {}) {
  let src = `./vendor/_${name}.js`
  let dest = `./vendor/${name}.js`
  let min = `./vendor/${name}.min.js`
  const minify = opts.minify
  delete opts.minify
  b.js(src, Object.assign({
    dest: dest,
    format: 'es',
    sourceMap: false,
    cleanup: true
  }, opts))
  if (minify !== false) {
    b.minify(dest, {
      debug: false
    })
    b.copy(min, dest)
    b.rm(min)
  }
}

// Tasks
// -----

b.task('clean', () => {
  b.rm('./dist')
  b.rm('./.test')
})

b.task('css', css)

b.task('schema', () => {
  rng(b, './dar/Manifest.rng', { dir: 'tmp' })
})

b.task('lib:browser', ['css', 'schema'], () => {
  buildLib('browser', 'production')
})

b.task('lib:browser:dev', ['css', 'schema'], () => {
  buildLib('browser')
})

b.task('lib:dev', ['css', 'schema'], () => {
  buildLib('all')
})

b.task('lib', ['css', 'schema'], () => {
  buildLib('all', 'production')
  // FIXME: we can't use buble any more because I like to use 'for-of'
  // We could switch to babel if we really need es5 support
  // Note: legacy build can not be mixed with the other builds
  // buildLib('browser:legacy', 'production')
})

b.task('test:browser', ['lib:browser:dev'], buildTestsBrowser)
  .describe('builds the test-suite for the browser (open test/index.html)')

b.task('test:node', () => {
  buildLib('es')
  buildTestsNode()
  fork(b, require.resolve('substance-test/bin/test'),
    './tmp/tests.cjs.js', { verbose: true })
})
  .describe('runs the test suite in nodejs')

b.task('cover', () => {
  buildLib('coverage')
  buildTestsBrowser()
  karma(b, {
    browsers: process.env.TRAVIS ? ['ChromeTravis', 'Firefox'] : ['Chrome']
  })
})

b.task('minify', () => {
  install(b, 'uglify-es', UGLIFY_VERSION)
  b.minify(DIST + 'substance.cjs.js', DIST + 'substance.cjs.min.js')
  b.minify(DIST + 'substance.es.js', DIST + 'substance.es.min.js')
  b.minify(DIST + 'substance.js', DIST + 'substance.min.js')
})

b.task('vendor', buildVendor)
  .describe('pre-bundles vendor libraries')

b.task('default', ['clean', 'lib'])

b.task('publish', ['clean', 'lib', 'minify'])

// Default dev mode, only browser bundles are made and no ES5 transpilation happens
b.task('dev', ['clean', 'lib:browser:dev', 'test:browser'])

b.task('test', ['test:node', 'cover'])
  .describe('runs the test suite')

b.setServerPort(4001)
b.serve({ static: true, route: '/', folder: '.' })
