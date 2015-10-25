'use strict';

var $ = require('../util/jquery');
var _ = require('../util/helpers');
var oo = require('../util/oo');

var Component = require('./Component');
var $$ = Component.$$;
var Icon = require('./FontAwesomeIcon');

function ContextToggles() {
  Component.apply(this, arguments);
}

ContextToggles.Prototype = function() {

  this.render = function() {
    var panelOrder = this.props.panelOrder;
    var contextId = this.props.contextId;
    var componentRegistry = this.context.componentRegistry;

    var el = $$('div').addClass("sc-context-toggles");
    _.each(panelOrder, function(panelId) {
      // var panelClass = componentRegistry.get(panelId);
      var toggle = $$('a')
        .addClass("se-context-toggle")
        .attr({
          href: "#",
          "data-id": panelId,
        })
        .on('click', this.onContextToggleClick);
      if (panelId === contextId) {
        toggle.addClass("sm-active");
      }
      // toggle.append(
      //   $$(Icon, { icon: panelClass.icon })
      // );
      toggle.append(
        $$('span').addClass('label').append(' '+this.i18n.t(panelId))
      );
      el.append(toggle);
    }, this);
    return el;
  };

  this.onContextToggleClick = function(e) {
    e.preventDefault();
    var newContext = $(e.currentTarget).attr("data-id");
    this.send('switchContext', newContext);
  };
};

oo.inherit(ContextToggles, Component);

module.exports = ContextToggles;
