'use strict';

var Controller = require('../../ui/Controller');
var ContainerEditor = require('../../ui/ContainerEditor');
var SplitPane = require('../../ui/SplitPane');
var ScrollPane = require('../../ui/ScrollPane');
var Toolbar = require('../../ui/Toolbar');
var ProseEditorTools = require('./ProseEditorTools');
var ProseEditorOverlay = require('./ProseEditorOverlay');

var ProseEditorDefaultConfig = require('./ProseEditorDefaultConfig');

function ProseEditor() {
  ProseEditor.super.apply(this, arguments);
}

ProseEditor.Prototype = function() {

  var _super = ProseEditor.super.prototype;

  this.didMount = function() {
    _super.didMount.call(this);
    this.refs.body.selectFirst();
  };

  // Run the default config block
  this.defaultConfig = function(config) {
    ProseEditorDefaultConfig(config);
  };

  this.render = function($$) {
    return $$('div').addClass('sc-editor').append(
      $$(SplitPane, {splitType: 'horizontal'}).append(
        $$(Toolbar, {
          content: ProseEditorTools
        }),
        $$(ScrollPane, {
          scrollbarType: 'substance',
          scrollbarPosition: 'right',
          overlay: ProseEditorOverlay,
        }).append(
          $$(ContainerEditor, {
            documentSession: this.documentSession,
            containerId: 'body',
            name: 'body',
            // TODO: this is somewhat redundant with the configuration
            commands: ['switch-text-type', 'strong', 'emphasis', 'link'],
            textTypes: this.textTypes
          }).ref('body')
        ).ref('contentPanel')
      )
    );
  };
};

Controller.extend(ProseEditor);

module.exports = ProseEditor;
