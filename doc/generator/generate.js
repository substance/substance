var each = require('lodash/collection/each');
var collectNodes = require('./collectNodes');
var collectNamespaceDocs = require('./collectNamespaceDocs');
var path = require('path');
var Documentation = require('../model/Documentation');

module.exports = function generate(config) {

  var nodes = collectNodes(config);
  var nsDocs = collectNamespaceDocs(config);

  // generate namespaces for all nodes where have documentation
  var namespaces = {};
  each(nodes, function(node) {
    // only add nodes which are module defaults to the namespace
    if (!node.isDefault) return;

    var nsId = path.dirname(node.id);
    if (!namespaces[nsId]) {
      namespaces[nsId] = {
        type: "namespace",
        id: nsId,
        description: nsDocs[nsId],
        items: []
      };
    }
    namespaces[nsId].items.push(node.id);
  });

  var documentation = new Documentation();
  each(nodes, function(node) {
    documentation.create(node);
  });
  var body = documentation.get('body');
  each(namespaces, function(ns) {
    documentation.create(ns);
    body.show(ns.id);
  });

  return documentation;
};
