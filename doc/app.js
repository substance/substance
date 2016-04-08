var Documentation = require('./model/Documentation');
var Component = require('../ui/Component');
var DocumentationReader = require('./DocumentationReader');
var $ = require('../util/jquery');
var _ = require('../util/helpers');
var importDocumentation = require('./model/importDocumentation');

var _loadDocument = function(cb) {
  _.request('GET', './documentation.json', null, function(err, rawDoc) {
    if (err) { console.error(err); cb(err); }
    var doc = importDocumentation(rawDoc);
    window.doc = doc;
    // console.log('LE DOC', doc);
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
