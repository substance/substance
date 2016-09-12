'use strict';

import Surface from './Surface'
import TextPropertyManager from '../model/TextPropertyManager'
import TextProperty from './TextPropertyComponent'

/**
  Annotator for a text property. Needs to be instantiated inside a {@link ui/Controller}
  context. Works like a TextPropertyEditor but you can only annotate, not edit.

  @class
  @component
  @extends ui/Surface

  @prop {String} name unique surface name
  @prop {String[]} path path to a text property
  @prop {ui/Command[]} commands array of command classes to be available

  @example

  ```js
  $$(TextPropertyAnnotator, {
    name: 'abstract',
    path: ['metadata', 'abstract'],
    commands: [EmphasisCommand]
  })
  ```
*/

function TextPropertyAnnotator() {
  Surface.apply(this, arguments);
  var doc = this.getDocument();
  this.textPropertyManager = new TextPropertyManager(doc);
}

TextPropertyAnnotator.Prototype = function() {

  this.render = function($$) {
    var el = $$(this.props.tagName || 'div')
      .addClass("sc-text-property-annotator")
      .append(
        $$(TextProperty, {
          tagName: "div",
          path: this.props.path
        })
      );
    return el;
  };

  this.isContainerEditor = function() {
    return false;
  };

};

Surface.extend(TextPropertyAnnotator);

export default TextPropertyAnnotator;