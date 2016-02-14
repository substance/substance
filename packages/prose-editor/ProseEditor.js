'use strict';

var Component = require('../../ui/Component');
var $$ = Component.$$;

var Controller = require('../../ui/Controller');
var ContainerEditor = require('../../ui/ContainerEditor');
var SplitPane = require('../../ui/SplitPane');
var ScrollPane = require('../../ui/ScrollPane');
var Icon = require('../../ui/FontAwesomeIcon');
var Toolbar = require('../../ui/Toolbar');
var UndoTool = require('../../ui/UndoTool');
var RedoTool = require('../../ui/RedoTool');
var SwitchTextTypeTool = require('../text/SwitchTextTypeTool');
var StrongTool = require('../strong/StrongTool');
var EmphasisTool = require('../emphasis/EmphasisTool');
var LinkTool = require('../link/LinkTool');

function Editor() {
  Controller.apply(this, arguments);
}

Editor.Prototype = function() {
  // Custom Render method for your editor
  this.render = function() {
    var config = this.getConfig();

    var tools = [
      $$(SwitchTextTypeTool, {'title': this.i18n.t('switch_text')}),
      $$(UndoTool).append($$(Icon, {icon: 'fa-undo'})),
      $$(RedoTool).append($$(Icon, {icon: 'fa-repeat'})),
      $$(StrongTool).append($$(Icon, {icon: 'fa-bold'})),
      $$(EmphasisTool).append($$(Icon, {icon: 'fa-italic'})),
      $$(LinkTool).append($$(Icon, {icon: 'fa-link'}))
    ];
    if (this.props.tools) {
      tools = tools.concat(this.props.tools);
    }
    return $$('div').addClass('sc-editor').append(
      $$(SplitPane, {splitType: 'horizontal'}).append(
        $$(Toolbar).append(
          $$(Toolbar.Group).append(tools)
        ),
        $$(ScrollPane, {scrollbarType: 'substance', scrollbarPosition: 'right'}).append(
          $$(ContainerEditor, {
            doc: this.props.doc,
            containerId: 'body',
            name: 'bodyEditor',
            commands: config.bodyEditor.commands,
            textTypes: config.bodyEditor.textTypes
          }).ref('bodyEditor')
        ).ref('contentPanel')
      )
    );
  };
};

Controller.extend(Editor);

Editor.static.config = {
  // Controller specific configuration (required!)
  controller: {
    // Component registry
    components: {
      'paragraph': require('../paragraph/ParagraphComponent'),
      'heading': require('../heading/HeadingComponent'),
      'link': require('../link/LinkComponent'),
      'codeblock': require('../codeblock/CodeblockComponent'),
      'blockquote': require('../blockquote/BlockquoteComponent')
    },
    // Controller commands
    commands: [
      require('../../ui/UndoCommand'),
      require('../../ui/RedoCommand'),
      require('../../ui/SaveCommand')
    ]
  },
  // Custom configuration (required!)
  bodyEditor: {
    commands: [
      require('../text/SwitchTextTypeCommand'),
      require('../strong/StrongCommand'),
      require('../emphasis/EmphasisCommand'),
      require('../link/LinkCommand'),
    ],
    textTypes: [
      {name: 'paragraph', data: {type: 'paragraph'}},
      {name: 'heading1',  data: {type: 'heading', level: 1}},
      {name: 'heading2',  data: {type: 'heading', level: 2}},
      {name: 'heading3',  data: {type: 'heading', level: 3}},
      {name: 'codeblock', data: {type: 'codeblock'}},
      {name: 'blockquote', data: {type: 'blockquote'}}
    ]
  }
};

module.exports = Editor;
