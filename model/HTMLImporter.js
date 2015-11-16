var oo = require('../util/oo');
var DOMImporter = require('./DOMImporter');

function HTMLImporter() {
  DOMImporter.apply(this, arguments);
}

HTMLImporter.Prototype = function() {};

oo.inherit(HTMLImporter, DOMImporter);

module.exports = HTMLImporter;
