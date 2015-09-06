var path = require('path');
var glob = require('glob');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var argv = require('yargs').argv;
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var yuidoc =  require('gulp-yuidoc');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
// var qunit = require('node-qunit-phantomjs');
var qunit = require('gulp-qunit');

gulp.task('doc', function() {
  return gulp.src(["index.js", "./src/**/*.js"])
    .pipe(yuidoc.parser())
    .pipe(yuidoc.reporter())
    .pipe(yuidoc.generator())
    .pipe(gulp.dest('./doc/api'));
});

gulp.task('lint', function() {
  return gulp.src([
    './basics/**/*.js',
    './data/**/*.js',
    './document/**/*.js',
    './operator/**/*.js',
    './surface/**/*.js',
    './ui/**/*.js'
  ]).pipe(jshint())
    .pipe(jshint.reporter('default'));
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

gulp.task('build-test', function() {
  return glob("test/**/*.test.js", {}, function (err, testfiles) {
    browserify({ debug: true })
    .add(testfiles.map(function(file) {
      return path.join(__dirname, file);
    }))
    .bundle()
    .pipe(source('test.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./test/tmp'));
  });
});

gulp.task('qunit', ['build-test'], function() {
  return gulp.src('./test/index.html')
    .pipe(qunit());
});

gulp.task('test', ['lint', 'qunit']);

gulp.task('default', ['build']);
