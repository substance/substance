'use strict';

var DOMImporter = require('./DOMImporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var extend = require('lodash/object/extend');

function HTMLImporter(config) {
  config = extend({ idAttribute: 'data-id' }, config);
  DOMImporter.call(this, config);

  // only used internally for creating wrapper elements
  this._el = DefaultDOMElement.parseHTML('<html></html>');
}

HTMLImporter.Prototype = function() {

  this.importDocument = function(html) {
    // initialization
    this.reset();
    // converting to JSON first
    var documentEl = DefaultDOMElement.parseHTML(html);
    this.convertDocument(documentEl);
    var doc = this.generateDocument();
    return doc;
  };

  /**
    Orchestrates conversion of a whole document.

    This method should be overridden by custom importers to reflect the structure
    of a custom HTML document, and to control where things go to within the document.

    @abstract
    @param {ui/DOMElement} documentEl the document element.

    @example

    The most simple implementation would take the body and convert its children to store
    them e.g. into the 'main' container.

    ```
      this.convertDocument = function(documentEl) {
        var bodyEl = documentEl.find('body');
        this.convertContainer(bodyEl.children, 'main');
      };
    ```
  */
  this.convertDocument = function(documentEl) {
    /* jshint unused:false */
    throw new Error('This method is abstract');
  };

};

DOMImporter.extend(HTMLImporter);

module.exports = HTMLImporter;
