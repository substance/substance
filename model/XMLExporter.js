'use strict';

var DOMExporter = require('./DOMExporter');

function XMLExporter() {
  DOMExporter.apply(this, arguments);
}

DOMExporter.extend(XMLExporter);

module.exports = XMLExporter;
