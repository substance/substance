/* global navigator */

'use strict';

var isArray = require('lodash/lang/isArray');
var extend = require('lodash/object/extend');
var HTMLImporter = require('../model/HTMLImporter');
var DefaultDOMElement = require('./DefaultDOMElement');
var JSONConverter = require('../model/JSONConverter');

// Note: sharing the symbol with the transformation
var CLIPBOARD_CONTAINER_ID = require('../model/transform/copySelection').CLIPBOARD_CONTAINER_ID;
var CLIPBOARD_PROPERTY_ID = require('../model/transform/copySelection').CLIPBOARD_PROPERTY_ID;

var converters = [
  require('../packages/paragraph/ParagraphHTMLConverter'),
  require('../packages/heading/HeadingHTMLConverter'),
  require('../packages/emphasis/EmphasisHTMLConverter'),
  require('../packages/strong/StrongHTMLConverter'),
  require('../packages/code/CodeHTMLConverter'),
  require('../packages/superscript/SuperscriptHTMLConverter'),
  require('../packages/subscript/SubscriptHTMLConverter'),
  require('../packages/link/LinkHTMLConverter'),
  require('../packages/table/TableHTMLConverter'),
  require('../packages/table/TableSectionHTMLConverter'),
  require('../packages/table/TableRowHTMLConverter'),
  require('../packages/table/TableCellHTMLConverter'),
  require('../packages/list/ListHTMLConverter'),
  require('../packages/list/ListItemHTMLConverter'),
];

/**
  Import HTML from clipboard. Used for inter-application copy'n'paste.
*/

function ClipboardImporter(config) {
  if (!config.schema) {
    throw new Error('Missing argument: config.schema is required.');
  }
  // disabling warnings about default importers
  this.IGNORE_DEFAULT_WARNINGS = true;

  extend(config, {
    trimWhitespaces: true,
    REMOVE_INNER_WS: true,
    converters: converters
  });
  ClipboardImporter.super.call(this, config);

  this._isWindows = (navigator && navigator.appVersion && navigator.appVersion.indexOf("Win") !== -1);
}

ClipboardImporter.Prototype = function() {

  /**
    Parses HTML and applies some sanitization/normalization.
  */
  this.importDocument = function(html) {
    var body, el;

    if (this._isWindows) {
      // Under windows we can exploit <!--StartFragment--> and <!--EndFragment-->
      // to have an easier life
      var match = /<!--StartFragment\-->(.*)<!--EndFragment-->/.exec(html);
      if (match) {
        html = match[1];
      }
    }

    // when copying from a substance editor we store JSON in a meta tag
    // Then we parse the
    // If the import fails e.g. because the schema is incompatible
    // we fall back to plain HTML import
    if (html.search(/meta name=.substance./)>=0) {
      el = DefaultDOMElement.parseHTML(html);
      var substanceData = el.find('meta[name="substance"]');
      if (substanceData) {
        var jsonStr = substanceData.attr('content');
        try {
          return this.importFromJSON(jsonStr);
        } catch(err) {
          console.error(err);
        }
      }
    }

    el = DefaultDOMElement.parseHTML(html);
    if (isArray(el)) {
      body = this._createElement('body');
      body.append(el);
    } else {
      body = el.find('body');
    }
    if (!body) {
      body = this._createElement('body');
      body.append(el);
    }
    body = _fixupGoogleDocsBody(body);
    if (!body) {
      console.warn('Invalid HTML.');
      return null;
    }

    this.reset();
    this.convertBody(body);
    var doc = this.generateDocument();
    return doc;
  };

  function _fixupGoogleDocsBody(body) {
    if (!body) return;
    // Google Docs has a strange convention to use a bold tag as
    // container for the copied elements
    // HACK: we exploit the fact that this element has an id with a
    // specific format, e.g., id="docs-internal-guid-5bea85da-43dc-fb06-e327-00c1c6576cf7"
    var bold = body.find('b');
    if (bold && /^docs-internal/.exec(bold.id)) {
      return bold;
    }
    return body;
  }

  this.importFromJSON = function(jsonStr) {
    var doc = this.createDocument();
    var jsonData = JSON.parse(jsonStr);
    var converter = new JSONConverter();
    converter.importDocument(doc, jsonData);
    return doc;
  };

  /**
    Converts all children of a given body element.

    @param {String} body body element of given HTML document
  */
  this.convertBody = function(body) {
    this.convertContainer(body.childNodes, CLIPBOARD_CONTAINER_ID);
  };

  this._wrapInlineElementsIntoBlockElement = function(childIterator) {
    var wrapper = this._createElement('p');
    while(childIterator.hasNext()) {
      var el = childIterator.next();
      // if there is a block node we finish this wrapper
      var blockTypeConverter = this._getConverterForElement(el, 'block');
      if (blockTypeConverter) {
        childIterator.back();
        break;
      }
      wrapper.append(el.clone());
    }
    // HACK: usually when we run into this case, then there is inline data only
    // Instead of detecting this case up-front we just set the proper id
    // and hope that all goes well.
    // Note: when this is called a second time, the id will be overridden.
    wrapper.attr('data-id', CLIPBOARD_PROPERTY_ID);
    var node = this.defaultConverter(wrapper, this);
    if (node) {
      if (!node.type) {
        throw new Error('Contract: Html.defaultConverter() must return a node with type.');
      }
      this._createAndShow(node);
    }
    return node;
  };

  /**
    Creates substance document to paste.

    @return {Document} the document instance
  */
  this.createDocument = function() {
    var doc = this._createDocument();
    if (!doc.get(CLIPBOARD_CONTAINER_ID)) {
      doc.create({
        type: 'container',
        id: CLIPBOARD_CONTAINER_ID,
        nodes: []
      });
    }
    return doc;
  };

};

HTMLImporter.extend(ClipboardImporter);

ClipboardImporter.converters = converters;
ClipboardImporter.CLIPBOARD_CONTAINER_ID = CLIPBOARD_CONTAINER_ID;
ClipboardImporter.CLIPBOARD_PROPERTY_ID = CLIPBOARD_PROPERTY_ID;

module.exports = ClipboardImporter;
