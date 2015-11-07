'use strict';

var oo = require('../util/oo');
var _ = require('../util/helpers');
var Component = require('./Component');
var ContainerEditor = require('./ContainerEditor');
var $$ = Component.$$;

/**
  Represents a flow annotator that manages a sequence of nodes in a container. Instantiate
  this class using `Component.$$` within the render method of a component. Needs to be
  instantiated within a {@link module:ui/Controller} context.

  @class
  @extends ui/ContainerEditor

  @example

  ```js
  var ContainerAnnotator = require('substance/ui/ContainerAnnotator');
  var Component = require('substance/ui/Component');
  var ToggleStrong = require('substance/packages/strong/ToggleStrong');

  var MyAnnotator = Component.extend({
    render: function() {
      var annotator = $$(ContainerAnnotator, {
      name: 'main',
      containerId: 'main',
      doc: doc,
      commands: [ToggleStrong]
      }).ref('annotator');
      return $$('div').addClass('my-annotator').append(annotator);
    }
  });
  ```
 */

function ContainerAnnotator() {
  ContainerEditor.apply(this, arguments);
}

ContainerAnnotator.Prototype = function() {

  this.render = function() {
    var doc = this.getDocument();
    var containerNode = doc.get(this.props.containerId);

    var el = $$("div")
      .addClass('surface container-node ' + containerNode.id)
      .attr({
        spellCheck: false,
        "data-id": containerNode.id,
        "contenteditable": false
      });

    // node components
    _.each(containerNode.nodes, function(nodeId) {
      el.append(this._renderNode(nodeId));
    }, this);

    return el;
  };

};

oo.inherit(ContainerAnnotator, ContainerEditor);
module.exports = ContainerAnnotator;