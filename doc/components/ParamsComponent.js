'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function ParamsComponent() {
  Component.apply(this, arguments);
}

ParamsComponent.Prototype = function() {
  this.render = function() {
    var el = $$('div').addClass('sc-params');
    var params = this.props.params;

    if (params.length > 0) {
      el.append($$('div').addClass('se-label').append(this.i18n.t('parameters')));
      params.forEach(function(param) {
        el.append(
          $$('div').addClass('se-param').append(
            $$('span').addClass('se-param-name').append(param.name),
            $$('span').addClass('se-param-type').append(param.type),
            $$('span').addClass('se-param-description').html(param.description)
          )
        );
      });
    }
    return el;
  };
};

oo.inherit(ParamsComponent, Component);
module.exports = ParamsComponent;
