'use strict';

var Component = require('../../ui/Component');
var $$ = Component.$$;

var Example = require('./ExampleComponent');
var SourceLink = require('./SourceLinkComponent');
var Documentation = require('../model/Documentation');

function PropertyComponent() {
  Component.apply(this, arguments);
}

PropertyComponent.Prototype = function() {

  this.render = function() {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-property')
      .attr("data-id", node.id);
    var info = Documentation.getNodeInfo(node);
    var visibility = node.isPrivate ? "private " : "";

    // declaration
    el.append(
      $$('div').addClass('se-declaration')
        .append($$('span').addClass('se-visibility').append(visibility))
        .append($$('span').addClass('se-storage').append(info.storage))
        .append($$('span').addClass('se-name').append(node.name))
    );
    el.append(
      $$('div').addClass('se-source').append(
        $$('strong').append('Property'),
        $$('span').append(' defined in '),
        $$(SourceLink, {node: node})
      )
    );

    // description
    el.append($$('div').addClass('se-description').html(node.description));
    // example
    if (node.example) {
      el.append($$(Example, {node: node}));
    }

    return el;
  };

};

Component.extend(PropertyComponent);
module.exports = PropertyComponent;
