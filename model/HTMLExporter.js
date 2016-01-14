'use strict';

var DOMExporter = require('./DOMExporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');

function HTMLExporter() {
  DOMExporter.apply(this, arguments);

  // used internally for creating elements
  this._el = DefaultDOMElement.parseHTML('<html></html>');
}

HTMLExporter.Prototype = function() {

  this.exportDocument = function(doc) {
    var htmlEl = DefaultDOMElement.parseHTML('<html><head></head><body></body></html>');
    return this.convertDocument(doc, htmlEl);
  };

};

DOMExporter.extend(HTMLExporter);

module.exports = HTMLExporter;
