/*global require,process*/
(function buildTask() {
  'use strict';

  const gulp = require('gulp')
    , spawn = require('child_process').spawn;
  let node;

  gulp.task('example', ['dist'], () => {
    if (node) {
      node.kill();
    }

    node = spawn('node', ['example/start-node.js'], {
      'stdio': 'inherit'
    });
    node.on('close', code => {
      if (code === 8) {

        gulp.log('Error detected, waiting for changes...');
      }
    });
  });

  gulp.task('example-debug', ['dist'], () => {
    if (node) {
      node.kill();
    }

    node = spawn('./node_modules/.bin/node-debug', ['example/start-node.js'], {
      'stdio': 'inherit'
    });
    node.on('close', code => {
      if (code === 8) {

        gulp.log('Error detected, waiting for changes...');
      }
    });
  });

  process.on('exit', () => {
    if (node) {
      node.kill();
    }
  });
}());
