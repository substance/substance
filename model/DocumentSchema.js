'use strict';

var OO = require('../util/oo');
var Schema = require('./data/schema');
var Node = require('./DocumentNode');
var Annotation = require('./Annotation');
var Container = require('./Container');
var ContainerAnnotation = require('./ContainerAnnotation');

function DocumentSchema(name, version) {
  DocumentSchema.super.call(this, name, version);
}

DocumentSchema.Prototype = function() {

  this.getDefaultTextType = function() {
    throw new Error('DocumentSchema.getDefaultTextType() is abstract and must be overridden.');
  };

  this.isAnnotationType = function(type) {
    var nodeClass = this.getNodeClass(type);
    return (nodeClass && nodeClass.prototype instanceof Annotation);
  };

  this.getBuiltIns = function() {
    return [Node, Annotation, Container, ContainerAnnotation];
  };

};

OO.inherit(DocumentSchema, Schema);

module.exports = DocumentSchema;
