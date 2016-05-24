'use strict';

var Surface = require('./Surface');
var TextProperty = require('./TextPropertyComponent');

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

function TextPropertyEditor(parent, props) {
  // prop 'name' is optional
  props.name = props.name || props.path.join('.');

  Surface.apply(this, arguments);

  if (!props.path) {
    throw new Error("Property 'path' is mandatory.");
  }
}

TextPropertyEditor.Prototype = function() {

  var _super = TextPropertyEditor.super.prototype;

  this.render = function($$) {
    var el = _super.render.apply(this, arguments);
    el.addClass("sc-text-property-editor");
    if (!this.props.disabled) {
      el.addClass('enabled');
    }
    // if (!this.props.disabled) {
    //   el.attr('contenteditable', true);
    // }
    el.append(
      $$(TextProperty, {
        tagName: "div",
        path: this.props.path
      })
    );
    return el;
  };

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

};

Surface.extend(TextPropertyEditor);

module.exports = TextPropertyEditor;
