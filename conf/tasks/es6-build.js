/*global require*/
(function buildTask() {
  'use strict';

  const gulp = require('gulp')
    , changed = require('gulp-changed')
    , plumber = require('gulp-plumber')
    , babel = require('gulp-babel')
    , rename = require('gulp-rename')
    , runSequence = require('run-sequence')
    , paths = require('../paths');

  gulp.task('es6-build', ['clean'], done => {

    return runSequence(['es6-build-js', 'es6-build-ng'], done);
  });

  gulp.task('es6-build-js', () => {

    return gulp.src(`${paths.lib}${paths.files.unminified.js}`)
      .pipe(plumber())
      .pipe(changed(`${paths.tmp}`, {
        'extension': '.js'
      }))
      .pipe(babel())
      .pipe(rename(path => {

        paths.dirname = '';
        path.basename = paths.files.minified.js;
        return path;
      }))
      .pipe(gulp.dest(`${paths.tmp}`));
  });

  gulp.task('es6-build-ng', () => {

    return gulp.src(`${paths.lib}${paths.files.unminified.ng}`)
      .pipe(plumber())
      .pipe(changed(`${paths.tmp}`, {
        'extension': '.js'
      }))
      .pipe(babel())
      .pipe(rename(path => {

        paths.dirname = '';
        path.basename = paths.files.minified.ng;
        return path;
      }))
      .pipe(gulp.dest(`${paths.tmp}`));
  });
}());
