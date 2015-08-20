'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;
var Data = require('../data');
var Annotation = require('./annotation');

// Annotation Index
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

var AnnotationIndex = function() {
  this.byPath = new PathAdapter();
  this.byType = new PathAdapter();
};

AnnotationIndex.Prototype = function() {

  this.property = "path";

  this.select = function(node) {
    return (node instanceof Annotation);
  };

  this.reset = function(data) {
    this.byPath.clear();
    this.byType.clear();
    this._initialize(data);
  };

  // TODO: use object interface? so we can combine filters (path and type)
  this.get = function(path, start, end, type) {
    var annotations = this.byPath.get(path) || {};
    if (Substance.isString(path) || path.length === 1) {
      // flatten annotations if this is called via node id
      var _annos = annotations;
      annotations = [];
      Substance.each(_annos, function(level) {
        annotations = annotations.concat(Substance.map(level, function(anno) {
          return anno;
        }));
      });
    } else {
      annotations = Substance.map(annotations, function(anno) {
        return anno;
      });
    }
    /* jshint eqnull:true */
    // null check for null or undefined
    if (start != null) {
      annotations = Substance.filter(annotations, AnnotationIndex.filterByRange(start, end));
    }
    if (type) {
      annotations = Substance.filter(annotations, AnnotationIndex.filterByType(type));
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

Substance.inherit(AnnotationIndex, Data.Index);

AnnotationIndex.filterByRange = function(start, end) {
  return function(anno) {
    var aStart = anno.startOffset;
    var aEnd = anno.endOffset;
    var overlap = (aEnd >= start);
    // Note: it is allowed to omit the end part
    /* jshint eqnull: true */
    if (end != null) {
      overlap = overlap && (aStart <= end);
    }
    /* jshint eqnull: false */
    return overlap;
  };
};

AnnotationIndex.filterByType = function(type) {
  return function(anno) {
    return anno.isInstanceOf(type);
  };
};

module.exports = AnnotationIndex;