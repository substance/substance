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

function TextPropertyEditor() {
  Surface.apply(this, arguments);
}

TextPropertyEditor.Prototype = function() {

  this.render = function($$) {
    var el = Surface.prototype.render.call(this);
    el.addClass("sc-text-property-editor");
    el.append(
      $$(TextProperty, {
        tagName: "div",
        path: this.props.path
      })
    );
    if (this.isEditable()) {
      el.attr('contenteditable', true);
    }
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
