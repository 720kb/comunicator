/*global jest,describe,test,expect*/
import ws from 'ws';
import jwt from 'jsonwebtoken';

import joinedFactory from './joined';

describe('Joined method', () => {

  test('Is defined', () => {

    expect(joinedFactory).toBeDefined();
  });

  test('Instantiate with nothing', () => {
    expect(() => {

      joinedFactory();
    }).toThrow('Missing context');
  });

  test('Instantiate with no connectedSockets, no sendPendingRequests and no jwtSaltKey', () => {

    expect(() => {

      joinedFactory({});
    }).toThrow('Missing mandatory parameter sendTo.');
  });

  test('Instantiate with sendTo, no connectedSockets, no sendPendingRequests and no jwtSaltKey', () => {

    expect(() => {

      joinedFactory({
        'sendTo': jest.fn()
      });
    }).toThrow('Missing mandatory parameter connectedSockets.');
  });

  test('Instantiate with sendTo, connectedSockets, no sendPendingRequests and no jwtSaltKey', () => {

    expect(() => {

      joinedFactory({
        'sendTo': jest.fn(),
        'connectedSockets': new Map()
      });
    }).toThrow('Missing mandatory parameter sendPendingRequests.');
  });

  test('Instantiate with sendTo, connectedSockets, sendPendingRequests and no jwtSaltKey', () => {

    expect(() => {

      joinedFactory({
        'sendTo': jest.fn(),
        'connectedSockets': new Map(),
        'sendPendingRequests': new Map()
      });
    }).toThrow('Missing mandatory parameter jwtSaltKeyMandatory.');
  });

  test('Instantiate with sendTo, connectedSockets, sendPendingRequests and jwtSaltKey', () => {
    const joinFunction = joinedFactory({
      'sendTo': jest.fn(),
      'connectedSockets': new Map(),
      'sendPendingRequests': new Map(),
      'jwtSaltKey': 'abcdefghi'
    });

    expect(joinFunction).toBeDefined();
    expect(Object.keys(joinFunction)).toEqual(['joined']);
  });

  describe('Joined reaction function', () => {
    const jwtSaltKey = 'abcdefghi'
      , sendTo = jest.fn()
      , token = jwt.sign({'name': 'test'}, jwtSaltKey)
      , joinFunction = joinedFactory({
        sendTo,
        'connectedSockets': new Map(),
        'sendPendingRequests': new Map(),
        jwtSaltKey
      }).joined;

    test('No message, socket and subscriber', () => {
      expect(() => {

        joinFunction();
      }).toThrow('Missing mandatory parameter message.');
    });

    describe('Message present but no socket and subscriber', () => {

      test('Nothing', () => {
        expect(() => {

          joinFunction({});
        }).toThrow('Missing mandatory message parameter whoami.');
      });

      test('Token present but no whoami', () => {
        expect(() => {

          joinFunction({
            token
          });
        }).toThrow('Missing mandatory message parameter whoami.');
      });

      test('Token present and whoami', () => {
        expect(() => {

          joinFunction({
            token,
            'whoami': 'test'
          });
        }).toThrow('Missing mandatory parameter socket.');
      });

      test('Whoami present but no token', () => {
        expect(() => {

          joinFunction({
            'whoami': 'test'
          });
        }).toThrow('Missing mandatory message parameter token.');
      });
    });

    describe('Message, socket present but no subscriber', () => {

      test('Socket present but empty object', () => {
        expect(() => {

          joinFunction({
            token,
            'whoami': 'test'
          },
          {});
        }).toThrow('Missing mandatory socket parameter send.');
      });

      test('Socket present with send method', () => {
        expect(() => {

          joinFunction({
            token,
            'whoami': 'test'
          },
          {
            'send': jest.fn()
          });
        }).toThrow('Missing mandatory parameter subscriber.');
      });
    });

    describe('Message, socket and subscriber present', () => {

      test('Subscriber present but empty object', () => {
        expect(() => {

          joinFunction({
            token,
            'whoami': 'test'
          },
          {
            'send': jest.fn()
          }, {});
        }).toThrow('Missing mandatory subscriber parameter next.');
      });

      test('Subscriber present but empty object', () => {
        expect(() => {

          joinFunction({
            token,
            'whoami': 'test'
          },
          {
            'send': jest.fn()
          }, {
            'next': jest.fn()
          });
        }).toThrow('Missing mandatory subscriber parameter error.');
      });
    });

    describe('Execution', () => {

      test('Invalid token', () => {
        const errorFn = jest.fn();

        joinFunction({
          'token': 'wrong',
          'whoami': 'test'
        },
        {
          'send': jest.fn()
        }, {
          'next': jest.fn(),
          'error': errorFn
        });

        expect(errorFn.mock.calls.length).toBe(1);
        expect(errorFn.mock.calls[0].length).toBe(1);
        expect(errorFn.mock.calls[0][0]).toEqual({
          'cause': 'jwt malformed',
          'type': 'error'
        });
      });

      test('Valid token', () => {
        const sendFn = jest.fn()
          , nextFn = jest.fn();

        joinFunction({
          token,
          'whoami': 'test'
        },
        {
          'send': sendFn
        }, {
          'next': nextFn,
          'error': jest.fn()
        });

        expect(sendFn.mock.calls.length).toBe(1);
        expect(sendFn.mock.calls[0].length).toBe(1);
        expect(sendFn.mock.calls[0][0]).toBe('{"opcode":"joined","whoami":"test"}');

        expect(nextFn.mock.calls.length).toBe(2);

        expect(nextFn.mock.calls[0].length).toBe(1);
        expect(nextFn.mock.calls[0][0]).toEqual({'type': 'user-joined', 'whoami': 'test'});

        expect(nextFn.mock.calls[1].length).toBe(1);
        expect(nextFn.mock.calls[1][0]).toEqual({'type': 'no-pending-messages', 'whoami': 'test'});
      });

      describe('Have pending requests', () => {
        const whoami = 'me'
          , connectedSockets = new Map([
            [whoami, {
              'readyState': ws.OPEN,
              'send': jest.fn()
            }]
          ])
          , sendPendingRequests = new Map()
          , joinFunction2 = joinedFactory({
            sendTo,
            connectedSockets,
            sendPendingRequests,
            jwtSaltKey
          }).joined
          , message = {
            whoami,
            token
          }
          , socket = {
            'send': jest.fn()
          }
          , subscriber = {
            'next': jest.fn(),
            'error': jest.fn()
          };


        test('Pending requests ok', () => {
          sendPendingRequests.set(whoami, [{
            'who': whoami,
            'whoami': 'other',
            'what': 'Message...'
          }]);

          joinFunction2(message, socket, subscriber);

          expect(sendPendingRequests.has(whoami)).toBe(false);
          expect(sendTo.mock.calls.length).toBe(1);
          expect(sendTo.mock.calls[0].length).toBe(3);
          expect(sendTo.mock.calls[0][0]).toBe('other');
          expect(sendTo.mock.calls[0][1]).toBe(whoami);
          expect(sendTo.mock.calls[0][2]).toBe('Message...');
        });

        test('Pending requests with errors', () => {
          sendPendingRequests.set(whoami, [{
            'who': whoami,
            'whoami': 'other'
          }]);

          joinFunction2(message, socket, subscriber);

          expect(sendPendingRequests.has(whoami)).toBe(false);
          expect(subscriber.error.mock.calls.length).toBe(1);
          expect(subscriber.error.mock.calls[0].length).toBe(1);
          expect(subscriber.error.mock.calls[0][0]).toEqual({
            'cause': 'A pending request is invalid.',
            'type': 'warning'
          });
        });
      });
    });
  });
});
