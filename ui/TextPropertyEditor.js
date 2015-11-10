'use strict';

var oo = require('../util/oo');
var Surface = require('./Surface');
var TextPropertyManager = require('../model/TextPropertyManager');
var insertText = require('../model/transform/insertText');
var deleteSelection = require('../model/transform/deleteSelection');
var copySelection = require('../model/transform/copySelection');
var Component = require('./Component');
var TextProperty = require('./TextPropertyComponent');
var $$ = Component.$$;

/**
  Editor for a text property (annotated string). Needs to be
  instantiated inside a {@link ui/Controller} context.
  
  @class
  @memberof module:ui
  @extends module:ui/Surface
  
  @example
  
  Create a `TextPropertyEditor` for the `name` property of an author object. Allow emphasis annotations.

  ```js
  $$(TextPropertyEditor, {
    name: 'authorNameEditor',
    path: ['author_1', 'name'],
    commands: [EmphasisCommand]
  })
  ```
*/
function TextPropertyEditor() {
  Surface.apply(this, arguments);
  var doc = this.getDocument();
  this.textPropertyManager = new TextPropertyManager(doc);
}

TextPropertyEditor.Prototype = function() {

  this.dispose = function() {
    Surface.prototype.dispose.call(this);
  };

  this.isContainerEditor = function() {
    return false;
  };

  this.render = function() {
    var el = $$(this.props.tagName || 'div')
      .addClass("sc-text-property-editor")
      .attr({
        spellcheck: false,
        contenteditable: true
      })
      .append(
        $$(TextProperty, {
          tagName: "div",
          path: this.props.path
        })
      );
    return el;
  };

  /* Editing behavior */

  // Selects the current property.
  this.selectAll = function() {
    var doc = this.getDocument();
    var sel = this.getSelection();
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
      return insertText(tx, args);
    }
  };

  // implements backspace and delete
  this.delete = function(tx, args) {
    return deleteSelection(tx, args);
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
    var result = copySelection(doc, { selection: selection });
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

oo.inherit(TextPropertyEditor, Surface);
module.exports = TextPropertyEditor;