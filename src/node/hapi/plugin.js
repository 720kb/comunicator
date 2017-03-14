import joi from 'joi';

const optionsSchema = joi.object().keys({
    'connectionName': joi.string().alphanum(),
    'jwtSalt': joi.string().required()
  })
  , packageJSONMandatory = () => {
    throw new Error('Missing mandatory parameter package.json.');
  }
  , comunicatorMandatory = () => {
    throw new Error('Missing mandatory parameter comunicator.');
  }
  , nameMandatory = () => {
    throw new Error('Missing mandatory parameter name into package.json.');
  }
  , versionMandatory = () => {
    throw new Error('Missing mandatory parameter version into package.json.');
  }
  , toExport = ({name = nameMandatory(), version = versionMandatory()} = packageJSONMandatory(), Comunicator = comunicatorMandatory()) => {

    const comunicatorHapiPlugin = (server, options, next) => {

      if (options) {
        joi.validate(options, optionsSchema, (err, value) => {

          if (err) {

            return next(new Error(err));
          }

          if (server) {

            if (!server.connections.length ||
              !server.connections[0].listener) {

              return next(new Error('No server connection specified'));
            }

            if (value.connectionName) {

              server.decorate('server', 'comunicator', new Comunicator({
                'server': server.select(value.connectionName).listener
              }, value.jwtSalt));
            } else {

              server.decorate('server', 'comunicator', new Comunicator({
                'server': server.connections[0].listener
              }, value.jwtSalt));
            }

            return next();
          }
          return next(new Error('Server is not specified'));
        });
      } else {

        return next(new Error('You must specify the options'));
      }
    };

    comunicatorHapiPlugin.attributes = {
      name,
      version
    };

    return {
      'register': comunicatorHapiPlugin
    };
  };

export default toExport;
