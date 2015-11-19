'use strict';

var _ = require('../util/helpers');
var oo = require('../util/oo');
var DocumentNode = require('./DocumentNode');
var ParentNodeMixin = require('./ParentNodeMixin');
var Schema = require('./DocumentSchema');

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

Container.Prototype = function() {

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
    return _.last(this._getNodeChain(address));
  };

  this.getPathForAddress = function(address) {
    var node = this._getNodeForAddress(address);
    var properties = node.getAddressablePropertyNames();
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
      properties = node.getAddressablePropertyNames();
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
      properties = node.getAddressablePropertyNames();
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

};

oo.inherit(Container, DocumentNode);
oo.mixin(Container, ParentNodeMixin);

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
