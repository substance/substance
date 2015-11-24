'use strict';

var _ = require('../util/helpers');
var Registry = require('../util/Registry');
var SurfaceSelection = require('./SurfaceSelection');
var Document = require('../model/Document');
var Selection = require('../model/Selection');
var Component = require('./Component');
var Clipboard = require('./Clipboard');
var $$ = Component.$$;


/**
   Abstract interface for editing components.
   Dances with contenteditable, so you don't have to.

   @class
   @component
   @abstract
*/

function Surface() {
  Component.apply(this, arguments);

  var controller = this.getController();
  var doc = this.getDocument();

  if (!controller) {
    throw new Error('Surface needs a valid controller');
  }
  if (!doc) {
    throw new Error('No doc provided');
  }
  if (!this.props.name) {
    throw new Error('No name provided');
  }

  this.name = this.props.name;
  this.selection = Document.nullSelection;
  this.clipboard = new Clipboard(this, doc.getClipboardImporter(), doc.getClipboardExporter());
  // this.element must be set via surface.attach(element)
  this.element = null;
  this.$element = null;
  this.surfaceSelection = null;
  this.dragging = false;
  this.onDomMutations = this.onDomMutations.bind(this);
  this.domObserver = new window.MutationObserver(this.onDomMutations);
  this.domObserverConfig = { subtree: true, characterData: true };
  this.skipNextObservation = false;

  // set when editing is enabled
  this.enabled = true;
  this.isIE = Surface.detectIE();
  this.isFF = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  this.undoEnabled = true;
  this.textTypes = this.props.textTypes;
  this._initializeCommandRegistry(this.props.commands);
  controller.registerSurface(this);
}

Surface.Prototype = function() {

  this.render = function() {
    var el = $$("div")
      .addClass('surface')
      .attr('spellCheck', false);
    // Keyboard Events
    el.on('keydown', this.onKeyDown);
    // OSX specific handling of dead-keys
    if (!this.isIE) {
      el.on('compositionstart', this.onCompositionStart);
    }
    if (!this.isIE) {
      el.on('textInput', this.onTextInput);
    } else {
      el.on('keypress', this.onTextInputShim);
    }

    // Mouse Events
    el.on('mousedown', this.onMouseDown);

    // disable drag'n'drop
    el.on('dragstart', this.onDragStart);

    // we will react on this to render a custom selection
    el.on('focus', this.onNativeFocus);
    el.on('blur', this.onNativeBlur);

    return el;
  };

  this.didMount = function() {
    var doc = this.getDocument();
    this.surfaceSelection = new SurfaceSelection(this.el, doc, this.getContainer());
    this.clipboard.attach(this);
    // Document Change Events
    this.domObserver.observe(this.el, this.domObserverConfig);
  };

  this.dispose = function() {
    var doc = this.getDocument();
    this.setSelection(null);
    this.textPropertyManager.dispose();
    this.domObserver.disconnect();
    // Document Change Events
    doc.disconnect(this);
    // Clean-up
    this.surfaceSelection = null;
    // unregister from controller
    this.getController().unregisterSurface(this);
  };

  this.getChildContext = function() {
    return {
      surface: this
    };
  };

  this._initializeCommandRegistry = function(commands) {
    var commandRegistry = new Registry();
    _.each(commands, function(CommandClass) {
      var cmd = new CommandClass(this);
      commandRegistry.add(CommandClass.static.name, cmd);
    }, this);
    this.commandRegistry = commandRegistry;
  };

  this.getCommand = function(commandName) {
    return this.commandRegistry.get(commandName);
  };

  this.getTextTypes = function() {
    return this.textTypes;
  };

  this.executeCommand = function(commandName, args) {
    var cmd = this.getCommand(commandName);
    if (!cmd) {
      console.warn('command', commandName, 'not registered on controller');
      return;
    }

    // Run command
    var info = cmd.execute(args);
    if (info) {
      this.emit('command:executed', info, commandName, cmd);
      // TODO: We want to replace this with a more specific, scoped event
      // but for that we need an improved EventEmitter API
    } else if (info === undefined) {
      console.warn('command ', commandName, 'must return either an info object or true when handled or false when not handled');
    }
  };

  // Used by TextTool
  // TODO: Filter by enabled commands for this Surface
  this.getTextCommands = function() {
    var textCommands = {};
    this.commandRegistry.each(function(cmd) {
      if (cmd.constructor.static.textTypeName) {
        textCommands[cmd.constructor.static.name] = cmd;
      }
    });
    return textCommands;
  };

  this.getName = function() {
    return this.name;
  };

  this.getElement = function() {
    return this.element;
  };

  this.getController = function() {
    return this.context.controller;
  };

  this.getDocument = function() {
    return this.context.controller.getDocument();
  };

  // Must be implemented by container surfaces
  this.getContainer = function() {};

  this.getContainerId = function() {};

  this.enable = function() {
    if (this.enableContentEditable) {
      this.el.prop('contentEditable', 'true');
    }
    this.enabled = true;
  };

  this.isEnabled = function() {
    return this.enabled;
  };

  this.disable = function() {
    if (this.enableContentEditable) {
      this.$element.removeAttr('contentEditable');
    }
    this.enabled = false;
  };

  /**
   * Handle document key down events.
   */
  this.onKeyDown = function( e ) {
    if (this.frozen) {
      return;
    }
    if ( e.which === 229 ) {
      // ignore fake IME events (emitted in IE and Chromium)
      return;
    }
    switch ( e.keyCode ) {
      case Surface.Keys.LEFT:
      case Surface.Keys.RIGHT:
        return this.handleLeftOrRightArrowKey(e);
      case Surface.Keys.UP:
      case Surface.Keys.DOWN:
        return this.handleUpOrDownArrowKey(e);
      case Surface.Keys.ENTER:
        return this.handleEnterKey(e);
      case Surface.Keys.SPACE:
        return this.handleSpaceKey(e);
      case Surface.Keys.BACKSPACE:
      case Surface.Keys.DELETE:
        return this.handleDeleteKey(e);
      default:
        break;
    }

    // Note: when adding a new handler you might want to enable this log to see keyCodes etc.
    // console.log('####', e.keyCode, e.metaKey, e.ctrlKey, e.shiftKey);

    // Built-in key combos
    // Ctrl+A: select all
    var handled = false;
    if ( (e.ctrlKey||e.metaKey) && e.keyCode === 65 ) {
      var newSelection = this.selectAll();
      if (newSelection) {
        this.setSelection(newSelection);
      }
      handled = true;
    }
    // Undo/Redo: cmd+z, cmd+shift+z
    else if (this.undoEnabled && e.keyCode === 90 && (e.metaKey||e.ctrlKey)) {
      if (e.shiftKey) {
        this.getController().executeCommand('redo');
      } else {
        this.getController().executeCommand('undo');
      }
      handled = true;
    }
    // Toggle strong: cmd+b ctrl+b
    else if (e.keyCode === 66 && (e.metaKey||e.ctrlKey)) {
      this.executeCommand('strong');
      handled = true;
    }
    // Toggle emphasis: cmd+i ctrl+i
    else if (e.keyCode === 73 && (e.metaKey||e.ctrlKey)) {
      this.executeCommand('emphasis');
      handled = true;
    }
    // Toggle link: cmd+l ctrl+l
    else if (e.keyCode === 76 && (e.metaKey||e.ctrlKey)) {
      this.executeCommand('link');
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  /**
    Run a transformation as a transaction properly configured for this surface.

    @param beforeState (optional) use this to override the default before-state (e.g. to use a different the initial selection).
    @param transformation a (surface) transformation function(tx, args) which receives
                          the selection the transaction was started with, and should return
                          output arguments containing a selection, as well.
    @param ctx (optional) will be used as `this` object when calling the transformation.

    @example

    Returning a new selection:
    ```js
    surface.transaction(function(tx, args) {
      var selection = args.selection;
      ...
      selection = tx.createSelection(...);
      return {
        selection: selection
      };
    });
    ```

    Reusing the current selection:
    ```js
    surface.transaction(function(tx, args) {
      ...
      this.foo();
      ...
      return args;
    }, this);
    ```

    Adding custom information to the transaction:

    ```js
    surface.transaction(beforeState, function(tx, args) {
      ...
    });
    ```
   */
  this.transaction = function(transformation, ctx) {
    // `beforeState` is saved with the document operation and will be used
    // to recover the selection when using 'undo'.
    var beforeState = {
      surfaceId: this.getName(),
      selection: this.getSelection()
    };
    // Note: this is to provide the optional signature transaction(before)
    if (!_.isFunction(arguments[0]) && arguments.length >= 2) {
      var customBeforeState = arguments[0];
      beforeState = _.extend(beforeState, customBeforeState);
      transformation = arguments[1];
      ctx = arguments[2];
    }
    var afterState;
    // TODO: remove this clear here, and in future do it on document:willchange (not implemented yet)
    // Then cursor flickering will be gone for undo/redos too.
    // this.surfaceSelection.clear();
    var doc = this.getDocument();
    // Making the doc transaction silent, so that the document:changed event does not
    // get emitted before the selection has been updated.
    var change = doc.transaction(beforeState, {silent: true}, function(tx, args) {
      args.selection = beforeState.selection;
      // A transformation receives a set of input arguments and should return a set of output arguments.
      var result = transformation.call(ctx, tx, args);
      // The `afterState` is saved with the document operation and will be used
      // to recover the selection whe using `redo`.
      afterState = result || {};
      // If no selection is returned, the old selection is for `afterState`.
      if (!afterState.selection) {
        afterState.selection = beforeState.selection;
      }
      afterState.surfaceId = beforeState.surfaceId;
      return afterState;
    });
    if (change) {
      // set the selection before notifying any listeners
      var sel = afterState.selection;
      this._setSelection(sel, "silent");
      doc._notifyChangeListeners(change);
      this.emit('selection:changed', sel, this);
      this.rerenderDomSelection();
    }
  };

  this.onTextInput = function(e) {
    if (this.frozen) {
      return;
    }
    if (!e.data) return;
    // console.log("TextInput:", e);
    e.preventDefault();
    e.stopPropagation();
    // necessary for handling dead keys properly
    this.skipNextObservation=true;
    this.transaction(function(tx, args) {
      // trying to remove the DOM selection to reduce flickering
      this.surfaceSelection.clear();
      args.text = e.data;
      return this.insertText(tx, args);
    }, this);
    this.rerenderDomSelection();
  };

  // Handling Dead-keys under OSX
  this.onCompositionStart = function() {
    // just tell DOM observer that we have everything under control
    this.skipNextObservation = true;
  };

  // a shim for textInput events based on keyPress and a horribly dangerous dance with the CE
  this.onTextInputShim = function(event) {
    if (this.frozen) {
      return;
    }
    // Filter out non-character keys. Doing this prevents:
    // * Unexpected content deletion when selection is not collapsed and the user presses, for
    //   example, the Home key (Firefox fires 'keypress' for it)
    // * Incorrect pawning when selection is collapsed and the user presses a key that is not handled
    //   elsewhere and doesn't produce any text, for example Escape
    if (
      // Catches most keys that don't produce output (charCode === 0, thus no character)
      event.which === 0 || event.charCode === 0 ||
      // Opera 12 doesn't always adhere to that convention
      event.keyCode === Surface.Keys.TAB || event.keyCode === Surface.Keys.ESCAPE ||
      // prevent combinations with meta keys, but not alt-graph which is represented as ctrl+alt
      !!(event.metaKey) || (!!event.ctrlKey^!!event.altKey)
    ) {
      return;
    }
    var character = String.fromCharCode(event.which);
    this.skipNextObservation=true;
    if (!event.shiftKey) {
      character = character.toLowerCase();
    }
    if (character.length>0) {
      this.transaction(function(tx, args) {
        // trying to remove the DOM selection to reduce flickering
        this.surfaceSelection.clear();
        args.text = character;
        return this.insertText(tx, args);
      }, this);
      this.rerenderDomSelection();
      event.preventDefault();
      event.stopPropagation();
      return;
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  this.handleLeftOrRightArrowKey = function (event) {
    var self = this;
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map the DOM selection
    window.setTimeout(function() {
      var options = {
        direction: (event.keyCode === Surface.Keys.LEFT) ? 'left' : 'right'
      };
      self._updateModelSelection(options);
      // We could rerender the selection, to make sure the DOM is representing
      // the model selection
      // TODO: ATM, the SurfaceSelection is not good enough in doing this, event.g., there
      // are situations where one can not use left/right navigation anymore, as
      // SurfaceSelection will always decides to choose the initial positition,
      // which means lockin.
      // self.rerenderDomSelection();
    });
  };

  this.handleUpOrDownArrowKey = function (event) {
    var self = this;
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map the DOM selection
    window.setTimeout(function() {
      var options = {
        direction: (event.keyCode === Surface.Keys.UP) ? 'left' : 'right'
      };
      self._updateModelSelection(options);
      // TODO: enable this when we are better, see comment above
      //self.rerenderDomSelection();
    });
  };

  this.handleSpaceKey = function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.transaction(function(tx, args) {
      // trying to remove the DOM selection to reduce flickering
      this.surfaceSelection.clear();
      args.text = " ";
      return this.insertText(tx, args);
    }, this);
    this.rerenderDomSelection();
  };

  this.handleEnterKey = function(event) {
    event.preventDefault();
    if (event.shiftKey) {
      this.transaction(function(tx, args) {
        return this.softBreak(tx, args);
      }, this);
    } else {
      this.transaction(function(tx, args) {
        return this.break(tx, args);
      }, this);
    }
    this.rerenderDomSelection();
  };

  this.handleDeleteKey = function (event) {
    event.preventDefault();
    var direction = (event.keyCode === Surface.Keys.BACKSPACE) ? 'left' : 'right';
    this.transaction(function(tx, args) {
      args.direction = direction;
      return this.delete(tx, args);
    }, this);
    this.rerenderDomSelection();
  };

  this.onMouseDown = function(event) {
    if (this.frozen) {
      this.unfreeze();
    }
    if ( event.which !== 1 ) {
      return;
    }
    // console.log('MouseDown on Surface %s', this.__id__);
    // 'mouseDown' is triggered before 'focus' so we tell
    // our focus handler that we are already dealing with it
    // The opposite situation, when the surface gets focused event.g. using keyboard
    // then the handler needs to kick in and recover a persisted selection or such
    this.skipNextFocusEvent = true;
    // Bind mouseup to the whole document in case of dragging out of the surface
    this.dragging = true;
    this.$document.one( 'mouseup', this._onMouseUp );
  };

  this.onMouseUp = function() {
    // ... and unbind the temporary handler
    this.dragging = false;
    this.setFocused(true);
    // HACK: somehow the DOM selection is sometimes not there
    var self = this;
    setTimeout(function() {
      if (self.surfaceSelection) {
        var sel = self.surfaceSelection.getSelection();
        self.textPropertyManager.removeSelection();
        self.setSelection(sel);
      }
    });
  };

  this.setFocused = function(val) {
    // transition: blurred -> focused
    if (!this.isFocused && val) {
      // console.log('Surface focus:', this.__id__);
    }
    // transition: focused -> blurred
    else if (this.isFocused && !val) {
      // console.log('Surface blur:', this.__id__);
      // when a surface gets blurred a persisted selection will be removed
      this.textPropertyManager.removeSelection();
    }
    this.isFocused = val;
    if (this.isFocused) {
      this.getController().didFocus(this);
    }
  };

  this.onMouseMove = function() {
    if (this.dragging) {
      // TODO: do we want that?
      // update selection during dragging
      // this._setModelSelection(this.surfaceSelection.getSelection());
    }
  };

  this.onDomMutations = function() {
    if (this.skipNextObservation) {
      this.skipNextObservation = false;
      return;
    }
    // Known use-cases:
    //  - Context-menu:
    //      - Delete
    //      - Note: copy, cut, paste work just fine
    //  - dragging selected text
    //  - spell correction
    console.info("We want to enable a DOM MutationObserver which catches all changes made by native interfaces (such as spell corrections, etc). Lookout for this message and try to set Surface.skipNextObservation=true when you know that you will mutate the DOM.");
  };

  this.onDragStart = function(event) {
    event.preventDefault();
    event.stopPropagation();
  };

  this.getSelection = function() {
    return this.selection;
  };

  /**
   * Set the model selection and update the DOM selection accordingly
   */
  this.setSelection = function(sel) {
    this._setSelection(sel);
  };

  this._setSelection = function(sel, silent) {
    if (!sel) {
      sel = Selection.nullSelection;
    } else if (_.isObject(sel) && !(sel instanceof Selection)) {
      sel = this.getDocument().createSelection(sel);
    }
    if (silent) {
      this._setModelSelection(sel, silent);
    } else {
      if (this._setModelSelection(sel)) {
        this.rerenderDomSelection();
      }
    }
    // Since we allow the surface be blurred natively when clicking
    // on tools we now need to make sure that the element is focused natively
    // when we set the selection
    // This is actually only a problem on FF, other proses set the focus implicitly
    // when a new DOM selection is set.
    if (!sel.isNull() && this.$element) {
      this.$element.focus();
    }
  };

  this.rerenderDomSelection = function() {
    if (this.surfaceSelection) {
      var surfaceSelection = this.surfaceSelection;
      var sel = this.getSelection();
      surfaceSelection.setSelection(sel);
    }
  };

  this.getDomNodeForId = function(nodeId) {
    return this.element.querySelector('*[data-id='+nodeId+']');
  };

  this._updateModelSelection = function(options) {
    this._setModelSelection(this.surfaceSelection.getSelection(options));
  };

  this.onNativeBlur = function() {
    // console.log('Native blur on surface', this.__id__);
    this.textPropertyManager.renderSelection(this.selection);
    this.isNativeFocused = false;
    this.skipNextFocusEvent = false;
  };

  this.onNativeFocus = function() {
    this.isNativeFocused = true;
    // console.log('Native focus on surface', this.__id__);
    // ATTENTION: native focus event is triggered before the DOM selection is there
    // Thus we need to delay this, unfortunately.
    window.setTimeout(function() {
      // when focus is handled via mouse selection
      // then everything is done already, and we do not need to handle it.
      if (this.skipNextFocusEvent) return;
      // console.log('... handling native focus on surface', this.__id__);
      if (this.isFocused){
        this.textPropertyManager.removeSelection();
        this.rerenderDomSelection();
      } else {
        var sel = this.surfaceSelection.getSelection();
        this.setFocused(true);
        this.setSelection(sel);
      }
    }.bind(this));
  };

  /**
   * Set the model selection only (without DOM selection update).
   *
   * Used internally if we derive the model selection from the DOM selcection.
   */
  this._setModelSelection = function(sel, silent) {
    sel = sel || Document.nullSelection;
    this.selection = sel;
    if (!silent) {
      this.emit('selection:changed', sel, this);
    }
    return true;
  };

  this.getLogger = function() {
    return this.logger;
  };

  this.getTextPropertyManager = function() {
    return this.textPropertyManager;
  };
};

Component.extend(Surface);

Surface.Keys =  {
  UNDEFINED: 0,
  BACKSPACE: 8,
  DELETE: 46,
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  ENTER: 13,
  END: 35,
  HOME: 36,
  TAB: 9,
  PAGEUP: 33,
  PAGEDOWN: 34,
  ESCAPE: 27,
  SHIFT: 16,
  SPACE: 32
};

Surface.detectIE = function() {
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf('MSIE ');
  if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  }
  var trident = ua.indexOf('Trident/');
  if (trident > 0) {
      // IE 11 => return version number
      var rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  }
  var edge = ua.indexOf('Edge/');
  if (edge > 0) {
     // IE 12 => return version number
     return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
  }
  // other browser
  return false;
};

module.exports = Surface;
