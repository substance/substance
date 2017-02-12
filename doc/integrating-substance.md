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

### Substance Bundler

Substance Bundler is our own build tool, which combines `chokidar` for file watching, `rollup` for bundling Javascript, `postcss` for CSS, and coming with a concept of tasks as you know it from `gulp`.

First you need to install `substance-bundler`:

```bash
npm install --save-dev substance-bundler
```

Then write a build script `make.js` that does the actual work:

```js
var b = require('substance-bundler')

b.task('clean', function() {
  b.rm('./dist')
})

b.task('assets', function() {
  b.copy('node_modules/substance/dist', './dist/substance')
  b.copy('node_modules/font-awesome', './dist/font-awesome')
})

b.task('build', ['clean', 'assets'], function() {
  b.copy('app/index.html', './dist/index.html')
  b.css('app/app.css', './dist/app.css')
  b.js('app/app.js', {
    target: {
      dest: './dist/app.js',
      format: 'umd',
      moduleName: 'app'
    },
    external: ['substance']
  })
})

b.task('default', ['build'])
```

To create your bundle you run

```bash
node make
```

If you want to look at a complete project setup, just clone and run [SimpleWriter](http://github.com/substance/simple-writer).

### Browserify and Babel

If you want to build your project with `browserify` you can do this

First you would install `browserify`:

```bash
npm install -g browserify
```

They you need to install babelify

```bash
npm install babel-preset-es2015 babelify
```

To bundle `dist/app.js` you run:

```bash
browserify app/app.js -t babelify -o dist/app.js
```

### Rollup and Bublé

You can use `rollup` together with some plugins to bundle Javascript.

First install rollup:

```
npm install -g rollup
```

Then install `bublé`:

```
npm install rollup-plugin-buble
```

Create a `rollup.config.js` which looks like

```js
import buble from 'rollup-plugin-buble'

export default {
  entry: 'src/app.js',
  plugins: [
    buble()
  ],
  // This tells rollup to consider substance as external dependency
  external: [ 'substance' ],
  format: 'umd',
  moduleName: 'app'
}
```

To build `dist/app.js` you run

```bash
rollup -c -o dist/app.js
```

If you want to create a single file bundle, i.e. with Substance code included, you need the following additional plugins

```
npm install rollup-plugin-node-resolve rollup-plugin-commonjs
```

And your `rollup.config.js` looks like:

```js
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import buble from 'rollup-plugin-buble'

export default {
  entry: 'src/app.js',
  plugins: [
    resolve({
      // consider the browser field in `package.json`
      browser: true,
      // use es6 entry points
      jsnext: true
    }),
    commonjs({
      // lodash is used as commonjs module
      include: [ '/**/lodash-es/**' ]
    }),
    buble()
  ],
  format: 'umd',
  moduleName: 'app'
}
```

> Note: bundling substance into your `app.js` will slow down your builds a bit.

### Other tools

You are free to use other build tools, such as [Webpack](https://webpack.github.io/) or Gulp. Please consult the websites
of those projects for usage documentation.

Substance comes with a distribution folder `dist` with following content:

- `substance.js`: a UMD bundle for the browser transpiled to ES5. Include it in your webpage and it will register Substance API under `window.substance`.
- `substance.js.map`: source maps for `substance.js`
- `substance.css`: A bundled CSS file indcluding styles for all core packages. It has been transpiled to CSS 2.1, i.e. with variables replaced.
- `substance.css.map`: source maps for `substance.css`
- `subsatnce.next.css`: same as `substance.css` but using modern CSS features, such as CSS variables.
- `substance.css.next.map`: source maps for `substance.next.css`
- `substance-pagestyle.css`: pagestyles that we use in our Substance apps.
- `substance-reset.css`: CSS that clears default styles.
