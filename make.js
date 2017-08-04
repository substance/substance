/* globals __dirname, process */
const b = require('substance-bundler')
const path = require('path')
const install = require('substance-bundler/extensions/install')
const fork = require('substance-bundler/extensions/fork')
const karma = require('substance-bundler/extensions/karma')

const UGLIFY_VERSION = '^2.7.5'

// Constants
// ---------

const DIST = 'dist/'
const TMP = 'tmp/'

// Helpers
// -------
// Doing the actual work

function css() {
  b.css('substance.css', DIST+'substance.css', { variables: true })
  b.css('substance.css', DIST+'substance.next.css')
  b.css('substance-pagestyle.css', DIST+'substance-pagestyle.css', {variables: true})
  b.css('substance-pagestyle.css', DIST+'substance-pagestyle.next.css')
  b.css('substance-reset.css', DIST+'substance-reset.css', {variables: true})
  b.css('substance-reset.css', DIST+'substance-reset.next.css')
}

function buildLib(target, production) {
  let targets = []
  const useStrict = production
  if (target === 'browser' || target === 'all') {
    targets.push({
      dest: DIST+'substance.js',
      format: 'umd', moduleName: 'substance',
      sourceMapRoot: __dirname, sourceMapPrefix: 'substance',
    })
  }
  if (target === 'browser:legacy') {
    targets.push({
      dest: DIST+'substance.es5.js',
      format: 'umd', moduleName: 'substance',
      sourceMapRoot: __dirname, sourceMapPrefix: 'substance',
      useStrict
    })
  }
  if (target === 'node' || target === 'all') {
    targets.push({
      dest: DIST+'substance.cjs.js',
      format: 'cjs',
      sourceMapRoot: __dirname, sourceMapPrefix: 'substance'
    })
  }
  if (target === 'es' || target === 'all') {
    targets.push({
      dest: DIST+'substance.es.js',
      format: 'es',
      sourceMapRoot: __dirname, sourceMapPrefix: 'substance'
    })
  }
  if (target === 'coverage') {
    targets.push({
      dest: TMP+'substance.cov.js',
      format: 'umd', moduleName: 'substance',
      sourceMapRoot: __dirname, sourceMapPrefix: 'substance'
    })
  }
  const config = {
    targets,
    alias: {
      'domutils': path.join(__dirname, 'vendor/domutils.js'),
      'entities': path.join(__dirname, 'vendor/entities.js'),
      'lodash-es': path.join(__dirname, 'vendor/lodash-es.js'),
    },
    commonjs: {
      include: [
        'node_modules/boolbase/**/*',
        'node_modules/css-what/**/*',
        'node_modules/domelementtype/**/*',
        'node_modules/nth-check/**/*',
      ]
    }
  }
  if (target === 'coverage') {
    config.istanbul = {
      include: [
        'collab/*.js',
        'dom/*.js',
        'model/**/*.js',
        'packages/**/*.js',
        'util/*.js',
        'ui/*.js',
        'xml/*.js'
      ]
    }
  }
  if (target === 'legacy') {
    config.buble = true
  }
  if (production) {
    config.cleanup = true
  }
  b.js('./index.es.js', config)
}

function buildTestsBrowser() {
  b.js('test/**/*.test.js', {
    dest: TMP+'tests.js',
    format: 'umd', moduleName: 'tests',
    external: {
      'substance': 'window.substance',
      'substance-test': 'window.substanceTest'
    },
  })
}

function buildTestsNode() {
  b.js('test/**/*.test.js', {
    dest: TMP+'tests.cjs.js',
    format: 'cjs',
    external: ['substance-test'],
    alias: {
      'substance':
        path.join(__dirname, 'dist/substance.es.js')
    }
  })
}

// generates API documentation
function buildDocs() {

  function _hideUndocumented(project) {
    if (project.groups) {
      project.groups.forEach((group) => {
        group.children.forEach((c) => {
          if (c && !c.hasComment()) {
            // 1 = Private
            c.setFlag(1, true)
          }
        })
      })
    }
  }

  // function _toJSON(project) {
  //   return Object.keys(project.reflections).map((id) => {
  //     const r = project.reflections[id]
  //     return r.toObject()
  //   })
  // }

  const typedoc = require('typedoc')
  const out = TMP+'doc'
  b.rm(out)
  b.custom('Creating documentation...', {
    src: [
      './collab/*.js',
      './dom/*.js',
      './model/*.js',
      './packages/**/*.js',
      './ui/*.js',
      './ui/types.d.ts',
      './util/*.js',
    ],
    execute(sources) {
      let app = new typedoc.Application({
        allowJs: true,
        mode: 'file',
        excludeExternals: true,
        excludeNotExported: true,
        externalPattern: "**/(node_modules|vendor|tmp)/**",
        includeDeclarations: true,
        ignoreCompilerErrors: true,
        listInvalidSymbolLinks: true,
        theme: '.typedoc/theme',
        readme: 'none'
      })
      sources = app.expandInputFiles(sources)
      let project = app.convert(sources)
      if (project) {
        _hideUndocumented(project)
        // b.writeSync('tmp/doc.json', JSON.stringify(_toJSON(project), 0, 2))
        app.generateDocs(project, out)
      } else {
        throw new Error('Error running Typedoc: could not convert sources.')
      }
    }
  })
}

function buildVendor() {
  install(b, 'uglify-js-harmony', UGLIFY_VERSION)
  const CLEANUP = true
  const MINIFY = false
  vendorRollup('domutils', {
    commonjs: true,
    external: ['domelementtype', 'entities'],
    cleanup: CLEANUP,
    minify: MINIFY
  })
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
    commonjs: true,
    json: true,
    cleanup: CLEANUP,
    minify: MINIFY
  })
  vendorRollup('htmlparser2', {
    commonjs: { include: ['vendor/htmlparser2/**'] },
    ignore: ['events'],
    alias: {
      'entities':
        path.join(__dirname, 'vendor/entities.js'),
      'entities/lib/decode_codepoint.js':
        path.join(__dirname, 'vendor/_entities_decodeCodepoint.js'),
      'entities/maps/entities.json':
        path.join(__dirname, 'vendor/_entities_entitiesJSON.js'),
      'entities/maps/legacy.json':
        path.join(__dirname, 'vendor/_entities_legacyJSON.js'),
      'entities/maps/xml.json':
        path.join(__dirname, 'vendor/_entities_xmlJSON.js'),
      'inherits':
        path.join(__dirname, 'vendor/_inherits.js'),
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

function vendorRollup(name, opts = {}) {
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
  b.rm('./.docs')
})

b.task('css', css)

b.task('lib:browser', ['css'], () => {
  buildLib('browser', 'production')
})

b.task('lib:browser:legacy', ['css'], () => {
  buildLib('browser:legacy', 'production')
})

b.task('lib:browser:dev', ['css'], () => {
  buildLib('browser')
})

b.task('lib:dev', ['css'], () => {
  buildLib('all')
})

b.task('lib', ['css'], () => {
  buildLib('all', 'production')
  // Note: legacy build can not be mixed with the other builds
  buildLib('browser:legacy', 'production')
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
    browsers: process.env.TRAVIS?['ChromeTravis', 'Firefox']:['Chrome']
  })
})

b.task('docs', () => {
  buildDocs('.docs/')
}).describe('generates API documentation')

b.task('vendor', buildVendor)
.describe('pre-bundles vendor libraries')

b.task('default', ['clean', 'lib'])

b.task('publish', ['clean', 'lib', 'docs'])

// Default dev mode, only browser bundles are made and no ES5 transpilation happens
b.task('dev', ['clean', 'lib:browser:dev', 'docs', 'test:browser'])

b.task('test', ['test:node', 'cover'])
.describe('runs the test suite')

b.setServerPort(4001)
b.serve({ static: true, route: '/', folder: '.' })
