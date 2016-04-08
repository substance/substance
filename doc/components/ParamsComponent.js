'use strict';

var Component = require('../../ui/Component');
var CrossLink = require('./CrossLinkComponent');

function ParamsComponent() {
  ParamsComponent.super.apply(this, arguments);
}

ParamsComponent.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass('sc-params');
    var params = this.props.params;
    var returns = this.props.returns;

    if (params.length > 0) {
      el.append($$('div').addClass('se-label').append(this.i18n.t(this.props.label || 'parameters')));

      var paramsTable = $$('table').addClass('se-params-table');
      params.forEach(function(param) {
        paramsTable.append(
          $$('tr').addClass('se-param').append(
            $$('td').addClass('se-param-name').append(param.name),
            $$('td').addClass('se-param-type').append($$(CrossLink, {nodeId: param.type}).append(param.shortType)),
            $$('td').addClass('se-param-description').html(param.description)
          )
        );
      });
      el.append(paramsTable);
    }
    if (returns) {
      el.append($$('div').addClass('se-returns se-label').append(this.i18n.t('returns')));
      el.append(
        $$('table').addClass('se-params-table').append(
          $$('tr').addClass('se-param').append(
            $$('td').addClass('se-param-type').append($$(CrossLink, {nodeId: returns.type})),
            $$('td').addClass('se-param-description').html(returns.description)
          )
        )
      );
    }
    return el;
  };
};

Component.extend(ParamsComponent);

module.exports = ParamsComponent;
