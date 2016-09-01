var bundler = require('substance-bundler');

bundler.configure({
  js: {
    // lodash is cjs
    commonjs: ['node_modules/lodash/**'],
    // leave cheerio et. al untouched
    external: ['cheerio', 'dom-serializer'],
  }
})

bundler.rm('./dist');

bundler.js('./index.es.js', [
  { dest: './dist/substance.js', format: 'cjs' },
  { dest: './dist/substance.es.js', format: 'es' },
]);
