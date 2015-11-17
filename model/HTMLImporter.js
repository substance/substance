var oo = require('../util/oo');
var DOMImporter = require('./DOMImporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');

function HTMLImporter() {
  DOMImporter.apply(this, arguments);
}

HTMLImporter.Prototype = function() {

  this.importDocument = function(html) {
    // initialization
    this.reset();
    // converting to JSON first
    var elements = DefaultDOMElement.parseHtml(html);
    this.convertDocument(elements);
    var doc = this.generateDocument();
    return doc;
  };
};

oo.inherit(HTMLImporter, DOMImporter);

module.exports = HTMLImporter;
