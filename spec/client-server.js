/*global module,require*/
(function testing() {
  'use strict';

  const EventEmitter = require('events')
    , events = new EventEmitter()
    , code = require('code')
    , lab = require('lab').script()
    , describe = lab.describe
    , it = lab.it
    , expect = code.expect
    , salt = 'kjwf788fu38l102ijllwefliuh98hegfj98usjsjsnwe%&kjnwef$kjwnflllyyyuii'
    , jwtToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjo5MTE2NDExOCwiaWF0IjoxNDU1OTYxMTgzfQ.0Fgi27N32jqdzLFnqMiSeynolxqSHHzTOrzamY5kWuo'
    , Comunicator = require('../dist/node/comunicator').Comunicator
    , ComunicatorClient = require('../dist/frontend/comunicator').Comunicator
    , theComunicatorServer = new Comunicator({
        'host': '::',
        'port': 8000
      }, salt)
    , theFirstComunicatorClient = new ComunicatorClient('ws://localhost:8000')
    , theSecondComunicatorClient = new ComunicatorClient('ws://localhost:8000')
    , subscriberObject = identifier => {

      return {
        'next': val => {

          if (identifier === 'client #1' &&
            val.type === 'joined') {

            events.emit('test-1');
          }

          if (identifier === 'client #2' &&
            val.type === 'joined') {

            events.emit('test-2');
          }

          if (identifier === 'client #2' &&
            val.type === 'to-me') {

            switch (val.what) {
              case 'an unmanaged message, but touched!': {

                events.emit('test-6', val.who, val.whoami, val.what);
                break;
              }
              default: {

                events.emit('test-3', val.who, val.whoami, val.what);
              }
            }
          }

          if (identifier === 'client #1' &&
            val.type === 'to-me') {

            events.emit('test-4', val.who, val.whoami, val.what);
          }

          if (identifier === 'client #2' &&
            val.type === 'to-all') {

            events.emit('test-5', val.whoami, val.what);
          }

          if (identifier === 'server' &&
            val.type === 'message-arrived' &&
            val.what === 'an unmanaged message') {
            const newWhat = `${val.what}, but touched!`;

            expect(val.whoami).to.be.equals('1');
            expect(val.who).to.be.equals('2');
            expect(val.what).to.be.equals('an unmanaged message');
            theComunicatorServer.sendTo(val.whoami, val.who, newWhat);
          }
        },
        'error': err => {

          throw err;
        },
        'complete': () => {

          throw new Error('that\'s all folks!');
        }
      };
    };

  theComunicatorServer
    .subscribe(subscriberObject('server'));
  theFirstComunicatorClient
    .subscribe(subscriberObject('client #1'));
  theSecondComunicatorClient
    .subscribe(subscriberObject('client #2'));

  describe('comunicator client and server comunicates', () => {

    it('should client #1 tell that is present', done => {

      events.on('test-1', () => {

        done();
      });
      theFirstComunicatorClient.userIsPresent('1', jwtToken);
    });

    it('should client #2 tell that is present', done => {

      events.on('test-2', () => {

        done();
      });
      theSecondComunicatorClient.userIsPresent('2', jwtToken);
    });

    it('should client #1 talk to #2', done => {

      events.on('test-3', (who, whoami, what) => {

        expect(who).to.be.equals('2');
        expect(whoami).to.be.equals('1');
        expect(what).to.be.equals('a test');
        done();
      });
      theFirstComunicatorClient.sendTo('2', 'a test');
    });

    it('should client #2 talk to #1', done => {

      events.on('test-4', (who, whoami, what) => {

        expect(who).to.be.equals('1');
        expect(whoami).to.be.equals('2');
        expect(what).to.be.equals('a test reply!');
        done();
      });
      theSecondComunicatorClient.sendTo('1', 'a test reply!');
    });

    it('should client #1 broadcast a message', done => {

      events.on('test-5', (whoami, what) => {

        expect(whoami).to.be.equals('1');
        expect(what).to.be.equals('a broadcast!');
        done();
      });
      theFirstComunicatorClient.broadcast('a broadcast!');
    });

    it('should client #1 talk to #2 but unmanaged', done => {

      events.on('test-6', (who, whoami, what) => {

        expect(who).to.be.equals('2');
        expect(whoami).to.be.equals('1');
        expect(what).to.be.equals('an unmanaged message, but touched!');
        done();
      });
      theFirstComunicatorClient.sendTo('2', 'an unmanaged message', true);
    });
  });

  module.exports = {
    lab
  };
}());
