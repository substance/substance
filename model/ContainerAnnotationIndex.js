'use strict';

var isString = require('lodash/isString');
var map = require('lodash/map');
var filter = require('lodash/filter');
var TreeIndex = require('../util/TreeIndex');
var DocumentIndex = require('./DocumentIndex');

function ContainerAnnotationIndex() {
  this.byId = new TreeIndex();
}

ContainerAnnotationIndex.Prototype = function() {

  this.select = function(node) {
    return Boolean(node._isContainerAnnotation);
  };

  this.reset = function(data) {
    this.byId.clear();
    this._initialize(data);
  };

  this.get = function(containerId, type) {
    var annotations = map(this.byId.get(containerId));
    if (isString(type)) {
      annotations = filter(annotations, DocumentIndex.filterByType);
    }
    return annotations;
  };

  this.create = function(anno) {
    this.byId.set([anno.containerId, anno.id], anno);
  };

  this.delete = function(anno) {
    this.byId.delete([anno.containerId, anno.id]);
  };

  this.update = function(node, path, newValue, oldValue) { // eslint-disable-line
    // TODO should we support moving a container anno from one container to another?
  };

};

DocumentIndex.extend(ContainerAnnotationIndex);

module.exports = ContainerAnnotationIndex;
