'use strict';

var DOMImporter = require('./DOMImporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var extend = require('lodash/object/extend');

function XMLImporter(config) {
  config = extend({ idAttribute: 'id' }, config);
  DOMImporter.call(this, config);

  // only used internally for creating wrapper elements
  this._el = DefaultDOMElement.parseXML('<dummy></dummy>');
}

XMLImporter.Prototype = function() {

  this.importDocument = function(xml) {
    // initialization
    this.reset();
    // converting to JSON first
    var articleElement = DefaultDOMElement.parseXML(xml);
    this.convertDocument(articleElement);
    var doc = this.generateDocument();
    return doc;
  };

};

DOMImporter.extend(XMLImporter);

module.exports = XMLImporter;
