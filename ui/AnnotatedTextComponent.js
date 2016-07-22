'use strict';

var Fragmenter = require('../model/Fragmenter');
var Component = require('./Component');
var AnnotationComponent = require('./AnnotationComponent');
var InlineNodeComponent = require('./InlineNodeComponent');

/**
  Renders an anotated text. Used internally by {@link ui/TextPropertyComponent}.

  @class
  @component
  @extends ui/Component

  @prop {String[]} path The property to be rendered.
*/

function AnnotatedTextComponent() {
  AnnotatedTextComponent.super.apply(this, arguments);
}

AnnotatedTextComponent.Prototype = function() {

  // TODO: this component should listen on changes to the property
  // Otherwise will not be updated.
  // Note that in contrast, TextPropertyComponents get updated by Surface.

  /**
    Node render implementation. Use model/Fragmenter for rendering of annotations.

    @return {VirtualNode} VirtualNode created using ui/Component
   */
  this.render = function($$) {
    var el = this._renderContent($$)
      .addClass('sc-annotated-text')
      .css({
        whiteSpace: "pre-wrap"
      });
    return el;
  };

  this.getText = function() {
    return this.getDocument().get(this.props.path) || '';
  };

  this.getAnnotations = function() {
    return this.getDocument().getIndex('annotations').get(this.props.path);
  };

  this._renderContent = function($$) {
    var text = this.getText();
    var annotations = this.getAnnotations();
    var el = $$(this.props.tagName || 'span');
    if (annotations && annotations.length > 0) {
      var fragmenter = new Fragmenter({
        onText: this._renderTextNode.bind(this),
        onEnter: this._renderFragment.bind(this, $$),
        onExit: this._finishFragment.bind(this)
      });
      fragmenter.start(el, text, annotations);
    } else {
      el.append(text);
    }
    return el;
  };

  this._renderTextNode = function(context, text) {
    if (text && text.length > 0) {
      context.append(text);
    }
  };

  this._renderFragment = function($$, fragment) {
    var doc = this.getDocument();
    var componentRegistry = this.getComponentRegistry();
    var node = fragment.node;
    if (node.type === "container-annotation-fragment") {
      return $$(AnnotationComponent, { doc: doc, node: node })
        .addClass("se-annotation-fragment")
        .addClass(node.anno.getTypeNames().join(' ').replace(/_/g, "-"));
    } else if (node.type === "container-annotation-anchor") {
      return $$(AnnotationComponent, { doc: doc, node: node })
        .addClass("se-anchor")
        .addClass(node.anno.getTypeNames().join(' ').replace(/_/g, "-"))
        .addClass(node.isStart?"start-anchor":"end-anchor");
    }
    var ComponentClass = componentRegistry.get(node.type) || AnnotationComponent;
    if (node.constructor.isInline &&
        // opt-out for custom implementations
        !ComponentClass.isCustom &&
        // also no extra wrapping if the node is already an inline node
        !ComponentClass.prototype._isInlineNodeComponent) {
      ComponentClass = InlineNodeComponent;
    }
    var el = $$(ComponentClass, { doc: doc, node: node });
    return el;
  };

  this._finishFragment = function(fragment, context, parentContext) {
    parentContext.append(context);
  };

  /**
    Gets document instance.

    @return {Document} The document instance
   */
  this.getDocument = function() {
    return this.props.doc || this.context.doc;
  };

  this.getComponentRegistry = function() {
    return this.props.componentRegistry || this.context.componentRegistry;
  };

};

Component.extend(AnnotatedTextComponent);

module.exports = AnnotatedTextComponent;
