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

b.task('test', function() {
  b.js('./test/model/ContainerAddress.test.js', {
    resolve: { jsnext: ['substance-test'] },
    commonjs: { include: ['node_modules/lodash/**'] },
    targets: [{
      dest: './tmp/test.cjs.js', format: 'cjs'
    }, {
      dest: './dist/test.js', format: 'umd', moduleName: 'test'
    }]
  });
})

b.task('default', ['clean', 'css', 'browser', 'server'])
