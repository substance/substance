'use strict';

var oo = require('../util/oo');
var isArray = require('lodash/lang/isArray');
var each = require('lodash/collection/each');

function JSONConverter() {}

JSONConverter.Prototype = function() {

  this.importDocument = function(doc, json) {
    if (!isArray(json)) {
      throw new Error('Invalid JSON format.');
    }
    // the json should just be an array of nodes
    var nodes = json;
    // import data in a block with deactivated indexers and listeners
    // as the data contains cyclic references which
    // cause problems.
    doc.import(function(tx) {
      each(nodes, function(node) {
        // overwrite existing nodes
        if (tx.get(node.id)) {
          tx.delete(node.id);
        }
        tx.create(node);
      });
    });
    return doc;
  };

  this.exportDocument = function(doc) {
    var json = [];
    each(doc.getNodes(), function(node) {
      json.push(node.toJSON());
    });
    return json;
  };
};

oo.initClass(JSONConverter);

module.exports = JSONConverter;
