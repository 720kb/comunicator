import angular from 'angular';
import {Comunicator} from './module/comunicator';

angular.module('720kb.comunicator', [])
.provider('Comunicator', () => {
  let comunicator;
  const initComunicator = url => {

    comunicator = new Comunicator(url);
    return comunicator;
  };

  return {
    'setComunicatorServerURL': initComunicator,
    '$get': /*@ngInject*/ () => {

      return comunicator;
    }
  };
});
