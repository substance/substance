You can install Substance via npm and use it with a build tool of your choice.

```bash
npm install substance
```

Let's assume the following project structure.

```bash
app - application setup (html, css, js)
lib - reusable library code of your editor
node_modules - dependencies such as substance and font-awesome
```

## Bundling

Now we want to create a distribution (bundle), that combines all those source files into dist folder that can be hosted on a webserver.

```bash
dist/index.html - HTML page
dist/app.css - bundled CSS
dist/app.js - bundled Javascript code
dist/substance/*
dist/font-awesome/*
```

Your `index.html` file should look like this:

```html
<script type="text/javascript" src="./substance/substance.js"/></script>
<script type="text/javascript" src="./app.js"></script>
<link rel="stylesheet" type="text/css" href="./app.css"/>
```

### Using Substance Bundler

Substance Bundler is a lightweight build tool for Javascript.

```bash
npm install substance-bundler
```

Now you need to write a simple build script (`make.js`) that does the actual work.

```js
var b = require('substance-bundler')

b.task('clean', function() {
  b.rm('./dist')
})

b.task('assets', function() {
  b.copy('lib/**/*.css', './dist/')
  b.copy('node_modules/font-awesome', './dist/font-awesome')
})

// this optional task makes it easier to work on Substance core
b.task('substance', function() {
  b.make('substance', 'clean', 'css', 'browser')
  b.copy('node_modules/substance/dist', './dist/substance')
})

b.task('build', ['clean', 'substance', 'assets'], function() {
  b.copy('app/index.html', './dist/index.html')
  b.copy('app/app.css', './dist/app.css')
  b.js('app/app.js', {
    external: ['substance'],
    commonjs: { include: ['node_modules/lodash/**'] },
    dest: './dist/app.js',
    format: 'umd',
    moduleName: 'app'
  })
})

b.task('default', ['build'])

// starts a server when CLI argument '-s' is set
b.setServerPort(5555)
b.serve({
  static: true, route: '/', folder: 'dist'
})
```

And now run:

```bash
node make
```

Please you want to look at a complete project setup, just clone and run [SimpleWriter](http://github.com/substance/simple-writer).

### Using Browserify and Babel

This does the same job, for bundling the Javascript.

```bash
npm install -g browserify
npm install babel-preset-es2015 babelify
browserify app/app.js -t babelify -o app.js
```

### Other tools

You are free to use other build tools, such as [Webpack](https://webpack.github.io/) or Gulp. Please consult the websites
of those projects for usage documentation.