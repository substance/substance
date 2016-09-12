import HTMLImporter from '../../model/HTMLImporter'
import ProseArticle from './ProseArticle'
var schema = ProseArticle.schema;

var converters = [];

// TODO: FIX this. Should be used together with configurator
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

export default ProseArticleImporter;
