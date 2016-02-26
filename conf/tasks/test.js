/*global require*/
(function buildTask() {
  'use strict';

  const gulp = require('gulp')
    , shell = require('gulp-shell')
    , paths = require('../paths');

  gulp.task('test', ['dist'], () => {

    return gulp.src(paths.spec)
      .pipe(shell('node_modules/.bin/lab --debug --verbose <%= file.path %>'));
  });

  gulp.task('test-pre-commit', ['lint'], () => {

    return gulp.src(paths.spec)
      .pipe(shell('node_modules/.bin/lab --debug --verbose <%= file.path %>'));
  });
}());
