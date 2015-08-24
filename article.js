'use strict';

// Substance Article
// ----------------
// 
// The default Article Implementation
// 
// Uses well-defined HTML exchange representation

var OO = require('./basics/oo');
var Document = require('./document');
var HtmlImporter = Document.HtmlImporter;
var HtmlExporter = Document.HtmlExporter;

var defaultNodes = [
  Document.Paragraph,
  Document.Codeblock,
  Document.Blockquote,
  Document.Heading,
  Document.List, Document.ListItem,
  Document.Emphasis,
  Document.Strong,
  Document.Link
];

// Default Schema
// ----------------

var defaultSchema = new Document.Schema("substance-article", "1.0.0");

defaultSchema.getDefaultTextType = function() {
  return "paragraph";
};

defaultSchema.addNodes(defaultNodes);

// Importer
// ----------------

function Importer(schema) {
  Importer.super.call(this, { schema: schema });
}

Importer.Prototype = function() {
  this.convert = function($rootEl, doc) {
    this.initialize(doc, $rootEl);
    this.convertContainer($rootEl, 'body');
    this.finish();
  };
};

OO.inherit(Importer, HtmlImporter);

// Exporter
// ----------------

function Exporter(schema) {
  Exporter.super.call(this, { schema: schema });
}

Exporter.Prototype = function() {

  this.convert = function(doc, options) {
    this.initialize(doc, options);

    var body = doc.get('body');
    var bodyNodes = this.convertContainer(body);
    var $el = $('<div>');
    $el.append(bodyNodes);
    return $el.html();
  };
};

OO.inherit(Exporter, HtmlExporter);


// Article Class
// ----------------

var Article = function(schema) {
  Document.call(this, schema || defaultSchema);
};

Article.Prototype = function() {

  this.initialize = function() {
    Document.prototype.initialize.apply(this, arguments);

    this.create({
      type: "container",
      id: "body",
      nodes: []
    });
  };

  this.toHtml = function() {
    return new Exporter(this.schema).convert(this);
  };

  // replaces the content by loading from the given html
  this.loadHtml = function(html) {
    this.clear();

    // Re-enable transaction for the importing step
    this.FORCE_TRANSACTIONS = false;
    var $root = $('<div>'+html+'</div>');
    new Importer(this.schema).convert($root, this);
    this.documentDidLoad();
  };
};

OO.inherit(Article, Document);
Article.schema = defaultSchema;

Article.Importer = Importer;
module.exports = Article;
