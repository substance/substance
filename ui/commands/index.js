/**
 * Commands are named operations that can be triggered by tools or keybindings.
 * There are a number of pre-defined commands, however developers are
 * encouraged to define their own.
 *
 * Substance provides a number of pre-implemented commands.
 * 
 * @example <caption>Surface Commands</caption>
 *
 * var commands = [
 *   require('substance/ui/commands/make_paragraph'),
 *   require('substance/ui/commands/make_heading1'),
 *   require('substance/ui/commands/make_heading2'),
 *   require('substance/ui/commands/make_heading3'),
 *   require('substance/ui/commands/make_blockquote'),
 *   require('substance/ui/commands/make_codeblock'),
 *   require('substance/ui/commands/toggle_strong'),
 *   require('substance/ui/commands/toggle_emphasis'),
 *   require('substance/ui/commands/toggle_link'),
 *   require('substance/ui/commands/select_all')
 * ];
 *
 * // In your custom editor component
 * var BodyEditor = Component.extend({
 *   render: function() {
 *     var editor = $$(ContainerEditor, {
 *     name: 'bodyEditor',
 *     containerId: 'body',
 *     doc: doc,
 *     commands: commands
 *     }).ref('editor');
 *     return $$('div').addClass('body-editor').append(editor);
 *   },
 *   ...
 * });
 * ...
 * 
 * @example <caption>Controller Commands</caption>
 *
 * var commands = [
 *  require('substance/ui/commands/undo'),
 *  require('substance/ui/commands/redo'),
 *  require('substance/ui/commands/save')  
 * ];
 * 
 * // Defining your app
 * var MyApp = Controller.extend({
 *   render: function() {
 *     ...
 *   }
 * });
 * 
 * // And configure it with a set of supported commands
 * var app = Component.mount($$(MyApp, {
 *   doc: doc,
 *   config: {
 *     ...
 *     commands: commands,
 *   }
 * }), $('#container'));
 * 
 * @module ui/commands 
 */

var commands = {};

commands.ControllerCommand = require('./controller_command');
commands.SurfaceCommand = require('./surface_command');

/* A set of default commands */
commands.defaultCommands = {
  controller: [
    require('./undo'),
    require('./redo'),
    require('./save')
  ],
  surface: [
    require('./make_paragraph'),
    require('./make_heading1'),
    require('./make_heading2'),
    require('./make_heading3'),
    require('./make_blockquote'),
    require('./make_codeblock'),
    require('./toggle_strong'),
    require('./toggle_emphasis'),
    require('./toggle_link'),
    require('./select_all')
  ]
};

module.exports = commands;
