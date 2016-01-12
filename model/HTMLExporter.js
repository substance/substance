'use strict';

var DOMExporter = require('./DOMExporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');

function HTMLExporter() {
  DOMExporter.apply(this, arguments);
}

HTMLExporter.Prototype = function() {
  this.createDocumentElement = function() {
    return DefaultDOMElement.parseHTML('<html><head></head><body></body></html>');
  };
};

DOMExporter.extend(HTMLExporter);

module.exports = HTMLExporter;
