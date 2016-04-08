'use strict';

var pluck = require('../../util/pluck');
var Component = require('../../ui/Component');
var Documentation = require('../model/Documentation');
var SourceLink = require('./SourceLinkComponent');

function SignatureComponent() {
  SignatureComponent.super.apply(this, arguments);
}

SignatureComponent.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass('sc-signature');
    var node = this.props.node;
    var params = node.params;

    var info = Documentation.getNodeInfo(node);
    var visibility = node.isPrivate ? 'private ' : '';
    var args = pluck(params, 'name').join(', ');

    el.append(
      $$('a').addClass('se-declaration')
        .attr({href: '#'})
        .on('click', this.onClick)
        .append($$('span').addClass('se-visibility').append(visibility))
        .append($$('span').addClass('se-storage').append(info.storage))
        .append($$('span').addClass('se-name').append(node.name))
        .append('(')
        .append($$('span').addClass('se-arguments').append(args))
        .append(')'),
      $$('div').addClass('se-source').append(
        $$('strong').append(info.typeDescr),
        $$('span').append(' defined in '),
        $$(SourceLink, {node: node})
      )
    );

    // param description
    // if (node.params.length > 0 || node.returns) {
    //   el.append($$(Params, {params: node.params, returns: node.returns}));
    // }

    // // if given a message indicating that this method has been inherited
    // if (this.props.inheritedFrom) {
    //   el.append(
    //     $$('div').addClass('se-inherited-from')
    //     .append(
    //       $$('span').addClass('se-label').append(this.i18n.t('inherited-from')),
    //       $$('a').addClass('se-parent-class')
    //         .attr('href','#'+this.props.inheritedFrom)
    //         .append(this.props.inheritedFrom)
    //     )
    //   );
    // }
    return el;
  };

  this.onClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.send('focusNode', this.props.node.id);
  };

};

Component.extend(SignatureComponent);

module.exports = SignatureComponent;
