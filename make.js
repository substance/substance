var b = require('substance-bundler');

b.task('clean', function() {
  b.rm('./dist');
});

b.task('css', function() {
  b.copy('*.css', 'dist/');
  b.copy('packages/**/*.css', 'dist/');
});

// bundle for the browser
b.task('browser', function() {
  b.js('./index.es.js', {
    // leave out server side dependencies
    ignore: ['cheerio', 'dom-serializer'],
    nodeResolve: { include: ['node_modules/lodash/**'] },
    commonjs: { include: ['node_modules/lodash/**'] },
    targets: [
      { dest: './dist/substance.js', format: 'umd', moduleName: 'substance' },
      { dest: './dist/substance.es6.js', format: 'es' }
    ]
  });
});

b.task('default', ['clean', 'css', 'browser'])
