'use strict';

var last = require('lodash/last');
var forEach = require('lodash/forEach');
var clone = require('lodash/clone');
var extend = require('lodash/extend');
var oo = require('../util/oo');
// var uuid = require('../util/uuid');
var createCountingIdGenerator = require('../util/createCountingIdGenerator');
var ArrayIterator = require('../util/ArrayIterator');

/**
  A generic base implementation for XML/HTML importers.

  @class
  @param {Object} config
 */
function DOMImporter(config) {
  if (!config.converters) {
    throw new Error('config.converters is mandatory');
  }
  this.config = extend({ idAttribute: 'id' }, config);
  this.schema = config.schema;
  this.state = null;

  this._defaultBlockConverter = null;
  this._allConverters = [];
  this._blockConverters = [];
  this._propertyAnnotationConverters = [];

  var schema = this.schema;
  var defaultTextType = schema.getDefaultTextType();

  config.converters.forEach(function(Converter) {
    var converter;
    if (typeof Converter === 'function') {
      // console.log('installing converter', Converter);
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
      converter.matchElement = this._defaultElementMatcher.bind(converter);
    }
    var NodeClass = schema.getNodeClass(converter.type);
    if (!NodeClass) {
      console.error('No node type defined for converter', converter.type);
      return;
    }
    if (!this._defaultBlockConverter && defaultTextType === converter.type) {
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

  this.state = new DOMImporter.State();
}

DOMImporter.Prototype = function DOMImporterPrototype() {

  this.reset = function() {
    this.state.reset();
  };

  this.createDocument = function(schema) {
    var doc = this._createDocument(schema);
    return doc;
  };

  this.generateDocument = function() {
    // creating all nodes
    var doc = this.createDocument(this.config.schema);
    this.state.nodes.forEach(function(node) {
      // delete if the node exists already
      if (doc.get(node.id)) {
        doc.delete(node.id);
      }
      doc.create(node);
    });
    // creating annotations afterwards so that the targeted nodes exist for sure
    this.state.inlineNodes.forEach(function(node) {
      if (doc.get(node.id)) {
        doc.delete(node.id);
      }
      doc.create(node);
    });
    return doc;
  };

  this._createDocument = function(schema) {
    // create an empty document and initialize the container if not present
    var doc = new this.config.DocumentClass(schema);
    return doc;
  };

  /**
    Converts and shows all children of a given element.

    @param {ui/DOMElement[]} elements All elements that should be converted into the container.
    @param {String} containerId The id of the target container node.
    @returns {Object} the preliminary container node
   */
  this.convertContainer = function(elements, containerId) {
    var state = this.state;
    state.container = [];
    state.containerId = containerId;
    var iterator = new ArrayIterator(elements);
    while(iterator.hasNext()) {
      var el = iterator.next();
      var blockTypeConverter = this._getConverterForElement(el, 'block');
      var node;
      if (blockTypeConverter) {
        node = this._nodeData(el, blockTypeConverter.type);
        state.pushContext(el.tagName, blockTypeConverter);
        node = blockTypeConverter.import(el, node, this) || node;
        state.popContext();
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
    var container = {
      type: 'container',
      id: containerId,
      nodes: this.state.container.slice(0)
    };
    this.createNode(container);
    return container;
  };

  /**
    Converts a single HTML element and creates a node in the current document.

    @param {ui/DOMElement} el the HTML element
    @returns {object} the created node as JSON
   */
  this.convertElement = function(el) {
    var node = this._convertElement(el);
    return node;
  };

  this._convertElement = function(el, mode) {
    var node;
    var converter = this._getConverterForElement(el, mode);
    if (converter) {
      node = this._nodeData(el, converter.type);
      this.state.pushContext(el.tagName, converter);
      node = converter.import(el, node, this) || node;
      this.state.popContext();
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
    return node;
  };

  this.show = function(node) {
    this.state.container.push(node.id);
  };

  this._createAndShow = function(node) {
    this.createNode(node);
    this.show(node);
  };

  this._nodeData = function(el, type) {
    var nodeData = {
      type: type,
      id: this.getIdForElement(el, type)
    };
    var NodeClass = this.schema.getNodeClass(type);
    forEach(NodeClass.static.schema, function(prop, name) {
      // check integrity of provided props, such as type correctness,
      // and mandatory properties
      var hasDefault = prop.hasOwnProperty('default');
      if (hasDefault) {
        nodeData[name] = clone(prop.default);
      }
    });
    return nodeData;
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
    Convert annotated text. You should call this method only for elements
    containing rich-text.

    @param {ui/DOMElement} el
    @param {String[]} path The target property where the extracted text (plus annotations) should be stored.
    @param {Object} options
    @param {Boolean} options.preserveWhitespace when true will preserve whitespace. Default: false.
    @returns {String} The converted text as plain-text
   */
  this.annotatedText = function(el, path, options) {
    var state = this.state;
    if (path) {
      // if (state.stack.length>0) {
      //   throw new Error('Contract: it is not allowed to bind a new call annotatedText to a path while the previous has not been completed.', el.outerHTML);
      // }
      if (options && options.preserveWhitespace) {
        state.preserveWhitespace = true;
      }
      state.stack.push({ path: path, offset: 0, text: ""});
    } else {
      if (state.stack.length===0) {
        throw new Error("Contract: DOMImporter.annotatedText() requires 'path' for non-reentrant call.", el.outerHTML);
      }
    }
    // IMO we should reset the last char, as it is only relevant within one
    // annotated text property. This feature is mainly used to eat up
    // whitespace in XML/HTML at tag boundaries, produced by pretty-printed XML/HTML.
    this.state.lastChar = '';
    var text;
    var iterator = el.getChildNodeIterator();
    text = this._annotatedText(iterator);
    if (path) {
      state.stack.pop();
      state.preserveWhitespace = false;
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
    return this.state.uuid(prefix);
  };

  this.getIdForElement = function(el, type) {
    var id = el.getAttribute(this.config.idAttribute);
    if (id && !this.state.ids[id]) return id;

    var root = el.getRoot();
    id = this.nextId(type);
    while (this.state.ids[id] || root.find('#'+id)) {
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
    this.state.pushContext(el.tagName, converter);
    node = defaultConverter.import(el, node, converter) || node;
    this.state.popContext();
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
        // if no inline converter is found we just traverse deeper
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
          state.pushContext(el.tagName, inlineTypeConverter);
          inlineNode = inlineTypeConverter.import(el, inlineNode, this) || inlineNode;
          state.popContext();

          var NodeClass = this.schema.getNodeClass(inlineType);
          // inline nodes are attached to an invisible character
          if (NodeClass.static.isInline) {
            this.customText("\u200B");
          } else {
            // We call this to descent into the element
            // which could be 'forgotten' otherwise.
            // TODO: what if the converter has processed the element already?
            this.annotatedText(el);
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
    var converter = null;
    for (var i = 0; i < converters.length; i++) {
      if (this._converterCanBeApplied(converters[i], el)) {
        converter = converters[i];
        break;
      }
    }
    return converter;
  };

  this._converterCanBeApplied = function(converter, el) {
    return converter.matchElement(el, converter);
  };

  this._createElement = function(tagName) {
    return this._el.createElement(tagName);
  };

  /**
    Wraps the remaining (inline) elements of a node iterator into a default
    block node.

    @private
    @param {model/DOMImporter.ChildIterator} childIterator
    @returns {model/DocumentNode}
   */
  this._wrapInlineElementsIntoBlockElement = function(childIterator) {
    var wrapper = this._createElement('div');
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
        throw new Error('Contract: DOMImporter.defaultConverter() must return a node with type.');
      }
      this._createAndShow(node);
    }
    return node;
  };

  /**
    Converts an element into a default block level node.

    @private
    @param {ui/DOMElement} el
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
    if (state.preserveWhitespace) {
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
    // this happens if somebody treats the text more like it would be done in Markdown
    // i.e. introducing line-breaks
    if (this.config.REMOVE_INNER_WS || state.removeInnerWhitespace) {
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
  this._trimTextContent = function(el) {
    var nodes = el.getChildNodes();
    var firstNode = nodes[0];
    var lastNode = last(nodes);
    var text, trimmed;
      // trim the first and last text
    if (firstNode && firstNode.isTextNode()) {
      text = firstNode.textContent;
      trimmed = this._trimLeft(text);
      firstNode.textContent = trimmed;
    }
    if (lastNode && lastNode.isTextNode()) {
      text = lastNode.textContent;
      trimmed = this._trimRight(text);
      lastNode.textContent = trimmed;
    }
    return el;
  };

  this._trimLeft = function(text) {
    return text.replace(WS_LEFT, "");
  };

  this._trimRight = function(text) {
    return text.replace(WS_RIGHT, "");
  };

};
oo.initClass(DOMImporter);

DOMImporter.State = function() {
  this.reset();
};

DOMImporter.State.Prototype = function() {

  this.reset = function() {
    this.preserveWhitespace = false;
    this.nodes = [];
    this.inlineNodes = [];
    this.containerId = null;
    this.container = [];
    this.ids = {};
    // stack for reentrant calls into _convertElement()
    this.contexts = [];
    // stack for reentrant calls into _annotatedText()
    this.stack = [];
    this.lastChar = "";
    this.skipTypes = {};
    this.ignoreAnnotations = false;

    // experimental: trying to generate simpler ids during import
    // this.uuid = uuid;
    this.uuid = createCountingIdGenerator();
  };

  this.pushContext = function(tagName, converter) {
    this.contexts.push({ tagName: tagName, converter: converter});
  };

  this.popContext = function() {
    return this.contexts.pop();
  };

  this.getCurrentContext = function() {
    return last(this.contexts);
  };

};

oo.initClass(DOMImporter.State);

module.exports = DOMImporter;
