'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var pluck = require('lodash/collection/pluck');


function ClassComponent() {
  Component.apply(this, arguments);
}

ClassComponent.Prototype = function() {

  this.renderSignature = function() {
    var paramSig = pluck(this.props.node.params, 'name').join(', ');
    var sig = ['new ', this.props.node.name, '(', paramSig, ')'];
    return $$('div').addClass('se-signature').append(
      $$('span').append(sig)
    );
  };

  this.renderParams = function() {
    var params = this.props.node.params;
    var paramsEl = $$('div').addClass('se-constructor-params');

    params.forEach(function(param) {
      paramsEl.append(
        $$('span').addClass('se-param-name').append(param.name),
        $$('span').addClass('se-param-type').append(param.type),
        $$('span').addClass('se-param-description').append(param.description)
      );
    });

    return paramsEl;
  };

  this.render = function() {
    // console.log('Class', this.props.node.name);
    // console.log('Class params', this.props.node.name);

    // Constructor params
    return $$('div')
      .addClass('sc-class')
      .attr("data-id", this.props.node.id)
      .append(
        $$('div').addClass('se-path').append(
          $$('span').addClass('se-ns').append(this.props.node.ns),
          $$('span').addClass('se-name').append(this.props.node.name)
        ),
        $$('div').addClass('se-description').html(this.props.node.description),
        this.renderSignature(),
        this.renderParams()
      );
  };
};

oo.inherit(ClassComponent, Component);

module.exports = ClassComponent;
