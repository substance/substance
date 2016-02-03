'use strict';

var $ = require('../util/jquery');
var isEqual = require('lodash/isEqual');
var each = require('lodash/each');
var platform = require('../util/platform');
var Registry = require('../util/Registry');
var copySelection = require('../model/transform/copySelection');
var insertText = require('../model/transform/insertText');
var deleteSelection = require('../model/transform/deleteSelection');
var DOMSelection = require('./DOMSelection');
var Clipboard = require('./Clipboard');
var Component = require('./Component');
var $$ = Component.$$;
var UnsupportedNode = require('./UnsupportedNode');

/**
   Abstract interface for editing components.
   Dances with contenteditable, so you don't have to.

   @class
   @component
   @abstract
*/
function Surface() {
  Surface.super.apply(this, arguments);

  this.controller = this.context.controller || this.props.controller;
  if (!this.controller) {
    throw new Error('Surface needs a valid controller');
  }
  this.documentSession = this.controller.getDocumentSession();
  this.name = this.props.name;
  if (!this.name) {
    throw new Error('No id provided');
  }

  this.clipboard = new Clipboard(this);
  var doc = this.documentSession.getDocument();

  this.domSelection = null;

  this.onDomMutations = this.onDomMutations.bind(this);
  this.domObserver = new window.MutationObserver(this.onDomMutations);
  this.domObserverConfig = { subtree: true, characterData: true };
  this.skipNextObservation = false;

  // HACK: we need to listen to mousup on document
  // to catch events outside the surface
  this.$document = $(window.document);
  this.onMouseUp = this.onMouseUp.bind(this);

  // set when editing is enabled
  this.enabled = true;
  this.undoEnabled = true;
  this.textTypes = this.props.textTypes;
  this._initializeCommandRegistry(this.props.commands);

  this.controller.registerSurface(this);

  // a registry for TextProperties which allows us to dispatch changes
  this._textProperties = {};
  this._annotations = {};

  doc.on('document:changed', this.onDocumentChange, this);
  // Only react to changes done via documentSession.setSelection
  // in the other case we are dealing with it ourself
  this.documentSession.on('selection:changed:explicitly', this.onSelectionChange, this);
}

Surface.Prototype = function() {

  this.render = function() {
    var tagName = this.props.tagName || 'div';
    var el = $$(tagName)
      .addClass('sc-surface')
      .attr('spellCheck', false);

    if (this.isEditable()) {
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
    }

    if (!this.isReadonly()) {
      // Mouse Events
      el.on('mousedown', this.onMouseDown);

      // disable drag'n'drop
      el.on('dragstart', this.onDragStart);

      // we will react on this to render a custom selection
      el.on('focus', this.onNativeFocus);
      el.on('blur', this.onNativeBlur);

      this.clipboard.attach(el);
    }

    return el;
  };

  this.didMount = function() {
    if (!this.isReadonly()) {
      this.domSelection = new DOMSelection(this.el, this.getDocument(), this.getContainer());
      this.clipboard.didMount();
      // Document Change Events
      this.domObserver.observe(this.el, this.domObserverConfig);
    }
  };

  this.dispose = function() {
    var doc = this.getDocument();
    doc.disconnect(this);
    this.domSelection = null;
    this.domObserver.disconnect();
    this.getController().unregisterSurface(this);
  };

  this.getChildContext = function() {
    return {
      surface: this,
      doc: this.getDocument()
    };
  };

  this.getName = function() {
    return this.name;
  };

  this.isEditable = function() {
    return (this.props.editing === "full" ||  this.props.editing === undefined);
  };

  this.isSelectable = function() {
    return (this.props.editing === "selection" ||  this.props.editing === "full");
  };

  this.isReadonly = function() {
    return this.props.editing === "readonly";
  };

  this.getCommand = function(commandName) {
    return this.commandRegistry.get(commandName);
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

  this.getElement = function() {
    return this.el;
  };

  this.getController = function() {
    return this.controller;
  };

  this.getDocument = function() {
    return this.documentSession.getDocument();
  };

  this.getDocumentSession = function() {
    return this.documentSession;
  };

  this.enable = function() {
    // As opposed to a ContainerEditor, a regular Surface
    // is not a ContentEditable -- but every contained TextProperty
    console.log('TODO: enable all contained TextProperties');
    this.enabled = true;
  };

  this.disable = function() {
    console.log('TODO: disable all contained TextProperties');
    this.enabled = false;
  };

  this.isEnabled = function() {
    return this.enabled;
  };

  this.isContainerEditor = function() {
    return false;
  };


  /**
    Run a transformation as a transaction properly configured for this surface.

    @param transformation a transformation function(tx, args) which receives
                          the selection the transaction was started with, and should return
                          output arguments containing a selection, as well.

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

    Adding event information to the transaction:

    ```js
    surface.transaction(function(tx, args) {
      tx.info.foo = 'bar';
      ...
    });
    ```
   */
  this.transaction = function(transformation) {
    var documentSession = this.documentSession;
    var surfaceId = this.getName();
    // using the silent version, so that the selection:changed event does not get emitted too early
    documentSession.transaction(function(tx, args) {
      // `beforeState` is saved with the document operation and will be used
      // to recover the selection when using 'undo'.
      tx.before.surfaceId = surfaceId;
      return transformation(tx, args);
    });
  };

  this.setFocused = function() {
    console.log('DEPRECATED: this is should not be necessary anymore.');
    console.log('Maybe you want the native focus? then you can try surface.focus()');
  };

  this.getSelection = function() {
    return this.documentSession.getSelection();
  };

  /**
   * Set the model selection and update the DOM selection accordingly
   */
  this.setSelection = function(sel) {
    // storing the surface id so that we can associate
    // the selection with this surface later
    if (!sel.isNull()) {
      sel.surfaceId = this.name;
    }
    this._setSelection(sel);
  };

  this.setSelectionFromEvent = function(evt) {
    this.skipNextFocusEvent = true;
    var domRange = Surface.getDOMRangeFromEvent(evt);
    var sel = this.domSelection.getSelectionFromDOMRange(domRange);
    this.setSelection(sel);
  };

  this.rerenderDomSelection = function() {
    if (this.domSelection) {
      var domSelection = this.domSelection;
      var sel = this.getSelection();
      // console.log('Re-rendering DOM selection', sel.toString(), this.__id__);
      domSelection.setSelection(sel);
    }
  };

  this.getDomNodeForId = function(nodeId) {
    return this.getElement().querySelector('*[data-id="'+nodeId+'"]');
  };

  /* Editing behavior */

  /* Note: In a regular Surface all text properties are treated independently
     like in a form */

  /**
    Selects all text
  */
  this.selectAll = function() {
    var doc = this.getDocument();
    var sel = this.getSelection();
    if (sel.isPropertySelection()) {
      var path = sel.path;
      var text = doc.get(path);
      sel = doc.createSelection({
        type: 'property',
        path: path,
        startOffset: 0,
        endOffset: text.length
      });
      this.setSelection(sel);
    }
  };

  /**
    Performs an {@link model/transform/insertText} transformation
  */
  this.insertText = function(tx, args) {
    var sel = args.selection;
    if (sel.isPropertySelection() || sel.isContainerSelection()) {
      return insertText(tx, args);
    }
  };

  /**
    Performs a {@link model/transform/deleteSelection} transformation
  */
  this.delete = function(tx, args) {
    return deleteSelection(tx, args);
  };

  // No breaking in properties, insert softbreak instead
  this.break = function(tx, args) {
    return this.softBreak(tx, args);
  };

  /**
    Inserts a soft break
  */
  this.softBreak = function(tx, args) {
    args.text = "\n";
    return this.insertText(tx, args);
  };

  /**
    Copy the current selection. Performs a {@link model/transform/copySelection}
    transformation.
  */
  this.copy = function(doc, selection) {
    var result = copySelection(doc, { selection: selection });
    return result.doc;
  };

  /**
    Performs a {@link model/transform/paste} transformation
  */
  this.paste = function(tx, args) {
    // TODO: for now only plain text is inserted
    // We could do some stitching however, preserving the annotations
    // received in the document
    if (args.text) {
      return this.insertText(tx, args);
    }
  };

  /* Event handlers */

  this.onDocumentChange = function(change) {
    change.updated.forEach(function(path) {
      var comp = this._textProperties[path];
      if (comp) {
        comp.rerender();
      }
    }.bind(this));
    if (this.domSelection) {
      // console.log('Rerendering DOM selection after document change.', this.__id__);
      this.rerenderDomSelection();
    }
    this.emit('selection:changed', this.getSelection());
  };

  this.onSelectionChange = function() {
    // console.log('Rerendering DOM selection after selection change.');
    this.rerenderDomSelection();
    this.emit('selection:changed', this.getSelection());
  };

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
      this.domSelection.clear();
      args.text = event.data;
      return this.insertText(tx, args);
    }.bind(this));
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
        this.domSelection.clear();
        args.text = character;
        return this.insertText(tx, args);
      }.bind(this));
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
      } else if (sel.isContainerSelection()) {
        this._selectProperty(sel.startPath);
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
    this.$document.one('mouseup', this.onMouseUp);
  };

  this.onMouseUp = function() {
    // ... and unbind the temporary handler
    // this.setFocused(true);
    // ATTENTION: this delay is necessary for cases the user clicks
    // into an existing selection. In this case the window selection still
    // holds the old value, and is set to the correct selection after this
    // being called.
    setTimeout(function() {
      if (this.domSelection) {
        var sel = this.domSelection.getSelection();
        this.setSelection(sel);
      }
    }.bind(this));
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
    // HACK: clearing DOM selection first, which eliminates strange selection
    // artifacts coming from changing the text property structure
    // while having a rendered DOM selection.
    // window.getSelection().removeAllRanges();
    // this.isNativeFocused = false;
    // this.skipNextFocusEvent = false;
  };

  this.onNativeFocus = function() {
    // this.isNativeFocused = true;
    // // console.log('Native focus on surface', this.__id__);
    // // ATTENTION: native focus event is triggered before the DOM selection is there
    // // Thus we need to delay this, unfortunately.
    // window.setTimeout(function() {
    //   // when focus is handled via mouse selection
    //   // then everything is done already, and we do not need to handle it.
    //   if (this.skipNextFocusEvent) return;
    //   // console.log('... handling native focus on surface', this.__id__);
    //   if (this.isFocused){
    //     this.rerenderDomSelection();
    //   } else {
    //     var sel = this.domSelection.getSelection();
    //     this.setFocused(true);
    //     this.setSelection(sel);
    //   }
    // }.bind(this));
  };


  // Internal implementations

  this._initializeCommandRegistry = function(commands) {
    var commandRegistry = new Registry();
    each(commands, function(CommandClass) {
      var cmd = new CommandClass(this);
      commandRegistry.add(CommandClass.static.name, cmd);
    }.bind(this));
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
      // TODO: ATM, the DOMSelection is not good enough in doing this, event.g., there
      // are situations where one can not use left/right navigation anymore, as
      // DOMSelection will always decides to choose the initial positition,
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
    });
  };

  this._isDisposed = function() {
    // HACK: if domSelection === null, this surface has been disposed
    return !this.domSelection;
  };

  this._handleSpaceKey = function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.transaction(function(tx, args) {
      // trying to remove the DOM selection to reduce flickering
      this.domSelection.clear();
      args.text = " ";
      return this.insertText(tx, args);
    }.bind(this));
  };

  this._handleEnterKey = function(event) {
    event.preventDefault();
    if (event.shiftKey) {
      this.transaction(function(tx, args) {
        return this.softBreak(tx, args);
      }.bind(this));
    } else {
      this.transaction(function(tx, args) {
        return this.break(tx, args);
      }.bind(this));
    }
  };

  this._handleDeleteKey = function (event) {
    event.preventDefault();
    var direction = (event.keyCode === Surface.Keys.BACKSPACE) ? 'left' : 'right';
    this.transaction(function(tx, args) {
      args.direction = direction;
      return this.delete(tx, args);
    }.bind(this));
  };

  this._setSelection = function(sel) {
    this.documentSession.setSelection(sel);
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
    this.setSelection(this.domSelection.getSelection(options));
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

  // EXPERIMENTAL: get bounding box for current selection
  this.getBoundingRectangleForSelection = function() {
    var wsel = window.getSelection();
    // having a DOM selection?
    if (wsel.rangeCount > 0) {
      var wrange = wsel.getRangeAt(0);
      // unfortunately, collapsed selections to not have a boundary rectangle
      // thus we need to insert a span temporarily and take its rectangle
      if (wrange.collapsed) {
        var span = document.createElement('span');
        // Ensure span has dimensions and position by
        // adding a zero-width space character
        this.skipNextObservation = true;
        span.appendChild(window.document.createTextNode("\u200b"));
        wrange.insertNode(span);
        var rect = span.getBoundingClientRect();
        var spanParent = span.parentNode;
        spanParent.removeChild(span);
        // Glue any broken text nodes back together
        spanParent.normalize();
        return rect;
      } else {
        return wrange.getBoundingClientRect();
      }
    } else {
      var sel = this.getSelection();
      if (sel.isNull()) {
        return {};
      } else {
        if (sel.isCollapsed()) {
          var cursorEl = this.el.querySelector('.se-cursor');
          if (cursorEl) {
            return cursorEl.getBoundingClientRect();
          } else {
            console.log('FIXME: there should be a rendered cursor element.');
            return {};
          }
        } else {
          var selFragments = this.el.querySelectorAll('.se-selection-fragment');
          if (selFragments.length > 0) {
            var bottom = 0;
            var top = 0;
            var right = 0;
            var left = 0;
            selFragments.forEach(function(el) {
              var rect = el.getBoundingClientRect();
              bottom = Math.max(rect.bottom, bottom);
              top = Math.min(rect.top, top);
              left = Math.min(rect.left, left);
              right = Math.max(rect.right, right);
            });
            var height = bottom - top;
            var width = right -left;
            return {
              top: top, bottom: bottom,
              left: left, right: right,
              width: width, height: height
            };
          } else {
            console.log('FIXME: there should be a rendered selection fragments element.');
          }
        }
      }
    }
  };

  // internal API for TextProperties to enable dispatching
  // TextProperty components are registered via path
  // Annotations are just registered via path for lookup, not as instances

  this._registerTextProperty = function(path, component) {
    this._textProperties[path] = component;
  };

  this._unregisterTextProperty = function(path) {
    delete this._textProperties[path];
    each(this._annotations, function(_path, id) {
      if (isEqual(path, _path)) {
        delete this._annotations[id];
      }
    }.bind(this));
  };

  this._getFragments = function(path) {
    return [];
  };

  // TODO: we could integrate container node rendering into this helper
  this._renderNode = function(nodeId) {
    var doc = this.getDocument();
    var node = doc.get(nodeId);
    var componentRegistry = this.context.componentRegistry || this.props.componentRegistry;
    var ComponentClass = componentRegistry.get(node.type);
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type);
      ComponentClass = UnsupportedNode;
    }
    return $$(ComponentClass, {
      doc: doc,
      node: node
    });
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
