'use strict';

var extend = require('lodash/object/extend');
var HTMLImporter = require('./HTMLImporter');

// Note: sharing the symbol with the transformation
var CLIPBOARD_CONTAINER_ID = require('./transform/copySelection').CLIPBOARD_CONTAINER_ID;

var converters = [
  require('../packages/paragraph/ParagraphHTMLConverter'),
  require('../packages/heading/HeadingHTMLConverter'),
  require('../packages/emphasis/EmphasisHTMLConverter'),
  require('../packages/strong/StrongHTMLConverter'),
  require('../packages/link/LinkHTMLConverter'),
  require('../packages/table/TableHTMLConverter'),
  require('../packages/table/TableSectionHTMLConverter'),
  require('../packages/table/TableRowHTMLConverter'),
  require('../packages/table/TableCellHTMLConverter'),
  require('../packages/list/ListHTMLConverter'),
  require('../packages/list/ListItemHTMLConverter'),
];

function ClipboardImporter(config) {
  if (!config.schema) {
    throw new Error('Missing argument: config.schema is required.');
  }
  extend(config, {
    trimWhitespaces: true,
    REMOVE_INNER_WS: true,
    containerId: CLIPBOARD_CONTAINER_ID,
    converters: converters
  });
  ClipboardImporter.super.call(this, config);
}

HTMLImporter.extend(ClipboardImporter, function() {


  this.importDocument = function(documentEl) {
    this.reset();
    this.convertDocument(documentEl);
    var doc = this.generateDocument();
    return doc;
  };

  this.convertDocument = function(documentEl) {
    var body = documentEl.find('body');
    body = this.sanitizeBody(body);
    this.convertContainer(body.children, CLIPBOARD_CONTAINER_ID);
  };

  this.sanitizeBody = function(body) {
    // Look for paragraphs in <b> which is served by GDocs.
    var gdocs = body.findAll('b > p');
    if (gdocs.length > 0) {
      body = gdocs[0].getParent();
    }
    return body;
  };

  this.checkQuality = function(documentEl) {
    var body = documentEl.find(body);
    // TODO: do we need to detect partials?
    if (!body) {
      return false;
    }
    // TODO: proper GDocs detection
    if (body.find('body > b > p')) {
      return true;
    }
    // Are there any useful block-level elements?
    // For example this works if you copy'n'paste a set of paragraphs from a wikipedia page
    if (body.find('body > p')) {
      return true;
    }
    // if we have paragraphs on a deeper level, it is fishy
    if (body.find('* p')) {
      return false;
    }
    // TODO: should this be the case when body contains only annotated text?
    if (body.find('body > a, body > b, body > i, body > strong, body > italic')) {
      return true;
    }
    // TODO: how does the content for inline data look like?
    return false;
  };

  this.createDocument = function() {
    var doc = this._createDocument();
    doc._setForClipboard(true);
    if (!doc.get(CLIPBOARD_CONTAINER_ID)) {
      doc.create({
        type: 'container',
        id: CLIPBOARD_CONTAINER_ID,
        nodes: []
      });
    }
    return doc;
  };

});

ClipboardImporter.converters = converters;
ClipboardImporter.CLIPBOARD_CONTAINER_ID = CLIPBOARD_CONTAINER_ID;

module.exports = ClipboardImporter;
