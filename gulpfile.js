/*global require*/
const gulp = require('gulp')
  , packageJson = require('./package.json')
  , babel = require('./tasks/babel').bind(undefined, packageJson)
  , lintTask = require('./tasks/lint').bind(undefined, packageJson);

gulp.task('lint', lintTask);
gulp.task('build', babel);

gulp.task('default', gulp.series('lint'));
