import ws from 'ws';
import debug from 'debug';

const log = debug('720kb:comunicator:broadcaster:debug')
  , connectedSocketsMandatory = () => {
    throw new Error('Missing mandatory parameter connectedSockets');
  }
  , whoamiMandatory = () => {
    throw new Error('Missing mandatory parameter whoami.');
  }
  , whatMandatory = () => {
    throw new Error('Missing mandatory parameter what.');
  }
  , contextMandatory = () => {
    throw new Error('Missing context');
  };

export default ({connectedSockets = connectedSocketsMandatory()} = contextMandatory()) => ({
  'broadcast': (whoami = whoamiMandatory(), what = whatMandatory()) => {
    const toSend = {
        'opcode': 'to-all',
        whoami,
        what
      }
      , whoamiWebSocket = connectedSockets.get(whoami);
    let sent = false;

    log(`Broadcasting message from ${whoami}: ${what}`);
    for (const aSocket of connectedSockets) {

      if (aSocket &&
        aSocket.length === 2 &&
        aSocket[1] !== whoamiWebSocket &&
        aSocket[1].readyState === ws.OPEN) {

        aSocket[1].send(JSON.stringify(toSend));
        sent = true;
      }
    }
    return sent;
  }
});
