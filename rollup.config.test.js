module.exports = function (options = {}) {
  return {
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
  }
}
