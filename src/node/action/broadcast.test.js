/*global jest,describe,test,expect*/
import ws from 'ws';
import broadcastFactory from './broadcast';

describe('Broadcast method', () => {

  test('Is defined', () => {

    expect(broadcastFactory).toBeDefined();
  });

  test('Fail due to missing context', () => {

    expect(() => {

      broadcastFactory();
    }).toThrow('Missing context');
  });

  test('Fail due to missing parameter connectedSockets', () => {

    expect(() => {

      broadcastFactory({});
    }).toThrow('Missing mandatory parameter connectedSockets');
  });

  describe('Instantiate with one connectedSockets', () => {
    const connectedSockets = new Map([
        [
          'me',
          {
            'readyState': ws.OPEN,
            'send': jest.fn()
          }
        ]
      ])
      , broadcast = broadcastFactory({connectedSockets});

    test('Call without whoami and what values', () => {

      expect(() => {

        broadcast.broadcast();
      }).toThrow('Missing mandatory parameter whoami.');
    });

    test('Call without what value', () => {

      expect(() => {

        broadcast.broadcast('me');
      }).toThrow('Missing mandatory parameter what.');
    });

    test('Call method but not sent (only me)', () => {
      const isSent = broadcast.broadcast('me', 'halo!');

      expect(isSent).toBe(false);
    });
  });

  describe('Instantiate with connectedSockets', () => {
    const connectedSockets = new Map([
        [
          'me',
          {
            'readyState': ws.OPEN,
            'send': jest.fn()
          }
        ],
        [
          'other',
          {
            'readyState': ws.OPEN,
            'send': jest.fn()
          }
        ]
      ])
      , broadcast = broadcastFactory({connectedSockets});


    test('Fail due to missing context', () => {

      expect(() => {

        broadcastFactory();
      }).toThrow('Missing context');
    });

    test('Call without whoami and what values', () => {

      expect(() => {

        broadcast.broadcast();
      }).toThrow('Missing mandatory parameter whoami.');
    });

    test('Call without what value', () => {

      expect(() => {

        broadcast.broadcast('me');
      }).toThrow('Missing mandatory parameter what.');
    });

    test('Call method and sent', () => {
      const isSent = broadcast.broadcast('me', 'halo!')
        , callsOnWebSockets = connectedSockets.get('other').send.mock.calls;

      expect(isSent).toBe(true);
      expect(callsOnWebSockets.length).toBe(1);//Number of calls
      expect(callsOnWebSockets[0].length).toBe(1);//Number of arguments to call
      expect(callsOnWebSockets[0][0]).toBe('{"opcode":"to-all","whoami":"me","what":"halo!"}');
    });
  });
});
