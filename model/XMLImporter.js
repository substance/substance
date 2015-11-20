'use strict';

var DOMImporter = require('./DOMImporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');

function XMLImporter() {
  DOMImporter.apply(this, arguments);
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
