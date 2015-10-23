'use strict';

var _ = require('../util/helpers');
var OO = require('../util/oo');
var PathAdapter = require('../util/PathAdapter');
var Node = require('./DocumentNode');
var ContainerAnnotation = require('./ContainerAnnotation');
var ParentNodeMixin = require('./ParentNodeMixin');

// Container
// --------
//
// A Container represents a list of node ids in first place.
// At the same time it keeps a sequence of components which are the editable
// properties of the nodes within this container.
// While most editing occurs on a property level (such as editing text),
// other things happen on a node level, e.g., breaking or mergin nodes,
// or spanning annotations or so called ContainerAnnotations.
// A Container provides a bridge between those two worlds: nodes and properties.
//
// Example:
// A figure node might consist of a title, an image, and a caption.
// As the image is not editable via conventional editing, we can say, the figure consists of
// two editable properties 'title' and 'caption'.
//
// In our data model we can describe selections by a start coordinate and an end
// coordinate, such as
//      start: { path: ['paragraph_1', 'content'],   offset: 10 } },
//      end:   { path: ['figure_10',   'caption'],   offset: 5  } }
// I.e. such a selection starts in a component of a paragraph, and ends in the caption of a figure.
// If you want to use that selection for deleting, you need to derive somehow what exactly
// lies between those coordinates. For example, there could be some paragraphs, which would
// get deleted completely and the paragraph and the figure where the selection started and ended
// would only be updated.
//
function Container() {
  Node.apply(this, arguments);

  // mixin
  ParentNodeMixin.call(this, 'nodes');

  this.components = [];
  this.nodeComponents = {};
  this.byPath = new PathAdapter({});
}

Container.Prototype = function() {

  _.extend(this, ParentNodeMixin.prototype);

  this.properties = {
    nodes: ["array", "id"]
  };

  this.didAttach = function() {
    this.reset();
  };

  this.getPosition = function(nodeId) {
    var pos = this.nodes.indexOf(nodeId);
    return pos;
  };

  this.show = function(nodeId, pos) {
    var doc = this.getDocument();
    // Note: checking with ==  is what we want here
    /* jshint eqnull: true */
    if (pos == null) {
      pos = this.nodes.length;
    }
    /* jshint eqnull: false */
    doc.update([this.id, 'nodes'], { insert: { offset: pos, value: nodeId } });
  };

  this.hide = function(nodeId) {
    var doc = this.getDocument();
    var pos = this.nodes.indexOf(nodeId);
    if (pos >= 0) {
      doc.update([this.id, 'nodes'], { delete: { offset: pos } });
    }
  };

  /**
    EXPERIMENTAL: numerical addressing
  */

  this.getAddress = function(path) {
    var doc = this.getDocument();
    var nodeId = path[0];
    var property = path[1];
    var node = doc.get(nodeId);
    var propIndex = node.getComponents().indexOf(property);
    if (propIndex < 0) {
      throw new Error('Can not resolve index for property ' + property);
    }
    var address = [propIndex];
    var parent, childIndex;
    while(node.hasParent()) {
      parent = node.getParent();
      childIndex = parent.getChildIndex(node);
      if (childIndex < 0) {
        throw new Error('Can not resolve index for child node ' + node.id + ' and parent ' + parent.id);
      }
      address.unshift(childIndex);
      node = parent;
    }
    var nodeIndex = this.getPosition(node.id);
    if (nodeIndex < 0) {
      throw new Error('Can not resolve index of node ' + node.id);
    }
    address.unshift(nodeIndex);
    return address;
  };

  this.getPath = function(address) {
    return this.getPathForAddress(address);
  };

  this._getNodeChain = function(address) {
    var doc = this.getDocument();
    if (address.length < 2) {
      throw new Error('Property addresses have a length of >= 2');
    }
    var nodes = [];
    var node;
    var nodeId = this.nodes[address[0]];
    // simple and structured nodes
    if (address.length === 2) {
      node = doc.get(nodeId);
      nodes.push(node);
    }
    // nested nodes
    else {
      node = doc.get(nodeId);
      nodes.push(node);
      for (var i = 1; node && i<address.length-1; i++) {
        node = node.getChildAt(address[i]);
        nodes.push(node);
      }
    }
    if (nodes.length === 0) {
      throw new Error('Could not resolve address: ' + address.toString());
    }
    return nodes;
  };

  this._getNodeForAddress = function(address) {
    return _.last(this._getNodeChain(address));
  };

  this.getPathForAddress = function(address) {
    var node = this._getNodeForAddress(address);
    var properties = node.getComponents();
    var propertyName = properties[_.last(address)];
    if (!propertyName) {
      throw new Error('No property with index ' + _.last(address) + ' in node ' + JSON.stringify(node.toJSON()));
    }
    var path = [node.id, propertyName];
    return path;
  };

  this.getNextAddress = function(address) {
    var nodeId, node, properties;
    var doc = this.getDocument();
    // extra implementation for the most common case
    if (address.length === 2) {
      nodeId = this.nodes[address[0]];
      node = doc.get(nodeId);
      properties = node.getComponents();
      if (properties.length > 1 && address[1] < properties.length - 1) {
        return [address[0], address[1] + 1];
      } else {
        if (address[0] < this.nodes.length-1) {
          nodeId = this.nodes[address[0]+1];
          return [address[0]+1].concat(this._getFirstAddress(doc.get(nodeId)));
        } else {
          return null;
        }
      }
    }
    else {
      var nodes = this._getNodeChain(address);
      node = _.last(nodes);
      properties = node.getComponents();
      var newAddress;
      if (properties.length > 1 && _.last(address) < properties.length-1) {
        newAddress = address.slice(0);
        newAddress[newAddress.length-1]++;
        return newAddress;
      } else {
        // find the first ancestor with a next sibling
        // and take the first, deepest child
        var parent, childIndex;
        nodes.unshift(this);
        for (var i = nodes.length-2; i >= 0; i--) {
          parent = nodes[i];
          childIndex = address[i];
          if (childIndex < parent.getChildCount()-1) {
            break;
          }
          node = parent;
        }
        if (i<0) {
          return null;
        }
        var nextIndex = childIndex+1;
        var sibling = parent.getChildAt(nextIndex);
        var tail = this._getFirstAddress(sibling);
        newAddress = address.slice(0, i).concat([nextIndex]).concat(tail);
        return newAddress;
      }
    }
  };

  this.getPreviousAddress = function(address) {
    var nodeId, node;
    var doc = this.getDocument();
    // extra implementation for the most common case
    if (address.length === 2) {
      if (address[1] > 0) {
        return [address[0], address[1]-1];
      } else if (address[0] > 0) {
        nodeId = this.nodes[address[0]-1];
        node = doc.get(nodeId);
        return [address[0]-1].concat(this._getLastAddress(node));
      } else {
        return null;
      }
    }
    // TODO: implementation with hierarchical nodes involved
    else {
      var nodes = this._getNodeChain(address);
      node = _.last(nodes);
      var newAddress;
      if (_.last(address) > 0) {
        newAddress = address.slice(0);
        newAddress[newAddress.length-1]--;
        return newAddress;
      } else {
        // find the first ancestor with a previous sibling
        // and take the first, deepest child
        nodes.unshift(this);
        for (var i = nodes.length-2; i >= 0; i--) {
          if (address[i] > 0) {
            break;
          }
        }
        if (i<0) {
          return null;
        }
        var parent = nodes[i];
        var prevIndex = address[i]-1;
        var sibling = parent.getChildAt(prevIndex);
        var tail = this._getLastAddress(sibling);
        newAddress = address.slice(0, i).concat([prevIndex]).concat(tail);
        return newAddress;
      }
    }
  };

  // Note: this is internal as it does provide address partials
  // i.e., when called for nested nodes
  this._getFirstAddress = function(node) {
    var address = [];
    while (node.hasChildren()) {
      address.push(0);
      node = node.getChildAt(0);
    }
    // first property
    address.push(0);
    return address;
  };

  this._getLastAddress = function(node) {
    var address = [];
    while (node.hasChildren()) {
      var childIndex = node.getChildCount()-1;
      address.push(childIndex);
      node = node.getChildAt(childIndex);
    }
    // last property
    address.push(node.getComponents().length-1);
    return address;
  };

  this.getFirstAddress = function(topLevelNode) {
    if (!topLevelNode) {
      topLevelNode = this.getChildAt(0);
    }
    var pos = this.getChildIndex(topLevelNode);
    if (pos < 0) {
      console.warn("Container.getLastAddress(): Illegal argument. Could not find node position.");
      return null;
    }
    return [pos].concat(this._getFirstAddress(topLevelNode));
  };

  this.getFirstPath = function(topLevelNode) {
    var address = this.getFirstAddress(topLevelNode);
    if (address) {
      return this.getPath(address);
    } else {
      return null;
    }
  };

  this.getLastAddress = function(topLevelNode) {
    if (!topLevelNode) {
      topLevelNode = this.getChildAt(this.length-1);
    }
    var pos = this.getChildIndex(topLevelNode);
    if (pos < 0) {
      console.warn("Container.getLastAddress(): Illegal argument. Could not find node position.");
      return null;
    }
    return [pos].concat(this._getLastAddress(topLevelNode));
  };

  this.getLastPath = function(topLevelNode) {
    var address = this.getLastAddress(topLevelNode);
    if (address) {
      return this.getPath(address);
    } else {
      return null;
    }
  };

  this.getAddressRange = function(startAddress, endAddress) {
    if (endAddress < startAddress) {
      var tmp = startAddress;
      startAddress = endAddress;
      endAddress = tmp;
    }
    var addresses = [startAddress];
    if (startAddress < endAddress) {
      var address = startAddress;
      while (address < endAddress) {
        address = this.getNextAddress(address);
        addresses.push(address);
      }
    }
    return addresses;
  };

  this.getPathRange = function(startPath, endPath) {
    // TODO: this implementation could be optimized
    var startAddress = this.getAddress(startPath);
    var endAddress = this.getAddress(endPath);
    var addresses = this.getAddressRange(startAddress, endAddress);
    return _.map(addresses, this.getPathForAddress, this);
  };

  this.getNextPath = function(path) {
    var address = this.getAddress(path);
    var nextAddress = this.getNextAddress(address);
    if (nextAddress) {
      return this.getPath(nextAddress);
    } else {
      return null;
    }
  };

  this.getPreviousPath = function(path) {
    var address = this.getAddress(path);
    var previousAddress = this.getPreviousAddress(address);
    if (previousAddress) {
      return this.getPath(previousAddress);
    } else {
      return null;
    }
  };

  this.getAddressesForNode = function(node) {
    var pos = this.getChildIndex(node);
    var first = [pos].concat(this._getFirstAddress(node));
    var last = [pos].concat(this._getLastAddress(node));
    return this.getAddressRange(first, last);
  };

  this.getPathsForNode = function(node) {
    var addresses = this.getAddressesForNode(node);
    return _.map(addresses, this.getPathForAddress, this);
  };

  /** END: numerical addressing */


  // THE API BELOW WILL BE REMOVED SOON

  this.getComponents = function() {
    console.error('DEPRECATED: this API will be removed.');
    return this.components;
  };

  this.getComponent = function(path) {
    console.error('DEPRECATED: this API will be removed.');
    var comp = this.byPath.get(path);
    return comp;
  };

  this.getComponentsForRange = function(range) {
    console.error('DEPRECATED: this API will be removed.');
    var comps = [];
    var startComp = this.byPath.get(range.start.path);
    var endComp = this.byPath.get(range.end.path);
    var startIdx = startComp.getIndex();
    var endIdx = endComp.getIndex();
    comps.push(startComp);
    for (var idx = startIdx+1; idx <= endIdx; idx++) {
      comps.push(this.getComponentAt(idx));
    }
    return comps;
  };

  this.getComponentAt = function(idx) {
    console.error('DEPRECATED: this API will be removed.');
    return this.components[idx];
  };

  this.getFirstComponent = function() {
    console.error('DEPRECATED: this API will be removed.');
    return this.components[0];
  };

  this.getLastComponent = function() {
    console.error('DEPRECATED: this API will be removed.');
    return _.last(this.components);
  };

  this.getComponentsForNode = function(nodeId) {
    console.error('DEPRECATED: this API will be removed.');
    var nodeComponent = this.nodeComponents[nodeId];
    if (nodeComponent) {
      return nodeComponent.components.slice(0);
    }
  };

  this.getNodeForComponentPath = function(path) {
    console.error('DEPRECATED: this API will be removed.');
    var comp = this.getComponent(path);
    if (!comp) return null;
    var nodeId = comp.rootId;
    return this.getDocument().get(nodeId);
  };

  this.getAnnotationFragments = function(containerAnnotation) {
    var fragments = [];
    var doc = containerAnnotation.getDocument();
    var anno = containerAnnotation;
    var startAnchor = anno.getStartAnchor();
    var endAnchor = anno.getEndAnchor();
    // if start and end anchors are on the same property, then there is only one fragment
    if (_.isEqual(startAnchor.path, endAnchor.path)) {
      fragments.push(new ContainerAnnotation.Fragment(anno, startAnchor.path, "property"));
    }
    // otherwise create a trailing fragment for the property of the start anchor,
    // full-spanning fragments for inner properties,
    // and one for the property containing the end anchor.
    else {
      var text = doc.get(startAnchor.path);
      var startComp = this.getComponent(startAnchor.path);
      var endComp = this.getComponent(endAnchor.path);
      if (!startComp || !endComp) {
        throw new Error('Could not find components of AbstractContainerAnnotation');
      }
      fragments.push(new ContainerAnnotation.Fragment(anno, startAnchor.path, "start"));
      for (var idx = startComp.idx + 1; idx < endComp.idx; idx++) {
        var comp = this.getComponentAt(idx);
        text = doc.get(comp.path);
        fragments.push(new ContainerAnnotation.Fragment(anno, comp.path, "inner"));
      }
      fragments.push(new ContainerAnnotation.Fragment(anno, endAnchor.path, "end"));
    }
    return fragments;
  };

  this.reset = function() {
    this.byPath = new PathAdapter();
    var doc = this.getDocument();
    var components = [];
    _.each(this.nodes, function(id) {
      var node = doc.get(id);
      components = components.concat(_getNodeComponents(node));
    }, this);
    this.components = [];
    this.nodeComponents = {};
    this._insertComponentsAt(0, components);
    this._updateComponentPositions(0);
  };

  // Incrementally updates the container based on a given operation.
  // Gets called by Substance.Document for every applied operation.
  this.update = function(op) {
    if (op.type === "create" || op.type === "delete") {
      return;
    }
    if (op.path[0] === this.id && op.path[1] === 'nodes') {
      if (op.type === 'set') {
        this.reset();
      } else {
        var diff = op.diff;
        if (diff.isInsert()) {
          var insertPos = this._handleInsert(diff.getValue(), diff.getOffset());
          this._updateComponentPositions(insertPos);
        } else if (diff.isDelete()) {
          var deletePos = this._handleDelete(diff.getValue());
          this._updateComponentPositions(deletePos);
        } else {
          throw new Error('Illegal state');
        }
      }
    }
    // HACK: this is for lists. We need to find a generalized way for hierarchical node types
    else if (op.type === 'update' && op.path[1] === 'items') {
      this.updateNode(op.path[0]);
    }
  };

  // TODO: nested structures such as tables and lists should
  // call this whenever they change
  this.updateNode = function(nodeId) {
    var node = this.getDocument().get(nodeId);
    var deletePos = this._handleDelete(nodeId);
    var components = _getNodeComponents(node);
    this._insertComponentsAt(deletePos, components);
    this._updateComponentPositions(deletePos);
  };

  this._insertComponentsAt = function(pos, components) {
    var before = this.components[pos-1];
    var after = this.components[pos];
    var nodeComponents = this.nodeComponents;
    var byPath = this.byPath;
    for (var i = 0; i < components.length; i++) {
      var comp = components[i];
      var nodeId = comp.rootId;
      var nodeComponent = nodeComponents[nodeId];
      if (!nodeComponent) {
        nodeComponent = new Container.NodeComponent(nodeId);
        nodeComponents[nodeId] = nodeComponent;
      }
      comp.parentNode = nodeComponent;
      if (i === 0 && before) {
        before.next = comp;
        comp.previous = before;
      } else if (i > 0) {
        comp.previous = components[i-1];
        components[i-1].next = comp;
      }
      nodeComponent.components.push(comp);
      byPath.set(comp.path, comp);
    }
    if (after) {
      components[components.length-1].next = after;
      after.previous = components[components.length-1];
    }
    this.components.splice.apply(this.components, [pos, 0].concat(components));
  };

  this._updateComponentPositions = function(startPos) {
    for (var i = startPos; i < this.components.length; i++) {
      this.components[i].idx = i;
    }
  };

  // if something has been inserted, we need to get the next id
  // and insert before its first component.
  this._handleInsert = function(nodeId, nodePos) {
    var doc = this.getDocument();
    var node = doc.get(nodeId);
    var length = this.nodes.length;
    var componentPos;
    // NOTE: the original length of the nodes was one less
    // Thus, we detect an 'append' situation by comparing the insertPosition with
    // the previous length
    if (nodePos === length-1) {
      componentPos = this.components.length;
    } else {
      var afterId = this.nodes[nodePos+1];
      var after = this.nodeComponents[afterId].components[0];
      componentPos = after.getIndex();
    }
    var components = _getNodeComponents(node);
    this._insertComponentsAt(componentPos, components);
    return componentPos;
  };

  this._handleDelete = function(nodeId) {
    var nodeComponent = this.nodeComponents[nodeId];
    var components = nodeComponent.components;
    var start = nodeComponent.components[0].getIndex();
    var end = _.last(components).getIndex();

    // remove the components from the tree
    for (var i = 0; i < components.length; i++) {
      var comp = components[i];
      this.byPath.delete(comp.path);
    }
    // and delete the nodeComponent
    delete this.nodeComponents[nodeId];

    this.components.splice(start, end-start+1);
    if (this.components.length > start) {
      this.components[start].previous = this.components[start-1];
    }
    if (start>0) {
      this.components[start-1].next = this.components[start];
    }
    return start;
  };

  var _getNodeComponents = function(node, rootNode) {
    rootNode = rootNode || node;
    var components = [];
    var componentNames = node.getComponents();
    var childNode;
    for (var i = 0; i < componentNames.length; i++) {
      var name = componentNames[i];
      var propertyType = node.getPropertyType(name);
      // text property
      if ( propertyType === "string" ) {
        var path = [node.id, name];
        components.push(new Container.Component(path, rootNode.id));
      }
      // child node
      else if (propertyType === "id") {
        var childId = node[name];
        childNode = node.getDocument().get(childId);
        components = components.concat(_getNodeComponents(childNode, rootNode));
      }
      // array of children
      else if (_.isEqual(propertyType, ['array', 'id'])) {
        var ids = node[name];
        for (var j = 0; j < ids.length; j++) {
          childNode = node.getDocument().get(ids[j]);
          components = components.concat(_getNodeComponents(childNode, rootNode));
        }
      } else {
        throw new Error('Not yet implemented.');
      }
    }
    return components;
  };
};

OO.inherit(Container, Node);

Container.static.name = "container";

Object.defineProperties(Container.prototype, {
  length: {
    get: function() {
      return this.nodes.length;
    },
    set: function() {
      throw new Error('container.length is read-only.');
    }
  }
});

Container.Component = function Component(path, rootId) {
  this.path = path;
  this.rootId = rootId;
  // computed dynamically
  this.idx = -1;
  this.parentNode = null;
  this.previous = null;
  this.next = null;
};

Container.Component.Prototype = function() {

  this.getPath = function() {
    return this.path;
  };

  this.hasPrevious = function() {
    return !!this.previous;
  };

  this.getPrevious = function() {
    return this.previous;
  };

  this.hasNext = function() {
    return !!this.next;
  };

  this.getNext = function() {
    return this.next;
  };

  this.getIndex = function() {
    return this.idx;
  };

  this.getParentNode = function() {
    return this.parentNode;
  };
};

OO.initClass(Container.Component);

Container.NodeComponent = function NodeComponent(id) {
  this.id = id;
  this.components = [];
};

OO.initClass(Container.NodeComponent);

module.exports = Container;
