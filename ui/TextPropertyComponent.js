'use strict';

var AnnotatedTextComponent = require('./AnnotatedTextComponent');

/**
  Renders a text property. Used internally by different components (e.g. ui/TextPropertyEditor)

  @class
  @component
  @extends ui/Component

  @prop {String[]} path path to a text property
  @prop {String} [tagName] specifies which tag should be used - defaults to `div`

  @example

  ```js
  $$(TextProperty, {
    path: [ 'paragraph-1', 'content']
  })
  ```
*/

function TextPropertyComponent() {
  TextPropertyComponent.super.apply(this, arguments);
}

TextPropertyComponent.Prototype = function() {


  this.initialize = function() {
    // Only register Property when inside a surface context
    if (this.getSurface()) {
      this.getTextPropertyManager().registerProperty(this);
    }
  };

  this.dispose = function() {
    // Only register Property when inside a surface context
    if (this.getSurface()) {
      this.getTextPropertyManager().unregisterProperty(this);
    }
  };

  this.getInitialState = function() {
    return {
      fragments: this.getTextPropertyManager().getFragments(this.props.path)
    };
  };

  /**
    Handles triple clicks

    Inline nodes (contenteditable=false islands) lead to unexpected
    behavior on triple click (selection gets blocked). This fix
    ensures the expected full text property selection is made.

    TODO: Do extensive cross browser testing and only apply this
    if really needed (e.g. for Chrome)

    TODO: When user clicks between the lines of a text property, no
    mousedown event is fired, thus the selection remains in the
    undesired state.

    @private
  */
  this.onTripleMouseDown = function(e) {
    if (e.detail === 3) {
      var doc = this.getDocument();
      var path = this.getPath();
      var text = doc.get(path);

      var sel = doc.createSelection({
        type: 'property',
        path:  path,
        startOffset: 0,
        // TODO: Is this problematic with regards to UTF8?
        endOffset: text.length
      });

      var surface = this.context.surface;
      surface.setSelection(sel);
      
      e.preventDefault();
      e.stopPropagation();    
    }
  };

  this.render = function() {
    var el = this.super.render.call(this);
    el.on('mousedown', this.onTripleMouseDown);
    el.removeClass('sc-annotated-text').addClass('sc-text-property');
    return el;
  };

  this.getAnnotations = function() {
    var doc = this.getDocument();
    var annotations = doc.getIndex('annotations').get(this.props.path);
    if (this.state.fragments) {
      annotations = annotations.concat(this.state.fragments);
    }
    return annotations;
  };

  this.getContainer = function() {
    return this.getSurface().getContainer();
  };

  this.getController = function() {
    return this.context.controller;
  };

  this.getDocument = function() {
    return this.context.doc;
  };

  this.getElement = function() {
    return this.$el[0];
  };

  this.getSurface = function() {
    return this.context.surface;
  };

  // TextPropertyManager API

  this.setFragments = function(fragments) {
    this.extendState({
      fragments: fragments
    });
  };

  this.update = function() {
    this.rerender();
  };

  this.getTextPropertyManager = function() {
    return this.getSurface().getTextPropertyManager();
  };

};

AnnotatedTextComponent.extend(TextPropertyComponent);

module.exports = TextPropertyComponent;
