/*global jest,describe,test,expect*/
import ws from 'ws';
import sendToFactory from './send-to';

describe('SendTo method', () => {

  test('Is defined', () => {

    expect(sendToFactory).toBeDefined();
  });

  test('Instantiate with nothing', () => {
    expect(() => {

      sendToFactory();
    }).toThrow('Missing context');
  });

  test('Instantiate with no connectedSockets and no sendPendingRequests', () => {

    expect(() => {

      sendToFactory({});
    }).toThrow('Missing mandatory parameter connectedSockets.');
  });

  test('Instantiate with connectedSockets and not sendPendingRequests', () => {

    expect(() => {

      sendToFactory({
        'connectedSockets': new Map()
      });
    }).toThrow('Missing mandatory parameter sendPendingRequests.');
  });

  describe('Instantiate with connectedSockets and sendPendingRequests', () => {

    describe('Only me', () => {

      const connectedSockets = new Map([
          [
            'me',
            {
              'readyState': ws.OPEN,
              'send': jest.fn()
            }
          ]
        ])
        , sendPendingRequests = new Map()
        , sendTo = sendToFactory({
          connectedSockets,
          sendPendingRequests
        });

      test('Call without whoami,who and what values', () => {

        expect(() => {

          sendTo.sendTo();
        }).toThrow('Missing mandatory parameter whoami.');
      });

      test('Call without who and what value', () => {

        expect(() => {

          sendTo.sendTo('me');
        }).toThrow('Missing mandatory parameter who.');
      });

      test('Call without what value', () => {

        expect(() => {

          sendTo.sendTo('me', 'other');
        }).toThrow('Missing mandatory parameter what.');
      });

      test('Call method but not sent (only me)', () => {
        const isSent = sendTo.sendTo('me', 'other', 'halo!')
          , pendingRequestsForOther = sendPendingRequests.get('other');

        expect(isSent).toBe(false);
        expect(sendPendingRequests.has('other')).toBe(true);
        expect(pendingRequestsForOther).toBeInstanceOf(Array);
        expect(pendingRequestsForOther.length).toBe(1);
        expect(pendingRequestsForOther[0]).toEqual({
          'whoami': 'me',
          'who': 'other',
          'what': 'halo!'
        });
      });

      test('Calll method but not sent (only me) - second time', () => {
        const isSent = sendTo.sendTo('me', 'other', 'halo halo!')
          , pendingRequestsForOther = sendPendingRequests.get('other');

        expect(isSent).toBe(false);
        expect(sendPendingRequests.has('other')).toBe(true);
        expect(pendingRequestsForOther).toBeInstanceOf(Array);
        expect(pendingRequestsForOther.length).toBe(2);
        expect(pendingRequestsForOther[0]).toEqual({
          'whoami': 'me',
          'who': 'other',
          'what': 'halo!'
        });
        expect(pendingRequestsForOther[1]).toEqual({
          'whoami': 'me',
          'who': 'other',
          'what': 'halo halo!'
        });
      });
    });

    describe('With another one', () => {

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
        , sendPendingRequests = new Map()
        , sendTo = sendToFactory({
          connectedSockets,
          sendPendingRequests
        });

      test('Call without whoami,who and what values', () => {

        expect(() => {

          sendTo.sendTo();
        }).toThrow('Missing mandatory parameter whoami.');
      });

      test('Call without who and what value', () => {

        expect(() => {

          sendTo.sendTo('me');
        }).toThrow('Missing mandatory parameter who.');
      });

      test('Call without what value', () => {

        expect(() => {

          sendTo.sendTo('me', 'other');
        }).toThrow('Missing mandatory parameter what.');
      });

      test('Call method and sent', () => {
        const isSent = sendTo.sendTo('me', 'other', 'halo!');

        expect(isSent).toBe(true);
        expect(connectedSockets.has('other')).toBe(true);
        expect(connectedSockets.get('other').send.mock.calls.length).toBe(1);
        expect(connectedSockets.get('other').send.mock.calls[0].length).toBe(1);
        expect(connectedSockets.get('other').send.mock.calls[0][0]).toBe('{"opcode":"to-me","whoami":"me","who":"other","what":"halo!"}');
      });

      test('Calll method and sent - second time', () => {
        const isSent = sendTo.sendTo('me', 'other', 'halo halo!');

        expect(isSent).toBe(true);
        expect(connectedSockets.has('other')).toBe(true);
        expect(connectedSockets.get('other').send.mock.calls.length).toBe(2);
        expect(connectedSockets.get('other').send.mock.calls[1].length).toBe(1);
        expect(connectedSockets.get('other').send.mock.calls[1][0]).toBe('{"opcode":"to-me","whoami":"me","who":"other","what":"halo halo!"}');
      });
    });
  });
});
