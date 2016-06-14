'use strict';

var Component = require('../../ui/Component');

function ExampleComponent() {
  ExampleComponent.super.apply(this, arguments);
}

ExampleComponent.Prototype = function() {

  this.render = function($$) {
    var node = this.props.node;
    var el = $$('div').addClass('sc-example').append(
      $$('div').addClass('se-heading').append(this.getLabel('example'))
    );
    var body = $$('div').addClass('se-body');
    body.append($$('div').addClass('se-description').html(node.example));
    el.append(body);

    return el;
  };

};

Component.extend(ExampleComponent);

module.exports = ExampleComponent;
