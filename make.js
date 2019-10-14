const b = require('substance-bundler')
const rollup = require('substance-bundler/extensions/rollup')
const karma = require('substance-bundler/extensions/karma')

const libraryConfig = require('./rollup.config.library')
const vendorConfig = require('./rollup.config.vendor')
const testConfig = require('./rollup.config.test')

b.task('clean', () => {
  b.rm('./tmp')
  b.rm('./coverage')
})

b.task('default', ['clean'])

// Default dev mode, only browser bundles are made and no ES5 transpilation happens
b.task('dev', ['clean', 'test:browser'])

b.task('build', ['clean'])

b.task('test', ['test:node', 'cover'])
  .describe('runs the test suite')

b.task('test', ['test:browser'])

b.task('test:browser', () => {
  rollup(b, libraryConfig())
  rollup(b, testConfig({ target: 'browser' }))
}).describe('builds the test-suite for the browser (open test/index.html)')

b.task('cover', () => {
  rollup(b, libraryConfig({ coverage: true }))
  rollup(b, testConfig())
  karma(b, {
    browsers: process.env.TRAVIS ? ['ChromeTravis', 'Firefox'] : ['Chrome']
  })
})

b.task('vendor', () => {
  rollup(b, vendorConfig)
}).describe('pre-bundles vendor libraries')

b.setServerPort(4001)
b.serve({ static: true, route: '/', folder: '.' })
