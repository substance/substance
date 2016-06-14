'use strict';

var HTMLImporter = require('../../model/HTMLImporter');
var ProseArticle = require('./ProseArticle');
var schema = ProseArticle.schema;

var converters = [
  require('../paragraph/ParagraphHTMLConverter'),
  require('../heading/HeadingHTMLConverter'),
  require('../codeblock/CodeBlockHTMLConverter'),
  require('../image/ImageHTMLConverter'),
  require('../strong/StrongHTMLConverter'),
  require('../emphasis/EmphasisHTMLConverter'),
  require('../link/LinkHTMLConverter'),
];

function ProseArticleImporter() {
  ProseArticleImporter.super.call(this, {
    schema: schema,
    converters: converters,
    DocumentClass: ProseArticle
  });
}

ProseArticleImporter.Prototype = function() {
  /*
    Takes an HTML string.
  */
  this.convertDocument = function(bodyEls) {
    // Just to make sure we always get an array of elements
    if (!bodyEls.length) bodyEls = [bodyEls];
    this.convertContainer(bodyEls, 'body');
  };
};

HTMLImporter.extend(ProseArticleImporter);

ProseArticleImporter.converters = converters;

module.exports = ProseArticleImporter;
