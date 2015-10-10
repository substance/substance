'use strict';

var OO = require('../basics/oo');
var _ = require('../basics/helpers');
var Surface = require('./surface');
var Component = require('./component');
var LegacyFormEditor = require('./surface/form_editor');
var TextPropertyManager = require('../document/text_property_manager');
var $$ = Component.$$;

function FormEditor() {
  Surface.apply(this, arguments);
  
  this.editor = new LegacyFormEditor(this.props.containerId);
  this.textPropertyManager = new TextPropertyManager(this.props.doc);
}

FormEditor.Prototype = function() {

  this.dispose = function() {
    this.props.doc.disconnect(this);
  };

  this.render = function() {
    var doc = this.props.doc;
    var containerNode = doc.get(this.props.containerId);

    var el = $$("div")
      .addClass("container-node " + containerNode.id)
      .attr({
        spellCheck: false,
        "data-id": containerNode.id,
        "contenteditable": true
      });

    // node components
    _.each(containerNode.nodes, function(nodeId) {
      el.append(this._renderNode(nodeId));
    }, this);

    return el;
  };
};

OO.inherit(FormEditor, Surface);
module.exports = FormEditor;