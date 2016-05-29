/*globals -Document */
'use strict';

var Document = require('../../model/Document');
var ProseSchema = require('./ProseSchema');

var ProseArticle = function(schema) {
  schema = schema || this._createSchema();
  Document.call(this, schema);

  this._initialize();
};

ProseArticle.Prototype = function() {

  this._createSchema = function() {
    return new this.constructor.static.Schema();
  };

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
