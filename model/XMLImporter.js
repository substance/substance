var oo = require('../util/oo');
var DOMImporter = require('./DOMImporter');

function XMLImporter() {
  DOMImporter.apply(this, arguments);
}

XMLImporter.Prototype = function() {};

oo.inherit(XMLImporter, DOMImporter);

module.exports = XMLImporter;
