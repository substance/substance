var oo = require('../util/oo');
var DOMExporter = require('./DOMExporter');

function HTMLExporter() {
  DOMExporter.apply(this, arguments);
}

HTMLExporter.Prototype = function() {};

oo.inherit(HTMLExporter, DOMExporter);

module.exports = HTMLExporter;
