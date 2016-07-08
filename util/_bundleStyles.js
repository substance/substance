'use strict';

// worker for sub-process

var path = require('path');

process.on('message', function(paramStr) {
  var params = JSON.parse(paramStr);
  var rootDir = params.rootDir;
  var configuratorPath = params.configuratorPath;
  var mainPackagePath = params.configPath;
  var Configurator = require(configuratorPath);
  var MainPackage = require(mainPackagePath);
  var configurator = new Configurator().import(MainPackage);
  var scssFiles = configurator.getStyles();
  var result = scssFiles.map(function(scssFile) {
    var relPath = String(path.relative(rootDir, scssFile)).split(path.sep).join('/');
    return "@import '"+relPath+"';";
  }).join('\n');
  // Pass results back to parent process
  process.send(JSON.stringify(result));
  process.exit(0);
});
