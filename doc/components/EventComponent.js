'use strict';

var Component = require('../../ui/Component');

var Example = require('./ExampleComponent');
var Params = require('./ParamsComponent');
var SourceLink = require('./SourceLinkComponent');

function EventComponent() {
  EventComponent.super.apply(this, arguments);
}

EventComponent.Prototype = function() {

  this.render = function($$) {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-method')
      .attr("data-id", node.id);

    el.append(
      $$('div').addClass('sc-signature').append(
        $$('a').attr({href: '#'}).addClass('se-declaration')
          .on('click', this.onClick)
          .append($$('span').addClass('se-name').append(node.name)),
        $$('div').addClass('se-source').append(
          $$('strong').append(this.getLabel('event')),
          $$('span').append(' defined in '),
          $$(SourceLink, {node: node})
        )
      )
    );

    // the description
    el.append(
      $$('div').addClass('se-description').html(node.description)
    );
    // param description
    if (node.params.length > 0 || node.returns) {
      el.append($$(Params, {params: node.params, returns: node.returns}));
    }
    // example
    if (node.example) {
      el.append($$(Example, {node:node}));
    }

    return el;
  };

  this.onClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.send('focusNode', this.props.node.id);
  };

};

Component.extend(EventComponent);

module.exports = EventComponent;
