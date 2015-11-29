'use strict';

var _ = require('../util/helpers');
var Component = require('./Component');
var $$ = Component.$$;
var ContextToggles = require('./ContextToggles');

function ContextSection() {
  Component.apply(this, arguments);
}

ContextSection.Prototype = function() {

  this._propsFromParentState = function() {
    var parentState = this.context.controller.state;
    var props = _.omit(parentState, 'contextId');
    props.doc = this.context.controller.getDocument();
    return props;
  };

  this.render = function() {
    var componentRegistry = this.context.componentRegistry;
    var parentState = this.context.controller.state;
    var config = this.context.config;
    var contextId = parentState.contextId;
    var panelConfig = config.panels[contextId] || {};
    var PanelComponentClass = componentRegistry.get(contextId);

    var el = $$('div').addClass('sc-context-section');

    // Only render context toggles when we are dealing with a dialog
    if (!panelConfig.hideContextToggles) {
      el.append($$(ContextToggles));
      el.addClass('sm-context-toggles-shown');
    } else {
      el.addClass('sm-context-toggles-hidden');
    }    

    // Add context panel
    var props = this._propsFromParentState();
    el.append(
      $$(PanelComponentClass, props).addClass('se-context-panel').ref(contextId)
    );
    return el;
  };
};

Component.extend(ContextSection);

module.exports = ContextSection;