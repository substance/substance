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
var MacroManager = require('../../ui/MacroManager');
var GlobalEventHandler = require('../../ui/GlobalEventHandler');

function ProseEditor() {
  ProseEditor.super.apply(this, arguments);
  this._initialize(this.props);
}

ProseEditor.Prototype = function() {

  this.didMount = function() {
    // this.refs.body.selectFirst();
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
    this.globalEventHandler.dispose();
    // Note: we need to clear everything, as the childContext
    // changes which is immutable
    this.empty();
  };

  this.willUpdateState = function(newState) {
    this.handleStateUpdate(newState);
  };

  this._initialize = function(props) {
    var configurator = this.props.configurator;
    var commands = configurator.getCommands();

    if (!props.documentSession) {
      throw new Error('DocumentSession instance required');
    }
    this.documentSession = props.documentSession;
    this.doc = this.documentSession.getDocument();

    this.saveHandler = configurator.getSaveHandler();
    this.documentSession.setSaveHandler(this.saveHandler);
    this.componentRegistry = configurator.getComponentRegistry();
    this.toolRegistry = configurator.getToolRegistry();
    this.i18nInstance = configurator.getI18nInstance();
    this.surfaceManager = new SurfaceManager(this.documentSession);
    this.fileClient = configurator.getFileClient();
    this.commandManager = new CommandManager(this.getCommandContext(), commands);
    this.macroManager = new MacroManager(this.getMacroContext(), configurator.getMacros());
    this.iconProvider = configurator.getIconProvider();
    this.converterRegistry = configurator.getConverterRegistry();
    this.globalEventHandler = new GlobalEventHandler(this.documentSession, this.surfaceManager);
    this.editingBehavior = configurator.getEditingBehavior();
    this.labelProvider = configurator.getLabelProvider();
  };

  this.getCommandContext = function() {
    return {
      documentSession: this.documentSession,
      surfaceManager: this.surfaceManager,
      fileClient: this.fileClient,
      saveHandler: this.saveHandler,
      converterRegistry: this.converterRegistry
    };
  };

  this.getMacroContext = function() {
    return {
      documentSession: this.documentSession,
      surfaceManager: this.surfaceManager
    };
  };

  this.getChildContext = function() {
    return {
      controller: this,
      iconProvider: this.iconProvider,
      documentSession: this.documentSession,
      doc: this.doc, // TODO: remove in favor of documentSession
      componentRegistry: this.componentRegistry,
      surfaceManager: this.surfaceManager,
      commandManager: this.commandManager,
      toolRegistry: this.toolRegistry,
      i18n: this.i18nInstance,
      labelProvider: this.labelProvider,
      converterRegistry: this.converterRegistry,
      globalEventHandler: this.globalEventHandler,
      editingBehavior: this.editingBehavior
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
