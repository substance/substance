'use strict';

var Document = require('../../model/Document');
var ProseSchema = require('./ProseSchema');

function ProseArticle(schema) {
  Document.call(this, schema);
  this._initialize();
}

ProseArticle.Prototype = function() {

  this._initialize = function() {
    this.create({
      type: 'container',
      id: 'body',
      nodes: []
    });
  };

};

Document.extend(ProseArticle);

ProseArticle.static.Schema = ProseSchema;

module.exports = ProseArticle;
