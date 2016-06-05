'use strict';

var AbstractConfigurator = require('./AbstractConfigurator');
var DocumentSchema = require('../model/DocumentSchema');
var FontAwesomeIconProvider = require('../ui/FontAwesomeIconProvider');

// Setup default I18n
var I18n = require('../ui/i18n');
I18n.instance.load(require('../i18n/en'));

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

  this.getI18nInstance = function() {
    return I18n.instance;
  };

};

AbstractConfigurator.extend(Configurator);

module.exports = Configurator;
