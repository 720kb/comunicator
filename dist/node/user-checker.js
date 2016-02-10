/**
* comunicator
* 2.2.4
*
* The 720kb notifier api (atm it uses websockets)
* https://github.com/720kb/comunicator
*
* MIT license
* Wed Feb 10 2016
*/
'use strict';

/*global module*/
module.exports = function (_ref) {
  var _ref$connectedSockets = _ref.connectedSockets;
  var connectedSockets = _ref$connectedSockets === undefined ? new Map() : _ref$connectedSockets;
  return {
    'isUserPresent': function isUserPresent(who) {
      if (!who) {

        return false;
      }

      return connectedSockets.has(who);
    }
  };
};