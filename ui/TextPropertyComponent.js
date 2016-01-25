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

  var _super = Object.getPrototypeOf(this);

  this.initialize = function() {
    // Only register Property when inside a surface context
    if (this.getSurface()) {
      this.getTextPropertyManager().registerProperty(this);
    }
  };

  this.dispose = function() {
    _super.dispose.call(this);

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

  this.render = function() {
    var el = this.super.render.call(this);
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
