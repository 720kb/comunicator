/*global require*/
(function withGulp(require) {
  'use strict';

  const gulp = require('gulp')
    , umd = require('gulp-umd');

  gulp.task('default', () => {

    return gulp.src('src/!(node)/*.js')
      .pipe(umd())
      .pipe(gulp.dest('lib'));
  });
}(require));
