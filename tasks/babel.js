/*global require,module*/
const gulp = require('gulp')
  , babel = require('gulp-babel')
  , sourcemaps = require('gulp-sourcemaps');

module.exports = application => {

  return gulp.src(application.confs.js.src)
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(application.confs.folders.dist));
};
