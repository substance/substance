'use strict';

var DOMExporter = require('./DOMExporter');

function HTMLExporter() {
  DOMExporter.apply(this, arguments);
}

HTMLExporter.Prototype = function() {};

DOMExporter.extend(HTMLExporter);

module.exports = HTMLExporter;
