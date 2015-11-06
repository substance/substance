var fs = require('fs');
var path = require('path');
var glob = require('glob');
var dox = require('dox');
var each = require('lodash/collection/each');
var processFile = require('./processFile');
var markdown = require('marked');
var highlightjs = require('highlight.js');

// HACK: overriding the type parser entry point
// to workaround a syntax error thrown by jsdoctypeparser for
// when using paths in type strings `{model/Document}` without `module:` prefix.
var _parseTagTypes = dox.parseTagTypes;
dox.parseTagTypes = function(str, tag) {
  if (/\{\w+(\/\w+)\}/.exec(str)) {
    str = str.replace('/', '_SEP_');
    var types = _parseTagTypes(str, tag);
    for (var i = 0; i < types.length; i++) {
      types[i] = types[i].replace('_SEP_', '/');
    }
  } else {
    return _parseTagTypes(str, tag);
  }
};


var renderer = new markdown.Renderer();
renderer.heading = function (text, level) {
  return '<h' + level + '>' + text + '</h' + level + '>\n';
};
renderer.paragraph = function (text) {
  return '<p>' + text + '</p>';
};
renderer.br = function () {
  return '<br />';
};

dox.setMarkedOptions({
  renderer: renderer,
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  highlight: function (code) {
    return highlightjs.highlightAuto(code).value;
  },
});

function collectNodes(config) {

  // collect all js files
  var jsFiles = [];
  var folders = config.folders || [];

  var patterns = [];
  each(folders, function(folder) {
    patterns.push(folder + "/**/*.js")
  })

  // EXPERIMENTAL
  // patterns = ["util/oo.js"];

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

module.exports = collectNodes;
