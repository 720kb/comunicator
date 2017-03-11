import ws from 'ws';
import debug from 'debug';

const log = debug('720kb:comunicator:broadcaster:debug')
  , whoamiMandatory = () => {
    throw new Error('Missing mandatory parameter whoami.');
  }
  , whatMandatory = () => {
    throw new Error('Missing mandatory parameter what.');
  };

export default ({connectedSockets = new Map()}) => ({
  'broadcast': (whoami = whoamiMandatory(), what = whatMandatory()) => {
    const toSend = {
        'opcode': 'to-all',
        whoami,
        what
      }
      , whoamiWebSocket = connectedSockets.get(whoami);

    log(`Broadcasting message from ${whoami}: ${what}`);
    for (const aSocket of connectedSockets) {

      if (aSocket &&
        aSocket.length === 2 &&
        aSocket[1] !== whoamiWebSocket &&
        aSocket[1].readyState === ws.OPEN) {

        aSocket[1].send(JSON.stringify(toSend));
      }
    }
  }
});
