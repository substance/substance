'use strict';

var Component = require('../../ui/Component');
var ContainerEditor = require('../../ui/ContainerEditor');

function TestContainerComponent() {
  TestContainerComponent.super.apply(this, arguments);
}

TestContainerComponent.Prototype = function() {
  this.render = function($$) {
    var el = $$('div').addClass('sc-container');
    el.append(
      $$(ContainerEditor, {
        node: this.props.node
      }).ref('editor')
    );
    return el;
  };
};

Component.extend(TestContainerComponent);

TestContainerComponent.static.fullWidth = true;

module.exports = TestContainerComponent;
