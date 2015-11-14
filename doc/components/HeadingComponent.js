'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var SourceLink = require('./SourceLinkComponent');
var CrossLink = require('./CrossLinkComponent');

function HeadingComponent() {
  Component.apply(this, arguments);
}

HeadingComponent.Prototype = function() {
  this.onClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.send('focusNode', this.props.node.id);
  };

  this.render = function() {
    var node = this.props.node;

    var name = node.name;
    var type = node.type;
    var el = $$('div').addClass('sc-heading');
    var headerEl = $$('a').attr({href: '#'}).addClass('se-header')
        .on('click', this.onClick);

    // namespace
    var parent = node.getParent();
    var namespace = "";
    if (parent) {
      namespace = parent.id.replace('/', ' / ');
      if (parent.type === 'namespace') {
        namespace += " / ";
      } else {
        namespace += " . ";
      }
    }
    headerEl.append(
      $$('span').addClass('se-namespace').append(namespace)
    );
    // name
    headerEl.append(
      $$('span').addClass('se-name').append(this.props.name || name)
    );

    // details: a line saying something like Class defined in '...', extends '...'
    var details = $$('div').addClass('se-details').addClass(type);
    var detailsLabel = $$('strong').addClass('se-type');
    if (node.isAbstract) {
      detailsLabel.append('Abstract ');
    }
    detailsLabel.append(this.i18n.t(type));
    details.append(detailsLabel);

    details.append(
      $$('span').addClass('se-source').append(
        $$('span').append(' ' + this.i18n.t('defined_in') + ' '),
        $$(SourceLink, {node: node})
      )
    );
    if (node.type === "class" && node.superClass) {
      details.append(
        $$('span').addClass('se-extends').append(
          $$('span').append(' ' + this.i18n.t('extends') + ' '),
          $$(CrossLink, {nodeId: node.superClass})
        )
      );
    }
    el.append(headerEl, details);

    return el;
  };
};

oo.inherit(HeadingComponent, Component);

module.exports = HeadingComponent;
