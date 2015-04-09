/*global module*/
(function setUp(module) {
  'use strict';

  var banner = ['/*',
      ' * <%= pkg.name %> - v<%= pkg.version %>',
      ' *',
      ' * <%= pkg.description %>',
      ' * <%= grunt.template.today("yyyy-mm-dd") %>',
      ' */\n\n'].join('\n');

  module.exports = function doGrunt(grunt) {

    grunt.initConfig({
      'pkg': grunt.file.readJSON('package.json'),
      'confs': {
        'dist': 'dist',
        'config': 'config',
        'js': 'src/js',
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
          '<%= confs.node %>/**/*.js',
          '<%= confs.js %>/**/*.js'
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
              '<%= confs.angular %>/**/*.js',
              '<%= confs.js %>/**/*.js'
            ],
            '<%= confs.dist %>/<%= pkg.name %>-min.js': [
              '<%= confs.js %>/**/*.js'
            ]
          }
        }
      }
    });

    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', [
      'eslint'
    ]);

    grunt.registerTask('prod', [
      'eslint',
      'uglify'
    ]);
  };
}(module));
