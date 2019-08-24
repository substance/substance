module.exports = function (options = {}) {
  let target = options.target || 'all'
  let config = []
  if (target === 'browser' || target === 'all') {
    config.push({
      input: 'test/index.js',
      output: {
        file: 'tmp/tests.js',
        format: 'umd',
        name: 'tests',
        globals: {
          'substance': 'window.substance',
          'substance-test': 'window.substanceTest'
        },
        sourcemap: true
      },
      external: [ 'substance', 'substance-test' ]
    })
  }
  if (target === 'node' || target === 'all') {
    config.push({
      input: 'test/index.js',
      output: {
        file: 'tmp/tests.cjs.js',
        format: 'cjs',
        sourcemap: true
      },
      external: ['substance', 'substance-test'],
      plugins: [
        _patchNodeTest()
      ]
    })
  }
  return config
}

function _patchNodeTest () {
  return {
    name: 'patch-node-test',
    generateBundle (options, bundle, isWrite) {
      let output = bundle['tests.cjs.js']
      output.code = output.code.replace("'substance'", "'../dist/substance.cjs.js'")
    }
  }
}
