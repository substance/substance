'use strict';

var ProseArticle = require('../../../packages/prose-editor/ProseArticle');
var DocumentSession = require('../../../model/DocumentSession');

module.exports = function _makeFixture(create) {
  return {
    createArticle: function() {
      var doc = new ProseArticle();
      create(doc);
      return doc;
    },
    createChangeset: function() {
      var doc = new ProseArticle();
      var session = new DocumentSession(doc);
      var change = session.transaction(create);
      return [change.toJSON()];
    },
  };
};
