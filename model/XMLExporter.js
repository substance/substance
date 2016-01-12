'use strict';

var DOMExporter = require('./DOMExporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');

function XMLExporter() {
  DOMExporter.apply(this, arguments);
}

XMLExporter.Prototype = function() {
};

DOMExporter.extend(XMLExporter);

module.exports = XMLExporter;
