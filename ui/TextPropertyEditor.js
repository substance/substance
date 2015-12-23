'use strict';

var Surface = require('./Surface');
var insertText = require('../model/transform/insertText');
var deleteSelection = require('../model/transform/deleteSelection');
var Component = require('./Component');
var TextProperty = require('./TextPropertyComponent');
var $$ = Component.$$;

/**
  Editor for a text property (annotated string). Needs to be
  instantiated inside a {@link ui/Controller} context.

  @class
  @component
  @extends ui/Surface

  @prop {String} name unique editor name
  @prop {String[]} path path to a text property
  @prop {ui/SurfaceCommand[]} commands array of command classes to be available

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
}

TextPropertyEditor.Prototype = function() {

  this.isContainerEditor = function() {
    return false;
  };

  this.render = function() {
    var el = Surface.prototype.render.call(this);
    el.tagName = this.props.tagName || 'div';
    el.addClass("sc-text-property-editor")
      .attr({
        spellcheck: false,
        contenteditable: true
      });
    el.append(
        $$(TextProperty, {
          tagName: "div",
          path: this.props.path
        })
      );
    return el;
  };

  /* Editing behavior */

  /**
    Selects all text
  */
  this.selectAll = function() {
    var doc = this.getDocument();
    var path = this.props.path;
    var text = doc.get(path);
    var sel = doc.createSelection({
      type: 'property',
      path: path,
      startOffset: 0,
      endOffset: text.length
    });
    this.setSelection(sel);
  };

  /**
    Performs an {@link model/transform/insertText} transformation
  */
  this.insertText = function(tx, args) {
    if (args.selection.isPropertySelection() || args.selection.isContainerSelection()) {
      return insertText(tx, args);
    }
  };

  /**
    Performs a {@link model/transform/deleteSelection} transformation
  */
  this.delete = function(tx, args) {
    return deleteSelection(tx, args);
  };

  // No breaking here, inserts softbreak instead
  this.break = function(tx, args) {
    return this.softBreak(tx, args);
  };

  /**
    Inserts a soft break
  */
  this.softBreak = function(tx, args) {
    args.text = "\n";
    return this.insertText(tx, args);
  };

  /**
    Performs a {@link model/transform/paste} transformation
  */
  this.paste = function(tx, args) {
    // TODO: for now only plain text is inserted
    // We could do some stitching however, preserving the annotations
    // received in the document
    if (args.text) {
      return this.insertText(tx, args);
    }
  };
};

Surface.extend(TextPropertyEditor);
module.exports = TextPropertyEditor;