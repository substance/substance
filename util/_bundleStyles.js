'use strict';

// worker for sub-process

var cloneDeep = require('lodash/cloneDeep');
var path = require('path');

process.on('message', function(paramStr) {
  var params = JSON.parse(paramStr);
  var rootDir = params.rootDir;
  var configuratorPath = params.configuratorPath;
  var mainPackagePath = params.configPath;
  // ATTENTION: if someone wants to use es6 in their project
  // they must use node6 and have babel-plugin-transfprm-es2015-
  // they must have babel-register and es2015 installed
  if (params.babel) {
    var babelParams = cloneDeep(params.babel);
    var babelRegister = path.join(params.rootDir, 'node_modules', 'babel-register');
    require(babelRegister)(babelParams);
  }
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
