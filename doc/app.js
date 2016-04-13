var Documentation = require('./model/Documentation');
var Component = require('../ui/Component');
var DocumentationReader = require('./DocumentationReader');
var importDocumentation = require('./model/importDocumentation');
var request = require('../util/request');

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
    Component.mount(DocumentationReader, {
      doc: doc
    }, 'body');
  });
};
