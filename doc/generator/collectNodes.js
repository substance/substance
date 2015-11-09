/* jshint latedef: false */
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var child_process = require('child_process');
var each = require('lodash/collection/each');
var map = require('lodash/collection/map');
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
  var nodes = [];
  each(jsFiles, function(jsFile) {
    nodes = nodes.concat(parseFile(jsFile));
  });

  // generate namespaces for all nodes where have documentation
  var namespaces = {};
  var nsDocs = _collectNamespaceDocs(config);
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
  nodes = nodes.concat(map(namespaces));

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
  nodes.push(meta);

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

module.exports = collectNodes;
