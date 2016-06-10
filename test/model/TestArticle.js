'use strict';

var Document = require('../../model/Document');
var schema = require('./TestSchema');

function TestArticle() {
  TestArticle.super.call(this, schema);

  this.create({
    type: "meta",
    id: "meta",
    title: 'Untitled'
  });
  this.create({
    type: "container",
    id: "body",
    nodes: []
  });
}

TestArticle.Prototype = function() {
  this.getDocumentMeta = function() {
    return this.get('meta');
  };
};

Document.extend(TestArticle);

module.exports = TestArticle;
