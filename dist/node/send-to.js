'use strict';

/**
* comunicator
* 2.2.4
*
* The 720kb notifier api (atm it uses websockets)
* https://github.com/720kb/comunicator
*
* MIT license
* Thu Feb 25 2016
*/
/*global require,module*/
var ws = require('ws'),
    debug = require('debug')('720kb:comunicator:sender:debug');

module.exports = function (_ref) {
  var _ref$connectedSockets = _ref.connectedSockets;
  var connectedSockets = _ref$connectedSockets === undefined ? new Map() : _ref$connectedSockets;
  var _ref$sendPendingReque = _ref.sendPendingRequests;
  var sendPendingRequests = _ref$sendPendingReque === undefined ? new Map() : _ref$sendPendingReque;
  return {
    'sendTo': function sendTo(whoami, who, what) {

      if (!whoami && !who && !what) {

        throw new Error('Mandatory params [whoami] - [who] - [what]: ' + whoami + ' - ' + who + ' - ' + what);
      } else {

        var toSend = {
          'opcode': 'to-me',
          whoami: whoami,
          who: who,
          what: what
        },
            aWebSocket = connectedSockets.get(who);

        debug('Sending message from ' + whoami + ' to ' + who + ' via ' + aWebSocket + ': ' + what);
        if (Boolean(aWebSocket) && aWebSocket.readyState === ws.OPEN) {

          aWebSocket.send(JSON.stringify(toSend));
        } else {

          if (!sendPendingRequests.has(who)) {

            sendPendingRequests.set(who, []);
          }

          sendPendingRequests.get(who).push({
            whoami: whoami,
            who: who,
            what: what
          });
          debug('User ' + who + ' isn\'t here at the moment...');
        }
      }
    }
  };
};
//# sourceMappingURL=send-to.js.map
