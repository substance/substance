var b = require('substance-bundler');

b.task('clean', function() {
  b.rm('./dist');
});

b.task('css', function() {
  b.copy('*.css', 'dist/');
  b.copy('packages/**/*.css', 'dist/');
});

b.task('browser', function() {
  b.js('./index.es.js', {
    ignore: ['substance-cheerio'],
    commonjs: { include: ['node_modules/lodash/**'] },
    targets: [{
      dest: './dist/substance.js',
      format: 'umd', moduleName: 'substance', sourceMapRoot: __dirname, sourceMapPrefix: 'substance'
    }]
  });
})

b.task('server', function() {
  b.js('./index.es.js', {
    commonjs: { include: ['node_modules/**', require.resolve('substance-cheerio')] },
    targets: [{
      dest: './dist/substance.cjs.js',
      format: 'cjs', sourceMapRoot: __dirname, sourceMapPrefix: 'substance'
    }]
  });
});

b.task('test:clean', function() {
  b.rm('dist/test')
})

b.task('test:assets', function() {
  b.copy('./node_modules/substance-test/dist/*', './dist/test', { root: './node_modules/substance-test/dist' })
})

b.task('test:browser', function() {
  b.js('./test/index.js', {
    // buble necessary here, as travis has old browser versions
    buble: true,
    ignore: ['substance-cheerio'],
    external: ['substance-test'],
    commonjs: { include: ['node_modules/lodash/**'] },
    targets: [
      { dest: './dist/test/tests.js', format: 'umd', moduleName: 'tests' }
    ]
  });
})

b.task('test:server', function() {
  b.js('./test/index.js', {
    // buble necessary here, for nodejs
    buble: true,
    external: ['substance-test'],
    commonjs: {
      include: [
        'node_modules/lodash/**',
        'node_modules/substance-cheerio/**'
      ]
    },
    targets: [
      { dest: './dist/test/run-tests.js', format: 'cjs' },
    ]
  });
})

b.task('test', ['test:clean', 'test:assets', 'test:browser', 'test:server'])

// starts a server when CLI argument '-s' is set
b.setServerPort(5550)
b.serve({
  static: true, route: '/', folder: 'dist'
})

b.task('default', ['clean', 'css', 'browser', 'server'])
