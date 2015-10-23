'use strict';

var $ = require('../util/jquery');
var _ = require('../util/helpers');
var OO = require('../util/oo');
var HtmlImporter = require('./HtmlImporter');

// Note: sharing the symbol with the transformation
var CLIPBOARD_CONTAINER_ID = require('./transformations/copy_selection').CLIPBOARD_CONTAINER_ID;

function ClipboardImporter(config) {
  if (!config.schema) {
    throw new Error('Missing argument: config.schema is required.');
  }
  _.extend(config, {
    trimWhitespaces: true,
    REMOVE_INNER_WS: true,
  });
  ClipboardImporter.super.call(this, config);
}

ClipboardImporter.Prototype = function() {

  this.convert = function($rootEl, doc) {
    this.initialize(doc, $rootEl);

    var $body = $rootEl.find('body');
    $body = this.sanitizeBody($body);
    // TODO: the containerId for the clipboard content should be
    // shared via a constant (see)
    this.convertContainer($body, CLIPBOARD_CONTAINER_ID);
    this.finish();
  };

  this.sanitizeBody = function($body) {
    // Look for paragraphs in <b> which is served by GDocs.
    var $gdocs = $body.find('b > p');
    if ($gdocs.length) {
      $body = $($gdocs[0].parentNode);
    }
    return $body;
  };

  this.checkQuality = function($rootEl) {
    var $body = $rootEl.find('body');
    // TODO: proper GDocs detection
    if ($body.children('b').children('p').length) {
      return true;
    }
    // Are there any useful block-level elements?
    // For example this works if you copy'n'paste a set of paragraphs from a wikipedia page
    if ($body.children('p').length) {
      return true;
    }
    // if we have paragraphs on a deeper level, it is fishy
    if ($body.find('* p').length) {
      return false;
    }
    if ($body.children('a,b,i,strong,italic').length) {
      return true;
    }
    // TODO: how does the content for inline data look like?
    return false;
  };

};

OO.inherit(ClipboardImporter, HtmlImporter);

module.exports = ClipboardImporter;
