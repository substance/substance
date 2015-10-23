"use strict";

var OO = require('../util/oo');
var HtmlExporter = require('./HtmlExporter');

function ClipboardExporter() {
  ClipboardExporter.super.call(this);
}

ClipboardExporter.Prototype = function() {


  this.convert = function(doc, options) {
    this.initialize(doc, options);
    var $doc = this.createHtmlDocument();
    // Note: the content of a clipboard document
    // is coming as container with id 'clipboard'
    var content = doc.get('clipboard_content');
    $doc.find('body').append(this.convertContainer(content));

    // This is not working with jquery
    //return $doc.html();

    return $doc.find('html').html();
  };

};

OO.inherit(ClipboardExporter, HtmlExporter);

module.exports = ClipboardExporter;
