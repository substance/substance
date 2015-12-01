'use strict';

var extend = require('lodash/object/extend');
var omit = require('lodash/object/omit');
var Component = require('./Component');
var $$ = Component.$$;
var ContextToggles = require('./ContextToggles');

function ContextSection() {
  Component.apply(this, arguments);
}

ContextSection.Prototype = function() {

  this._propsFromParentState = function() {
    /*
     This is implementation is wrong as it violates a basic principle.
     A component is rerendered, when its state or props have changed.

     Deriving props for children from the parent state is seriously a bad practice.
     As stated in #311, it raises the expectation, that rerendering occurs
     just because the parent state has changed.

     On such premises, it is not possible to implement an efficient reactive
     rendering engine, as there is no way to tell, when to bound descending.
     Moreover a parent component could cut off this component by deciding
     that shouldRerender = false.
    */
    var parentState = this.context.controller.state;
    var props = omit(parentState, 'contextId');
    return props;
  };

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
      $$(PanelComponentClass, extend({
        doc: doc
      }, this.props)).addClass('se-context-panel').ref(contextId)
    );
    return el;
  };
};

Component.extend(ContextSection);

module.exports = ContextSection;