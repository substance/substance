'use strict';

var oo = require('../util/oo');
var each = require('lodash/collection/each');
var last = require('lodash/array/last');
var extend = require('lodash/object/extend');
var bind = require('lodash/function/bind');
var uuid = require('../util/uuid');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var $$ = DefaultDOMElement.createElement;

/**
  A generic base implementation for XML/HTML importers.

  @class
  @param {Object} config
 */
function DOMImporter(config) {
  if (!config.converters) {
    throw new Error('config.converters is mandatory');
  }

  this.config = extend({idAttribute: 'data-id'}, config);
  this.schema = config.schema;
  this.state = null;

  this.$$ = $$;

  this._defaultBlockConverter = null;
  this._allConverters = [];
  this._blockConverters = [];
  this._propertyAnnotationConverters = [];

  var schema = this.schema;
  var defaultTextType = schema.getDefaultTextType();

  config.converters.forEach(function(Converter) {
    var converter;
    if (typeof Converter === 'function') {
      console.log('installing converter', Converter);
      converter = new Converter();
    } else {
      converter = Converter;
    }

    if (!converter.type) {
      console.error('Converter must provide the type of the associated node.', converter);
      return;
    }
    if (!converter.matchElement && !converter.tagName) {
      console.error('Converter must provide a matchElement function or a tagName property.', converter);
      return;
    }
    if (!converter.matchElement) {
      converter.matchElement = bind(this._defaultElementMatcher, converter);
    }
    var NodeClass = schema.getNodeClass(converter.type);
    if (!NodeClass) {
      return;
    }
    if (defaultTextType === converter.type) {
      this._defaultBlockConverter = converter;
    }

    this._allConverters.push(converter);
    // Defaults to _blockConverters
    if (NodeClass.static.isPropertyAnnotation) {
      this._propertyAnnotationConverters.push(converter);
    } else {
      this._blockConverters.push(converter);
    }

  }.bind(this));

  this._initState();
}

DOMImporter.Prototype = function DOMImporterPrototype() {

  this._initState = function() {
    var state = {
      trimWhitespaces: !!this.config.trimWhitespaces,
    };
    // get the target containerId from config or schema
    var containerId = this.config.containerId;
    if (!containerId && this.schema.getBodyContainer) {
      containerId = this.schema.getBodyContainer();
    }
    if (!containerId) {
      throw new Error('Container id must be specified: either via config.containerId, or via schema.getBodyContainer()');
    }
    state.containerId = containerId;
    this.state = state;
    this.reset();
    return state;
  };

  this.reset = function() {
    this.state = extend(this.state, {
      nodes: [],
      inlineNodes: [],
      container: [],
      ids: {},
      // stack of contexts to handle reentrant calls
      stack: [],
      lastChar: "",
      skipTypes: {},
      ignoreAnnotations: false,
    });
  };

  this.createDocument = function() {
    var doc = this._createDocument();
    var containerId = this.state.containerId;
    var container = doc.get(containerId);
    if (!container) {
      doc.create({
        type: 'container',
        id: containerId,
        nodes: []
      });
    }
    return doc;
  };

  this.generateDocument = function() {
    // creating all nodes
    var doc = this.createDocument();
    each(this.state.nodes, function(node) {
      doc.create(node);
    });
    // filling the container
    doc.set([this.state.containerId, 'nodes'], this.state.container);
    // creating annotations afterwards so that the targeted nodes exist for sure
    each(this.state.inlineNodes, function(inlineNode) {
      doc.create(inlineNode);
    });
    return doc;
  };

  this._createDocument = function() {
    // create an empty document and initialize the container if not present
    var doc = new this.config.DocumentClass();
    return doc;
  };

  /**
    Converts and shows all children of a given element.

    @param {ui/DOMElement[]} elements All elements that should be converted into the container.
    @param {String} containerId TODO The id of the target container node.
   */
  this.convertContainer = function(elements) {
    var state = this.state;
    state.container = [];
    var iterator = new DefaultDOMElement.NodeIterator(elements);
    while(iterator.hasNext()) {
      var el = iterator.next();
      var blockTypeConverter = this._getConverterForElement(el, 'block');
      var node;
      if (blockTypeConverter) {
        node = this._nodeData(el, blockTypeConverter.type);
        node = blockTypeConverter.import(el, node, this) || node;
        this._createAndShow(node);
      } else {
        if (el.isCommentNode()) {
          // skip HTML comment nodes on block level
        } else if (el.isTextNode()) {
          var text = el.textContent;
          if (/^\s*$/.exec(text)) continue;
          // If we find text nodes on the block level we wrap
          // it into a paragraph element (or what is configured as default block level element)
          iterator.back();
          this._wrapInlineElementsIntoBlockElement(iterator);
        } else if (el.isElementNode()) {
          // NOTE: hard to tell if unsupported nodes on this level
          // should be treated as inline or not.
          // ATM: we apply a catch-all to handle cases where inline content
          // is found on top level
          iterator.back();
          this._wrapInlineElementsIntoBlockElement(iterator);
        }
      }
    }
  };

  /**
    Converts a single HTML element and creates a node in the current document.

    @param {ui/DOMElement} el the HTML element
    @returns {object} the created node as JSON
   */
  this.convertElement = function(el) {
    return this._convertElement(el);
  };

  this._convertElement = function(el, mode) {
    var node;
    var converter = this._getConverterForElement(el, mode);
    if (converter) {
      node = this._nodeData(el, converter.type);
      node = converter.import(el, node, this) || node;
      this.createNode(node);
    } else {
      throw new Error('No converter found for '+el.tagName);
    }
    return node;
  };

  this.createNode = function(node) {
    if (this.state.ids[node.id]) {
      throw new Error('Node with id alread exists:' + node.id);
    }
    this.state.ids[node.id] = true;
    this.state.nodes.push(node);
  };

  this.show = function(node) {
    this.state.container.push(node.id);
  };

  this._createAndShow = function(node) {
    this.createNode(node);
    this.show(node);
  };

  this._nodeData = function(el, type) {
    return {
      type: type,
      id: this.getIdForElement(el)
    };
  };

  // /**
  //   Converts an html element into a text property of the document.

  //   @private
  //   @param {Array<String>} path Path of the property to be written
  //   @param {String} html HTML to be converter
  //  */
  // this.convertProperty = function(path, html) {
  //   // TODO: while this method may be useful if html is updated
  //   // piecewise, from an API point of view it is not intuitive.
  //   // We should see if we really need this.
  //   // And we should give it a better naming.
  //   var doc = this.getDocument();
  //   var el = $$('div').setInnerHtml(html);
  //   var text = this.annotatedText(el, path);
  //   doc.setText(path, text, this.state.inlineNodes);
  // };

  /**
    Convert annotated text.

    Make sure you call this method only for elements where `this.isParagraphish(elements) === true`.

    @param {ui/DOMElement} el
    @param {String[]} path The target property where the extracted text (plus annotations) should be stored.
    @returns {String} The converted text as plain-text
   */
  this.annotatedText = function(el, path) {
    var state = this.state;
    if (path) {
      if (state.stack.length>0) {
        throw new Error('Contract: it is not allowed to bind a new call annotatedText to a path while the previous has not been completed.', el.outerHTML);
      }
      state.stack = [{ path: path, offset: 0, text: ""}];
    } else {
      if (state.stack.length===0) {
        throw new Error("Contract: DOMImporter.annotatedText() requires 'path' for non-reentrant call.", el.outerHTML);
      }
    }
    // IMO we should reset the last char, as it is only relevant within one
    // annotated text property. This feature is mainly used to eat up
    // whitespace in XML/HTML at tag boundaries, produced by pretty-printed XML/HTML.
    this.state.lastChar = '';

    var iterator = el.getChildNodeIterator();
    var text = this._annotatedText(iterator);
    if (path) {
      state.stack.pop();
    }
    return text;
  };

  /**
    Converts the given element as plain-text.

    @param {ui/DOMElement} el
    @returns {String} The plain text
   */
  this.plainText = function(el) {
    var state = this.state;
    var text = el.textContent;
    if (state.stack.length > 0) {
      var context = last(state.stack);
      context.offset += text.length;
      context.text += context.text.concat(text);
    }
    return text;
  };

  /**
    Tells the converter to insert a virutal custom text.

    This is useful when during conversion a generated label needs to be inserted instead
    of real text.

    @param {String}
   */
  this.customText = function(text) {
    var state = this.state;
    if (state.stack.length > 0) {
      var context = last(state.stack);
      context.offset += text.length;
      context.text += context.text.concat(text);
    }
    return text;
  };

  /**
    Generates an id. The generated id is unique with respect to all ids generated so far.

    @param {String} a prefix
    @return {String} the generated id
   */
  this.nextId = function(prefix) {
    // TODO: we could create more beautiful ids?
    // however we would need to be careful as there might be another
    // element in the HTML coming with that id
    // For now we use shas
    return uuid(prefix);
  };

  this.getIdForElement = function(el, type) {
    var id = el.getAttribute(this.config.idAttribute) || this.nextId(type);
    // TODO: check for collisions
    while (this.state.ids[id]) {
      id = this.nextId(type);
    }
    return id;
  };

  this.defaultConverter = function(el, converter) {
    if (!this.IGNORE_DEFAULT_WARNINGS) {
      console.warn('This element is not handled by the converters you provided. This is the default implementation which just skips conversion. Override DOMImporter.defaultConverter(el, converter) to change this behavior.', el.outerHTML);
    }
    var defaultTextType = this.schema.getDefaultTextType();
    var defaultConverter = this._defaultBlockConverter;
    if (!defaultConverter) {
      throw new Error('Could not find converter for default type ', defaultTextType);
    }
    var node = this._nodeData(el, defaultTextType);
    node = defaultConverter.import(el, node, converter) || node;
    return node;
  };

  this._defaultElementMatcher = function(el) {
    return el.is(this.tagName);
  };

  // Internal function for parsing annotated text
  // --------------------------------------------
  //
  this._annotatedText = function(iterator) {
    var state = this.state;
    var context = last(state.stack);
    if (!context) {
      throw new Error('Illegal state: context is null.');
    }
    while(iterator.hasNext()) {
      var el = iterator.next();
      var text = "";
      // Plain text nodes...
      if (el.isTextNode()) {
        text = this._prepareText(state, el.textContent);
        if (text.length) {
          // Note: text is not merged into the reentrant state
          // so that we are able to return for this reentrant call
          context.text = context.text.concat(text);
          context.offset += text.length;
        }
      } else if (el.isCommentNode()) {
        // skip comment nodes
        continue;
      } else if (el.isElementNode()) {
        var inlineTypeConverter = this._getConverterForElement(el, 'inline');
        if (!inlineTypeConverter) {
          if (!this.IGNORE_DEFAULT_WARNINGS) {
            console.warn('Unsupported inline element. We will not create an annotation for it, but process its children to extract annotated text.', el.outerHTML);
          }
          // Note: this will store the result into the current context
          this.annotatedText(el);
          continue;
        }
        // reentrant: we delegate the conversion to the inline node class
        // it will either call us back (this.annotatedText) or give us a finished
        // node instantly (self-managed)
        var startOffset = context.offset;
        var inlineType = inlineTypeConverter.type;
        var inlineNode = this._nodeData(el, inlineType);
        if (inlineTypeConverter.import) {
          // push a new context so we can deal with reentrant calls
          state.stack.push({ path: context.path, offset: startOffset, text: ""});
          inlineNode = inlineTypeConverter.import(el, inlineNode, this) || inlineNode;

          var NodeClass = this.schema.getNodeClass(inlineType);
          // inline nodes are attached to an invisible character
          if (NodeClass.static.isInline) {
            this.customText("\u200B");
          }
          // ... and transfer the result into the current context
          var result = state.stack.pop();
          context.offset = result.offset;
          context.text = context.text.concat(result.text);
        } else {
          this.annotatedText(el);
        }
        // in the mean time the offset will probably have changed to reentrant calls
        var endOffset = context.offset;
        inlineNode.startOffset = startOffset;
        inlineNode.endOffset = endOffset;
        inlineNode.path = context.path.slice(0);
        state.inlineNodes.push(inlineNode);
      } else {
        console.warn('Unknown element type. Taking plain text.', el.outerHTML);
        text = this._prepareText(state, el.textContent);
        context.text = context.text.concat(text);
        context.offset += text.length;
      }
    }
    // return the plain text collected during this reentrant call
    return context.text;
  };

  this._getConverterForElement = function(el, mode) {
    var converters;
    if (mode === "block") {
      if (!el.tagName) return null;
      converters = this._blockConverters;
    } else if (mode === "inline") {
      converters = this._propertyAnnotationConverters;
    } else {
      converters = this._allConverters;
    }
    for (var i = 0; i < converters.length; i++) {
      if (converters[i].matchElement(el)) {
        return converters[i];
      }
    }
  };

  /**
    Wraps the remaining (inline) elements of a node iterator into a default
    block node.

    @private
    @param {model/DOMImporter.ChildIterator} childIterator
    @returns {model/DocumentNode}
   */
  this._wrapInlineElementsIntoBlockElement = function(childIterator) {
    var wrapper = $$('div');
    while(childIterator.hasNext()) {
      var el = childIterator.next();
      // if there is a block node we finish this wrapper
      var blockTypeConverter = this._getConverterForElement(el, 'block');
      if (blockTypeConverter) {
        childIterator.back();
        break;
      }
      wrapper.append(el.clone());
    }
    var node = this.defaultConverter(wrapper, this);
    if (node) {
      if (!node.type) {
        throw new Error('Contract: Html.defaultConverter() must return a node with type.');
      }
      this._createAndShow(node);
    }
    return node;
  };

  /**
    Converts an element into a default block level node.

    @private
    @param {ui/DOMElement} $el
    @returns {model/DocumentNode}
   */
  this._createDefaultBlockElement = function(el) {
    var node = this.defaultConverter(el, this);
    if (node) {
      if (!node.type) {
        throw new Error('Contract: Html.defaultConverter() must return a node with type.', el.outerHTML);
      }
      node.id = node.id || this.defaultId(el, node.type);
      this._createAndShow(node);
    }
  };

  var WS_LEFT = /^\s+/g;
  var WS_LEFT_ALL = /^\s*/g;
  var WS_RIGHT = /\s+$/g;
  var WS_ALL = /\s+/g;
  // var ALL_WS_NOTSPACE_LEFT = /^[\t\n]+/g;
  // var ALL_WS_NOTSPACE_RIGHT = /[\t\n]+$/g;
  var SPACE = " ";
  var TABS_OR_NL = /[\t\n\r]+/g;

  // TODO: this needs to be tested and documented
  this._prepareText = function(state, text) {
    if (!state.trimWhitespaces) {
      return text;
    }
    var repl = SPACE;
    // replace multiple tabs and new-lines by one space
    text = text.replace(TABS_OR_NL, '');
    // TODO: the last char handling is only necessary for for nested calls
    // i.e., when processing the content of an annotation, for instance
    // we need to work out how we could control this with an inner state
    if (state.lastChar === SPACE) {
      text = text.replace(WS_LEFT_ALL, repl);
    } else {
      text = text.replace(WS_LEFT, repl);
    }
    text = text.replace(WS_RIGHT, repl);
    // EXPERIMENTAL: also remove white-space within
    if (this.config.REMOVE_INNER_WS) {
      text = text.replace(WS_ALL, SPACE);
    }
    state.lastChar = text[text.length-1] || state.lastChar;
    return text;
  };

  /**
    Removes any leading and trailing whitespaces from the content
    within the given element.
    Attention: this is not yet implemented fully. Atm, trimming is only done
    on the first and last text node (if they exist).

    @private
    @param {util/jQuery} $el
    @returns {util/jQuery} an element with trimmed text
   */
  this._trimTextContent = function($el) {
    var nodes = $el[0].childNodes;
    var first = nodes[0];
    var last = last(nodes);
    var text, trimmed;
    if (first) {
      // trim the first and last text
      if (this._getDomNodeType(first) === "text") {
        text = first.textContent;
        trimmed = this.trimLeft(text);
        first.textContent = trimmed;
      }
    }
    if (last) {
      if (this._getDomNodeType(last) === "text") {
        text = last.textContent;
        trimmed = this.trimRight(text);
        last.textContent = trimmed;
      }
    }
    return $el;
  };

  this._trimLeft = function(text) {
    return text.replace(WS_LEFT, "");
  };

  this._trimRight = function(text) {
    return text.replace(WS_RIGHT, "");
  };

};
oo.initClass(DOMImporter);

DOMImporter.$$ = require('../ui/VirtualDOMElement').createElement;

module.exports = DOMImporter;
