'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function HeadingComponent() {
  Component.apply(this, arguments);
}

HeadingComponent.Prototype = function() {
  this.render = function() {
    var namespace = this.props.namespace;
    var name = this.props.name;
    var type = this.props.type;
    var el = $$('div').addClass('sc-heading');

    // namespace
    el.append(
      $$('span').addClass('se-namespace').append(namespace.split('/').join(' / ') + ' / ')
    );
    // name
    el.append(
      $$('span').addClass('se-name').append(name)
    );
    // type
    if (type) {
      el.append(
        $$('div').addClass('se-node-type').addClass(type).append(type)
      );
    }
    return el;
  };
};

oo.inherit(HeadingComponent, Component);

module.exports = HeadingComponent;
