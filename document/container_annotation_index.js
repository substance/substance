'use strict';

var _ = require('../basics/helpers');
var OO = require('../basics/oo');
var PathAdapter = require('../basics/path_adapter');
var Data = require('../data');
var ContainerAnnotation = require('./container_annotation');

// HACK: this is not the final version
var ContainerAnnotationIndex = function(doc) {
  this.doc = doc;
  this.indexes = {};
  this.containers = {};
  this.containerAnnotations = {};
};

ContainerAnnotationIndex.Prototype = function() {

  this.getFragments = function(path, containerName) {
    var index = this.indexes[containerName];
    if (index) {
      return index.get(path) || [];
    }
    return [];
  };

  this.getAllContainerAnnotations = function() {
    return this.containerAnnotations;
  };

  this.reset = function() {
    this.indexes = {};
    this._initialize(this.doc.data);
  };

  this._initialize = function(data) {
    _.each(data.getNodes(), function(node) {
      if (this.select(node)) {
        this.create(node, "isInitializing");
      }
    }, this);
    _.each(this.containers, function(container) {
      this.recompute(container.id);
    }, this);
  };

  this.select = function(node) {
    return (node.type === "container" || node.isInstanceOf(ContainerAnnotation.static.name));
  };

  this.create = function(node, isInitializing) {
    if (node.type === "container") {
      this.containers[node.id] = node;
      this.indexes[node.id] = new PathAdapter.Arrays();
    } else if (node.isInstanceOf(ContainerAnnotation.static.name)) {
      var containerId = node.container;
      this.containerAnnotations[node.id] = node;
      if (!isInitializing) {
        this.recompute(containerId);
      }
    }
  };

  this.recompute = function(containerId) {
    var index = this.indexes[containerId] = new PathAdapter.Arrays();
    _.each(this.containerAnnotations, function(anno) {
      var fragments = anno.getFragments();
      _.each(fragments, function(frag) {
        index.add(frag.path, frag);
      });
    });
  };

  this.onDocumentChange = function(change) {
    var needsUpdate = false;
    var dirtyContainers = {};
    var doc = this.doc;
    var schema = doc.getSchema();
    for (var i = 0; i < change.ops.length; i++) {
      var op = change.ops[i];
      if (op.isCreate() || op.isDelete()) {
        var nodeData = op.getValue();
        if (nodeData.type === "container") {
          dirtyContainers[nodeData.id] = true;
          if (op.isCreate()) {
            this.containers[nodeData.id] = doc.get(nodeData.id);
          } else {
            delete this.containers[nodeData.id];
          }
          needsUpdate = true;
        } else if (schema.isInstanceOf(nodeData.type, ContainerAnnotation.static.name)) {
          dirtyContainers[nodeData.container] = true;
          if (op.isCreate()) {
            this.containerAnnotations[nodeData.id] = doc.get(nodeData.id);
          } else {
            delete this.containerAnnotations[nodeData.id];
          }
          needsUpdate = true;
        }
      } else {
        var nodeId = op.path[0];
        // skip updates on nodes which have been deleted by this change
        if (change.deleted[nodeId]) {
          continue;
        }
        var node = doc.get(nodeId);
        if (node.type === "container") {
          dirtyContainers[node.id] = true;
          needsUpdate = true;
        } else if (node.isInstanceOf(ContainerAnnotation.static.name)) {
          dirtyContainers[node.container] = true;
          needsUpdate = true;
        }
      }
    }
    if (needsUpdate) {
      _.each(dirtyContainers, function(val, containerId) {
        this.recompute(containerId);
      }, this);
    }
  };

};

OO.inherit(ContainerAnnotationIndex, Data.Index);

module.exports = ContainerAnnotationIndex;

