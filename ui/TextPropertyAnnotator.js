'use strict';

var oo = require('../util/oo');
var Surface = require('./Surface');
var TextPropertyManager = require('../model/TextPropertyManager');
var Component = require('./Component');
var TextProperty = require('./TextPropertyComponent');
var $$ = Component.$$;

/**
  Annotator for a text property. Needs to be instantiated inside a {@link ui/Controller}
  context. Works like a TextPropertyEditor but you can only annotate, not edit.

  @class
  @component
  @extends ui/Surface
  
  @prop {String} name unique surface name
  @prop {String[]} path path to a text property
  @prop {ui/SurfaceCommand[]} commands array of command classes to be available

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

  this.dispose = function() {
    Surface.prototype.dispose.call(this);
  };

  this.isContainerEditor = function() {
    return false;
  };

  this.render = function() {
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
};

oo.inherit(TextPropertyAnnotator, Surface);
module.exports = TextPropertyAnnotator;