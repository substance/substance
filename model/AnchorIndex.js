'use strict';

var _ = require('../util/helpers');
var oo = require('../util/oo');
var PathAdapter = require('../util/PathAdapter');
var ContainerAnnotation = require('./ContainerAnnotation');
var NodeIndex = require('./data/NodeIndex');

var ContainerAnnotationAnchorIndex = function(doc) {
  this.doc = doc;
  this.byPath = new PathAdapter.Arrays();
  this.byId = {};
};

ContainerAnnotationAnchorIndex.Prototype = function() {
  this.select = function(node) {
    return (node instanceof ContainerAnnotation);
  };

  this.reset = function(data) {
    this.byPath.clear();
    this.byId = {};
    this._initialize(data);
  };

  this.get = function(path, containerName) {
    var anchors = this.byPath.get(path) || [];
    if (!_.isArray(anchors)) {
      var _anchors = [];
      this.byPath._traverse(anchors, [], function(path, anchors) {
        _anchors = _anchors.concat(anchors);
      });
      anchors = _anchors;
    }
    if (containerName) {
      return _.filter(anchors, function(anchor) {
        return (anchor.container === containerName);
      });
    } else {
      // return a copy of the array
      return anchors.slice(0);
    }
    return anchors;
  };

  this.create = function(containerAnno) {
    var startAnchor = containerAnno.getStartAnchor();
    var endAnchor = containerAnno.getEndAnchor();
    this.byPath.add(startAnchor.path, startAnchor);
    this.byPath.add(endAnchor.path, endAnchor);
    this.byId[containerAnno.id] = containerAnno;
  };

  this.delete = function(containerAnno) {
    var startAnchor = containerAnno.getStartAnchor();
    var endAnchor = containerAnno.getEndAnchor();
    this.byPath.remove(startAnchor.path, startAnchor);
    this.byPath.remove(endAnchor.path, endAnchor);
    delete this.byId[containerAnno.id];
  };

  this.update = function(node, path, newValue, oldValue) {
    if (this.select(node)) {
      var anchor = null;
      if (path[1] === 'startPath') {
        anchor = node.getStartAnchor();
      } else if (path[1] === 'endPath') {
        anchor = node.getEndAnchor();
      } else {
        return;
      }
      this.byPath.remove(oldValue, anchor);
      this.byPath.add(anchor.path, anchor);
    }
  };

};

oo.inherit(ContainerAnnotationAnchorIndex, NodeIndex);

module.exports = ContainerAnnotationAnchorIndex;
