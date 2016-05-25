'use strict';

var ContainerEditor = require('../../ui/ContainerEditor');
var Component = require('../../ui/Component');
var SplitPane = require('../../ui/SplitPane');
var ScrollPane = require('../../ui/ScrollPane');
var Toolbar = require('../../ui/Toolbar');
var ProseEditorTools = require('./ProseEditorTools');
var ProseEditorOverlay = require('./ProseEditorOverlay');
var CommandManager = require('../../ui/CommandManager');
var SurfaceManager = require('../../ui/SurfaceManager');

function ProseEditor() {
  ProseEditor.super.apply(this, arguments);
  this._initialize(this.props);
}

ProseEditor.Prototype = function() {

  this.didMount = function() {
    this.refs.body.selectFirst();
  };

  this.willReceiveProps = function(nextProps) {
    var newSession = nextProps.documentSession;
    var shouldDispose = newSession && newSession !== this.documentSession;
    if (shouldDispose) {
      this._dispose();
      this._initialize(nextProps);
    }
  };

  /**
    Is called when component life ends. If you need to implement dispose
    in your custom Controller class, don't forget the super call.
  */
  this.dispose = function() {
    this._disposeController();
  };

  this._dispose = function() {
    this.surfaceManager.dispose();
    this.commandManager.dispose();
    // Note: we need to clear everything, as the childContext
    // changes which is immutable
    this.empty();
  };

  this.willUpdateState = function(newState) {
    this.handleStateUpdate(newState);
  };

  this._initialize = function(props) {
    var configurator = this.props.configurator;

    if (!props.documentSession) {
      throw new Error('DocumentSession instance required');
    }
    this.documentSession = props.documentSession;
    this.doc = this.documentSession.getDocument();

    // Static registries
    this.componentRegistry = configurator.getComponentRegistry();
    this.toolRegistry = configurator.getToolRegistry();
    this.i18nInstance = configurator.getI18nInstance();
    this.surfaceManager = new SurfaceManager(this.documentSession);
    this.fileUploader = configurator.getFileUploader();
    // this.backend = configurator.getBackend();
    // this.documentSession.on('save', this.backend.save);
    this.commandManager = new CommandManager({
      documentSession: this.documentSession,
      surfaceManager: this.surfaceManager
    }, configurator.getCommands());
  };

  this.getChildContext = function() {
    return {
      controller: this,
      documentSession: this.documentSession,
      doc: this.doc,
      componentRegistry: this.componentRegistry,
      surfaceManager: this.surfaceManager,
      commandManager: this.commandManager,
      toolRegistry: this.toolRegistry,
      i18n: this.i18nInstance
    };
  };

  this.render = function($$) {
    var configurator = this.props.configurator;
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
            commands: configurator.getSurfaceCommandNames(),
            textTypes: configurator.getTextTypes()
          }).ref('body')
        ).ref('contentPanel')
      )
    );
  };

};

Component.extend(ProseEditor);

module.exports = ProseEditor;
