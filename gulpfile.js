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
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var qunit = require('node-qunit-phantomjs');
var istanbul = require('browserify-istanbul');
var istanbulReport = require('gulp-istanbul-report');
var generate = require('./doc/generator/generate');
var config = require('./doc/config.json');
var sass = require('gulp-sass');
var through2 = require('through2');
var fs = require('fs');

gulp.task('doc:sass', function() {
  gulp.src('./doc/app.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./dist/master'));
});

gulp.task('doc:assets', function () {
  gulp.src('./doc/assets/**/*', {base:"./doc/assets"})
    .pipe(gulp.dest('./dist/master'));

  gulp.src('node_modules/font-awesome/fonts/*')
    .pipe(gulp.dest('./dist/master/fonts'));
});

gulp.task('doc:data', ['doc:bundle'], function () {
  console.log('generating documentation... and saving to ./dist/documentation.json');
  var nodes = generate(config);
  fs.writeFileSync(__dirname+'/dist/master/documentation.json', JSON.stringify(nodes, null, '  '));
});

gulp.task('doc:bundle', function () {
  console.log('bunlding DocumentationReader... and saving to ./dist/master');
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
      this.emit('end');
    })
    .pipe(uglify())
    .pipe(gulp.dest('./dist/master'));
});

gulp.task('doc', ['doc:sass', 'doc:bundle', 'doc:assets', 'doc:data']);

gulp.task('lint', function() {
  return gulp.src([
    './doc/**/*.js',
    './model/**/*.js',
    './packages/**/*.js',
    './ui/**/*.js',
    './util/**/*.js'
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
    .pipe(gulp.dest('./tmp/test/'));
};

gulp.task('build:test', ['lint'], function() {
  var testfiles = glob.sync("test/**/*.test.js");
  gulp.src(['./test/index.html'])
   .pipe(gulp.dest('./tmp/test/'));
  gulp.src(['./test/lib/jquery.js', './test/lib/qunit.js'])
   .pipe(gulp.dest('./tmp/test/lib/'));
  return _buildTestBundle(testfiles);
});

gulp.task('build:coverage', function() {
  var testfiles = glob.sync("test/**/*.test.js");
  return _buildTestBundle(testfiles, { withInstrumentaion: true });
});

gulp.task('test', ['build:test'], function() {
  return qunit('./tmp/test/index.html');
});

gulp.task('coverage', ['build:coverage'], function() {
  qunit('./tmp/test/index.html', {
    customRunner: path.join(__dirname, 'test/run-phantomjs.js')
  }, function() {
    gulp.src('./coverage/coverage.json')
    .pipe(istanbulReport({
      reporters: ['html']
    }));
  });
});

gulp.task('default', ['build']);
