/*global __dirname,require,process,console*/
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
    , hapiComunicator = require('../dist/node/comunicator').hapiComunicator
    , subscriberObject = who => {

      return {
        'next': val => {

          console.info(`Next: ${who}, ${JSON.stringify(val)}`);
        },
        'error': err => {

          console.error(`Error: ${who}, ${JSON.stringify(err)}`);
        },
        'complete': () => {

          console.info(`${who} complete`);
        }
      };
    };

  server.connection({
    'host': '::',
    'port': 3000
  });

  server.connection({
    'host': '::',
    'port': 3001,
    'labels': [
      'comunicator'
    ]
  });
  server.register([
    Inert,
    {
      'register': hapiComunicator,
      'options': {
        'connectionName': 'comunicator',
        'jwtSalt': salt
      }
    }], () => {

      const logger = server.comunicator
          .map(anElement => anElement.type)
        , logJoin = server.comunicator
          .filter(anElement => anElement.type === 'user-joined')
          .map(anElement => anElement.whoami)
        , loggerSubscription = logger.subscribe(subscriberObject('logger'))
        , logJoinSubscription = logJoin.subscribe(subscriberObject('join-logger'));

      process.on('exit', () => {

        loggerSubscription.unsubscribe();
        logJoinSubscription.unsubscribe();
      });
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

        server.connections.forEach(element => {

          console.info(`Server running at: ${element.info.uri}`);
        });
      });
    });
}());
