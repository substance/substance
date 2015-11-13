'use strict';

var oo = require('../../util/oo');
var Document = require('../../model/Document');
var schema = require('./test_schema');

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

  this.getDocumentMeta = function() {
    return this.get('meta');
  };
};

oo.inherit(TestArticle, Document);

module.exports = TestArticle;
