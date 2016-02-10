/*global require,module*/
const ws = require('ws')
  , debug = require('debug')('720kb:comunicator:broadcaster:debug');

module.exports = ({connectedSockets = new Map()}) => ({
  'broadcast': (whoami, what) => {

    if (!whoami &&
      !what) {

      throw new Error(`Mandatory params [whoami] - [what]: ${whoami} - ${what}`);
    } else {

      const toSend = {
          'opcode': 'broadcasted',
          whoami,
          what
        }
        , whoamiWebSocket = connectedSockets.get(whoami);

      debug(`Broadcasting message from ${whoami}: ${what}`);
      for (const aSocket of connectedSockets) {

        if (aSocket &&
          aSocket.length === 2 &&
          aSocket[1] !== whoamiWebSocket &&
          aSocket[1].readyState === ws.OPEN) {

          aSocket[1].send(JSON.stringify(toSend));
        }
      }
    }
  }
});
