/*global require*/
(function buildTask() {
  'use strict';

  const gulp = require('gulp')
    , paths = require('../paths');

  gulp.task('dist', ['es6-build'], () => {

    return gulp.src(`${paths.tmp}/**/*`)
      .pipe(gulp.dest(`${paths.dist}`));
  });
}());
