'use strict';

var OO = require('../../util/oo');
var Document = require('../../model/document');
var schema = require('./test_schema');

var TestHtmlImporter = require('./test_html_importer');
//var TestHtmlExporter = require('./test_html_exporter');

var TestArticle = function() {
  TestArticle.super.call(this, schema);
};

TestArticle.Prototype = function() {

  this.initialize = function() {
    this.super.initialize.apply(this, arguments);
    this.create({
      type: "meta",
      id: "meta",
      title: 'Untitled'
    });
    this.create({
      type: "container",
      id: "main",
      nodes: []
    });
  };

  this.toHtml = function() {
    return new TestHtmlImporter().convert(this);
  };

  this.propertyToHtml = function(path) {
    // return new TestHtmlExporter().convertProperty(this, path);
  };

  this.getDocumentMeta = function() {
    return this.get('meta');
  };
};

OO.inherit(TestArticle, Document);

TestArticle.fromHtml = function(html) {
  var $root;
  if (typeof window === "undefined") {
    $root = $(html);
  } else {
     var parser = new window.DOMParser();
     var htmlDoc = parser.parseFromString(html, "text/html");
     $root = $(htmlDoc);
  }
  var doc = new TestArticle();
  new TestHtmlImporter().convert($root, doc);
  doc.documentDidLoad();
  return doc;
};

module.exports = TestArticle;
