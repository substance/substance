'use strict';

var each = require('lodash/each');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var SurfaceTool = require('../../ui/SurfaceTool');

/*
  Abstract class for text types. Implements the SurfaceTool API.

  @class
  @component
*/

function SwitchTextType() {
  SurfaceTool.apply(this, arguments);
}

SwitchTextType.Prototype = function() {

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
    var textTypeName = 'No selection';

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
    each(this.state.textTypes, function(textType) {
      var button = $$('button')
          .addClass('se-option sm-'+textType.name)
          .attr("data-type", textType.name)
          .append(this.i18n.t(textType.name))
          .on('click', this.handleClick);
      options.append(button);
    }.bind(this));

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
    this.getSurface().executeCommand('switch-text-type', textType);
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

SurfaceTool.extend(SwitchTextType);

SwitchTextType.static.name = 'switch-text-type';
SwitchTextType.static.command = 'switch-text-type';

module.exports = SwitchTextType;
