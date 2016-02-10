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
      'dist': 'dist/',
      'spec': 'spec/**/*.js'
    };

  module.exports = paths;
}());
