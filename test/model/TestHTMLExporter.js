'use strict';

var HTMLExporter = require('../../model/HTMLExporter');
var converters = require('./TestHTMLImporter').converters;

function TestHTMLExporter() {
  TestHTMLExporter.super.call(this, {
    converters: converters,
    containerId: 'main'
  });
}

HTMLExporter.extend(TestHTMLExporter, function() {

  this.convertDocument = function() {
    var element = this.$$('body');
    element.append(
      this.convertContainer(this.state.containerId)
    );
    return element;
  };

});

module.exports = TestHTMLExporter;
