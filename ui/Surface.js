'use strict';

var _ = require('../util/helpers');
var Registry = require('../util/Registry');
var SurfaceSelection = require('./SurfaceSelection');
var Document = require('../model/Document');
var Selection = require('../model/Selection');
var Component = require('./Component');
var Clipboard = require('./Clipboard');
var $$ = Component.$$;
var $ = require('../util/jquery');
var copySelection = require('../model/transform/copySelection');
var platform = require('../util/platform');

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
  var doc =  this.getDocument();

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
  this.clipboard = new Clipboard(this);

  // HACK: we need to listen to mousup on document
  // to catch events outside the surface, mouseup event must be listened on $document
  this.$document = $(window.document);
  this.onMouseUp = this.onMouseUp.bind(this);
  // <----

  this.surfaceSelection = null;
  this.dragging = false;
  this.onDomMutations = this.onDomMutations.bind(this);
  this.domObserver = new window.MutationObserver(this.onDomMutations);
  this.domObserverConfig = { subtree: true, characterData: true };
  this.skipNextObservation = false;

  // set when editing is enabled
  this.enabled = true;
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
    if (!platform.isIE) {
      el.on('compositionstart', this.onCompositionStart);
    }

    // Note: TextEvent in Chrome/Webkit is the easiest for us
    // as it contains the actual inserted string.
    // Though, it is not available in FF and not working properly in IE
    // where we fall back to a ContentEditable backed implementation.
    if (window.TextEvent && !platform.isIE) {
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

    this.clipboard.attach(el);

    return el;
  };

  this.didMount = function() {
    var doc = this.getDocument();
    this.surfaceSelection = new SurfaceSelection(this.el, doc, this.getContainer());
    this.clipboard.didMount();
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
      surface: this,
      doc: this.getDocument()
    };
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
    return (this.context.controller ||
      // used in test-suite
      this.props.controller);
  };

  this.getDocument = function() {
    // TODO: decide where the doc should come from
    // I am against abusing the controller for everything
    // it should only take over tasks which can not be solved otherwise
    // Providing the doc is a bad example.
    if (this.doc) {
      return this.doc;
    }
    var doc =  this.context.doc;
    // Leaving this here for legacy reason
    if (!doc) {
      console.warn('TODO: provide the doc instance via context (or as prop).');
      var controller = this.getController();
      if (controller) {
        doc = controller.getDocument();
      }
    }
    if (!doc) {
      throw new Error('Could not retrieve document.');
    }
    this.doc = doc;
    return doc;
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
      this.el.removeAttr('contentEditable');
    }
    this.enabled = false;
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

  this.setFocused = function(val) {
    // transition: blurred -> focused
    if (!this.isFocused && val) {
      // console.log('Surface focus:', this.__id__);
      this.isFocused = val;
      this.getController().didFocus(this);
      this.emit('focus', this);
    }
    // transition: focused -> blurred
    else if (this.isFocused && !val) {
      this.isFocused = val;
      // console.log('Surface blur:', this.__id__);
      // when a surface gets blurred a persisted selection will be removed
      this.textPropertyManager.removeSelection();
      this.emit('blur', this);
    }
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

  this.setSelectionFromEvent = function(evt) {
    this.skipNextFocusEvent = true;
    var domRange = Surface.getDOMRangeFromEvent(evt);
    var sel = this.surfaceSelection.getSelectionFromDOMRange(domRange);
    this.setSelection(sel);
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

  this.getLogger = function() {
    return this.logger;
  };

  this.getTextPropertyManager = function() {
    return this.textPropertyManager;
  };

  /**
    Copy the current selection. Performs a {@link model/transform/copySelection}
    transformation.
  */
  this.copy = function(doc, selection) {
    var result = copySelection(doc, { selection: selection });
    return result.doc;
  };

  // ### event handlers

  /*
   * Handle document key down events.
   */
  this.onKeyDown = function(event) {
    if ( event.which === 229 ) {
      // ignore fake IME events (emitted in IE and Chromium)
      return;
    }
    switch ( event.keyCode ) {
      case Surface.Keys.LEFT:
      case Surface.Keys.RIGHT:
        return this._handleLeftOrRightArrowKey(event);
      case Surface.Keys.UP:
      case Surface.Keys.DOWN:
        return this._handleUpOrDownArrowKey(event);
      case Surface.Keys.ENTER:
        return this._handleEnterKey(event);
      case Surface.Keys.SPACE:
        return this._handleSpaceKey(event);
      case Surface.Keys.BACKSPACE:
      case Surface.Keys.DELETE:
        return this._handleDeleteKey(event);
      default:
        break;
    }

    // Note: when adding a new handler you might want to enable this log to see keyCodes etc.
    // console.log('####', event.keyCode, event.metaKey, event.ctrlKey, event.shiftKey);

    // Built-in key combos
    // Ctrl+A: select all
    var handled = false;
    if ( (event.ctrlKey||event.metaKey) && event.keyCode === 65) {
      this.selectAll();
      handled = true;
    }
    // Undo/Redo: cmd+z, cmd+shift+z
    else if (this.undoEnabled && event.keyCode === 90 && (event.metaKey||event.ctrlKey)) {
      if (event.shiftKey) {
        this.getController().executeCommand('redo');
      } else {
        this.getController().executeCommand('undo');
      }
      handled = true;
    }
    // Toggle strong: cmd+b ctrl+b
    else if (event.keyCode === 66 && (event.metaKey||event.ctrlKey)) {
      this.executeCommand('strong');
      handled = true;
    }
    // Toggle emphasis: cmd+i ctrl+i
    else if (event.keyCode === 73 && (event.metaKey||event.ctrlKey)) {
      this.executeCommand('emphasis');
      handled = true;
    }
    // Toggle link: cmd+l ctrl+l
    else if (event.keyCode === 76 && (event.metaKey||event.ctrlKey)) {
      this.executeCommand('link');
      handled = true;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  this.onTextInput = function(event) {
    if (!event.data) return;
    // console.log("TextInput:", event);
    event.preventDefault();
    event.stopPropagation();
    // necessary for handling dead keys properly
    this.skipNextObservation=true;
    this.transaction(function(tx, args) {
      // trying to remove the DOM selection to reduce flickering
      this.surfaceSelection.clear();
      args.text = event.data;
      return this.insertText(tx, args);
    }, this);
    this.rerenderDomSelection();
  };

  // Handling Dead-keys under OSX
  this.onCompositionStart = function() {
    // just tell DOM observer that we have everything under control
    this.skipNextObservation = true;
  };

  this.onTextInputShim = function(event) {
    // Filter out non-character keys
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

  this.onMouseDown = function(event) {

    // special treatment for triple clicks
    if (!(platform.isIE && platform.version<12) && event.detail >= 3) {
      var sel = this.getSelection();
      if (sel.isPropertySelection()) {
        this._selectProperty(sel.path);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
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
    this.$document.one('mouseup', this.onMouseUp);
  };

  this.onMouseUp = function() {
    // ... and unbind the temporary handler
    this.dragging = false;
    this.setFocused(true);
    var self = this;
    var textPropertyManager = this.textPropertyManager;
    // ATTENTION: this delay is necessary for cases the user clicks
    // into an existing selection. In this case the window selection still
    // holds the old value, and is set to the correct selection after this
    // being called.
    setTimeout(function() {
      if (self.surfaceSelection) {
        var sel = self.surfaceSelection.getSelection();
        if (textPropertyManager.hasSelection()) {
          textPropertyManager.removeSelection();
          self.setSelection(sel);
        } else {
          self._setModelSelection(sel);
        }
      }
    });
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

  this.onNativeBlur = function() {
    // console.log('Native blur on surface', this.__id__);

    // clearing DOM selection first, which eliminates strange selection
    // artifacts coming from changing the text property structure
    // while having a rendered DOM selection.
    window.getSelection().removeAllRanges();
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

  // ## internal implementations

  this._initializeCommandRegistry = function(commands) {
    var commandRegistry = new Registry();
    _.each(commands, function(CommandClass) {
      var cmd = new CommandClass(this);
      commandRegistry.add(CommandClass.static.name, cmd);
    }, this);
    this.commandRegistry = commandRegistry;
  };

  this._handleLeftOrRightArrowKey = function (event) {
    var self = this;
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map the DOM selection
    window.setTimeout(function() {
      if (self._isDisposed()) return;

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

  this._handleUpOrDownArrowKey = function (event) {
    var self = this;
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map the DOM selection
    window.setTimeout(function() {
      if (self._isDisposed()) return;

      var options = {
        direction: (event.keyCode === Surface.Keys.UP) ? 'left' : 'right'
      };
      self._updateModelSelection(options);
      // TODO: enable this when we are better, see comment above
      //self.rerenderDomSelection();
    });
  };

  this._isDisposed = function() {
    // HACK: if surfaceSelection === null, this surface has been disposed
    return !this.surfaceSelection;
  };

  this._handleSpaceKey = function(event) {
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

  this._handleEnterKey = function(event) {
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

  this._handleDeleteKey = function (event) {
    event.preventDefault();
    var direction = (event.keyCode === Surface.Keys.BACKSPACE) ? 'left' : 'right';
    this.transaction(function(tx, args) {
      args.direction = direction;
      return this.delete(tx, args);
    }, this);
    this.rerenderDomSelection();
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
    // This is actually only a problem on FF, other browsers set the focus implicitly
    // when a new DOM selection is set.
    if (platform.isFF && !sel.isNull() && this.el) {
      this.el.focus();
    }
  };

  this._updateModelSelection = function(options) {
    this._setModelSelection(this.surfaceSelection.getSelection(options));
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

  this._selectProperty = function(path) {
    var doc = this.getDocument();
    var text = doc.get(path);
    this.setSelection(doc.createSelection({
      type: 'property',
      path: path,
      startOffset: 0,
      endOffset: text.length
    }));
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


Surface.getDOMRangeFromEvent = function(evt) {
  var range, x = evt.clientX, y = evt.clientY;

  // Try the simple IE way first
  if (document.body.createTextRange) {
    range = document.body.createTextRange();
    range.moveToPoint(x, y);
  }

  else if (typeof document.createRange != "undefined") {
    // Try Mozilla's rangeOffset and rangeParent properties,
    // which are exactly what we want
    if (typeof evt.rangeParent != "undefined") {
      range = document.createRange();
      range.setStart(evt.rangeParent, evt.rangeOffset);
      range.collapse(true);
    }

    // Try the standards-based way next
    else if (document.caretPositionFromPoint) {
      var pos = document.caretPositionFromPoint(x, y);
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
    }

    // Next, the WebKit way
    else if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y);
    }
  }

  return range;
};

module.exports = Surface;
