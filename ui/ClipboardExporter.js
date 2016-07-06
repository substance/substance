"use strict";

var Document = require('../model/Document');
var HtmlExporter = require('../model/HTMLExporter');
var JSONConverter = require('../model/JSONConverter');

/**
  Export HTML from clipboard. Used for inter-application copy'n'paste.
*/
function ClipboardExporter(config) {
  ClipboardExporter.super.call(this, config);
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
    // special treatment for a text snippet
    if (elements.length === 1 && elements[0].attr('data-id') === Document.TEXT_SNIPPET_ID) {
      html = elements[0].innerHTML;
    } else {
      html = elements.map(function(el) {
        return el.outerHTML;
      }).join('');
    }
    var jsonConverter = new JSONConverter();
    var jsonStr = JSON.stringify(jsonConverter.exportDocument(doc));
    var meta = [
      "<meta name='substance' content='",
      btoa(jsonStr),
      "'>"
    ].join('');
    return '<html><head>' +meta+ '</head><body>' + html + '</body></html>';
  };

  /**
    Coverts document to set of DOM elements.

    @param {Document} doc document to convert

    @return {Array} array of DOM elements each represented single node
  */
  this.convertDocument = function(doc) {
    var content = doc.get(Document.SNIPPET_ID);
    if (!content) {
      throw new Error('Illegal clipboard document: could not find container "' + Document.SNIPPET_ID + '"');
    }
    return this.convertContainer(content);
  };

};

HtmlExporter.extend(ClipboardExporter);

module.exports = ClipboardExporter;
