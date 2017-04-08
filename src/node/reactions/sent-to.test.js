/*global jest,describe,test,expect*/
import jwt from 'jsonwebtoken';

import sentToFactory from './sent-to';

describe('SentTo method', () => {

  test('Is defined', () => {

    expect(sentToFactory).toBeDefined();
  });

  test('Instantiate with nothing', () => {
    expect(() => {

      sentToFactory();
    }).toThrow('Missing context');
  });

  test('Instantiate with no sendTo and no jwtSaltKey', () => {

    expect(() => {

      sentToFactory({});
    }).toThrow('Missing mandatory parameter sendTo');
  });

  test('Instantiate with sendTo and no jwtSaltKey', () => {

    expect(() => {

      sentToFactory({
        'sendTo': jest.fn()
      });
    }).toThrow('Missing mandatory parameter jwtSaltKey');
  });

  test('Instantiate with sendTo, connectedSockets, no sendPendingRequests and no jwtSaltKey', () => {
    const sentTo = sentToFactory({
        'sendTo': jest.fn(),
        'jwtSaltKey': 'abcdefghi'
      });

    expect(sentTo).toBeDefined();
    expect(Object.keys(sentTo)).toEqual(['sentTo']);
  });

  describe('SendTo reaction function', () => {
    const jwtSaltKey = 'abcdefghi'
      , sendTo = jest.fn()
      , token = jwt.sign({'name': 'test'}, jwtSaltKey)
      , sendToFunction = sentToFactory({
        sendTo,
        jwtSaltKey
      }).sentTo;

    test('No message, socket and subscriber', () => {
      expect(() => {

        sendToFunction();
      }).toThrow('Missing mandatory parameter message.');
    });

    describe('Message present but no subscriber', () => {

      test('Nothing', () => {
        expect(() => {

          sendToFunction({});
        }).toThrow('Missing mandatory message parameter whoami.');
      });

      test('Token present but no whoami, no what, no what and no who', () => {
        expect(() => {

          sendToFunction({
            token
          });
        }).toThrow('Missing mandatory message parameter whoami.');
      });

      test('Token present and whoami but no what and no who', () => {
        expect(() => {

          sendToFunction({
            token,
            'whoami': 'test'
          });
        }).toThrow('Missing mandatory message parameter who.');
      });

      test('Token, whoami and who present and no what', () => {
        expect(() => {

          sendToFunction({
            token,
            'whoami': 'test',
            'who': 'are you'
          });
        }).toThrow('Missing mandatory message parameter what.');
      });

      test('Token present, whoami, what and who', () => {
        expect(() => {

           sendToFunction({
            token,
            'whoami': 'test',
            'who': 'are you',
            'what': 'what!?'
          });
        }).toThrow('Missing mandatory parameter subscriber.');
      });

      test('Whoami, what and who present but no token', () => {
        expect(() => {

          sendToFunction({
            'whoami': 'test',
            'who': 'are you',
            'what': 'what!?'
          });
        }).toThrow('Missing mandatory message parameter token.');
      });
    });

    describe('Message and subscriber present', () => {

      test('Subscriber present but empty object', () => {
        expect(() => {

          sendToFunction({
            token,
            'whoami': 'test',
            'who': 'are you',
            'what': 'what!?'
          }, {});
        }).toThrow('Missing mandatory subscriber parameter next.');
      });

      test('Subscriber present but empty object', () => {
        expect(() => {

          sendToFunction({
            token,
            'whoami': 'test',
            'who': 'are you',
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

        sendToFunction({
          'token': 'noooooo',
          'whoami': 'test',
          'who': 'are you',
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

        sendToFunction({
          token,
          'whoami': 'test',
          'who': 'are you',
          'what': 'what!?'
        }, {
          'next': nextFn,
          'error': jest.fn()
        });

        expect(sendTo.mock.calls.length).toBe(1);
        expect(sendTo.mock.calls[0].length).toBe(3);
        expect(sendTo.mock.calls[0][0]).toBe('test');
        expect(sendTo.mock.calls[0][1]).toBe('are you');
        expect(sendTo.mock.calls[0][2]).toBe('what!?');

        expect(nextFn.mock.calls.length).toBe(1);

        expect(nextFn.mock.calls[0].length).toBe(1);
        expect(nextFn.mock.calls[0][0]).toEqual({'type': 'message-arrived', 'what': 'what!?', 'who': 'are you', 'whoami': 'test'});
      });
    });
  });
});
