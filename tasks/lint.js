/*global require,module*/

const gulp = require('gulp')
    , eslint = require('gulp-eslint');

module.exports = application => {

  return gulp.src([application.confs.js.src,
      application.confs.js.gulpfile,
      application.confs.js.tasks
    ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
};
