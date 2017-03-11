'use strict';

var _angular = require('angular');

var _angular2 = _interopRequireDefault(_angular);

var _comunicator = require('./comunicator');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_angular2.default.module('720kb.comunicator', []).provider('Comunicator', function () {
  var comunicator = void 0;
  var initComunicator = function initComunicator(url) {

    comunicator = new _comunicator.Comunicator(url);
    return comunicator;
  };

  return {
    'setComunicatorServerURL': initComunicator,
    '$get': /*@ngInject*/function $get() {

      return comunicator;
    }
  };
});
//# sourceMappingURL=angular-comunicator.js.map
