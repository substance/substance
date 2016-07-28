'use strict';

var Component = require('./Component');
var CommandManager = require('./CommandManager');
var SurfaceManager = require('./SurfaceManager');
var MacroManager = require('./MacroManager');
var GlobalEventHandler = require('./GlobalEventHandler');
var DragManager = require('./DragManager');

function AbstractEditor() {
  AbstractEditor.super.apply(this, arguments);

  this._initialize(this.props);
}

AbstractEditor.Prototype = function() {

  this.didMount = function() {
    this.documentSession.on('didUpdate', this._documentSessionUpdated, this);
  };

  this.willReceiveProps = function(nextProps) {
    var newSession = nextProps.documentSession;
    var shouldDispose = newSession && newSession !== this.documentSession;
    if (shouldDispose) {
      this._dispose();
      this._initialize(nextProps);
    }
  };

  this.dispose = function() {
    this._dispose();
  };

  this._dispose = function() {
    this.surfaceManager.dispose();
    this.commandManager.dispose();
    this.globalEventHandler.dispose();
    this.dragManager.dispose();
    this.documentSession.off(this);
    // Note: we need to clear everything, as the childContext
    // changes which is immutable
    this.empty();
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
      labelProvider: this.labelProvider,
      converterRegistry: this.converterRegistry,
      globalEventHandler: this.globalEventHandler,
      editingBehavior: this.editingBehavior,
      dragManager: this.dragManager,
    };
  };

  this._initialize = function(props) {
    var configurator = props.configurator;
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
    this.surfaceManager = new SurfaceManager(this.documentSession);
    this.fileClient = configurator.getFileClient();
    this.commandManager = new CommandManager(this.getCommandContext(), commands);
    this.dragManager = new DragManager(configurator.createDragHandlers(), {
      documentSession: this.documentSession,
      surfaceManager: this.surfaceManager,
      commandManager: this.commandManager,
    });
    this.macroManager = new MacroManager(this.getMacroContext(), configurator.getMacros());
    this.iconProvider = configurator.getIconProvider();
    this.converterRegistry = configurator.getConverterRegistry();
    this.globalEventHandler = new GlobalEventHandler(this.documentSession, this.surfaceManager);
    this.editingBehavior = configurator.getEditingBehavior();
    this.labelProvider = configurator.getLabelProvider();
  };

  this.getCommandContext = function() {
    return {
      editor: this,
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

  this.getToolbar = function() {
    throw new Error('This method is abstract.');
  };

  this._documentSessionUpdated = function() {
    var toolbar = this.getToolbar();
    if (toolbar) {
      var commandStates = this.commandManager.getCommandStates();
      this.refs.toolbar.setProps({
        commandStates: commandStates
      });
    }
  };
};

Component.extend(AbstractEditor);

module.exports = AbstractEditor;
