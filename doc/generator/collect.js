var fs = require('fs');
var path = require('path');
var glob = require('glob');
var dox = require('dox');
var each = require('lodash/collection/each');
var processFile = require('./processFile');

function collect(config) {

  // collect all js files
  var jsFiles = [];
  var folders = config.folders || [];

  var patterns = [];
  each(folders, function(folder) {
    patterns.push(folder + "/**/*.js")
  })

  // EXPERIMENTAL
  // patterns = ["ui/Controller.js"];

  each(patterns, function(pattern) {
    jsFiles = jsFiles.concat(glob.sync(pattern));
  });
  // console.log(jsFiles);

  // run dox on every js file
  var files = {};
  each(jsFiles, function(jsFile) {
    var js = fs.readFileSync(jsFile, 'utf8');
    var folder = path.dirname(jsFile);
    var name = path.basename(jsFile, '.js');
    var id = jsFile.slice(0,-3);
    files[id] = {
      id: id,
      folder: folder,
      name: name,
      dox: dox.parseComments(js)
    };
  });
  // console.log('Doxified:', doxified);

  // expand and aggregate
  // Methods and properties and added to their container
  // Each file is classified either as Class, Object, or Function depending on export tags.
  // If no export tags are found, the one entity is assumed as default export which has the same name as the file
  var nodes = [];
  each(files, function(file) {
    nodes = nodes.concat(processFile(file));
  });

  // TODO: add namespace nodes derived from found nodes.

  return nodes;
}

module.exports = collect;
