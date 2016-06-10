'use strict';

var AbstractConfigurator = require('../util/AbstractConfigurator');

function TestConfigurator(rootPackage) {
  AbstractConfigurator.call(this);

  if (firstPackage) {
    this.import(firstPackage);
  }
}

TestConfigurator.Prototype = function() {
};

oo.initClass(TestConfigurator);

module.exports = TestConfigurator;
