var collectNodes = require('./collectNodes');
var schema = require('../model/Documentation').schema;
var map = require('lodash/collection/map');
var pick = require('lodash/object/pick');


function generate(config) {
  var nodes = collectNodes(config);

  // make the nodes conform to the schema
  nodes = map(nodes, function(node) {
    var nodeSchema = schema.getNodeSchema(node.type);
    if (!nodeSchema) {
      return node;
    }
    // pick only properties which are defined in node schema
    node = pick(node, ['type'].concat(Object.keys(nodeSchema)));
    if (node.members) {
      node.members.sort();
    }
    return node;
  });

  nodes.sort(function(a,b) {
    if (a.id<b.id) return -1;
    if (a.id>b.id) return 1;
    return 0;
  });

  return nodes;
}

module.exports = generate;
