/*global require*/
(function buildTask() {
  'use strict';

  const gulp = require('gulp')
    , plumber = require('gulp-plumber')
    , ngAnnotate = require('gulp-ng-annotate')
    , header = require('gulp-header')
    , paths = require('../paths');

  gulp.task('annotate', ['es6-build'], () => {

    return gulp.src(`${paths.tmp}${paths.files.minified.ng}.js`)
      .pipe(plumber())
      .pipe(ngAnnotate({
        'gulpWarnings': false
      }))
      .pipe(header(paths.banner))
      .pipe(gulp.dest(`${paths.tmp}`));
  });
}());
