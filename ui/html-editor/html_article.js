'use strict';

var OO = require('../../basics/oo');
var Document = require('../../document');
var Paragraph = Document.Paragraph;
var Heading = Document.Heading;
var List = Document.List;
var ListItem = Document.ListItem;
var Emphasis = Document.Emphasis;
var Strong = Document.Strong;
var Link = Document.Link;

var HtmlImporter = Document.HtmlImporter;
var HtmlExporter = Document.HtmlExporter;

// Schema
// ----------------

var schema = new Document.Schema("html-article", "1.0.0");

schema.getDefaultTextType = function() {
  return "paragraph";
};

schema.addNodes([
  Paragraph,
  Heading,
  List, ListItem,
  Emphasis,
  Strong,
  Link
]);

// Importer
// ----------------

function Importer() {
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

function Exporter() {
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

var HtmlArticle = function() {
  Document.call(this, schema);
};

HtmlArticle.Prototype = function() {

  this.initialize = function() {
    Document.prototype.initialize.apply(this, arguments);

    this.create({
      type: "container",
      id: "body",
      nodes: []
    });
  };

  this.toHtml = function() {
    return new Exporter().convert(this);
  };

  // replaces the content by loading from the given html
  this.loadHtml = function(html) {
    this.clear();
    var $root = $('<div>'+html+'</div>');
    new Importer().convert($root, this);
    this.documentDidLoad();
  };

};

OO.inherit(HtmlArticle, Document);

HtmlArticle.schema = schema;

HtmlArticle.fromJson = function(json) {
  var doc = new HtmlArticle();
  doc.loadSeed(json);
  return doc;
};

HtmlArticle.fromHtml = function(html) {
  var $root = $('<div>'+html+'</div>');
  var doc = new HtmlArticle();
  new Importer().convert($root, doc);
  doc.documentDidLoad();
  return doc;
};

HtmlArticle.Importer = Importer;

module.exports = HtmlArticle;
