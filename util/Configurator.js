'use strict';

var AbstractConfigurator = require('./AbstractConfigurator');
var FontAwesomeIconProvider = require('../ui/FontAwesomeIconProvider');

// Setup default label provider
var LabelProvider = require('../ui/DefaultLabelProvider');

/*
  Default Configurator for Substance editors

  This works well for single-column apps (such as ProseEditor).
  Write your own Configurator for apps that require more complex
  configuration (e.g. when there are multiple surfaces involved
  each coming with different textTypes, enabled commands etc.)
*/
function Configurator(firstPackage) {
  AbstractConfigurator.call(this);

  if (firstPackage) {
    this.import(firstPackage);
  }
}

Configurator.Prototype = function() {

  this.getIconProvider = function() {
    return new FontAwesomeIconProvider(this.config.icons);
  };

  this.getLabelProvider = function() {
    return new LabelProvider(this.config.labels);
  };

};

AbstractConfigurator.extend(Configurator);

module.exports = Configurator;
