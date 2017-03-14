/*global jest,describe,test,expect*/
import {Server} from 'hapi';
import plugin from './plugin';

describe('Hapi plugin', () => {

  test('Is defined', () => {

    expect(plugin).toBeDefined();
  });

  test('Fail due to missing package.json', () => {

    expect(() => {

      plugin();
    }).toThrow('Missing mandatory parameter package.json.');
  });

  test('Fail due to missing package name', () => {

    expect(() => {

      plugin({});
    }).toThrow('Missing mandatory parameter name into package.json.');
  });

  test('Fail due to missing package version', () => {

    expect(() => {

      plugin({'name': 'something'});
    }).toThrow('Missing mandatory parameter version into package.json.');
  });

  test('Fail due to missing comunicator', () => {

    expect(() => {

      plugin({'name': 'something', 'version': '1.0.0'});
    }).toThrow('Missing mandatory parameter comunicator.');
  });

  describe('Plugin calls', () => {
    const comunicatorMock = jest.fn()
      , args = [{'name': 'something', 'version': '1.0.0'}, comunicatorMock];

    test('Returns an object with register field', () => {
      const hapiPlugin = plugin(...args);

      expect(hapiPlugin).toBeDefined();
      expect(hapiPlugin.register).toBeDefined();
      expect(hapiPlugin.register).toBeInstanceOf(Object);
    });

    test('Throw error server not specified', () => {
      const currentRun = jest.fn()
        , hapiPlugin = plugin(...args);

      hapiPlugin.register(undefined, {
        'jwtSalt': '12345'
      }, currentRun);

      expect(currentRun.mock.calls.length).toBe(1);
      expect(currentRun.mock.calls[0].length).toBe(1);
      expect(currentRun.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(currentRun.mock.calls[0][0].message).toBe('Server is not specified');
    });

    test('No options provided', () => {
      const currentRun = jest.fn()
        , server = new Server()
        , hapiPlugin = plugin(...args);

      hapiPlugin.register(server, undefined, currentRun);

      expect(currentRun.mock.calls.length).toBe(1);
      expect(currentRun.mock.calls[0].length).toBe(1);
      expect(currentRun.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(currentRun.mock.calls[0][0].message).toBe('You must specify the options');
    });

    test('Validation error - wrong jwtSalt', () => {
      const currentRun = jest.fn()
        , server = new Server()
        , hapiPlugin = plugin(...args);

      hapiPlugin.register(server, {
        'jwtSalt': 123
      }, currentRun);

      expect(currentRun.mock.calls.length).toBe(1);
      expect(currentRun.mock.calls[0].length).toBe(1);
      expect(currentRun.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(currentRun.mock.calls[0][0].message).toBe('ValidationError: child "jwtSalt" fails because ["jwtSalt" must be a string]');
    });

    test('No connection specified in server', () => {
      const currentRun = jest.fn()
        , server = new Server()
        , hapiPlugin = plugin(...args);

      hapiPlugin.register(server, {
        'jwtSalt': '123456'
      }, currentRun);
      expect(currentRun.mock.calls.length).toBe(1);
      expect(currentRun.mock.calls[0].length).toBe(1);
      expect(currentRun.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(currentRun.mock.calls[0][0].message).toBe('No server connection specified');
    });

    test('Default conection is taken', () => {
      const currentRun = jest.fn()
        , server = new Server()
        , hapiPlugin = plugin(...args);

      server.connection({
        'host': '::',
        'port': 3000
      });
      hapiPlugin.register(server, {
        'jwtSalt': '123456'
      }, currentRun);
      expect(currentRun.mock.calls.length).toBe(1);
      expect(currentRun.mock.calls[0].length).toBe(0);
      expect(server.comunicator).toBeDefined();
    });

    test('Labelled connection is taken', () => {
      const currentRun = jest.fn()
        , server = new Server()
        , hapiPlugin = plugin(...args);

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

      hapiPlugin.register(server, {
        'connectionName': 'comunicator',
        'jwtSalt': '123456'
      }, currentRun);
      expect(currentRun.mock.calls.length).toBe(1);
      expect(currentRun.mock.calls[0].length).toBe(0);
      expect(server.comunicator).toBeDefined();
    });
  });
});
