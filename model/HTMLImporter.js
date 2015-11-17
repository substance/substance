var oo = require('../util/oo');
var DOMImporter = require('./DOMImporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');

function HTMLImporter() {
  DOMImporter.apply(this, arguments);
}

HTMLImporter.Prototype = function() {

  this.convertDocument = function(documentEl) {
    var bodyEl = documentEl.find('body');
    this.convertContainer(bodyEl.children, this.config.containerId);
  };

  this.importDocument = function(html) {
    // initialization
    this.reset();
    // converting to JSON first
    var documentEl = DefaultDOMElement.parseHtml(html);
    this.convertDocument(documentEl);
    var doc = this.generateDocument();
    return doc;
  };
};

oo.inherit(HTMLImporter, DOMImporter);

module.exports = HTMLImporter;
