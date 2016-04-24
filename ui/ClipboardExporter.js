"use strict";

var HtmlExporter = require('../model/HTMLExporter');
var ClipboardImporter = require('./ClipboardImporter');
var converters = ClipboardImporter.converters;
var CLIPBOARD_CONTAINER_ID = ClipboardImporter.CLIPBOARD_CONTAINER_ID;
var CLIPBOARD_PROPERTY_ID = ClipboardImporter.CLIPBOARD_PROPERTY_ID;
var JSONConverter = require('../model/JSONConverter');

/**
  Export HTML from clipboard. Used for inter-application copy'n'paste.
*/
function ClipboardExporter() {
  ClipboardExporter.super.call(this, {
    converters: converters
  });
}

ClipboardExporter.Prototype = function() {

  /**
    Exports document in html format.

    @param {Document} doc document to export

    @return {String} html representation of given document
  */
  this.exportDocument = function(doc) {
    this.state.doc = doc;
    var html;
    var elements = this.convertDocument(doc);
    if (elements.length === 1 && elements[0].attr('data-id') === CLIPBOARD_PROPERTY_ID) {
      html = elements[0].innerHTML;
    } else {
      html = elements.map(function(el) {
        return el.outerHTML;
      }).join('');
    }
    var jsonConverter = new JSONConverter();
    var json = [
      "<meta name='substance' content='",
      JSON.stringify(jsonConverter.exportDocument(doc)),
      "'>"
    ].join('');
    return '<html><head>' +json+ '</head><body>' + html + '</body></html>';
  };

  /**
    Coverts document to set of DOM elements.

    @param {Document} doc document to convert

    @return {Array} array of DOM elements each represented single node
  */
  this.convertDocument = function(doc) {
    var content = doc.get(CLIPBOARD_CONTAINER_ID);
    if (!content) {
      throw new Error('Illegal clipboard document: could not find container "' + CLIPBOARD_CONTAINER_ID + '"');
    }
    return this.convertContainer(content);
  };

};

HtmlExporter.extend(ClipboardExporter);

ClipboardExporter.CLIPBOARD_CONTAINER_ID = CLIPBOARD_CONTAINER_ID;

module.exports = ClipboardExporter;
