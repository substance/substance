'use strict';

// worker for sub-process

var path = require('path');

process.on('message', function(paramStr) {
  var params = JSON.parse(paramStr);
  var rootDir = params.rootDir;
  var configuratorPath = params.configuratorPath;
  var mainPackagePath = params.configPath;
  // ATTENTION: if someone wants to use es6 in their project
  // they must use node6 and have babel-plugin-transfprm-es2015-
  // they must have babel-register and es2015 installed
  if (params.es6 || params.jsx) {
    var plugins = [];
    if (params.es6) {
      plugins = plugins.concat(require('./_es6-babel-plugins'));
    }
    if (params.jsx) {
      plugins.push("syntax-jsx");
      plugins.push(
        [ "transform-react-jsx", {
          // this will generate calls such as in
          // $$(MyComp, props, ...children)
          "pragma": "$$"
        }]
      );
    }
    require(path.join(params.rootDir, 'node_modules', 'babel-register'))({
      plugins: plugins
    });
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
