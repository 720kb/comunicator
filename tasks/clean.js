/*global require,module*/
const del = require('del');

module.exports = application => {

  return del([
    application.confs.folders.dist,
    application.confs.folders.tmp
  ]);
};
