var b = require('substance-bundler');

b.task('clean', function() {
  b.rm('./dist');
});

b.task('css', function() {
  b.copy('*.css', 'dist/');
  b.copy('packages/**/*.css', 'dist/');
});

b.task('browser:umd', function() {
  b.js('./index.es.js', {
    ignore: ['cheerio', 'dom-serializer'],
    commonjs: { include: ['node_modules/lodash/**'] },
    dest: './dist/substance.js',
    format: 'umd',
    moduleName: 'substance',
    sourceMapRoot: __dirname,
    sourceMapPrefix: 'substance'
  });
})

// bundle for the browser
b.task('browser:es6', function() {
  b.js('./index.es.js', {
    ignore: ['cheerio', 'dom-serializer'],
    commonjs: { include: ['node_modules/lodash/**'] },
    dest: './dist/substance.es6.js',
    format: 'es',
    sourceMapRoot: __dirname,
    sourceMapPrefix: 'substance'
  });
});

b.task('browser', ['browser:umd', 'browser:es6'])

b.task('default', ['clean', 'css', 'browser'])
