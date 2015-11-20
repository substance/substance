'use strict';

var Document = require('../../model/Document');
var schema = require('./TestSchema');

var TestArticle = function() {
  TestArticle.super.call(this, schema);

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

Document.extend(TestArticle, function TestArticlePrototype() {
  this.getDocumentMeta = function() {
    return this.get('meta');
  };
});

module.exports = TestArticle;
