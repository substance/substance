'use strict';

var $ = require('../util/jquery');
var _ = require('../util/helpers');

var Component = require('./Component');
var $$ = Component.$$;

function ContextToggles() {
  Component.apply(this, arguments);
}

ContextToggles.Prototype = function() {

  this.render = function() {
    // TODO: this should be less bound to the app context!
    var config = this.context.config;
    var parentState = this.context.controller.state;
    var panelOrder = config.panelOrder;
    var contextId = parentState.contextId;

    var el = $$('div').addClass("sc-context-toggles");
    _.each(panelOrder, function(panelId) {
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

Component.extend(ContextToggles);

module.exports = ContextToggles;
