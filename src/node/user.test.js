/*global jest,describe,test,expect*/
import ws from 'ws';
import isUserPresentFactory from './user';

describe('isUserPresent method', () => {

  test('Is defined', () => {

    expect(isUserPresentFactory).toBeDefined();
  });

  test('Fail due to missing context', () => {

    expect(() => {

      isUserPresentFactory();
    }).toThrow('Missing context');
  });

  test('Fail due to missing parameter connectedSockets', () => {

    expect(() => {

      isUserPresentFactory({});
    }).toThrow('Missing mandatory parameter connectedSockets');
  });

  describe('Instantiate with connectedSockets', () => {
    const connectedSockets = new Map([
        [
          'me',
          {
            'readyState': ws.OPEN,
            'send': jest.fn()
          }
        ]
      ])
      , isUserPresent = isUserPresentFactory({connectedSockets});

    test('Call without who value', () => {

      expect(() => {

        isUserPresent.isUserPresent();
      }).toThrow('Missing mandatory parameter who.');
    });

    test('me it\'s present', () => {
      const isPresent = isUserPresent.isUserPresent('me');

      expect(isPresent).toBe(true);
    });

    test('other it isn\'t present', () => {
      const isPresent = isUserPresent.isUserPresent('other');

      expect(isPresent).toBe(false);
    });
  });
});
