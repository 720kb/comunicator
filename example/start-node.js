/*global __dirname,require,console*/
(function withModule() {
  'use strict';

  const salt = 'kjwf788fu38l102ijllwefliuh98hegfj98usjsjsnwe%&kjnwef$kjwnflllyyyuii'
    , randomMagnitude = 100000000
    , jwt = require('jsonwebtoken')
    , Hapi = require('hapi')
    , Inert = require('inert')
    , server = new Hapi.Server()
    , path = require('path')
    , publicFolder = path.resolve(__dirname, '', 'www')
    , Comunicator = require('../dist/node/comunicator');

  server.connection({
    'host': '0.0.0.0',
    'port': 3000
  });
  server.register(Inert, () => {
    const comunicator = new Comunicator({
      'host': '0.0.0.0',
      'port': 3001
    }, salt);

    comunicator.forEach(console.log);
    server.route({
      'method': 'GET',
      'path': '/token',
      'handler': (request, reply) => {

        const userID = parseInt(Math.random() * randomMagnitude, 10)
          , token = jwt.sign({
          'user': userID
        }, salt);

        reply({
          token,
          userID
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
}());
