'use strict';

var Substance = require('../../basics');
var Document = require('../../document');
var Transformations = Document.Transformations;

function FormEditor() {}

FormEditor.Prototype = function() {

  this.isContainerEditor = function() {
    return false;
  };

  // Selects the current property.
  this.selectAll = function(doc, selection) {
    var sel = selection;
    if (sel.isNull()) return;
    if (sel.isPropertySelection()) {
      var path = sel.start.path;
      var text = doc.get(path);
      return doc.createSelection({
        type: 'property',
        path: path,
        startOffset: 0,
        endOffset: text.length
      });
    }
  };

  this.insertText = function(tx, args) {
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return Transformations.insertText(tx, args);
    }
  };

  // implements backspace and delete
  this.delete = function(tx, args) {
    return Transformations.deleteSelection(tx, args);
  };

  // no breaking
  this.break = function(tx, args) {
    return this.softBreak(tx, args);
  };

  this.softBreak = function(tx, args) {
    args.text = "\n";
    return this.insertText(tx, args);
  };

  // create a document instance containing only the selected content
  this.copy = function(doc, selection) {
    var result = Transformations.copySelection(doc, { selection: selection });
    return result.doc;
  };

  this.paste = function(tx, args) {
    // TODO: for now only plain text is inserted
    // We could do some stitching however, preserving the annotations
    // received in the document
    if (args.text) {
      return this.insertText(tx, args);
    }
  };

};

Substance.initClass(FormEditor);

module.exports = FormEditor;
