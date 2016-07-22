'use strict';
/* eslint-disable no-console */

var Documentation = require('./model/Documentation');
var Component = require('../ui/Component');
var DocumentationReader = require('./DocumentationReader');
var importDocumentation = require('./model/importDocumentation');
var request = require('../util/request');
var Configurator = require('../util/Configurator');

var _loadDocument = function(cb) {
  // var t = Date.now();
  request('GET', './documentation.json', null, function(err, rawDoc) {
    if (err) { console.error(err); cb(err); }
    // console.log('Loading documentation.json took %s ms', Date.now()-t);

    // t = Date.now();
    var doc = importDocumentation(rawDoc);
    // console.log('Importing took %s ms', Date.now()-t);

    window.doc = doc;
    cb(null, doc);
  });
};

window.onload = function() {
  var doc = new Documentation();
  window.doc = doc;
  _loadDocument(function(err, doc) {
    var config = require('./DocumentationReaderConfig');
    var configurator = new Configurator().import(config);
    DocumentationReader.mount({
      doc: doc,
      configurator: configurator
    }, 'body');
  });
};
