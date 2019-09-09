const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const istanbul = require('substance-bundler/extensions/rollup/rollup-plugin-istanbul')

const DIST = 'dist/'

module.exports = function (commandLineArgs) {
  let target = commandLineArgs.target || 'all'
  let output = []
  if (target === 'browser' || target === 'all') {
    output.push({
      file: DIST + 'substance.js',
      format: 'umd',
      name: 'substance',
      sourcemap: true,
      sourcemapRoot: __dirname,
      sourcemapPrefix: 'substance'
    })
  }
  if (target === 'node' || target === 'all') {
    output.push({
      file: DIST + 'substance.cjs.js',
      format: 'cjs',
      sourcemap: true,
      sourcemapRoot: __dirname,
      sourcemapPrefix: 'substance'
    })
  }
  if (target === 'es' || target === 'all') {
    output.push({
      file: DIST + 'substance.es.js',
      format: 'esm',
      sourcemap: true,
      sourcemapRoot: __dirname,
      sourcemapPrefix: 'substance'
    })
  }
  if (target === 'coverage') {
    output.push({
      file: 'tmp/substance.cov.js',
      format: 'umd',
      name: 'substance',
      sourcemap: true,
      sourcemapRoot: __dirname,
      sourcemapPrefix: 'substance'
    })
  }
  const config = {
    input: 'index.es.js',
    output,
    plugins: [
      nodeResolve(),
      commonjs({
        include: [
          'node_modules/boolbase/**/*',
          'node_modules/css-what/**/*',
          'node_modules/domelementtype/**/*',
          'node_modules/nth-check/**/*'
        ]
      })
    ]
  }
  if (target === 'coverage') {
    config.plugins.push(
      istanbul({
        include: [
          'dom/*.js',
          'model/*.js',
          'editor/*.js',
          'util/*.js'
        ]
      })
    )
  }
  return config
}
