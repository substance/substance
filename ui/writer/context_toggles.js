'use strict';

var _ = require('../../basics/helpers');
var OO = require('../../basics/oo');

var Component = require('../component');
var $$ = Component.$$;
var Icon = require('../font_awesome_icon');

function ContextToggles() {
  Component.apply(this, arguments);
}

ContextToggles.Prototype = function() {

  this.render = function() {
    var panelOrder = this.props.panelOrder;
    var contextId = this.props.contextId;
    var ctrl = this.context.controller;

    var el = $$('div').addClass("context-toggles");
    _.each(panelOrder, function(panelId) {
      var panelClass = ctrl.getComponent(panelId);
      var toggle = $$('a')
        .addClass("toggle-context")
        .attr({
          href: "#",
          "data-id": panelClass.contextId,
        })
        .on('click', this.onContextToggleClick);
      if (panelClass.contextId === contextId) {
        toggle.addClass("active");
      }
      toggle.append(
        $$(Icon, { icon: panelClass.icon })
      );
      toggle.append(
        $$('span').addClass('label').append(panelClass.displayName)
      );
      el.append(toggle);
    }, this);
    return el;
  };

  this.onContextToggleClick = function(e) {
    e.preventDefault();
    var newContext = $(e.currentTarget).attr("data-id");
    this.send('switch-context', newContext);
  };
};

OO.inherit(ContextToggles, Component);

module.exports = ContextToggles;
