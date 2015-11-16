var oo = require('../util/oo');
var DOMExporter = require('./DOMExporter');

function XMLExporter() {
  DOMExporter.apply(this, arguments);
}

XMLExporter.Prototype = function() {};

oo.inherit(XMLExporter, DOMExporter);

module.exports = XMLExporter;
