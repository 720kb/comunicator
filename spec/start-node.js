/*global __dirname,require,console*/
(function withModule(__dirname, require, console) {
  'use strict';

  const salt = 'kjwf788fu38l102ijllwefliuh98hegfj98usjsjsnwe%&kjnwef$kjwnflllyyyuii'
    , crypto = require('crypto')
    , jwt = require('jsonwebtoken')
    , Hapi = require('hapi')
    , Inert = require('inert')
    , Comunicator = require('../src/node/comunicator')
    , comunicator = new Comunicator(salt)
    , server = new Hapi.Server()
    , path = require('path')
    , publicFolder = path.resolve(__dirname, 'www');

  server.connection({
    'host': '0.0.0.0',
    'port': 3000
  });

  comunicator.on('comunicator:ready', (connectionInformations) => {

    console.info(`Server listen websocket connections on ${connectionInformations.host}:${connectionInformations.port}`);
  });

  comunicator.on('comunicator:user-leave', (whoami) => {

    console.log(`${whoami} went offline...`);
  });

  comunicator.on('comunicator:user-joined', (whoami) => {

    console.log(`${whoami} goes online...`);
  });

  comunicator.on('comunicator:message-arrived', (aMessage) => {

    console.log(`A message is arrived: ${aMessage}`);
  });

  server.register(Inert, () => {

    server.route({
      'method': 'GET',
      'path': '/token',
      'handler': (request, reply) => {

        var userID = crypto.pseudoRandomBytes(20).toString('hex')
          , token = jwt.sign({
            'user': userID
          }, salt);

        reply({
          'token': token,
          'userID': userID
        });
      }
    });

    server.route({
      'method': 'GET',
      'path': '/{param*}',
      'handler': {
        'directory': {
          'path': publicFolder,
          'listing': false
        }
      }
    });

    server.start(() => {

      console.log('Server running at:', server.info.uri);
    });
  });
}(__dirname, require, console));
