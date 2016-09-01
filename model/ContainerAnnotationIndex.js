'use strict';

import isString from 'lodash/isString'
import map from 'lodash/map'
import filter from 'lodash/filter'
import TreeIndex from '../util/TreeIndex'
import DocumentIndex from './DocumentIndex'

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

export default ContainerAnnotationIndex;
