'use strict';

var _ = require('../../basics/helpers');
var OO = require('../../basics/oo');
var Substance = require('../../basics');
var SurfaceSelection = require('./surface_selection');
var Document = require('../../document');
var Selection = Document.Selection;
var TextPropertyManager = require('../../document/text_property_manager');

var Registry = require('../../basics/registry');
var Clipboard = require('./clipboard');

var defaultCommands = require('../commands');

var __id__ = 0;

function Surface(doc, editor, config) {
  Substance.EventEmitter.call(this);

  this.doc = doc;

  config = config || {};

  // Initialize registries
  // this._initializeComponentRegistry(config.components);
  this._initializeCommandRegistry(config.commands || defaultCommands);

  // Initialize clipboard
  this.clipboard = new Clipboard(this, doc.getClipboardImporter(), doc.getClipboardExporter());

  this.__id__ = __id__++;
  this.name = config.name || this.__id__;

  if (editor.isContainerEditor()) {
    this.textPropertyManager = new TextPropertyManager(doc, editor.getContainerId());
  } else {
    this.textPropertyManager = new TextPropertyManager(doc);
  }

  this.selection = Document.nullSelection;

  // this.element must be set via surface.attach(element)
  this.element = null;
  this.$element = null;
  this.editor = editor;

  this.surfaceSelection = null;

  this.logger = config.logger || window.console;

  this.$ = $;
  this.$window = this.$(window);
  this.$document = this.$(window.document);

  this.dragging = false;

  this._onMouseUp = _.bind(this.onMouseUp, this);
  this._onMouseDown = _.bind(this.onMouseDown, this);
  this._onMouseMove = _.bind(this.onMouseMove, this);

  this._onKeyDown = _.bind(this.onKeyDown, this);
  this._onTextInput = _.bind(this.onTextInput, this);
  this._onTextInputShim = _.bind( this.onTextInputShim, this );
  this._onCompositionStart = _.bind( this.onCompositionStart, this );

  this._onDomMutations = _.bind(this.onDomMutations, this);
  this.domObserver = new window.MutationObserver(this._onDomMutations);
  this.domObserverConfig = { subtree: true, characterData: true };
  this.skipNextObservation = false;

  this._onNativeFocus = _.bind(this.onNativeFocus, this);
  this._onNativeBlur = _.bind(this.onNativeBlur, this);

  // set when editing is enabled
  this.enabled = true;

  // surface usually gets frozen while showing a popup
  this.frozen = false;
  this.$caret = $('<span>').addClass('surface-caret');

  this.isIE = Surface.detectIE();
  this.isFF = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  this.undoEnabled = true;

  /*jshint eqnull:true */
  if (config.undoEnabled != null) {
    this.undoEnabled = config.undoEnabled;
  }
  if (config.contentEditable != null) {
    this.enableContentEditable = config.contentEditable;
  } else {
    this.enableContentEditable = true;
  }

  /*jshint eqnull:false */

  this.doc.connect(this, {
    'document:changed': this.onDocumentChanged,
    'transaction:started': this.onTransactionStarted
  }, {
    // Use lower priority so that everyting is up2date
    // when we render the selection
    priority: -10
  });
}

Surface.Prototype = function() {

  // FIXME: even if this seems to be very hacky,
  // it is quite useful to make transactions 'app-compatible'
  this.onTransactionStarted = function(tx) {
    /* jshint unused: false */
    // // store the state so that it can be recovered when undo/redo
    // tx.before.state = this.state;
    // tx.before.selection = this.getSelection();
  };

  this.onDocumentChanged = function(change, info) {

    // On undo/redo
    // ----------

    if (info.replay) {
      var selection = change.after.selection;
      var surfaceId = change.after.surfaceId;

      if (surfaceId === this.__id__) {
        // Will be focused automatically
        this.setSelection(selection);
      }
    }
  };

  // this._initializeComponentRegistry = function(components) {
  //   var componentRegistry = new Registry();
  //   _.each(components, function(ComponentClass, name) {
  //     componentRegistry.add(name, ComponentClass);
  //   });
  //   this.componentRegistry = componentRegistry;
  // };

  this._initializeCommandRegistry = function(commands) {
    var commandRegistry = new Registry();
    _.each(commands, function(CommandClass) {
      var cmd = new CommandClass(this);
      commandRegistry.add(CommandClass.static.name, cmd);
    }, this);
    this.commandRegistry = commandRegistry;
  };

  // this.getComponent = function(name) {
  //   return this.componentRegistry.get(name);
  // };

  this.getClipboard = function() {
    return this.clipboard;
  };

  // Command API
  // ----------------

  this.getCommand = function(commandName) {
    return this.commandRegistry.get(commandName);
  };

  this.executeCommand = function(commandName) {
    var cmd = this.getCommand(commandName);
    if (!cmd) {
      console.warn('command', commandName, 'not registered on surface');
      return;
    }

    // Run command
    var info = cmd.execute();
    if (info) {
      this.emit('command:executed', info, commandName);
      // TODO: We want to replace this with a more specific, scoped event
      // but for that we need an improved EventEmitter API
      // this.emit('command:executed', 'commandName', info, commandName);
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

  this.getContainerName = function() {
    console.warn('DEPRECATED: Use getContainerId()');
    return this.getContainerId();
  };

  this.getContainerId = function() {
    if (this.editor.isContainerEditor()) {
      return this.editor.getContainerId();
    }
  };

  this.getContainer = function() {
    if (this.editor.isContainerEditor()) {
      return this.getDocument().get(this.editor.getContainerId());
    }
  };

  this.getEditor = function() {
    return this.editor;
  };

  this.getDocument = function() {
    return this.doc;
  };

  this.dispose = function() {
    this.setSelection(null);
    this.detach();
    
    this.clipboard.detach(this.$el[0]);
  };

  this.attach = function(element) {
    if (!element) {
      throw new Error('Illegal argument: Surface element is required. was ' + element);
    }

    if (this.attached) {
      throw new Error('Surface is already attached to element: ' + element);
    }

    var doc = this.getDocument();

    // Initialization
    this.element = element;
    this.$element = $(element);

    this.surfaceSelection = new SurfaceSelection(element, doc, this.getContainer());

    this.$element.addClass('surface');

    // Keyboard Events
    //
    this.attachKeyboard();

    // Mouse Events
    //
    this.$element.on('mousedown', this._onMouseDown);

    // disable drag'n'drop
    this.$element.on('dragstart', this.onDragStart);

    // we will react on this to render a custom selection
    this.$element.on('focus', this._onNativeFocus);
    this.$element.on('blur', this._onNativeBlur);

    // Document Change Events
    //
    this.domObserver.observe(element, this.domObserverConfig);

    this.attached = true;
  };

  this.attachKeyboard = function() {
    this.$element.on('keydown', this._onKeyDown);
    // OSX specific handling of dead-keys
    if (this.element.addEventListener) {
      this.element.addEventListener('compositionstart', this._onCompositionStart, false);
    }
    if (window.TextEvent && !this.isIE) {
      this.element.addEventListener('textInput', this._onTextInput, false);
    } else {
      this.$element.on('keypress', this._onTextInputShim);
    }
  };

  this.detach = function() {
    var doc = this.getDocument();

    this.domObserver.disconnect();

    // Document Change Events
    //
    doc.disconnect(this);

    // Mouse Events
    //
    this.$element.off('mousedown', this._onMouseDown );

    // enable drag'n'drop
    this.$element.off('dragstart', this.onDragStart);

    // Keyboard Events
    //
    this.detachKeyboard();

    this.$element.removeClass('surface');

    // Clean-up
    //
    this.element = null;
    this.$element = null;
    this.surfaceSelection = null;

    this.attached = false;
  };

  this.detachKeyboard = function() {
    this.$element.off('keydown', this._onKeyDown);
    if (this.element.addEventListener) {
      this.element.removeEventListener('compositionstart', this._onCompositionStart, false);
    }
    if (window.TextEvent && !this.isIE) {
      this.element.removeEventListener('textInput', this._onTextInput, false);
    } else {
      this.$element.off('keypress', this._onTextInputShim);
    }
  };

  this.isAttached = function() {
    return this.attached;
  };

  this.enable = function() {
    if (this.enableContentEditable) {
      this.$element.prop('contentEditable', 'true');
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

  this.freeze = function() {
    console.log('Freezing surface...');
    if (this.enableContentEditable) {
      this.$element.removeAttr('contentEditable');
    }
    this.$element.addClass('frozen');
    this.domObserver.disconnect();
    this.frozen = true;
  };

  this.unfreeze = function() {
    if (!this.frozen) {
      return;
    }
    console.log('Unfreezing surface...');
    if (this.enableContentEditable) {
      this.$element.prop('contentEditable', 'true');
    }
    this.$element.removeClass('frozen');
    this.domObserver.observe(this.element, this.domObserverConfig);
    this.frozen = false;
  };

  // ###########################################
  // Keyboard Handling
  //

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
      this.executeCommand('selectAll');
      handled = true;
    }
    // Undo/Redo: cmd+z, cmd+shift+z
    else if (this.undoEnabled && e.keyCode === 90 && (e.metaKey||e.ctrlKey)) {
      if (e.shiftKey) {
        this.executeCommand('redo');
      } else {
        this.executeCommand('undo');
      }
      handled = true;
    }
    // Toggle strong: cmd+b ctrl+b
    else if (e.keyCode === 66 && (e.metaKey||e.ctrlKey)) {
      this.executeCommand('toggleStrong');
      handled = true;
    }
    // Toggle emphasis: cmd+i ctrl+i
    else if (e.keyCode === 73 && (e.metaKey||e.ctrlKey)) {
      this.executeCommand('toggleEmphasis');
      handled = true;
    }
    // Toggle link: cmd+l ctrl+l
    else if (e.keyCode === 76 && (e.metaKey||e.ctrlKey)) {
      this.executeCommand('toggleLink');
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  /**
   * Run a transformation as a transaction properly configured for this surface.
   * @param beforeState (optional) use this to override the default before-state (e.g. to use a different the initial selection).
   * @param transformation a (surface) transformation function(tx, args) which receives
   *                       the selection the transaction was started with, and should return
   *                       output arguments containing a selection, as well.
   * @param ctx (optional) will be used as `this` object when calling the transformation.
   *
   * @example
   *
   *   ```
   *   surface.transaction(function(tx, args) {
   *     var selection = args.selection;
   *     ...
   *     selection = tx.createSelection(...);
   *     return {
   *       selection: selection
   *     };
   *   });
   *
   *   surface.transaction(function(tx, args) {
   *     ...
   *     this.foo();
   *     ...
   *     return args;
   *   }, this);
   *
   *   surface.transaction(beforeState, function(tx, args) {
   *     ...
   *   });
   *   ```
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
    this.getDocument().transaction(beforeState, function(tx) {
      // A transformation receives a set of input arguments and should return a set of output arguments.
      var result = transformation.call(ctx, tx, { selection: beforeState.selection });
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

    this.setSelection(afterState.selection);
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
      return this.editor.insertText(tx, { selection: args.selection, text: e.data });
    }, this);
    this.rerenderDomSelection();
  };

  // Handling Dead-keys under OSX
  this.onCompositionStart = function() {
    // just tell DOM observer that we have everything under control
    this.skipNextObservation = true;
  };

  // a shim for textInput events based on keyPress and a horribly dangerous dance with the CE
  this.onTextInputShim = function( e ) {
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
      e.which === 0 || e.charCode === 0 ||
      // Opera 12 doesn't always adhere to that convention
      e.keyCode === Surface.Keys.TAB || e.keyCode === Surface.Keys.ESCAPE ||
      // prevent combinations with meta keys, but not alt-graph which is represented as ctrl+alt
      !!(e.metaKey) || (!!e.ctrlKey^!!e.altKey)
    ) {
      return;
    }
    var character = String.fromCharCode(e.which);
    this.skipNextObservation=true;
    if (!e.shiftKey) {
      character = character.toLowerCase();
    }
    if (character.length>0) {
      this.transaction(function(tx, args) {
        // trying to remove the DOM selection to reduce flickering
        this.surfaceSelection.clear();
        return this.editor.insertText(tx, { selection: args.selection, text: character });
      }, this);
      this.rerenderDomSelection();
      e.preventDefault();
      e.stopPropagation();
      return;
    } else {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  this.handleLeftOrRightArrowKey = function ( e ) {
    var self = this;
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map the DOM selection
    window.setTimeout(function() {
      var options = {
        direction: (e.keyCode === Surface.Keys.LEFT) ? 'left' : 'right'
      };
      self._updateModelSelection(options);
      // We could rerender the selection, to make sure the DOM is representing
      // the model selection
      // TODO: ATM, the SurfaceSelection is not good enough in doing this, e.g., there
      // are situations where one can not use left/right navigation anymore, as
      // SurfaceSelection will always decides to choose the initial positition,
      // which means lockin.
      // self.rerenderDomSelection();
    });
  };

  this.handleUpOrDownArrowKey = function ( e ) {
    var self = this;
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map the DOM selection
    window.setTimeout(function() {
      var options = {
        direction: (e.keyCode === Surface.Keys.UP) ? 'left' : 'right'
      };
      self._updateModelSelection(options);
      // TODO: enable this when we are better, see comment above
      //self.rerenderDomSelection();
    });
  };

  this.handleSpaceKey = function( e ) {
    e.preventDefault();
    e.stopPropagation();
    this.transaction(function(tx, args) {
      // trying to remove the DOM selection to reduce flickering
      this.surfaceSelection.clear();
      return this.editor.insertText(tx, { selection: args.selection, text: " " });
    }, this);
    this.rerenderDomSelection();
  };

  this.handleEnterKey = function( e ) {
    e.preventDefault();
    if (e.shiftKey) {
      this.transaction(function(tx, args) {
        return this.editor.softBreak(tx, args);
      }, this);
    } else {
      this.transaction(function(tx, args) {
        return this.editor.break(tx, args);
      }, this);
    }
    this.rerenderDomSelection();
  };

  this.handleDeleteKey = function ( e ) {
    e.preventDefault();
    var direction = (e.keyCode === Surface.Keys.BACKSPACE) ? 'left' : 'right';
    this.transaction(function(tx, args) {
      return this.editor.delete(tx, { selection: args.selection, direction: direction });
    }, this);
    this.rerenderDomSelection();
  };

  // ###########################################
  // Mouse Handling
  //

  this.onMouseDown = function(e) {
    if (this.frozen) {
      this.unfreeze();
    }
    if ( e.which !== 1 ) {
      return;
    }
    // Bind mouseup to the whole document in case of dragging out of the surface
    this.dragging = true;
    this.$document.one( 'mouseup', this._onMouseUp );
  };

  this.onMouseUp = function(/*e*/) {
    // ... and unbind the temporary handler
    this.dragging = false;
    this.setFocused(true);
    // HACK: somehow the DOM selection is sometimes not there
    var self = this;
    setTimeout(function() {
      if (self.surfaceSelection) {
        var sel = self.surfaceSelection.getSelection();
        self.setSelection(sel);
      }
    });
  };

  this.setFocused = function(val) {
    this.isFocused = val;
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

  this.onDragStart = function(e) {
    e.preventDefault();
    e.stopPropagation();
  };

  // ###########################################
  // Document and Selection Changes
  //

  this.getSelection = function() {
    return this.selection;
  };

  /**
   * Set the model selection and update the DOM selection accordingly
   */
  this.setSelection = function(sel) {
    if (!sel) {
      sel = Selection.nullSelection;
    } else if (_.isObject(sel) && !(sel instanceof Selection)) {
      sel = this.getDocument().createSelection(sel);
    }
    if (this._setModelSelection(sel)) {
      this.rerenderDomSelection();
    }
  };

  this.rerenderDomSelection = function() {
    if (this.surfaceSelection) {
      var surfaceSelection = this.surfaceSelection;
      var sel = this.getSelection();
      // This delay was just necessary in case of async rerendering, e.g., with react.
      // without it, the observed DOM selection flickering seems much better.
      // setTimeout(function() {
      surfaceSelection.setSelection(sel);
      // });
    }
  };

  this.getDomNodeForId = function(nodeId) {
    return this.element.querySelector('*[data-id='+nodeId+']');
  };

  this._updateModelSelection = function(options) {
    this._setModelSelection(this.surfaceSelection.getSelection(options));
  };

  this.onNativeBlur = function() {
    console.log('Blurring surface', this.__id__);
    this.textPropertyManager.renderSelection(this.selection);
  };

  this.onNativeFocus = function() {
    console.log('Focusing surface', this.__id__);
    this.textPropertyManager.removeSelection();
  };

  /**
   * Set the model selection only (without DOM selection update).
   *
   * Used internally if we derive the model selection from the DOM selcection.
   */
  this._setModelSelection = function(sel) {
    sel = sel || Substance.Document.nullSelection;
    this.selection = sel;
    this.emit('selection:changed', sel, this);
    return true;
  };

  this.getLogger = function() {
    return this.logger;
  };

  // EXPERIMENTAL:
  // Adds a span at the current cursor position. This way it is possible to
  // layout a popup relative to the cursor.
  this.placeCaretElement = function() {
    var sel = this.getSelection();
    if (sel.isNull()) {
      throw new Error('Selection is null.');
    }
    var $caret = this.$caret;
    $caret.empty().remove();
    var pos = this.surfaceSelection._findDomPosition(sel.start.path, sel.start.offset);
    if (pos.node.nodeType === window.Node.TEXT_NODE) {
      var textNode = pos.node;
      if (textNode.length === pos.offset) {
        $caret.insertAfter(textNode);
      } else {
        // split the text node into two pieces
        var wsel = window.getSelection();
        var wrange = window.document.createRange();
        var text = textNode.textContent;
        var frag = window.document.createDocumentFragment();
        var textFrag = window.document.createTextNode(text.substring(0, pos.offset));
        frag.appendChild(textFrag);
        frag.appendChild($caret[0]);
        frag.appendChild(document.createTextNode(text.substring(pos.offset)));
        $(textNode).replaceWith(frag);
        wrange.setStart(textFrag, pos.offset);
        wsel.removeAllRanges();
        wsel.addRange(wrange);
      }
    } else {
      pos.node.appendChild($caret[0]);
    }
    return $caret;
  };

  this.removeCaretElement = function() {
    this.$caret.remove();
  };

  this.updateCaretElement = function() {
    this.$caret.remove();
    this.placeCaretElement();
  };

  this.getTextPropertyManager = function() {
    return this.textPropertyManager;
  };
};

OO.inherit(Surface, Substance.EventEmitter);

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
