'use strict';

var Component = require('./Component');
var $$ = Component.$$;
var Fragmenter = require('../model/Fragmenter');
var AnnotationComponent = require('./AnnotationComponent');

/**
  Renders annotated text.
  Used internally by ui/TextPropertyComponent.

  @class
  @component
  @extends ui/Component
*/

function AnnotatedTextComponent() {
  AnnotatedTextComponent.super.apply(this, arguments);
}

AnnotatedTextComponent.Prototype = function() {

  /**
    Node render implementation. Use model/Fragmenter for rendering of annotations.

    @return {VirtualNode} VirtualNode created using ui/Component
   */
  this.render = function() {
    var componentRegistry = this.context.componentRegistry;
    var doc = this.getDocument();
    var path = this.getPath();
    var text = doc.get(path) || "";
    var annotations = this.getAnnotations();
    var highlights = this.getHighlights();

    var el = $$(this.props.tagName || 'span')
      .addClass('sc-annotated-text')
      .attr({
        "data-path": this.props.path.join('.'),
        spellCheck: false,
      })
      .css({
        whiteSpace: "pre-wrap"
      });

    function _addHighlight(el, nodeId) {
      if (highlights[nodeId]) {
        el.addProps({
          highlighted: highlights[nodeId]
        });
      }
    }

    var fragmenter = new Fragmenter();
    var fragmentCounters = {};
    fragmenter.onText = function(context, text) {
      if (text && text.length > 0) {
        context.append(text);
      }
    };
    fragmenter.onEnter = function(fragment) {
      var node = fragment.node;
      var id = node.id;
      var el;
      if (!fragmentCounters[id]) {
        fragmentCounters[id] = 0;
      }
      fragmentCounters[id] = fragmentCounters[id]+1;
      if (node.type === 'cursor') {
        return $$('span').addClass('se-cursor');
      } else if (node.type === 'selection-fragment') {
        return $$('span').addClass('se-selection-fragment');
      } else if (node.type === "container-annotation-fragment") {
        el = $$(AnnotationComponent, { doc: doc, node: node })
          .addClass("se-annotation-fragment")
          .addClass(node.anno.getTypeNames().join(' ').replace(/_/g, "-"));
        _addHighlight(el, node.anno.id);
        return el;
      } else if (node.type === "container-annotation-anchor") {
        el = $$(AnnotationComponent, { doc: doc, node: node })
          .addClass("se-anchor")
          .addClass(node.anno.getTypeNames().join(' ').replace(/_/g, "-"))
          .addClass(node.isStart?"start-anchor":"end-anchor");
        _addHighlight(el, node.anno.id);
        return el;
      }
      var ComponentClass = componentRegistry.get(node.type) || AnnotationComponent;
      el = $$(ComponentClass, { doc: doc, node: node });
      _addHighlight(el, node.id);
      // adding refs here, enables preservative rerendering
      // TODO: while this solves problems with rerendering inline nodes
      // with external content, it decreases the overall performance too much.
      // We should optimize the component first before we can enable this.
      // el.ref(id + "@" + fragmentCounters[id]);
      return el;
    };
    fragmenter.onExit = function(fragment, context, parentContext) {
      parentContext.append(context);
    };
    fragmenter.start(el, text, annotations);
    // NOTE: this is particularly necessary for text-properties of
    // block level text nodes. Otherwise, the element will not y-expand
    // as desired, and soft-breaks are not visible.
    // TODO: sometimes we do not want to do this. Make it configurable.
    el.append($$('br'));
    return el;
  };

  /**
    Gets annotations related to current node.

    @return {Array} Node's annotations
   */
  this.getAnnotations = function() {
    var doc = this.getDocument();
    var annotations = doc.getIndex('annotations').get(this.props.path);
    return annotations;
  };

  /**
    Gets document instance.

    @return {Document} The document instance
   */
  this.getDocument = function() {
    return this.props.doc || this.context.doc;
  };

  /**
    Gets a node path.

    @return {String[]} Node path
   */
  this.getPath = function() {
    return this.props.path;
  };

  this.getHighlights = function() {
    return {};
  };

};

Component.extend(AnnotatedTextComponent);

module.exports = AnnotatedTextComponent;
