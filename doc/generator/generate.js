var each = require('lodash/collection/each');
var map = require('lodash/collection/map');
var collectNodes = require('./collectNodes');
var collectNamespaceDocs = require('./collectNamespaceDocs');
var path = require('path');

module.exports = function generate(config) {

  var nodes = collectNodes(config);
  var nsDocs = collectNamespaceDocs(config);

  // generate namespaces for all nodes where have documentation
  var namespaces = {};
  each(nodes, function(node) {
    // only add nodes which are module defaults to the namespace
    if (!node.isDefault) return;

    var nsId = path.dirname(node.id);
    var name = path.basename(nsId);
    if (!namespaces[nsId]) {
      namespaces[nsId] = {
        type: "namespace",
        id: nsId,
        name: name,
        description: nsDocs[nsId],
        members: []
      };
    }
    namespaces[nsId].members.push(node.id);
  });


  var result = nodes.concat(map(namespaces));
  return result;
};
