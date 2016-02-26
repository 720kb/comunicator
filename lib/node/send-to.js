/*global require,module*/
const ws = require('ws')
  , debug = require('debug')('720kb:comunicator:sender:debug');

module.exports = ({connectedSockets = new Map(), sendPendingRequests = new Map()}) => ({
  'sendTo': (whoami, who, what) => {

    if (!whoami &&
      !who &&
      !what) {

      throw new Error(`Mandatory params [whoami] - [who] - [what]: ${whoami} - ${who} - ${what}`);
    } else {

      const toSend = {
          'opcode': 'to-me',
          whoami,
          who,
          what
        }
        , aWebSocket = connectedSockets.get(who);

      debug(`Sending message from ${whoami} to ${who} via ${aWebSocket}: ${what}`);
      if (Boolean(aWebSocket) &&
        aWebSocket.readyState === ws.OPEN) {

        aWebSocket.send(JSON.stringify(toSend));
      } else {

        if (!sendPendingRequests.has(who)) {

          sendPendingRequests.set(who, []);
        }

        sendPendingRequests.get(who).push({
          whoami,
          who,
          what
        });
        debug(`User ${who} isn't here at the moment...`);
      }
    }
  }
});
