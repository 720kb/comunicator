'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
  var _ref$connectedSockets = _ref.connectedSockets,
      connectedSockets = _ref$connectedSockets === undefined ? new Map() : _ref$connectedSockets;
  return {
    'isUserPresent': function isUserPresent(who) {

      return connectedSockets.has(who);
    }
  };
};
//# sourceMappingURL=user.js.map
