'use strict';

var each = require('lodash/each');
var ContainerEditor = require('./ContainerEditor');

/**
  Represents a flow annotator that manages a sequence of nodes in a container. Needs to
  be instantiated within a ui/Controller context. Works like a {@link ui/ContainerEditor}
  but you can only annotate, not edit.

  @class ContainerAnnotator
  @component
  @extends ui/ContainerEditor

  @prop {String} name unique editor name
  @prop {String} containerId container id
  @prop {ui/SurfaceCommand[]} commands array of command classes to be available

  @example

  ```js
  $$(ContainerAnnotator, {
    name: 'bodySurface',
    containerId: 'main',
    doc: doc,
    commands: [ToggleStrong]
  })
  ```
 */

function ContainerAnnotator() {
  ContainerAnnotator.super.apply(this, arguments);
}

ContainerAnnotator.Prototype = function() {

  this.render = function($$) {
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
    each(containerNode.nodes, function(nodeId) {
      el.append(this._renderNode(nodeId));
    }.bind(this));

    return el;
  };

};

ContainerEditor.extend(ContainerAnnotator);

module.exports = ContainerAnnotator;