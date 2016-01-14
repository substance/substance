'use strict';

var DOMExporter = require('./DOMExporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');

function XMLExporter() {
  DOMExporter.apply(this, arguments);

  // used internally for creating elements
  this._el = DefaultDOMElement.parseXML('<dummy></dummy>');
}

XMLExporter.Prototype = function() {
};

DOMExporter.extend(XMLExporter);

module.exports = XMLExporter;
