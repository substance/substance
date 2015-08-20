var Substance = require('../basics');
var _ = Substance;

var inBrowser = (typeof window !== 'undefined');

function HtmlImporter( config ) {
  this.config = config || {};
  this.nodeTypesByName = {};
  this.nodeTypes = [];
  this.blockTypes = [];
  this.inlineTypes = [];
  // register converters defined in schema
  if (this.config.schema) {
    this.config.schema.each(function(NodeClass) {
      this.defineNodeImporter(NodeClass);
    }, this);
  }
  this.$ = global.$;
}

HtmlImporter.Prototype = function HtmlImporterPrototype() {

  this.defineNodeImporter = function(NodeClass) {
    // ATM Node.matchElement is required
    if (!NodeClass.static.matchElement) {
      return;
    }
    this.nodeTypes.push(NodeClass);
    this.nodeTypesByName[NodeClass.static.name] = NodeClass;
    if (NodeClass.static.blockType) {
      this.blockTypes.push(NodeClass);
    } else if (NodeClass.static.isInline){
      this.inlineTypes.push(NodeClass);
    }
  };

  this.defaultConverter = function($el, converter) {
    /* jshint unused:false */
    console.warn('This element is not handled by the converters you provided. This is the default implementation which just skips conversion. Override HtmlImporter.defaultConverter(el, converter) to change this behavior.', this.$toStr($el));
    var defaultTextType = this.state.doc.getSchema().getDefaultTextType();
    var DefaultBlockTextClass = this.nodeTypesByName[defaultTextType];
    if (!DefaultBlockTextClass) {
      throw new Error('Could not class for default text type', defaultTextType);
    }
    var node = DefaultBlockTextClass.static.fromHtml($el, converter);
    if (node) {
      node.type = defaultTextType;
    }
    return node;
  };

  this.initialize = function(doc, $root) {
    var state = {
      doc: doc,
      $root: $root,
      inlineNodes: [],
      trimWhitespaces: !!this.config.trimWhitespaces,
      // stack of contexts to handle reentrant calls
      stack: [],
      lastChar: "",
      skipTypes: {},
      ignoreAnnotations: false,
    };
    this.state = state;
  };

  this.convert = function($root, doc) {
    /* jshint unused:false */
    throw new Error('This method is abstract.');

    /* Example:

    this.initialize(doc, $root);
    var $body = $root.find('body');
    this.convertContainer($body, 'body');
    this.finish();

    */
  };

  // convert a container with block level elements and show
  // the result in the container node with given id
  this.convertContainer = function($containerEl, containerId) {
    var state = this.state;
    var doc = state.doc;
    var containerNode = doc.get(containerId);
    state.containerNode = containerNode;
    var childIterator = new HtmlImporter.ChildNodeIterator($containerEl[0]);
    while(childIterator.hasNext()) {
      var el = childIterator.next();
      var $el = this.$(el);
      var blockType = this._getBlockTypeForElement($el);
      var node;
      if (blockType) {
        node = blockType.static.fromHtml($el, this);
        if (!node) {
          throw new Error("Contract: a Node's fromHtml() method must return a node", this.$toStr($el));
        } else {
          node.type = blockType.static.name;
          node.id = node.id || $el.attr('id') || Substance.uuid(node.type);
          doc.create(node);
          containerNode.show(node.id);
        }
      } else {
        if (this.isCommentNode(el)) {
          // skip comment nodes on block level
        } else if (this.isTextNode(el)) {
          var text = $el.text();
          if (/^\s*$/.exec(text)) continue;
          // If we find text nodes on the block level we wrap
          // it into a paragraph element (or what is configured as default block level element)
          childIterator.back();
          this.wrapInlineElementsIntoBlockElement(childIterator);
        } else if (this.isElementNode(el)) {
          var inlineType = this._getInlineTypeForElement($el);
          // NOTE: hard to tell if unsupported nodes on this level
          // should be treated as inline or not.
          // ATM we only support spans as entry to the catch-all implementation
          // that collects inline elements and wraps into a paragraph.
          // TODO: maybe this should be the default?
          if (inlineType || this.getTagName(el) === "span") {
            childIterator.back();
            this.wrapInlineElementsIntoBlockElement(childIterator);
          } else {
            this.createDefaultBlockElement($el);
          }
        }
      }
    }
  };

  this.finish = function() {
    var doc = this.state.doc;
    // create annotations afterwards so that the targeted nodes
    // exist for sure
    for (var i = 0; i < this.state.inlineNodes.length; i++) {
      doc.create(this.state.inlineNodes[i]);
    }
  };

  this.convertProperty = function(doc, path, html) {
    var $el = this.$('<div>').html(html);
    this.initialize(doc, $el);
    var text = this.annotatedText($el, path);
    doc.setText(path, text, this.state.inlineNodes);
  };

  this.convertElement = function($el, data) {
    var doc = this.state.doc;
    var nodeType = this._getNodeTypeForElement($el);
    if (!nodeType) {
      throw new Error("Could not find a node class associated to element:" + this.$toStr($el));
    }
    var node = nodeType.static.fromHtml($el, this);
    node.type = nodeType.static.name;
    node.id = node.id || this.defaultId($el, node.type);
    _.extend(node, data);
    return doc.create(node);
  };

  this.getDocument = function() {
    return this.state.doc;
  };

  this.getTagName = function(el) {
    if (!el.tagName) {
      return "";
    } else {
      return el.tagName.toLowerCase();
    }
  };

  this.isTextNode = function(el) {
    if (inBrowser) {
      return (el.nodeType === window.Node.TEXT_NODE);
    } else {
      // cheerio text node
      return el.type === "text";
    }
  };

  this.isElementNode = function(el) {
    if (inBrowser) {
      return (el.nodeType === window.Node.ELEMENT_NODE);
    } else {
      return el.type === "tag";
    }
  };

  this.isCommentNode = function(el) {
    if (inBrowser) {
      return (el.nodeType === window.Node.COMMENT_NODE);
    } else {
      return el.type === "comment";
    }
  };

  this.wrapInlineElementsIntoBlockElement = function(childIterator) {
    var state = this.state;
    var doc = state.doc;
    var containerNode = state.containerNode;
    var $wrapper = this.$('<div>');
    while(childIterator.hasNext()) {
      var el = childIterator.next();
      var $el = this.$(el);
      var blockType = this._getBlockTypeForElement($el);
      if (blockType) {
        childIterator.back();
        break;
      }
      $wrapper.append($el.clone());
    }
    var node = this.defaultConverter($wrapper, this);
    if (node) {
      if (!node.type) {
        throw new Error('Contract: Html.defaultConverter() must return a node with type.');
      }
      node.id = node.id || this.nextId(node.type);
      doc.create(node);
      containerNode.show(node.id);
    }
  };

  this.createDefaultBlockElement = function($el) {
    var state = this.state;
    var doc = state.doc;
    var containerNode = state.containerNode;
    var node = this.defaultConverter($el, this);
    if (node) {
      if (!node.type) {
        throw new Error('Contract: Html.defaultConverter() must return a node with type.', this.$toStr($el));
      }
      node.id = node.id || this.defaultId($el, node.type);
      doc.create(node);
      containerNode.show(node.id);
    }
  };

  /**
   * Parse annotated text
   *
   * Make sure you call this method only for elements where `this.isParagraphish(elements) === true`
   */
  this.annotatedText = function($el, path) {
    var state = this.state;
    if (path) {
      if (state.stack.length>0) {
        throw new Error('Contract: it is not allowed to bind a new call annotatedText to a path while the previous has not been completed.', this.$toStr($el));
      }
      state.stack = [{ path: path, offset: 0, text: ""}];
    } else {
      if (state.stack.length===0) {
        throw new Error("Contract: HtmlImporter.annotatedText() requires 'path' for non-reentrant call.", this.$toStr($el));
      }
    }
    var iterator = new HtmlImporter.ChildNodeIterator($el[0]);
    var text = this._annotatedText(iterator);
    if (path) {
      state.stack.pop();
    }
    return text;
  };

  this.plainText = function($el) {
    var state = this.state;
    var text = $el.text();
    if (state.stack.length > 0) {
      var context = _.last(state.stack);
      context.offset += text.length;
      context.text += context.text.concat(text);
    }
    return text;
  };

  this.customText = function(text) {
    var state = this.state;
    if (state.stack.length > 0) {
      var context = _.last(state.stack);
      context.offset += text.length;
      context.text += context.text.concat(text);
    }
    return text;
  };

  this.nextId = function(prefix) {
    // TODO: we could create more beautiful ids?
    // however we would need to be careful as there might be another
    // element in the HTML coming with that id
    // For now we use shas
    return Substance.uuid(prefix);
  };

  // TODO: maybe we want to capture warnings and errors in future
  this.warning = function(msg) {
    console.warn('[HtmlImporter] ' + msg);
  };

  this.error = function(msg) {
    console.error('[HtmlImporter] ' + msg);
  };

  this.defaultId = function($el, type) {
    var id = $el.attr('id') || this.nextId(type);
    while (this.state.doc.get(id)) {
      id = this.nextId(type)
    }
    // TODO: check for collisions
    return id;
  };

  // Internal function for parsing annotated text
  // --------------------------------------------
  //
  this._annotatedText = function(iterator) {
    var state = this.state;
    var context = _.last(state.stack);
    if (!context) {
      throw new Error('Illegal state: context is null.');
    }
    while(iterator.hasNext()) {
      var el = iterator.next();
      var $el = this.$(el);
      var text = "";
      // Plain text nodes...
      if (this.isTextNode(el)) {
        text = this._prepareText(state, $el.text());
        if (text.length) {
          // Note: text is not merged into the reentrant state
          // so that we are able to return for this reentrant call
          context.text = context.text.concat(text);
          context.offset += text.length;
        }
      } else if (this.isCommentNode(el)) {
        // skip comment nodes
        continue;
      } else if (this.isElementNode(el)) {
        var inlineType = this._getInlineTypeForElement($el);
        if (!inlineType) {
          var blockType = this._getInlineTypeForElement($el);
          if (blockType) {
            throw new Error('Expected inline element. Found block element:', this.$toStr($el));
          }
          console.warn('Unsupported inline element. We will not create an annotation for it, but process its children to extract annotated text.', this.$toStr($el));
          // Note: this will store the result into the current context
          this.annotatedText($el);
          continue;
        }
        // reentrant: we delegate the conversion to the inline node class
        // it will either call us back (this.annotatedText) or give us a finished
        // node instantly (self-managed)
        var startOffset = context.offset;
        var inlineNode;
        if (inlineType.static.fromHtml) {
          // push a new context so we can deal with reentrant calls
          state.stack.push({ path: context.path, offset: startOffset, text: ""});
          inlineNode = inlineType.static.fromHtml($el, this);
          if (!inlineNode) {
            throw new Error("Contract: a Node's fromHtml() method must return a node", this.$toStr($el));
          }
          // external nodes are attached to an invisible character
          if (inlineType.static.external) {
            this.customText("\u200B");
          }
          // ... and transfer the result into the current context
          var result = state.stack.pop();
          context.offset = result.offset;
          context.text = context.text.concat(result.text);
        } else {
          inlineNode = {};
          this.annotatedText($el);
        }
        // in the mean time the offset will probably have changed to reentrant calls
        var endOffset = context.offset;
        inlineNode.type = inlineType.static.name;
        inlineNode.id = inlineType.id || this.nextId(inlineNode.type);
        inlineNode.startOffset = startOffset;
        inlineNode.endOffset = endOffset;
        inlineNode.path = context.path.slice(0);
        state.inlineNodes.push(inlineNode);
      } else {
        console.warn('Unknown element type. Taking plain text.', this.$toStr($el));
        text = this._prepareText(state, $el.text());
        context.text = context.text.concat(text);
        context.offset += text.length;
      }
    }
    // return the plain text collected during this reentrant call
    return context.text;
  };

  this._getBlockTypeForElement = function($el) {
    // HACK: tagName does not exist for prmitive nodes such as DOM TextNode.
    if (!$el[0].tagName) return null;
    for (var i = 0; i < this.blockTypes.length; i++) {
      if (this.blockTypes[i].static.matchElement($el)) {
        return this.blockTypes[i];
      }
    }
  };

  this._getInlineTypeForElement = function($el) {
    for (var i = 0; i < this.inlineTypes.length; i++) {
      if (this.inlineTypes[i].static.matchElement($el)) {
        return this.inlineTypes[i];
      }
    }
  };

  this._getNodeTypeForElement = function($el) {
    for (var i = 0; i < this.nodeTypes.length; i++) {
      if (this.nodeTypes[i].static.matchElement($el)) {
        return this.nodeTypes[i];
      }
    }
  };

  this._getDomNodeType = function(el) {
    if (this.isTextNode(el)) {
      return "text";
    } else if (this.isCommentNode(el)) {
      return "comment";
    } else if (el.tagName) {
      return el.tagName.toLowerCase();
    } else {
      throw new Error("Unknown node type");
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

  this._prepareText = function(state, text) {
    if (!state.trimWhitespaces) {
      return text;
    }
    // EXPERIMENTAL: drop all 'formatting' white-spaces (e.g., tabs and new lines)
    // (instead of doing so only at the left and right end)
    //text = text.replace(ALL_WS_NOTSPACE_LEFT, "");
    //text = text.replace(ALL_WS_NOTSPACE_RIGHT, "");
    text = text.replace(TABS_OR_NL, SPACE);
    if (state.lastChar === SPACE) {
      text = text.replace(WS_LEFT_ALL, SPACE);
    } else {
      text = text.replace(WS_LEFT, SPACE);
    }
    text = text.replace(WS_RIGHT, SPACE);
    // EXPERIMENTAL: also remove white-space within
    if (this.config.REMOVE_INNER_WS) {
      text = text.replace(WS_ALL, SPACE);
    }
    state.lastChar = text[text.length-1] || state.lastChar;
    return text;
  };

  // for error messages
  this.$toStr = function($el) {
    var $clone = $el.clone();
    $clone.empty();
    return $('<p>').append($clone).html();
  };

};
HtmlImporter.prototype = new HtmlImporter.Prototype();

HtmlImporter.ChildNodeIterator = function(arg) {
  this.nodes = arg.childNodes;
  this.length = this.nodes.length;
  this.pos = -1;
};

HtmlImporter.ChildNodeIterator.Prototype = function() {
  this.hasNext = function() {
    return this.pos < this.length - 1;
  };
  this.next = function() {
    this.pos += 1;
    return this.nodes[this.pos];
  };
  this.back = function() {
    if (this.pos >= 0) {
      this.pos -= 1;
    }
    return this;
  };
};
HtmlImporter.ChildNodeIterator.prototype = new HtmlImporter.ChildNodeIterator.Prototype();

module.exports = HtmlImporter;
