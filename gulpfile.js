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
var generate = require('./doc/generator/generate');
var config = require('./doc/config.json');
var sass = require('gulp-sass');
var through2 = require('through2');
var fs = require('fs');

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
      this.emit('end');
    })
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));
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

gulp.task('default', ['build']);
