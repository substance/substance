'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function HeadingComponent() {
  Component.apply(this, arguments);
}

HeadingComponent.Prototype = function() {
  this.render = function() {
    var namespace = this.props.node.namespace;
    var name = this.props.node.name;
    var type = this.props.node.type;
    var el = $$('div').addClass('sc-heading');
    var headerEl = $$('div').addClass('se-header');
    
    // namespace
    headerEl.append(
      $$('span').addClass('se-namespace').append(namespace.split('/').join(' / ') + ' / ')
    );
    // name
    headerEl.append(
      $$('span').addClass('se-name').append(name)
    );
    // type
    if (type) {
      headerEl.append(
        $$('div').addClass('se-node-type').addClass(type).append(type)
      );
    }

    var sourceEl = $$('div').addClass('se-source').append(
      $$('strong').append(type),
      $$('span').append(' defined in '),
      $$('a').attr({href: '#'}).append('model/Foo.js#41')
    );

    el.append(headerEl, sourceEl);

    return el;
  };
};

oo.inherit(HeadingComponent, Component);

module.exports = HeadingComponent;
