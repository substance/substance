'use strict';

var isArray = require('lodash/isArray');
var each = require('lodash/each');
var error = require('../util/error');
var oo = require('../util/oo');

function JSONConverter() {}

JSONConverter.Prototype = function() {

  this.importDocument = function(doc, json) {
    if (!json.schema || !isArray(json.nodes)) {
      throw new Error('Invalid JSON format.');
    }
    var schema = doc.getSchema();
    if (schema.name !== json.schema.name) {
      throw new Error('Incompatible schema.');
    }
    if (schema.version !== json.schema.version) {
      error('Different schema version. Conversion might be problematic.');
    }
    // the json should just be an array of nodes
    var nodes = json.nodes;
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
    var schema = doc.getSchema();
    var json = {
      schema: {
        name: schema.name,
        version: schema.version
      },
      nodes: []
    };
    each(doc.getNodes(), function(node) {
      json.nodes.push(node.toJSON());
    });
    return json;
  };
};

oo.initClass(JSONConverter);

module.exports = JSONConverter;
