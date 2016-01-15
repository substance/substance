'use strict';

var last = require('lodash/array/last');
var map = require('lodash/collection/map');
var DocumentNode = require('./DocumentNode');
var ParentNodeMixin = require('./ParentNodeMixin');
var DocumentAddress = require('./DocumentAddress');

/**
  A Container represents a list of node ids in first place.
  At the same time it keeps a sequence of components which are the editable
  properties of the nodes within this container.
  While most editing occurs on a property level (such as editing text),
  other things happen on a node level, e.g., breaking or mergin nodes,
  or spanning annotations or so called ContainerAnnotations.
  A Container provides a bridge between those two worlds: nodes and properties.

  @class
  @prop {Array<id>} nodes

  @example

  A figure node might consist of a title, an image, and a caption.
  As the image is not editable via conventional editing, we can say, the figure consists of
  two editable properties 'title' and 'caption'.

  In our data model we can describe selections by a start coordinate and an end
  coordinate, such as
       start: { path: ['paragraph_1', 'content'],   offset: 10 } },
       end:   { path: ['figure_10',   'caption'],   offset: 5  } }

  I.e. such a selection starts in a component of a paragraph, and ends in the caption of a figure.
  If you want to use that selection for deleting, you need to derive somehow what exactly
  lies between those coordinates. For example, there could be some paragraphs, which would
  get deleted completely and the paragraph and the figure where the selection started and ended
  would only be updated.
*/
function Container() {
  Container.super.apply(this, arguments);
}

DocumentNode.extend(Container, ParentNodeMixin, function() {

  this.getChildrenProperty = function() {
    return 'nodes';
  };

  this.getPosition = function(nodeId) {
    var pos = this.nodes.indexOf(nodeId);
    return pos;
  };

  this.getLength = function() {
    return this.nodes.length;
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

  this.getAddress = function(path) {
    var doc = this.getDocument();
    var nodeId = path[0];
    var property = path[1];
    var node = doc.get(nodeId);
    if (!node) {
      throw new Error('Can not find node ' + nodeId);
    }
    var propIndex = node.getAddressablePropertyNames().indexOf(property);
    if (propIndex < 0) {
      throw new Error('Can not resolve index for property ' + property);
    }
    var address = new DocumentAddress().push(propIndex);
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
      // throw new Error('Can not resolve index of node ' + node.id);
      return null;
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
      if (!node) {
        throw new Error('Can not find node ' + nodeId);
      }
      nodes.push(node);
    }
    // nested nodes
    else {
      node = doc.get(nodeId);
      if (!node) {
        throw new Error('Can not find node ' + nodeId);
      }
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
    if (address.length === 0) {
      throw new Error('Illegal argument.');
    }
    if (address.length < 3) {
      var nodeId = this.nodes[address[0]];
      var doc = this.getDocument();
      return doc.get(nodeId);
    } else {
      return last(this._getNodeChain(address));
    }
  };

  this.getPathForAddress = function(address) {
    var node = this._getNodeForAddress(address);
    var properties = node.getAddressablePropertyNames();
    if (properties.length === 0) {
      return null;
    }
    var propertyName = properties[last(address)];
    if (!propertyName) {
      throw new Error('No property with index ' + last(address) + ' in node ' + JSON.stringify(node.toJSON()));
    }
    var path = [node.id, propertyName];
    return path;
  };

  this._getNextAddress = function(address) {
    var nodeId, node, properties;
    var doc = this.getDocument();
    // extra implementation for the most common case
    if (address.length === 2) {
      nodeId = this.nodes[address[0]];
      node = doc.get(nodeId);
      properties = node.getAddressablePropertyNames();
      if (properties.length > 1 && address[1] < properties.length - 1) {
        return new DocumentAddress().push(address[0], address[1] + 1);
      } else {
        if (address[0] < this.nodes.length-1) {
          nodeId = this.nodes[address[0]+1];
          node = doc.get(nodeId);
          if (node.hasAddressableProperties()) {
            return new DocumentAddress(address[0]+1).append(this._getFirstAddress(doc.get(nodeId)));
          } else {
            return new DocumentAddress(address[0]+1, -1);
          }
        } else {
          return null;
        }
      }
    }
    else {
      var nodes = this._getNodeChain(address);
      node = last(nodes);
      properties = node.getAddressablePropertyNames();
      var newAddress;
      if (properties.length > 1 && last(address) < properties.length-1) {
        // TODO: deal with nodes without addressable properties here
        newAddress = address.clone();
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
        // TODO: deal with nodes without addressable properties here
        var tail = this._getFirstAddress(sibling);
        newAddress = address.slice(0, i).push(nextIndex).append(tail);
        return newAddress;
      }
    }
  };

  this.getNextAddress = this._getNextAddress;

  this._getPreviousAddress = function(address) {
    var nodeId, node;
    var doc = this.getDocument();
    // extra implementation for the most common case
    if (address.length === 2) {
      if (address[1] > 0) {
        return new DocumentAddress().push(address[0], address[1]-1);
      } else if (address[0] > 0) {
        nodeId = this.nodes[address[0]-1];
        node = doc.get(nodeId);
        if (node.hasAddressableProperties()) {
          return new DocumentAddress(address[0]-1).append(this._getLastAddress(node));
        } else {
          return new DocumentAddress(address[0]-1, -1);
        }
      } else {
        return null;
      }
    }
    // TODO: implementation with hierarchical nodes involved
    else {
      var nodes = this._getNodeChain(address);
      node = last(nodes);
      var newAddress;
      if (last(address) > 0) {
        // TODO: deal with nodes without addressable properties here
        newAddress = address.clone();
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
        // TODO: deal with nodes without addressable properties here
        var tail = this._getLastAddress(sibling);
        newAddress = address.slice(0, i).push(prevIndex).append(tail);
        return newAddress;
      }
    }
  };

  this.getPreviousAddress = this._getPreviousAddress;

  // Note: this is internal as it does provide address partials
  // i.e., when called for nested nodes
  this._getFirstAddress = function(node) {
    if (!node.hasAddressableProperties()) {
      return null;
    }
    var address = new DocumentAddress();
    while (node.hasChildren()) {
      address.push(0);
      node = node.getChildAt(0);
    }
    // first property
    address.push(0);
    return address;
  };

  this._getLastAddress = function(node) {
    if (!node.hasAddressableProperties()) {
      return null;
    }
    var address = new DocumentAddress();
    while (node.hasChildren()) {
      var childIndex = node.getChildCount()-1;
      address.push(childIndex);
      node = node.getChildAt(childIndex);
    }
    // last property
    address.push(node.getAddressablePropertyNames().length-1);
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
    return new DocumentAddress().push(pos).append(this._getFirstAddress(topLevelNode));
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
    return new DocumentAddress().push(pos).append(this._getLastAddress(topLevelNode));
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
    if (!startAddress || !endAddress) {
      return [];
    }
    if (endAddress.isBefore(startAddress)) {
      var tmp = startAddress;
      startAddress = endAddress;
      endAddress = tmp;
    }
    var addresses = [startAddress];
    var address = startAddress;
    while (address.isBefore(endAddress)) {
      address = this._getNextAddress(address);
      addresses.push(address);
    }
    return addresses;
  };

  this.getPathRange = function(startPath, endPath) {
    // TODO: this implementation could be optimized
    var startAddress = this.getAddress(startPath);
    var endAddress = this.getAddress(endPath);
    var addresses = this.getAddressRange(startAddress, endAddress);
    return map(addresses, this.getPathForAddress, this);
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
    if (node.hasAddressableProperties()) {
      var pos = this.getChildIndex(node);
      var first = new DocumentAddress().push(pos).append(this._getFirstAddress(node));
      var last = new DocumentAddress().push(pos).append(this._getLastAddress(node));
      return this.getAddressRange(first, last);
    } else {
      return [];
    }
  };

  this.getPathsForNode = function(node) {
    var addresses = this.getAddressesForNode(node);
    return map(addresses, this.getPathForAddress, this);
  };

});

Container.static.name = "container";

Container.static.defineSchema({
  nodes: { type: ['id'], default: [] }
});

Object.defineProperty(Container.prototype, 'length', {
  get: function() {
    console.warn('DEPRECATED: want to get rid of unnecessary properties. Use this.getLength() instead.');
    return this.nodes.length;
  }
});

module.exports = Container;
