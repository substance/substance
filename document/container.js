'use strict';

var _ = require('../basics/helpers');
var OO = require('../basics/oo');
var PathAdapter = require('../basics/path_adapter');
var Node = require('./node');
var ContainerAnnotation = require('./container_annotation');

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
  this.components = [];
  this.nodeComponents = {};
  this.byPath = new PathAdapter({});
}

Container.Prototype = function() {

  this.properties = {
    nodes: ["array", "string"]
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

  this.getComponents = function() {
    return this.components;
  };

  this.getComponent = function(path) {
    var comp = this.byPath.get(path);
    return comp;
  };

  this.getComponentsForRange = function(range) {
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
    return this.components[idx];
  };

  this.getFirstComponent = function() {
    return this.components[0];
  };

  this.getLastComponent = function() {
    return _.last(this.components);
  };

  this.getComponentsForNode = function(nodeId) {
    var nodeComponent = this.nodeComponents[nodeId];
    if (nodeComponent) {
      return nodeComponent.components.slice(0);
    }
  };

  this.getNodeForComponentPath = function(path) {
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
