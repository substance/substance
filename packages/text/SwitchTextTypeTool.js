'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var SurfaceTool = require('../../ui/SurfaceTool');
var _ = require('../../util/helpers');

/**
 * Abstract class for text types
 *
 * Implements the SurfaceTool API.
 */

function SwitchTextType() {
  SurfaceTool.apply(this, arguments);
  this.context.toolManager.registerTool(this);
}

SwitchTextType.Prototype = function() {

  this.static = {
    name: 'switchTextType',
    command: 'switchTextType'
  };

  this.getInitialState = function() {
    var state = this.context.toolManager.getCommandState(this);
    return state;
  };

  this.getTextCommands = function() {
    var surface = this.getSurface();
    if (!this.textCommands && surface) {
      this.textCommands = surface.getTextCommands();
    }
    return this.textCommands || {};
  };

  this.dispose = function() {
    this.context.toolManager.unregisterTool(this);
  };

  // UI Specific parts
  // ----------------

  this.render = function() {
    var textTypeName = '-';

    if (this.state.currentTextType) {
      textTypeName = this.state.currentTextType.name;
    }
    var el = $$("div").addClass('sc-switch-text-type');

    // Note: this is a view internal state for opening the select dropdown
    if (this.state.open) {
      el.addClass('sm-open');
    }
    if (this.state.disabled) {
      el.addClass('sm-disabled');
    }

    el.append($$('button')
      .addClass('se-toggle').attr('href', "#")
      .attr('title', this.props.title)
      .append(this.i18n.t(textTypeName))
      .on('click', this.toggleAvailableTextTypes)
    );

    // dropdown options
    var options = $$('div').addClass("se-options");
    _.each(this.state.textTypes, function(textType) {
      var button = $$('button')
          .addClass('se-option sm-'+textType.name)
          .attr("data-type", textType.name)
          .append(this.i18n.t(textType.name))
          .on('click', this.handleClick);
      options.append(button);
    }, this);

    el.append(options);
    return el;
  };

  this.handleClick = function(e) {
    e.preventDefault();
    // Modifies the tool's state so that state.open is undefined, which is nice
    // because it means the dropdown will be closed automatically
    this.executeCommand(e.currentTarget.dataset.type);
  };

  this.executeCommand = function(textType) {
    this.getSurface().executeCommand('switchTextType', textType);
  };

  this.toggleAvailableTextTypes = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.state.disabled) return;

    // HACK: This only updates the view state state.open is not set on the tool itself
    // That way the dropdown automatically closes when the selection changes
    this.toggleDropdown();
  };

  this.toggleDropdown = function() {
    this.extendState({
      open: !this.state.open
    });
  };
};

oo.inherit(SwitchTextType, SurfaceTool);

module.exports = SwitchTextType;
