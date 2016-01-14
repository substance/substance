'use strict';

var DOMExporter = require('./DOMExporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var extend = require('lodash/object/extend');

function HTMLExporter(config) {
  config = extend({ idAttribute: 'data-id' }, config);
  DOMExporter.call(this, config);

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
