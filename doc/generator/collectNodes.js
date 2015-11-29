/* jshint latedef: false */
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var child_process = require('child_process');
var each = require('lodash/collection/each');
var parseFile = require('./parseFile');

var markdown = require('./markdownConverter');

function collectNodes(config) {

  // collect all js files
  var jsFiles = [];
  var folders = config.folders || [];

  var patterns = [];
  each(folders, function(folder) {
    patterns.push(folder + "/**/*.js");
  });

  // patterns = ["model/Document.js"];

  each(patterns, function(pattern) {
    jsFiles = jsFiles.concat(glob.sync(pattern));
  });

  // run dox on every js file
  var _nodes = [];
  each(jsFiles, function(jsFile) {
    _nodes = _nodes.concat(parseFile(jsFile));
  });

  // generate namespaces for all nodes where have documentation
  var nodes = {};
  var nsDocs = _collectNamespaceDocs(config);
  each(_nodes, function(node) {
    nodes[node.id] = node;

    // add nodes to the namespace which are module defaults
    if (node.isDefault) {
      var nsId = path.dirname(node.id);
      var name = path.basename(nsId);
      if (!nodes[nsId]) {
        nodes[nsId] = {
          type: "namespace",
          id: nsId,
          name: name,
          description: nsDocs[nsId],
          members: []
        };
      }
      nodes[nsId].members.push(node.id);
    }
  });

  var mainDoc = _loadDoc('index.md') || "";
  var meta = {
    type: "meta",
    id: "meta",
    description: mainDoc,
    repository: config.repository,
    sha: "master"
  };
  var out = child_process.execSync('git rev-parse HEAD');
  meta.sha = out.toString().trim();
  nodes[meta.id] = meta;

  _enhanceParams(nodes);

  return nodes;
}

function _collectNamespaceDocs(config) {

  // collect all js files
  var mdFiles = [];
  var folders = config.folders || [];

  var patterns = [];
  each(folders, function(folder) {
    patterns.push(folder + "/**/index.md");
  });

  each(patterns, function(pattern) {
    mdFiles = mdFiles.concat(glob.sync(pattern));
  });

  var docs = {};
  each(mdFiles, function(mdFile) {
    var id = path.dirname(mdFile);
    docs[id] = _loadDoc(mdFile);
  });

  return docs;
}

function _loadDoc(mdFile) {
  var data = fs.readFileSync(mdFile, 'utf8');
  if (data) {
    return markdown.toHtml(data);
  }
}

var _builtins = {
  'Object': true, 'Array': true, 'String': true,
  'Number': true, 'Boolean': true,
  'null': true, 'undefined': true
};

function _enhanceParams(nodes) {
  each(nodes, function(node) {
    if (node.params) {
      each(node.params, _enhanceParam.bind(null, nodes, node));
    }
  });
}

function _enhanceParam(nodes, node, param) {
  var type = param.type;
  if (_builtins[type] || nodes[type]) {
    return;
  }
  // if the type is not absolute trying to reolve
  // the type within the same namespace
  var nsScopedType = node.ns + "/" + type;
  if (nodes[nsScopedType]) {
    param.type = nsScopedType;
  }
}

module.exports = collectNodes;
