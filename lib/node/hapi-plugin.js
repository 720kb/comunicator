/*global require,module,__dirname*/

const path = require('path')
  , joi = require('joi')
  , optionsSchema = joi.object().keys({
      'connectionName': joi.string().alphanum(),
      'jwtSalt': joi.string().required()
    })
  , packageJSON = path.resolve(__dirname, '../..', 'package.json')
  , packageInformation = require(packageJSON);

module.exports = Comunicator => {

  const comunicatorHapiPlugin = (server, options, next) => {

    if (options) {
      joi.validate(options, optionsSchema, (err, value) => {

        if (err) {

          return next(new Error(err));
        }

        if (server) {
          const connection = value.connectionName ? server.select(value.connectionName).listener : server.connections[0].listener;

          server.decorate('server', 'comunicator', new Comunicator({
            'server': connection
          }, value.jwtSalt));
          return next();
        }
        return next(new Error('Server is not specified'));
      });
    } else {

      return next(new Error('You must specify the options'));
    }
  };

  comunicatorHapiPlugin.attributes = {
    'name': packageInformation.name,
    'version': packageInformation.version
  };

  return {
    'register': comunicatorHapiPlugin
  };
};
