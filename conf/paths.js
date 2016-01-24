/*global require,module*/
(function pathConfiguration() {
  'use strict';

  const infos = require('../package.json')
    , today = new Date()
    , banner = `/**
* ${infos.name}
* ${infos.version}
*
* ${infos.description}
* ${infos.homepage}
*
* ${infos.license} license
* ${today.toDateString('yyyy-MM-dd')}
*/
`
    , paths = {
      banner,
      'tmp': '.tmp/',
      'lib': 'lib/',
      'output': 'dist/',
      'files': {
        'unminified': {
          'js': 'js/comunicator.js',
          'ng': 'ng/comunicator.js'
        },
        'minified': {
          'js': 'comunicator',
          'ng': 'angular-comunicator'
        }
      }
    };

  module.exports = paths;
}());
