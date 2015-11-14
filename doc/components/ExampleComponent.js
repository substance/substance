'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function ExampleComponent() {
  Component.apply(this, arguments);
}

ExampleComponent.Prototype = function() {
  this.render = function() {
    var node = this.props.node;
    var el = $$('div').addClass('sc-example').append(
      $$('div').addClass('se-heading').append(this.i18n.t('example'))
    );
    var body = $$('div').addClass('se-body');
    body.append($$('div').addClass('se-description').html(node.example));
    el.append(body);

    return el;
  };
};

oo.inherit(ExampleComponent, Component);

module.exports = ExampleComponent;
