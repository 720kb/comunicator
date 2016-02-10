import angular from 'angular';
import Comunicator from './comunicator';

angular.module('720kb.comunicator', [])
.provider('Comunicator', () => {
  let comunicator;
  const initComunicator = url => {

    comunicator = new Comunicator(url);
    return comunicator;
  };

  return {
    'setComunicatorServerURL': initComunicator,
    '$get': /*@ngInject*/ $rootScope => {

      comunicator.forEach(element => {

        $rootScope.$apply(scope => {

          scope.$emit('comunicator:event', element);
        });
      });
      /*const arrivedJoined = () => {

        $rootScope.$apply(scope => {

          scope.$emit('comunicator:joined');
        });

        $log.debug('comunicator:joined dispatched');
      }
      , arrivedToMe = event => {

        $rootScope.$apply(scope => {

          scope.$emit('comunicator:to-me', event.detail);
        });

        $log.debug('comunicator:to-me dispatched');
      }
      , arrivedToAll = event => {

        $rootScope.$apply(scope => {

          scope.$emit('comunicator:to-all', event.detail);
        });

        $log.debug('comunicator:to-all dispatched');
      }
      , arrivedClosed = () => {

        $rootScope.$apply(scope => {

          scope.$emit('comunicator:closed');
        });

        $log.debug('comunicator:closed dispatched');
      };

      $window.addEventListener('comunicator:joined', arrivedJoined, false);
      $window.addEventListener('comunicator:to-me', arrivedToMe, false);
      $window.addEventListener('comunicator:to-all', arrivedToAll, false);
      $window.addEventListener('comunicator:closed', arrivedClosed, false);

      $rootScope.$on('$destroy', () => {

        $window.removeEventListener('comunicator:joined', arrivedJoined, false);
        $window.removeEventListener('comunicator:to-me', arrivedToMe, false);
        $window.removeEventListener('comunicator:to-all', arrivedToAll, false);
        $window.removeEventListener('comunicator:closed', arrivedClosed, false);
      });*/

      return comunicator;
    }
  };
});
