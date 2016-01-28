/*global __dirname,require,console*/
(function withModule(__dirname, require, console) {
  'use strict';

  var salt = 'kjwf788fu38l102ijllwefliuh98hegfj98usjsjsnwe%&kjnwef$kjwnflllyyyuii'
    , jwt = require('jsonwebtoken')
    , Hapi = require('hapi')
    , server = new Hapi.Server()
    , path = require('path')
    , publicFolder = path.resolve(__dirname, '', 'www');

  server.connection({
    'host': '0.0.0.0',
    'port': 3000
  });

  require('../src/node/comunicator')({
    'server': server.connections[0].listener
  }, salt);
  /*{
    'host': comunicatorHost,
    'port': comunicatorPort
  }*/

  server.route({
    'method': 'GET',
    'path': '/token',
    'handler': function handler(request, reply) {

      var userID = parseInt(Math.random() * 100000000, 10)
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

  server.start(function onStart() {

    console.log('Server running at:', server.info.uri);
  });
}(__dirname, require, console));
