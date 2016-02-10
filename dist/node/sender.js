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

/*global require,module*/
var ws = require('ws'),
    debug = require('debug')('720kb:comunicator:sender:debug'),
    error = require('debug')('720kb:comunicator:sender:error');

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
          'opcode': 'sent',
          whoami: whoami,
          who: who,
          what: what
        },
            aWebSocket = connectedSockets.get(who);

        debug('Sending message from ' + whoami + ' to ' + who + ': ' + what);
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
          error('User ' + who + ' isn\'t here at the moment...');
        }
      }
    }
  };
};