'use strict';

/**
* comunicator
* 2.2.4
*
* The 720kb notifier api (atm it uses websockets)
* https://github.com/720kb/comunicator
*
* MIT license
* Fri Feb 26 2016
*/
/*global require,module,__dirname*/

var path = require('path'),
    joi = require('joi'),
    optionsSchema = joi.object().keys({
  'connectionName': joi.string().alphanum(),
  'jwtSalt': joi.string().required()
}),
    packageJSON = path.resolve(__dirname, '../..', 'package.json'),
    packageInformation = require(packageJSON);

module.exports = function (Comunicator) {

  var comunicatorHapiPlugin = function comunicatorHapiPlugin(server, options, next) {

    if (options) {
      joi.validate(options, optionsSchema, function (err, value) {

        if (err) {

          return next(new Error(err));
        }

        if (server) {
          var connection = value.connectionName ? server.select(value.connectionName).listener : server.connections[0].listener;

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
//# sourceMappingURL=hapi-plugin.js.map
