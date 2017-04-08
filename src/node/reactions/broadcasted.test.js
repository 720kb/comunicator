/*global jest,describe,test,expect*/
import jwt from 'jsonwebtoken';

import broadcastedFactory from './broadcasted';

describe('Broadcasted method', () => {

  test('Is defined', () => {

    expect(broadcastedFactory).toBeDefined();
  });

  test('Instantiate with nothing', () => {
    expect(() => {

      broadcastedFactory();
    }).toThrow('Missing context');
  });

  test('Instantiate with no broadcast and no jwtSaltKey', () => {

    expect(() => {

      broadcastedFactory({});
    }).toThrow('Missing mandatory parameter broadcast.');
  });

  test('Instantiate with broadcast and no jwtSaltKey', () => {

    expect(() => {

      broadcastedFactory({
        'broadcast': jest.fn()
      });
    }).toThrow('Missing mandatory parameter jwtSaltKey.');
  });

  test('Instantiate with sendTo, connectedSockets, no sendPendingRequests and no jwtSaltKey', () => {
    const broadcastFunction = broadcastedFactory({
        'broadcast': jest.fn(),
        'jwtSaltKey': 'abcdefghi'
      });

    expect(broadcastFunction).toBeDefined();
    expect(Object.keys(broadcastFunction)).toEqual(['broadcasted']);
  });

  describe('Broadcast reaction function', () => {
    const jwtSaltKey = 'abcdefghi'
      , broadcast = jest.fn()
      , token = jwt.sign({'name': 'test'}, jwtSaltKey)
      , broadcastFunction = broadcastedFactory({
        broadcast,
        jwtSaltKey
      }).broadcasted;

    test('No message, socket and subscriber', () => {
      expect(() => {

        broadcastFunction();
      }).toThrow('Missing mandatory parameter message.');
    });

    describe('Message present but no subscriber', () => {

      test('Nothing', () => {
        expect(() => {

          broadcastFunction({});
        }).toThrow('Missing mandatory message parameter whoami.');
      });

      test('Token present but no whoami and no what', () => {
        expect(() => {

          broadcastFunction({
            token
          });
        }).toThrow('Missing mandatory message parameter whoami.');
      });

      test('Token present and whoami and no what', () => {
        expect(() => {

          broadcastFunction({
            token,
            'whoami': 'test'
          });
        }).toThrow('Missing mandatory message parameter what.');
      });

      test('Token present and whoami and what', () => {
        expect(() => {

           broadcastFunction({
            token,
            'whoami': 'test',
            'what': 'what!?'
          });
        }).toThrow('Missing mandatory parameter subscriber.');
      });

      test('Whoami present but no token', () => {
        expect(() => {

          broadcastFunction({
            'whoami': 'test'
          });
        }).toThrow('Missing mandatory message parameter token.');
      });
    });

    describe('Message and subscriber present', () => {

      test('Subscriber present but empty object', () => {
        expect(() => {

          broadcastFunction({
            token,
            'whoami': 'test',
            'what': 'what!?'
          }, {});
        }).toThrow('Missing mandatory subscriber parameter next.');
      });

      test('Subscriber present but empty object', () => {
        expect(() => {

          broadcastFunction({
            token,
            'whoami': 'test',
            'what': 'what!?'
          }, {
            'next': jest.fn()
          });
        }).toThrow('Missing mandatory subscriber parameter error.');
      });
    });

    describe('Execution', () => {

      test('Invalid token', () => {
        const errorFn = jest.fn();

        broadcastFunction({
          'token': 'wrong',
          'whoami': 'test',
          'what': 'what!?'
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
        const nextFn = jest.fn();

        broadcastFunction({
          token,
          'whoami': 'test',
          'what': 'what!?'
        }, {
          'next': nextFn,
          'error': jest.fn()
        });

        expect(broadcast.mock.calls.length).toBe(1);
        expect(broadcast.mock.calls[0].length).toBe(2);
        expect(broadcast.mock.calls[0][0]).toBe('test');
        expect(broadcast.mock.calls[0][1]).toBe('what!?');

        expect(nextFn.mock.calls.length).toBe(1);

        expect(nextFn.mock.calls[0].length).toBe(1);
        expect(nextFn.mock.calls[0][0]).toEqual({'type': 'message-arrived', 'what': 'what!?', 'who': '*', 'whoami': 'test'});
      });
    });
  });
});
