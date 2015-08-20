var Substance = require('../basics');
var Document = require('../document');
var NodeView = require('./node_view');
var AnnotationView = require('./annotation_view');
var Annotator = Document.Annotator;

// Basic implementation of a text property.
//

function TextProperty() {}

TextProperty.Prototype = function() {

  this.getSurface = function() {
    throw new Error('This is abstract');
  };

  this.getDocument = function() {
    var surface = this.getSurface();
    if (!surface) {
      return null;
    } else {
      return surface.getDocument();
    }
  };

  this.getPath = function() {
    throw new Error('This is abstract');
  };

  /*
    Add these when creating the element
      class: 'text-property'
      style: "whiteSpace: pre-wrap;"
      'data-path': path.join('.')
   */
  this.getElement = function() {
    throw new Error('This is abstract');
  };

  // Override this if you want to add app-specific annotations, such as highlights
  this.getAnnotations = function() {
    var doc = this.getDocument();
    var path = this.getPath();
    return doc.getIndex('annotations').get(path);
  };

  this.attach = function() {
    var doc = this.getDocument();
    var path = this.getPath();
    doc.getEventProxy('path').add(path, this, this.propertyDidChange);
  };

  this.detach = function() {
    var doc = this.getDocument();
    var path = this.getPath();
    doc.getEventProxy('path').remove(path, this);
  };

  this.renderContent = function() {
    var doc = this.getDocument();
    var domNode = this.getElement();
    if (!domNode) { return; }
    var contentView = new TextProperty.ContentView({
      doc: doc,
      children: this.renderChildren()
    });
    var fragment = contentView.render();
    // Add a <br> so that the node gets rendered when empty and Contenteditable will stop when moving the cursor.
    // TODO: probably this is not good when using the property inline.
    fragment.appendChild(document.createElement('br'));
    domNode.innerHTML = "";
    domNode.appendChild(fragment);
  };

  this.renderChildren = function() {
    var doc = this.getDocument();
    var path = this.getPath();
    var text = doc.get(path) || "";

    var annotations = this.getAnnotations();

    var annotator = new Annotator();
    annotator.onText = function(context, text) {
      context.children.push(text);
    };
    annotator.onEnter = function(entry) {
      var node = entry.node;
      // TODO: we need a component factory, so that we can create the appropriate component
      var ViewClass = AnnotationView;
      var classNames = [];
      return {
        ViewClass: ViewClass,
        props: {
          doc: doc,
          node: node,
          classNames: classNames,
        },
        children: []
      };
    };
    annotator.onExit = function(entry, context, parentContext) {
      var props = context.props;
      props.children = context.children;
      var view = new context.ViewClass(props);
      parentContext.children.push(view);
    };
    var root = { children: [] };
    annotator.start(root, text, annotations);
    return root.children;
  };

  this.propertyDidChange = function(change, info) {
    // Note: Surface provides the source element as element
    // whenever editing is done by Contenteditable (as opposed to programmatically)
    // In that case we trust in CE and do not rerender.
    if (info.source === this.getElement()) {
      console.log('Skipping update...');
      // NOTE: this hack triggers a rerender of the text-property
      // after a burst of changes. Atm, we let CE do incremental rendering,
      // which is important for a good UX. However CE sometimes does undesired
      // things which can lead to a slight diversion of model and view.
      // Using this hack we can stick to the trivial rerender based implementation
      // of TextProperty as opposed to an incremental version.
      if (info.surface && info.typing) {
        if (!this._debouncedRerender) {
          var INTERVAL = 200; //ms
          var self = this;
          this._debouncedRerender = Substance.debounce(function() {
            var doc = this.getDocument();
            // as this get called delayed it can happen
            // that this element has been deleted in the mean time
            if (doc) {
              self.renderContent();
              info.surface.rerenderDomSelection();
            }
          }, INTERVAL);
        }
        this._debouncedRerender();
        return;
      }
    }
    // For now, we stick to rerendering as opposed to incremental rendering.
    // As long the user is not editing this property this strategy is sufficient.
    // For the editing the above strategy is applied.
    this.renderContent();

    if (info.source === this.getElement() && info.surface) {
      setTimeout(function() {
        info.surface.rerenderDomSelection();
      });
    }
  };
};

Substance.initClass(TextProperty);

TextProperty.ContentView = NodeView.extend({
  createElement: function() {
    return document.createDocumentFragment();
  }
});

module.exports = TextProperty;
