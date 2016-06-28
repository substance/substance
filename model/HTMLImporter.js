'use strict';

var DOMImporter = require('./DOMImporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var extend = require('lodash/extend');

/**
  @class
  @abstract

  Base class for custom HTML importers. If you want to use XML as your
  exchange format see {@link model/XMLImporter}.

  @example

  Below is a full example taken from the [Notepad](https://github.com/substance/examples/blob/master/converter/NoteImporter.js) example.

  ```js
  var HTMLImporter = require('substance/model/HTMLImporter');
  var noteSchema = require('../note/noteSchema');
  var Note = require('../note/Note');

  var converters = [
    require('substance/packages/paragraph/ParagraphHTMLConverter'),
    require('substance/packages/blockquote/BlockquoteHTMLConverter'),
    require('substance/packages/codeblock/CodeblockHTMLConverter'),
    require('substance/packages/heading/HeadingHTMLConverter'),
    require('substance/packages/strong/StrongHTMLConverter'),
    require('substance/packages/emphasis/EmphasisHTMLConverter'),
    require('substance/packages/link/LinkHTMLConverter'),
    require('./MarkHTMLConverter'),
    require('./TodoHTMLConverter')
  ];

  function NoteImporter() {
    NoteImporter.super.call(this, {
      schema: noteSchema,
      converters: converters,
      DocumentClass: Note
    });
  }

  NoteImporter.Prototype = function() {
    this.convertDocument = function(bodyEls) {
      this.convertContainer(bodyEls, 'body');
    };
  };

  // Expose converters so we can reuse them in NoteHtmlExporter
  NoteImporter.converters = converters;

  HTMLImporter.extend(NoteImporter);
  ```
*/

function HTMLImporter(config) {
  config = extend({ idAttribute: 'data-id' }, config);
  DOMImporter.call(this, config);

  // only used internally for creating wrapper elements
  this._el = DefaultDOMElement.parseHTML('<html></html>');
}

HTMLImporter.Prototype = function() {

  this.importDocument = function(html) {
    this.reset();
    var parsed = DefaultDOMElement.parseHTML(html);
    // creating all nodes
    this.convertDocument(parsed);
    this.generateDocument();
    return this.state.doc;
  };

  /**
    Orchestrates conversion of a whole document.

    This method should be overridden by custom importers to reflect the
    structure of a custom HTML document or fragment, and to control where
    things go to within the document.

    @abstract
    @param {ui/DOMElement} documentEl the document element.

    @example

    When a fragment `<h1>Foo</h1><p></Bar</p>` is imported the implementation
    looks like this.

    ```js
      this.convertDocument = function(els) {
        this.convertContainer(els, 'body');
      };
    ```

    If a full document `<html><body><p>A</p><p>B</p></body></html>` is imported
    you get the `<html>` element instead of a node array.

    ```js
      this.convertDocument = function(htmlEl) {
        var bodyEl = htmlEl.find('body');
        this.convertContainer(bodyEl.children, 'body');
      };
    ```
  */
  this.convertDocument = function(documentEl) { // eslint-disable-line
    throw new Error('This method is abstract');
  };

};

DOMImporter.extend(HTMLImporter);

module.exports = HTMLImporter;
