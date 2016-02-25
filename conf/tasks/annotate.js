/*global require*/
(function buildTask() {
  'use strict';

  const gulp = require('gulp')
    , plumber = require('gulp-plumber')
    , ngAnnotate = require('gulp-ng-annotate')
    , paths = require('../paths');

  gulp.task('annotate', ['clean'], () => {

    return gulp.src(`${paths.tmp}**/*.js`)
      .pipe(plumber())
      .pipe(ngAnnotate({
        'gulpWarnings': false
      }))
      .pipe(gulp.dest(`${paths.tmp}`));
  });
}());
