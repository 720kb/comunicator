/*global require,module,process,console*/
(function withNode() {
  'use strict';

  const debug = require('debug')('comunicator')
    , ws = require('ws')
    , Observable = require('zen-observable')
    , jwt = require('jsonwebtoken')
    , connectedSockets = new Map()
    , sendPendingRequests = {};

  class Comunicator extends Observable {

    constructor(host, port, jwtSaltKey) {

      if (arguments.length === 1) {

        jwtSaltKey = host;
        host = undefined;
        port = undefined;
      }

      host = host || process.env.COMUNICATOR_HOST || '0.0.0.0';
      port = port || process.env.COMUNICATOR_PORT || 9876;

      super(observer => {
        let webSocket = new ws.Server({
          'host': host,
          'port': port
        }, element => {

          console.info('webSocket server on', element);
          /*
          this.emit('comunicator:ready', {
            'host': host,
            'port': port
          });*/
        });

        return a => {

          console.info('unsub', a);
        }
      });
    }

    broadcast(whoami, what) {

      if (!whoami &&
        !what) {

        /*eslint-disable no-console*/
        console.error('Mandatory params [whoami] - [what]:', whoami, '-', what);
        /*eslint-enable no-console*/
      } else {

        var toSend = {
            'opcode': 'broadcasted',
            'whoami': whoami,
            'what': what
          }
          , whoamiWebSocket = connectedSockets.get(whoami);

        for (let aSocket of connectedSockets) {

          if (aSocket &&
            aSocket.length === 2 &&
            aSocket[1] !== whoamiWebSocket &&
            aSocket[1].readyState === ws.OPEN) {

            aSocket[1].send(JSON.stringify(toSend));
          }
        }
      }
    }

    sendTo(whoami, who, what) {

      if (!whoami &&
        !who &&
        !what) {

        /*eslint-disable no-console*/
        console.error('Mandatory params [whoami] - [who] - [what]:', whoami, '-', who, '-', what);
        /*eslint-enable no-console*/
      } else {

        var toSend = {
            'opcode': 'sent',
            'whoami': whoami,
            'who': who,
            'what': what
          }
          , aWebSocket = connectedSockets.get(who);

        if (!!aWebSocket &&
          aWebSocket.readyState === ws.OPEN) {

          aWebSocket.send(JSON.stringify(toSend));
        } else {

          if (!sendPendingRequests[who]) {

            sendPendingRequests[who] = [];
          }
          sendPendingRequests[who].push(this.sendTo.bind(this, whoami, who, what));
          /*eslint-disable no-console*/
          console.error('User', who, ' isn\'t here at the moment...');
          /*eslint-enable no-console*/
        }
      }
    }

    isUserPresent(who) {

      if (!who) {

        return false;
      }
      return connectedSockets.has(who);
    }
  }

  module.exports = Comunicator;
}());
