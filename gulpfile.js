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
var qunit = require('node-qunit-phantomjs');
// var qunit = require('gulp-qunit');
var istanbul = require('browserify-istanbul');
var istanbulReport = require('gulp-istanbul-report');

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
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter("fail"));
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

var _buildTestBundle = function(testfiles, options) {
  options = options || {};
  var b = browserify({ debug: true });
  if (options.withInstrumentaion) {
    b = b.transform(istanbul);
  }
  return b.add(path.join(__dirname, 'test', 'test-globals.js'))
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
}

gulp.task('build:test', ['lint'], function() {
  var testfiles = glob.sync("test/**/*.test.js");
  return _buildTestBundle(testfiles);
});

gulp.task('build:coverage', function() {
  var testfiles = glob.sync("test/**/*.test.js");
  return _buildTestBundle(testfiles, { withInstrumentaion: true });
});

gulp.task('test', ['build:test'], function() {
  return qunit('./test/index.html');
});

gulp.task('coverage', ['build:coverage'], function() {
  qunit('./test/index.html', {
    customRunner: path.join(__dirname, 'test/run-phantomjs.js')
  }, function() {
    gulp.src('./coverage/coverage.json')
    .pipe(istanbulReport({
      reporters: ['html']
    }));
  });
});

gulp.task('default', ['build']);
