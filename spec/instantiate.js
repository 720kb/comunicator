/*global module,require*/
(function testing(module, require) {
  'use strict';

  const code = require('code')
    , lab = require('lab').script()
    , describe = lab.describe
    , it = lab.it
    , before = lab.before
    , expect = code.expect
    , salt = 'kjwf788fu38l102ijllwefliuh98hegfj98usjsjsnwe%&kjnwef$kjwnflllyyyuii'
    , Comunicator = require('../src/node/comunicator');

  describe('comunicator is correctly instantiated', () => {
    let comunicatorMethods;

    before(done => {

      comunicatorMethods = Object.getOwnPropertyNames(Comunicator.prototype);
      done();
    });

    it('should Comunicator class must have declared methods', done => {

      expect(comunicatorMethods).to.only.include([
        'constructor',
        'broadcast',
        'sendTo',
        'isUserPresent']);
      done();
    });


    it('should instantiate the comunicator', done => {

      let theComunicator = new Comunicator(salt);

      expect(theComunicator).to.not.be.undefined();
      expect(theComunicator).to.be.an.object();
      expect(theComunicator).to.be.an.instanceof(Comunicator);

      comunicatorMethods.forEach((anElement) => {

        expect(theComunicator[anElement]).to.be.a.function();
      });

      done();
    });
  });

  module.exports = {
    'lab': lab
  };
}(module, require));
