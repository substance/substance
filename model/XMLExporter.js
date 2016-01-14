'use strict';

var DOMExporter = require('./DOMExporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var extend = require('lodash/object/extend');

function XMLExporter(config) {
  config = extend({ idAttribute: 'id' }, config);
  DOMExporter.call(this, config);

  // used internally for creating elements
  this._el = DefaultDOMElement.parseXML('<dummy></dummy>');
}

DOMExporter.extend(XMLExporter);

module.exports = XMLExporter;
