'use strict';

/**
* comunicator
* 3.0.0
*
* The 720kb notifier api (atm it uses websockets)
* https://github.com/720kb/comunicator
*
* MIT license
* Fri Feb 26 2016
*/
/*global module,require*/
var ws = require('ws'),
    debug = require('debug')('720kb:comunicator:broadcaster:debug');

module.exports = function (_ref) {
  var _ref$connectedSockets = _ref.connectedSockets;
  var connectedSockets = _ref$connectedSockets === undefined ? new Map() : _ref$connectedSockets;
  return {
    'broadcast': function broadcast(whoami, what) {

      if (!whoami && !what) {

        throw new Error('Mandatory params [whoami] - [what]: ' + whoami + ' - ' + what);
      } else {

        var toSend = {
          'opcode': 'to-all',
          whoami: whoami,
          what: what
        },
            whoamiWebSocket = connectedSockets.get(whoami);

        debug('Broadcasting message from ' + whoami + ': ' + what);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = connectedSockets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var aSocket = _step.value;


            if (aSocket && aSocket.length === 2 && aSocket[1] !== whoamiWebSocket && aSocket[1].readyState === ws.OPEN) {

              aSocket[1].send(JSON.stringify(toSend));
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }
  };
};
//# sourceMappingURL=broadcast.js.map
