/*global require*/
(function buildTask() {
  'use strict';

  const gulp = require('gulp')
    , runSequence = require('run-sequence')
    , plumber = require('gulp-plumber')
    , rollup = require('gulp-rollup')
    , babel = require('gulp-babel')
    , sourcemaps = require('gulp-sourcemaps')
    , paths = require('../paths');

  gulp.task('es6-build', ['clean'], done => {

    runSequence(['es6-build-node', 'es6-build-frontend'],
      done);
  });

  gulp.task('es6-build-node', () => {

    return gulp.src(`${paths.lib}node/**/*.js`)
      .pipe(plumber())
      .pipe(babel({
        'presets': [
          'es2015'
        ],
        'moduleIds': true
      }))
      .pipe(gulp.dest(`${paths.tmp}node`));
  });

  gulp.task('es6-build-frontend', () => {

    return gulp.src(`${paths.lib}frontend/*.js`, {
        'read': false
      })
      .pipe(plumber())
      .pipe(rollup({
        // any option supported by rollup can be set here, including sourceMap
        'sourceMap': true
      }))
      .pipe(babel({
        'presets': [
          'es2015'
        ],
        'plugins': [
          'transform-es2015-modules-umd'
        ],
        'moduleIds': true
      }))
      .pipe(sourcemaps.write('.')) // this only works if the sourceMap option is true
      .pipe(gulp.dest(`${paths.tmp}frontend`));
  });
}());
