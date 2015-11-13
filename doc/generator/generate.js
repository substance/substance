var collectNodes = require('./collectNodes');
var schema = require('../model/Documentation').schema;
var map = require('lodash/collection/map');
var pick = require('lodash/object/pick');

module.exports = function generate(config) {
  var nodes = collectNodes(config);

  // make the nodes conform to the schema
  nodes = map(nodes, function(node) {
    var nodeSchema = schema.getNodeSchema(node.type);
    return pick(node, Object.keys(nodeSchema));
  });

  return nodes;
};
