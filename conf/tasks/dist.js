/*global require*/
(function buildTask() {
  'use strict';

  const gulp = require('gulp')
    , paths = require('../paths');

  gulp.task('dist', ['annotate'], () => {

    return gulp.src(`${paths.tmp}/**/*.js`)
      .pipe(gulp.dest(`${paths.dist}`));
  });
}());
