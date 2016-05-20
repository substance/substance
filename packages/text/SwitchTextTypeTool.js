'use strict';

var each = require('lodash/each');
var SurfaceTool = require('../../ui/SurfaceTool');
var keys = require('../../util/keys');

/**
  SwitchTextTypeTool. Implements the SurfaceTool API.

  @class
  @component
*/
function SwitchTextTypeTool() {
  SwitchTextTypeTool.super.apply(this, arguments);

  // cursor for keyboard navigation
  this._navIdx = -1;
}

SwitchTextTypeTool.Prototype = function() {

  var _super = SwitchTextTypeTool.super.prototype;

  // UI Specific parts
  // ----------------

  this.didMount = function() {
    _super.didMount.call(this);

    this._focusToggle();
  };

  this.render = function($$) {
    var textTypeName = 'No selection';

    if (this.props.currentTextType) {
      textTypeName = this.props.currentTextType.name;
    }
    var el = $$('div').addClass('sc-switch-text-type');

    var toggleButton = $$('button').ref('toggle')
      .addClass('se-toggle')
      .attr('title', this.i18n.t('switch_text'))
      .append(this.i18n.t(textTypeName))
      .on('click', this.toggleAvailableTextTypes);

    if (this.props.disabled || !this.props.currentTextType) {
      el.addClass('sm-disabled');
      toggleButton.attr('tabindex', -1);
    } else {
      toggleButton.attr('tabindex', 1);
    }

    el.append(toggleButton);

    if (this.state.open) {
      el.addClass('sm-open');

      // dropdown options
      var options = $$('div').addClass("se-options").ref('options');
      each(this.props.textTypes, function(textType) {
        var button = $$('button')
            .addClass('se-option sm-'+textType.name)
            .attr('data-type', textType.name)
            .append(this.i18n.t(textType.name))
            .on('click', this.handleClick);
        options.append(button);
      }.bind(this));
      el.append(options);
      el.on('keydown', this.onKeydown);
    }

    return el;
  };

  this.didUpdate = function() {
    this._focusToggle();
  };

  this._focusToggle = function() {
    if (this.state.open) {
      this.refs.toggle.focus();
    }
  };

  this.executeCommand = function(textType) {
    this.context.commandManager.executeCommand('switch-text-type', textType);
  };

  this.getTextCommands = function() {
    var surface = this.getSurface();
    if (!this.textCommands && surface) {
      this.textCommands = surface.getTextCommands();
    }
    return this.textCommands || {};
  };

  this.handleClick = function(e) {
    e.preventDefault();
    // Modifies the tool's state so that state.open is undefined, which is nice
    // because it means the dropdown will be closed automatically
    this.executeCommand(e.currentTarget.dataset.type);
  };

  this.onKeydown = function(event) {
    var handled = false;
    switch (event.keyCode) {
      case keys.UP:
        this._nav(-1);
        handled = true;
        break;
      case keys.DOWN:
        this._nav(1);
        handled = true;
        break;
      case keys.ESCAPE:
        this.toggleDropdown();
        handled = true;
        break;
    }
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  this.toggleAvailableTextTypes = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.props.disabled) return;

    // HACK: This only updates the view state state.open is not set on the tool itself
    // That way the dropdown automatically closes when the selection changes
    this.toggleDropdown();
  };

  this.toggleDropdown = function() {
    // reset index for keyboard navigation
    this._navIdx = -1;
    this.extendState({
      open: !this.state.open
    });
  };

  this._nav = function(step) {
    this._navIdx += step;
    this._navIdx = Math.max(0, this._navIdx);
    this._navIdx = Math.min(this._getOptionsCount()-1, this._navIdx);

    if (this._navIdx >= 0) {
      var option = this.refs.options.children[this._navIdx];
      option.focus();
    }
  };

  this._getOptionsCount = function() {
    return this.refs.options.children.length;
  };

};

SurfaceTool.extend(SwitchTextTypeTool);

SwitchTextTypeTool.static.name = 'switch-text-type';

module.exports = SwitchTextTypeTool;
