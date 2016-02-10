/*global module,require*/
(function testing(module, require) {
  'use strict';

  const code = require('code')
    , lab = require('lab').script()
    , ws = require('ws')
    , describe = lab.describe
    , it = lab.it
    , before = lab.before
    , expect = code.expect
    , salt = 'kjwf788fu38l102ijllwefliuh98hegfj98usjsjsnwe%&kjnwef$kjwnflllyyyuii'
    , Comunicator = require('../src/node/comunicator')
    , ComunicatorClient = require('../src/js/comunicator');

  describe('comunicator client and server comunicates', () => {
    let theComunicatorServer
      , theComunicatorClient
      , websocketClient;

    before(done => {

      websocketClient = new ws.WebSocket('localhost:9876');
      theComunicatorServer = new Comunicator(salt);
      theComunicatorClient = new ComunicatorClient(websocketClient);

      theComunicatorServer.on('comunicator:ready', connectionInformations => {

        console.info(`Server listen websocket connections on ${connectionInformations.host}:${connectionInformations.port}`);
      });

      theComunicatorServer.on('comunicator:user-leave', whoami => {

        console.log(`${whoami} went offline...`);
      });

      theComunicatorServer.on('comunicator:user-joined', whoami => {

        console.log(`${whoami} goes online...`);
      });

      theComunicatorServer.on('comunicator:message-arrived', aMessage => {

        console.log(`A message is arrived: ${aMessage}`);
      });
      done();
    });
  });

  module.exports = {
    'lab': lab
  };
}(module, require));
