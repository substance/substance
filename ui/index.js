/**
 * Reusable UI components for building editing apps.
 * 
 * @module ui
 */

var ui = {};

/* Sub modules */
ui.surface = require('./surface');
ui.commands = require('./commands');

/* Properties */
ui.Component = require('./component');
ui.I18n = require('./i18n');
ui.ToolManager = require('./tool_manager');
ui.Controller = require('./controller');
ui.TextPropertyComponent = require('./text_property_component');

module.exports = ui;
