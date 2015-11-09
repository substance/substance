'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var SourceLink = require('./SourceLinkComponent');

function HeadingComponent() {
  Component.apply(this, arguments);
}

HeadingComponent.Prototype = function() {
  this.render = function() {
    var node = this.props.node;
    var namespace = node.namespace;
    var name = node.name;
    var type = node.type;
    var el = $$('div').addClass('sc-heading');
    var headerEl = $$('div').addClass('se-header');

    // namespace
    headerEl.append(
      $$('span').addClass('se-namespace').append(namespace.split('/').join(' / ') + ' / ')
    );
    // name
    headerEl.append(
      $$('span').addClass('se-name').append(this.props.name || name)
    );
    // type
    if (type) {
      headerEl.append(
        $$('div').addClass('se-node-type').addClass(type).append(type)
      );
    }

    var sourceEl = $$('div').addClass('se-source').append(
      $$('strong').append(this.i18n.t(type)),
      $$('span').append(' ' + this.i18n.t('defined_in') + ' '),
      $$(SourceLink, {node: node})
    );

    el.append(headerEl, sourceEl);

    return el;
  };
};

oo.inherit(HeadingComponent, Component);

module.exports = HeadingComponent;
