'use strict';
/* eslint-disable no-console */

var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var transform = require('vinyl-transform');
var gutil = require('gulp-util');
var argv = require('yargs').argv;
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var eslint = require('gulp-eslint');
var tape = require('gulp-tape');
var tapSpec = require('tap-spec');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var mapStream = require('map-stream');
var generate = require('./doc/generator/generate');
var config = require('./doc/config.json');
var sass = require('gulp-sass');
var through2 = require('through2');
var fs = require('fs');
var Karma = require('karma').Server;

gulp.task('doc:sass', function() {
  gulp.src('./doc/app.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./dist'));
});

gulp.task('doc:assets', function () {
  gulp.src('./doc/assets/**/*', {base:"./doc/assets"})
    .pipe(gulp.dest('./dist'));

  gulp.src('node_modules/font-awesome/fonts/*')
    .pipe(gulp.dest('./dist/fonts'));
});

gulp.task('doc:data', ['doc:bundle'], function () {
  console.log('generating documentation... and saving to ./dist/documentation.json');
  var nodes = generate(config);
  fs.writeFileSync(__dirname+'/dist/documentation.json', JSON.stringify(nodes, null, '  '));
});

gulp.task('doc:bundle', function () {
  console.log('bunlding DocumentationReader... and saving to ./dist');
  return gulp.src('./doc/app.js')
    .pipe(through2.obj(function (file, enc, next) {
      browserify(file.path)
        .bundle(function (err, res) {
          if (err) { return next(err); }
          file.contents = res;
          next(null, file);
        });
    }))
    .on('error', function (error) {
      console.log(error.stack);
      this.emit('end'); // eslint-disable-line
    })
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));
});

gulp.task('doc', ['doc:sass', 'doc:bundle', 'doc:assets', 'doc:data']);

gulp.task('lint', function() {
  return gulp.src([
    './collab/**/*.js',
    './doc/**/*.js',
    './model/**/*.js',
    './packages/**/*.js',
    './ui/**/*.js',
    './util/**/*.js',
    './test/**/*.js'
  ]).pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});


gulp.task('build', ['lint'], function() {
  return browserify({
    entries: './browser.js',
    debug: true
  }).bundle()
    .pipe(source('substance.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulpif(argv.production, rename({suffix: '.min'})))
    .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist'));
});

var html2js = transform(function(filename) {
  return mapStream(function(chunk, next) {
    console.log('### Compiling ', filename);
    var wrapped = "'use strict';\nmodule.exports="+JSON.stringify(chunk.toString())+";";
    return next(null, wrapped);
  });
});

gulp.task('test:fixtures', function() {
  return gulp.src('./test/fixtures/html/*.html')
    .pipe(html2js)
    .pipe(rename(function(path) {
      path.extname = ".js";
    }))
    .pipe(gulp.dest('test/fixtures/html/'));
});

gulp.task('test:qunit:karma', function(done) {
  new Karma({
    configFile: __dirname + '/karma.qunit.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('test:qunit:server', function() {
  // requiring instead of doing 'node test/run.js'
  require('./test-old/run');
});

function _testBrowser(browser, done) {
  new Karma({
    configFile: __dirname + '/karma.conf.js',
    browsers: [browser],
    singleRun: true
  }, done).start();
}

gulp.task('test:chrome', function(done) {
  if(process.env.TRAVIS) {
    _testBrowser('ChromeTravis', done);
  } else {
    _testBrowser('Chrome', done);
  }
});

gulp.task('test:firefox', function(done) {
  _testBrowser('Firefox', done);
});

gulp.task('test:browsers', ['test:chrome', 'test:firefox']);

gulp.task('test:server', function(done) {
  return gulp.src('test/**/*.test.js')
    .pipe(tape({
      reporter: tapSpec()
    }));
});

gulp.task('test:qunit', ['lint', 'test:qunit:karma', 'test:qunit:server']);

gulp.task('test', ['lint', 'test:browsers', 'test:server']);

gulp.task('default', ['build']);
