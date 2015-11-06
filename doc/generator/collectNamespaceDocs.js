var fs = require('fs');
var path = require('path');
var glob = require('glob');
var marked = require('marked');
var each = require('lodash/collection/each');

function collectNamespaceDocs(config) {

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
    var folder = path.dirname(mdFile);
    var id = folder;
    var data = fs.readFileSync(mdFile, 'utf8');
    docs[id] = marked(data);
  });

  return docs;
}

module.exports = collectNamespaceDocs;
