"use strict";
/* global i18n*/

var OO = require("../../basics/oo");
var Component = require('../component');
var $$ = Component.$$;

// Navigate Tool Component
// ----------------
//
// Just used to trigger app state changes

function TableToolComponent() {
  Component.apply(this, arguments);
}

TableToolComponent.Prototype = function() {

  this.getInitialState = function() {
    return { disabled: true };
  };

  this.render = function() {
    var el = $$("button")
      .attr({
        title: this.props.title,
      })
      .on('mousedown', this.handleMouseDown)
      .on('click', this.handleClick);
    if (this.state.disabled) {
      el.addClass('disabled');
    }
    var label, sel, colCount, rowCount;
    switch(this.props.tool) {
    case "insert_columns":
      if (this.state.disabled) {
        if (this.props.mode === "before") {
          label = i18n.t('insert_column_before');
        } else if (this.props.mode === "after") {
          label = i18n.t('insert_column_after');
        }
      } else {
        sel = this.tool.getToolState().sel;
        colCount = sel.endCol - sel.startCol + 1;
        if (this.props.mode === "before") {
          label = i18n.t('insert_k_columns_before', { smart_count: colCount });
        } else if (this.props.mode === "after") {
          label = i18n.t('insert_k_columns_after', { smart_count: colCount });
        }
      }
      break;
    case "delete_columns":
      if (this.state.disabled) {
        label = i18n.t('delete_column');
      } else {
        sel = this.tool.getToolState().sel;
        colCount = sel.endCol - sel.startCol + 1;
        label = i18n.t('delete_k_columns', { smart_count: colCount });
      }
      break;
    case "insert_rows":
      if (this.state.disabled) {
        if (this.props.mode === "above") {
          label = i18n.t('insert_row_above');
        } else if (this.props.mode === "below") {
          label = i18n.t('insert_row_below');
        }
      } else {
        sel = this.tool.getToolState().sel;
        rowCount = sel.endRow - sel.startRow + 1;
        if (this.props.mode === "above") {
          label = i18n.t('insert_k_rows_above', { smart_count: rowCount });
        } else if (this.props.mode === "below") {
          label = i18n.t('insert_k_rows_below', { smart_count: rowCount });
        }
      }
      break;
    case "delete_rows":
      if (this.state.disabled) {
        label = i18n.t('delete_row');
      } else {
        sel = this.tool.getToolState().sel;
        rowCount = sel.endRow - sel.startRow + 1;
        label = i18n.t('delete_k_rows', { smart_count: rowCount });
      }
      break;
    }
    return el.append(label);
  };

  this.didMount = function() {
    var toolName = this.props.tool;
    if (!toolName) {
      throw new Error('Prop "tool" is mandatory.');
    }
    this.tool = this.context.toolRegistry.get(toolName);
    if (!this.tool) {
      console.error('No tool registered with name %s', toolName);
    }
    this.tool.connect(this, {
      'toolstate:changed': this.onToolstateChanged
    });
    this.$el.on('mousedown', this.handleMouseDown);
    this.$el.on('click', this.handleClick);
  };

  this.willUnmount = function() {
    this.tool.disconnect(this);
    this.$el.off('mousedown', this.handleMouseDown);
    this.$el.off('click', this.handleClick);
  };

  this.onToolstateChanged = function(toolState) {
    this.setState({
      disabled: toolState.disabled
    });
  };

  this.handleClick = function(e) {
    e.preventDefault();
  };

  this.handleMouseDown = function(e) {
    e.preventDefault();
    if (!this.state.disabled) {
      this.tool.performAction(this.props);
    }
  };
};

OO.inherit(TableToolComponent, Component);

module.exports = TableToolComponent;
