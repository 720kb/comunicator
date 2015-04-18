(function withModule(require) {
  'use strict';

  var salt = 'kjwf788fu38l102ijllwefliuh98hegfj98usjsjsnwe%&kjnwef$kjwnflllyyyuii'
    , comunicator = require('../src/node/comunicator')(salt)
    , jwt = require('jsonwebtoken')
    , Hapi = require('hapi')
    , server = new Hapi.Server()
    , path = require('path')
    , publicFolder = path.resolve(__dirname, '', 'www');;

  server.connection({'host': '0.0.0.0', 'port': 3000});

  server.route({
    'method': 'GET',
    'path': '/token',
    'handler': function handler(request, reply) {

      var userID = parseInt(Math.random() * 100000000, 10)
        , token = jwt.sign({
        'user': userID
      }, salt);

      reply({'token': token, 'userID': userID});
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
}(require));
