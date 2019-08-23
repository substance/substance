const b = require('substance-bundler')
const rollup = require('substance-bundler/extensions/rollup')
const postcss = require('substance-bundler/extensions/postcss')
const fork = require('substance-bundler/extensions/fork')
const karma = require('substance-bundler/extensions/karma')

const libConfig = require('./rollup.config.substance')
const vendorConfig = require('./rollup.config.vendor')
const testConfig = require('./rollup.config.test')

const DIST = 'dist/'

b.task('clean', () => {
  b.rm('./dist')
  b.rm('./tmp')
  b.rm('./coverage')
})

b.task('default', ['clean', 'css', 'lib'])

// Default dev mode, only browser bundles are made and no ES5 transpilation happens
b.task('dev', ['clean', 'css', 'lib:browser', 'test:browser'])

b.task('build', ['clean', 'css', 'lib'])

b.task('test', ['test:node', 'cover'])
  .describe('runs the test suite')

b.task('css', () => {
  postcss(b, {
    from: 'substance.css',
    to: DIST + 'substance.css'
  })
  postcss(b, {
    from: 'substance-pagestyle.css',
    to: DIST + 'substance-pagestyle.css'
  })
  postcss(b, {
    from: 'substance-reset.css',
    to: DIST + 'substance-reset.css'
  })
})

b.task('lib', () => {
  rollup(b, libConfig({ target: 'all' }))
})

b.task('lib:browser', () => {
  rollup(b, libConfig({ target: 'browser' }))
})

b.task('lib:node', () => {
  rollup(b, libConfig({ target: 'node' }))
})

b.task('lib:es', () => {
  rollup(b, libConfig({ target: 'es' }))
})

b.task('test', ['test:browser', 'test:node'])

b.task('test:browser', ['lib:browser'], () => {
  rollup(b, testConfig('browser'))
}).describe('builds the test-suite for the browser (open test/index.html)')

b.task('test:node', ['lib:node'], () => {
  rollup(b, testConfig('node'))
  fork(b, require.resolve('substance-test/bin/test'), ['./tmp/tests.cjs.js'], { verbose: true })
}).describe('runs the test suite in nodejs')

b.task('cover', () => {
  rollup(b, libConfig({ target: 'coverage' }))
  rollup(b, testConfig('browser'))
  karma(b, {
    browsers: process.env.TRAVIS ? ['ChromeTravis', 'Firefox'] : ['Chrome']
  })
})

b.task('vendor', () => {
  rollup(b, vendorConfig)
}).describe('pre-bundles vendor libraries')

b.setServerPort(4001)
b.serve({ static: true, route: '/', folder: '.' })
