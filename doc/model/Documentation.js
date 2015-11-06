'use strict';

var oo = require('substance/util/oo');
var Document = require('substance/model/Document');
var Schema = require('substance/model/DocumentSchema');

var schema = new Schema("substance-documentation", "0.1.0");
schema.getDefaultTextType = function() {
  return "paragraph";
};

schema.addNodes([
  require('./ClassNode'),
  require('./MethodNode'),
  require('./FunctionNode'),
  require('./ObjectNode')
]);

var Documentation = function() {
  Document.call(this, schema);
  
  this.create({
    type: "container",
    id: "body",
    nodes: []
  });
};

Documentation.Prototype = function() {

};

oo.inherit(Documentation, Document);
Documentation.schema = schema;

module.exports = Documentation;
