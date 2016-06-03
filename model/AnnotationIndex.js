'use strict';

var isString = require('lodash/isString');
var isNumber = require('lodash/isNumber');
var map = require('lodash/map');
var filter = require('lodash/filter');
var TreeIndex = require('../util/TreeIndex');
var DocumentIndex = require('./DocumentIndex');

// PropertyAnnotation Index
// ----------------
//
// Lets us look up existing annotations by path and type
//
// To get all annotations for the content of a text node
//
//    var aIndex = doc.annotationIndex;
//    aIndex.get(["text_1", "content"]);
//
// You can also scope for a specific range
//
//    aIndex.get(["text_1", "content"], 23, 45);

function AnnotationIndex() {
  this.byPath = new TreeIndex();
  this.byType = new TreeIndex();
}

AnnotationIndex.Prototype = function() {

  this.property = "path";

  this.select = function(node) {
    return Boolean(node._isPropertyAnnotation);
  };

  this.reset = function(data) {
    this.byPath.clear();
    this.byType.clear();
    this._initialize(data);
  };

  // TODO: use object interface? so we can combine filters (path and type)
  this.get = function(path, start, end, type) {
    var annotations;
    if (isString(path) || path.length === 1) {
      annotations = this.byPath.getAll(path) || {};
    } else {
      annotations = this.byPath.get(path);
    }
    annotations = map(annotations);
    if (isNumber(start)) {
      annotations = filter(annotations, AnnotationIndex.filterByRange(start, end));
    }
    if (type) {
      annotations = filter(annotations, AnnotationIndex.filterByType(type));
    }
    return annotations;
  };

  this.create = function(anno) {
    this.byType.set([anno.type, anno.id], anno);
    this.byPath.set(anno.path.concat([anno.id]), anno);
  };

  this.delete = function(anno) {
    this.byType.delete([anno.type, anno.id]);
    this.byPath.delete(anno.path.concat([anno.id]));
  };

  this.update = function(node, path, newValue, oldValue) {
    if (this.select(node) && path[1] === this.property) {
      this.delete({ id: node.id, type: node.type, path: oldValue });
      this.create(node);
    }
  };

};

DocumentIndex.extend(AnnotationIndex);

AnnotationIndex.filterByRange = function(start, end) {
  return function(anno) {
    var aStart = anno.startOffset;
    var aEnd = anno.endOffset;
    var overlap = (aEnd >= start);
    // Note: it is allowed to omit the end part
    if (isNumber(end)) {
      overlap = overlap && (aStart <= end);
    }
    return overlap;
  };
};

AnnotationIndex.filterByType = function(type) {
  return function(anno) {
    return anno.isInstanceOf(type);
  };
};

module.exports = AnnotationIndex;
