'use strict';

var extend = require('lodash/object/extend');
var Component = require('./Component');
var $$ = Component.$$;
var ContextToggles = require('./ContextToggles');

function ContextSection() {
  Component.apply(this, arguments);
}

ContextSection.Prototype = function() {

  this.render = function() {
    var componentRegistry = this.context.componentRegistry;
    var contextId = this.props.contextId;
    var panelConfig = this.props.panelConfig;
    var PanelComponentClass = componentRegistry.get(contextId);
    var doc = this.context.controller.getDocument();
    var el = $$('div').addClass('sc-context-section');

    // Only render context toggles when we are dealing with a dialog
    if (!panelConfig.hideContextToggles) {
      el.append($$(ContextToggles));
      el.addClass('sm-context-toggles-shown');
    } else {
      el.addClass('sm-context-toggles-hidden');
    }

    // Add context panel
    el.append(
      // forwarding all props from above adding doc as a prop
      $$(PanelComponentClass, this.props.panelProps)
        .addClass('se-context-panel').ref(contextId)
    );
    return el;
  };
};

Component.extend(ContextSection);

module.exports = ContextSection;