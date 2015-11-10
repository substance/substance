'use strict';

var oo = require('../util/oo');
var Schema = require('./data/Schema');
var Node = require('./DocumentNode');
var Annotation = require('./Annotation');
var Container = require('./Container');
var ContainerAnnotation = require('./ContainerAnnotation');

/**
  Used to define custom article formats. Predefined node types can be combined with custom ones.
  
  @class
  @param {String} name schema identifier
  @param {String} schema schema version
  
  @example

  ```js
  var Paragraph = require('substance/packages/paragraph/Paragraph');
  var Emphasis = require('substance/packages/emphasis/Emphasis');
  var Strong = require('substance/packages/emphasis/Strong');
  var Annotation = require('substance/ui/Annotation');

  var Comment = Annotation.extend({
    name: 'comment',
    properties: {
      content: 'string'
    }
  });

  var schema = new Document.Schema('my-article', '1.0.0');
  schema.getDefaultTextType = function() {
    return "paragraph";
  };
  schema.addNodes([Paragraph, Emphasis, Strong, Comment]);
  ```
*/

function DocumentSchema(name, version) {
  DocumentSchema.super.call(this, name, version);
}

DocumentSchema.Prototype = function() {

  /**
    Returns default text type. E.g. used when hitting ENTER in a text node, which
    produces a new node of the type returned here. Abstract method, which must be implemented.

    @abstract
    @return {String} default text type (e.g. 'paragraph')
  */

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

oo.inherit(DocumentSchema, Schema);

module.exports = DocumentSchema;
