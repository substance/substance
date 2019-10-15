const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const istanbul = require('substance-bundler/extensions/rollup/rollup-plugin-istanbul')

// This is now used for browser tests and coverage
module.exports = function (options = {}) {
  const config = {
    input: 'index.es.js',
    output: {
      file: 'tmp/substance.js',
      format: 'umd',
      name: 'substance',
      sourcemap: true,
      sourcemapRoot: __dirname,
      sourcemapPrefix: 'substance'
    },
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
  if (options.coverage) {
    config.output.file = 'tmp/substance.istanbul.js'
    config.plugins.push(istanbul({
      include: [
        'dom/*.js',
        'model/*.js',
        'editor/*.js',
        'util/*.js'
      ]
    }))
  }
  return config
}
