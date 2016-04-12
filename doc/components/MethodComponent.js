'use strict';

var Component = require('../../ui/Component');

var Signature = require('./SignatureComponent');
var Example = require('./ExampleComponent');
var Params = require('./ParamsComponent');

function MethodComponent() {
  Component.apply(this, arguments);
}

MethodComponent.Prototype = function() {

  this.render = function($$) {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-method')
      .attr("data-id", node.id);

    // signature
    el.append($$(Signature, {node: node}));

    // the description
    el.append(
      $$('div').addClass('se-description').html(node.description)
    );

    // param description
    if (node.params.length > 0 || node.returns) {
      el.append($$(Params, {params: node.params, returns: node.returns}));
    }

    if (node.example) {
      el.append($$(Example, {node:node}));
    }

    return el;
  };

};

Component.extend(MethodComponent);

module.exports = MethodComponent;
