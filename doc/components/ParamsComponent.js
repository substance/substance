'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function ParamsComponent() {
  Component.apply(this, arguments);
}

ParamsComponent.Prototype = function() {
  this.render = function() {
    var params = this.props.params;

    var paramsEl = $$('div').addClass('sc-params');
    paramsEl.append($$('div').addClass('se-label').append('Parameters'));
    params.forEach(function(param) {

      paramsEl.append(
        $$('div').addClass('se-param').append(
          $$('span').addClass('se-param-name').append(param.name),
          $$('span').addClass('se-param-type').append(param.type),
          $$('span').addClass('se-param-description').html(param.description)
        )
      );
    });
    return paramsEl;
  };
};

oo.inherit(ParamsComponent, Component);
module.exports = ParamsComponent;
