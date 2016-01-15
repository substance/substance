'use strict';

var DOMImporter = require('./DOMImporter');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var extend = require('lodash/object/extend');

/**
  @class
  @abstract

  Base class for custom XML importers. If you want to use HTML as your
  exchange format see {@link model/HTMLImporter}.

  @example
  
  Below is a full example taken from [Lens](https://github.com/substance/lens/blob/master/model/LensArticleImporter.js).

  ```js
  var XMLImporter = require('substance/model/XMLImporter');
  var articleSchema = require('./articleSchema');
  var LensArticle = require('./LensArticle');

  var converters = [
    require('substance/packages/paragraph/ParagraphHTMLConverter'),
    require('substance/packages/blockquote/BlockquoteHTMLConverter'),
    require('substance/packages/codeblock/CodeblockHTMLConverter'),
    require('substance/packages/heading/HeadingHTMLConverter'),
    require('substance/packages/image/ImageXMLConverter'),
    require('substance/packages/strong/StrongHTMLConverter'),
    require('substance/packages/emphasis/EmphasisHTMLConverter'),
    require('substance/packages/link/LinkHTMLConverter'),

    // Lens-specific converters
    require('../packages/metadata/MetadataXMLConverter'),
    require('../packages/bibliography/BibItemXMLConverter'),
    require('../packages/figures/ImageFigureXMLConverter'),

    require('../packages/figures/ImageFigureCitationXMLConverter'),
    require('../packages/bibliography/BibItemCitationXMLConverter'),
  ];

  function LensArticleImporter() {
    XMLImporter.call(this, {
      schema: articleSchema,
      converters: converters,
      DocumentClass: LensArticle
    });
  }

  LensArticleImporter.Prototype = function() {

    // XML import
    // <article>
    //   <meta>...</meta>
    //   <resources>...</resources>
    //   <body>...</body>
    // </article>
    this.convertDocument = function(articleElement) {
      // Import meta node
      var metaElement = articleElement.find('meta');
      this.convertElement(metaElement);

      // Import resources
      var resources = articleElement.find('resources');
      resources.children.forEach(function(resource) {
        this.convertElement(resource);
      }.bind(this));

      // Import main container
      var bodyNodes = articleElement.find('body').children;
      this.convertContainer(bodyNodes, 'main');
    };
  };

  // Expose converters so we can reuse them in NoteHtmlExporter
  LensArticleImporter.converters = converters;

  XMLImporter.extend(LensArticleImporter);
  ```
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

module.exports = XMLImporter;
