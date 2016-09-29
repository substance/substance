'use strict';

import DOMImporter from './DOMImporter'
import DefaultDOMElement from '../ui/DefaultDOMElement'
import extend from 'lodash/extend'

/*
  @class
  @abstract

  Base class for custom XML importers. If you want to use HTML as your
  exchange format see {@link model/HTMLImporter}.

  TODO: provide example and activate reenable API docs
*/

function XMLImporter(config) {
  config = extend({ idAttribute: 'id' }, config);
  DOMImporter.call(this, config);

  // only used internally for creating wrapper elements
  this._el = DefaultDOMElement.parseXML('<dummy></dummy>');
}

XMLImporter.Prototype = function() {

  this.importDocument = function(xml) {
    // initialization
    this.reset();
    // converting to JSON first
    var articleElement = DefaultDOMElement.parseXML(xml);
    this.convertDocument(articleElement);
    var doc = this.generateDocument();
    return doc;
  };

};

DOMImporter.extend(XMLImporter);

export default XMLImporter;
