/*global module,require*/
(function testing() {
  'use strict';

  const code = require('code')
    , lab = require('lab').script()
    , describe = lab.describe
    , it = lab.it
    , beforeEach = lab.beforeEach
    , expect = code.expect
    , Hapi = require('hapi')
    , salt = 'kjwf788fu38l102ijllwefliuh98hegfj98usjsjsnwe%&kjnwef$kjwnflllyyyuii'
    , comunicator = require('../dist/node/comunicator')
    , hapiComunicator = comunicator.hapiComunicator;

  describe('comunicator hapi plugin is loaded', () => {
    let server;

    beforeEach(done => {

      server = new Hapi.Server();
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
      done();
    });

    it('should register hapi comunicator plugin (with minimun options)', done => {

      server.register([{
        'register': hapiComunicator,
        'options': {
          'jwtSalt': salt
        }
      }], () => {

        expect(server.comunicator).to.be.not.undefined();
        done();
      });
    });

    it('should register hapi comunicator plugin (with minimun all options)', done => {

      server.register([{
        'register': hapiComunicator,
        'options': {
          'connectionName': 'comunicator',
          'jwtSalt': salt
        }
      }], () => {

        expect(server.comunicator).to.be.not.undefined();
        done();
      });
    });
  });

  module.exports = {
    lab
  };
}());
