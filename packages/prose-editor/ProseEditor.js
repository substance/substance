'use strict';

var Controller = require('../../ui/Controller');
var ContainerEditor = require('../../ui/ContainerEditor');
var SplitPane = require('../../ui/SplitPane');
var ScrollPane = require('../../ui/ScrollPane');
var Toolbar = require('../../ui/Toolbar');
var ProseEditorTools = require('./ProseEditorTools');

function ProseEditor() {
  ProseEditor.super.apply(this, arguments);
}

ProseEditor.Prototype = function() {

  var _super = ProseEditor.super.prototype;

  this.didMount = function() {
    _super.didMount.call(this);
    this.refs.body.selectFirst();
  };

  this.render = function($$) {
    var config = this.getConfig();

    return $$('div').addClass('sc-editor').append(
      $$(SplitPane, {splitType: 'horizontal'}).append(
        $$(Toolbar, {
          content: ProseEditorTools
        }),
        $$(ScrollPane, {scrollbarType: 'substance', scrollbarPosition: 'right'}).append(
          $$(ContainerEditor, {
            documentSession: this.documentSession,
            containerId: 'body',
            name: 'body',
            commands: config.surfaces.body.commands,
            textTypes: config.surfaces.body.textTypes
          }).ref('body')
        ).ref('contentPanel')
      )
    );
  };
};

Controller.extend(ProseEditor);

ProseEditor.static.config = {
  // Component registry
  components: {
    'paragraph': require('../paragraph/ParagraphComponent'),
    'heading': require('../heading/HeadingComponent'),
    'link': require('../link/LinkComponent'),
    'codeblock': require('../codeblock/CodeblockComponent'),
    'blockquote': require('../blockquote/BlockquoteComponent')
  },
  commands: [
    // Controller commands
    require('../../ui/UndoCommand'),
    require('../../ui/RedoCommand'),
    require('../../ui/SaveCommand'),

    // Surface Commands
    require('../text/SwitchTextTypeCommand'),
    require('../strong/StrongCommand'),
    require('../emphasis/EmphasisCommand'),
    require('../link/LinkCommand')
  ],
  surfaces: {
    body: {
      commands: ['switch-text-type', 'strong', 'emphasis', 'link'],
      textTypes: [
        {name: 'paragraph', data: {type: 'paragraph'}},
        {name: 'heading1',  data: {type: 'heading', level: 1}},
        {name: 'heading2',  data: {type: 'heading', level: 2}},
        {name: 'heading3',  data: {type: 'heading', level: 3}},
        {name: 'codeblock', data: {type: 'codeblock'}},
        {name: 'blockquote', data: {type: 'blockquote'}}
      ]
    }    
  }

};

module.exports = ProseEditor;
