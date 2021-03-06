'use strict';

/**
* comunicator
* 3.0.1
*
* The 720kb notifier api (atm it uses websockets)
* https://github.com/720kb/comunicator
*
* MIT license
* Sun Mar 06 2016
*/
/*global module*/
module.exports = function (_ref) {
  var _ref$connectedSockets = _ref.connectedSockets;
  var connectedSockets = _ref$connectedSockets === undefined ? new Map() : _ref$connectedSockets;
  return {
    'isUserPresent': function isUserPresent(who) {

      return connectedSockets.has(who);
    }
  };
};
//# sourceMappingURL=user.js.map
