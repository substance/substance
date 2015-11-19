'use strict';

var oo = require('../../util/oo');
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

TestArticle.Prototype = function() {
  this.getDocumentMeta = function() {
    return this.get('meta');
  };
};

oo.inherit(TestArticle, Document);

module.exports = TestArticle;
