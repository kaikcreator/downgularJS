var gulp = require('gulp');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var del = require('del');


gulp.task('clean', function () {
  return del([
    'dist/**/*',
    'example/downgular.js',
  ]);
});

gulp.task('concat', ['clean'], function() {
  return gulp.src(['./src/module.js','./src/*.js'])
    .pipe(concat('downgular.js'))
    .pipe(gulp.dest('./dist/'))
    .pipe(gulp.dest('./example/'))
});

gulp.task('lint', function() {
  return gulp.src('./src/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});



gulp.task('default', ['lint'], function() {
    gulp.start('concat');
});