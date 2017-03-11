/*global require*/
const gulp = require('gulp')
  , packageJson = require('./package.json')
  , babelTask = require('./tasks/babel').bind(undefined, packageJson)
  , cleanTask = require('./tasks/clean').bind(undefined, packageJson);

gulp.task('babel', babelTask);
gulp.task('clean', cleanTask);

gulp.task('default', gulp.series('clean', 'babel'));
