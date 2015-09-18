"use strict";

var OO = require('../basics/oo');
var Component = require('./component');
var $$ = Component.$$;
var Annotator = require('../document/annotator');
var AnnotationComponent = require('./nodes/annotation_component');

function TextPropertyComponent() {
  Component.apply(this, arguments);
}

TextPropertyComponent.Prototype = function() {

  this.didInitialize = function() {
    this.getTextPropertyManager().registerProperty(this);
  };

  this.getInitialState = function() {
    return {
      fragments: this.getTextPropertyManager().getFragments(this.props.path)
    };
  };

  this.willUnmount = function() {
    this.getTextPropertyManager().unregisterProperty(this);
  };

  this.render = function() {
    var componentRegistry = this.context.componentRegistry;
    var doc = this.getDocument();
    var path = this.getPath();
    var text = doc.get(path) || "";
    var annotations = this.getAnnotations();

    var el = $$(this.props.tagName || 'span')
      .addClass("text-property")
      .attr({
        "data-path": this.props.path.join('.'),
        spellCheck: false,
      })
      .css({
        whiteSpace: "pre-wrap"
      });

    var annotator = new Annotator();
    var fragmentCounters = {};
    annotator.onText = function(context, text) {
      if (text && text.length > 0) {
        context.append(text);
      }
    };
    annotator.onEnter = function(entry) {
      var node = entry.node;
      var id = node.id;
      if (!fragmentCounters[id]) {
        fragmentCounters[id] = 0;
      }
      fragmentCounters[id] = fragmentCounters[id]+1;
      var ViewClass;
      if (componentRegistry.contains(node.type)) {
        ViewClass = componentRegistry.get(node.type);
      } else {
        ViewClass = AnnotationComponent;
      }
      var el = $$(ViewClass, {
        doc: doc,
        node: node,
      });
      // adding keys here, enables preservative rerendering
      // TODO: experiment, if this reduces cursor flickering, already...
      // .key(id + "@" + fragmentCounters[id]);
      // special support for container annotation fragments
      if (node.type === "container_annotation_fragment") {
        el.addClass(node.anno.getTypeNames().join(' ').replace(/_/g, "-"));
        el.addClass("annotation-fragment");
      } else if (node.type === "container-annotation-anchor") {
        el.addClass(node.anno.getTypeNames().join(' ').replace(/_/g, "-"));
        el.addClass("anchor");
        el.addClass(node.isStart?"start-anchor":"end-anchor");
      }
      return el;
    };
    annotator.onExit = function(entry, context, parentContext) {
      parentContext.append(context);
    };
    annotator.start(el, text, annotations);
    // NOTE: this is particularly necessary for text-properties of
    // block level text nodes. Otherwise, the element will not y-expand
    // as desired, and soft-breaks are not visible.
    // TODO: sometimes we do not want to do this. Make it configurable.
    el.append($$('br'));
    return el;
  };

  this.getAnnotations = function() {
    var annotations = this.props.doc.getIndex('annotations').get(this.props.path);
    if (this.state.fragments) {
      annotations = annotations.concat(this.state.fragments);
    }
    return annotations;
  };

  this.getContainer = function() {
    return this.getSurface().getContainer();
  };

  this.getDocument = function() {
    return this.props.doc;
  };

  this.getPath = function() {
    return this.props.path;
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

OO.inherit(TextPropertyComponent, Component);

module.exports = TextPropertyComponent;
