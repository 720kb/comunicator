/*global module, require*/
(function setUp(module, require) {
  'use strict';

  var banner = ['/*',
      ' * <%= pkg.name %> - v<%= pkg.version %>',
      ' *',
      ' * <%= pkg.description %>',
      ' * <%= grunt.template.today("yyyy-mm-dd") %>',
      ' */\n\n'].join('\n')
    , modRewrite = require('connect-modrewrite');

  module.exports = function doGrunt(grunt) {

    grunt.initConfig({
      'pkg': grunt.file.readJSON('package.json'),
      'confs': {
        'dist': 'dist',
        'config': 'config',
        'angular': 'src/angular',
        'node': 'src/node',
        'serverPort': 8000
      },
      'eslint': {
        'options': {
          'config': '<%= confs.config %>/eslint.json'
        },
        'target': [
          'Gruntfile.js',
          '<%= confs.angular %>/**/*.js',
          '<%= confs.node %>/**/*.js'
        ]
      },
      'uglify': {
        'options': {
          'sourceMap': true,
          'preserveComments': false,
          'report': 'gzip',
          'banner': banner
        },
        'minifyTarget': {
          'files': {
            '<%= confs.dist %>/<%= pkg.name %>-angular.min.js': [
              '<%= confs.angular %>/<%= pkg.name %>.js'
            ],
            '<%= confs.dist %>/<%= pkg.name %>-node.min.js': [
              '<%= confs.node %>/<%= pkg.name %>.js'
            ]
          }
        }
      },
      'watch': {
        'dev': {
          'files': [
            'Gruntfile.js',
            '<%= confs.angular %>/**/*.js',
            '<%= confs.node %>/**/*.js'
          ],
          'tasks': [
            'eslint'
          ],
          'options': {
            'spawn': false
          }
        }
      },
      'concurrent': {
        'dev': {
          'tasks': [
            'watch:dev'
          ],
          'options': {
            'limit': '<%= concurrent.dev.tasks.length %>',
            'logConcurrentOutput': true
          }
        }
      }
    });

    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [
      'eslint',
      'concurrent:dev'
    ]);

    grunt.registerTask('prod', [
      'eslint',
      'uglify'
    ]);
  };
}(module, require));
