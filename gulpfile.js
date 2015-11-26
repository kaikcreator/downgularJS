var gulp = require('gulp');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');


gulp.task('concat', function() {
  return gulp.src(['./src/module.js','./src/*.js'])
    .pipe(concat('downgular.js'))
    .pipe(gulp.dest('./dist/'))
    .pipe(gulp.dest('./tests/'))
});

gulp.task('lint', function() {
  return gulp.src('./src/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});