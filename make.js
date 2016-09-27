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
    buble: true,
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
    buble: true,
    commonjs: { include: ['node_modules/**', require.resolve('substance-cheerio')] },
    targets: [{
      dest: './dist/substance.cjs.js',
      format: 'cjs', sourceMapRoot: __dirname, sourceMapPrefix: 'substance'
    }, {
      dest: './dist/substance.es6.js',
      format: 'es', sourceMapRoot: __dirname, sourceMapPrefix: 'substance'
    }]
  });
});

// NEXT TODO: make test suite run in browser again, i.e. bundle the files for the browser test suite
// in substance-test and deploy these to tmp folder

b.task('test:clean', function() {
  b.rm('tmp')
})

b.task('test:assets', function() {
  b.copy('./node_modules/substance-test/dist/*', './tmp', { root: './node_modules/substance-test/dist' })
})

b.task('test:browser', function() {
  b.js('./test/index.js', {
    buble: true,
    ignore: ['substance-cheerio'],
    external: ['substance-test'],
    commonjs: {
      include: [
        'node_modules/lodash/**',
      ]
    },
    targets: [
      { dest: './tmp/tests.js', format: 'umd', moduleName: 'tests' }
    ]
  });
})

b.task('test:server', function() {
  b.copy('./node_modules/substance-test/dist/*', './tmp', { root: './node_modules/substance-test/dist' })
  b.js('./test/index.js', {
    buble: true,
    external: ['substance-test'],
    commonjs: {
      include: [
        'node_modules/lodash/**',
        'node_modules/substance-cheerio/**'
      ]
    },
    targets: [
      { dest: './tmp/run-tests.js', format: 'cjs' },
    ]
  });
})

b.task('test', ['test:clean', 'test:assets', 'test:browser', 'test:server'])

b.task('default', ['clean', 'css', 'browser', 'server'])
