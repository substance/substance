'use strict';

import forEach from 'lodash/forEach'
import isUndefined from 'lodash/isUndefined'
import startsWith from 'lodash/startsWith'
import createSurfaceId from '../util/createSurfaceId'
import getRelativeBoundingRect from '../util/getRelativeBoundingRect'
import keys from '../util/keys'
import platform from '../util/platform'
import inBrowser from '../util/inBrowser'
import copySelection from '../model/transform/copySelection'
import deleteSelection from '../model/transform/deleteSelection'
import deleteCharacter from '../model/transform/deleteCharacter'
import insertText from '../model/transform/insertText'
import Clipboard from './Clipboard'
import Component from './Component'
import DefaultDOMElement from './DefaultDOMElement'
import DOMSelection from './DOMSelection'
import UnsupportedNode from './UnsupportedNodeComponent'

/**
   Abstract interface for editing components.
   Dances with contenteditable, so you don't have to.

   @class
   @component
   @abstract
*/
function Surface() {
  Surface.super.apply(this, arguments);

  // DocumentSession instance must be provided either as a prop
  // or via dependency-injection
  this.documentSession = this.props.documentSession || this.context.documentSession;
  if (!this.documentSession) {
    throw new Error('No DocumentSession provided');
  }
  this.name = this.props.name;
  if (!this.name) {
    throw new Error('Surface must have a name.');
  }
  if (this.name.indexOf('/') > -1) {
    // because we are using '/' to deal with nested surfaces (isolated nodes)
    throw new Error("Surface.name must not contain '/'");
  }
  // this path is an identifier unique for this surface
  // considering nesting in IsolatedNodes
  this._surfaceId = createSurfaceId(this);

  this.clipboard = new Clipboard(this, {
    converterRegistry: this.context.converterRegistry
  });

  this.domSelection = null;
  this.domObserver = null;

  // HACK: we need to listen to mousup on document
  // to catch events outside the surface
  if (inBrowser) {
    this.documentEl = DefaultDOMElement.wrapNativeElement(window.document);
  }

  // set when editing is enabled
  this.undoEnabled = true;
  this.textTypes = this.props.textTypes;

  // a registry for TextProperties which allows us to dispatch changes
  this._textProperties = {};

  this._state = {
    // true if the document session's selection is addressing this surface
    skipNextFocusEvent: false,
    skipNextObservation: false,
    // used to avoid multiple rerenderings (e.g. simultanous update of text and fragments)
    isDirty: false,
    dirtyProperties: {},
    // while fragments are provided as a hash of (type -> [Fragment])
    // we derive a hash of (prop-key -> [Fragment]); in other words, Fragments grouped by property
    fragments: {},
    // we want to show the cursor fragment only when blurred, so we keep it separated from the other fragments
    cursorFragment: null,
  };

  Surface.prototype._deriveInternalState.call(this, this.props);
}

Surface.Prototype = function() {

  this._isSurface = true;

  this.getChildContext = function() {
    return {
      surface: this,
      surfaceParent: this,
      doc: this.getDocument()
    };
  };

  this.didMount = function() {
    if (this.context.surfaceManager) {
      this.context.surfaceManager.registerSurface(this);
    }
    if (!this.isReadonly() && inBrowser) {
      this.domSelection = new DOMSelection(this);
      // this.domObserver = new window.MutationObserver(this.onDomMutations.bind(this));
      // this.domObserver.observe(this.el.getNativeElement(), { subtree: true, characterData: true, characterDataOldValue: true });
    }
    this.documentSession.on('update', this._onSessionUpdate, this);
  };


  this.dispose = function() {
    this.documentSession.off(this);
    this.domSelection = null;
    if (this.domObserver) {
      this.domObserver.disconnect();
    }
    if (this.context.surfaceManager) {
      this.context.surfaceManager.unregisterSurface(this);
    }
  };

  this.willReceiveProps = function(nextProps) {
    Surface.prototype._deriveInternalState.call(this, nextProps);
  };

  this.didUpdate = function(oldProps, oldState) {
    this._update(oldProps, oldState);
  };

  this.render = function($$) {
    var tagName = this.props.tagName || 'div';
    var el = $$(tagName)
      .addClass('sc-surface')
      .attr('spellCheck', false)
      .attr('tabindex', 2);

    if (!this.isDisabled()) {
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
        if (inBrowser && window.TextEvent && !platform.isIE) {
          el.on('textInput', this.onTextInput);
        } else {
          el.on('keypress', this.onTextInputShim);
        }
      }
      if (!this.isReadonly()) {
        // Mouse Events
        el.on('mousedown', this.onMouseDown);
        // disable drag'n'drop
        // we will react on this to render a custom selection
        el.on('focus', this.onNativeFocus);
        el.on('blur', this.onNativeBlur);
        // activate the clipboard
        this.clipboard.attach(el);
      }

      if (this.context.dragManager) {
        el.on('drop', this.onDrop);
      }

    }
    return el;
  };

  this.renderNode = function($$, node) {
    var doc = this.getDocument();
    var componentRegistry = this.getComponentRegistry();
    var ComponentClass = componentRegistry.get(node.type);
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type);
      ComponentClass = UnsupportedNode;
    }
    return $$(ComponentClass, {
      doc: doc,
      node: node
    }).ref(node.id);
  };

  this.getComponentRegistry = function() {
    return this.context.componentRegistry || this.props.componentRegistry;
  };

  this.getName = function() {
    return this.name;
  };

  this.getId = function() {
    return this._surfaceId;
  };

  this.isDisabled = function() {
    return this.props.disabled;
  };

  this.isEditable = function() {
    return (this.props.editing === "full" || this.props.editing === undefined);
  };

  this.isSelectable = function() {
    return (this.props.editing === "selection" || this.props.editing === "full");
  };

  this.isReadonly = function() {
    return this.props.editing === "readonly";
  };

  this.getElement = function() {
    return this.el;
  };

  this.getController = function() {
    return this.context.controller;
  };

  this.getDocument = function() {
    return this.documentSession.getDocument();
  };

  this.getDocumentSession = function() {
    return this.documentSession;
  };

  this.isEnabled = function() {
    return !this.state.disabled;
  };

  this.isContainerEditor = function() {
    return false;
  };

  this.getContainerId = function() {
    return null;
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
  this.transaction = function(transformation, info) {
    // TODO: we would like to get rid of this method, and only have
    // documentSession.transaction()
    // The problem is, that we need to get surfaceId into the change,
    // to be able to set the selection into the right surface.
    // ATM we put this into the selection, which is hacky, and makes it
    // unnecessarily inconvient to create selections.
    // Maybe documentSession should provide a means to augment the before/after
    // state of a change.
    var documentSession = this.documentSession;
    var surfaceId = this.getId();
    return documentSession.transaction(function(tx, args) {
      tx.before.surfaceId = surfaceId;
      return transformation(tx, args);
    }, info);
  };

  this.getSelection = function() {
    return this.documentSession.getSelection();
  };

  /**
   * Set the model selection and update the DOM selection accordingly
   */
  this.setSelection = function(sel) {
    // console.log('Surface.setSelection()', this.name, sel);
    // storing the surface id so that we can associate
    // the selection with this surface later
    if (sel && !sel.isNull()) {
      sel.surfaceId = this.getId();
      sel.containerId = sel.containerId || this.getContainerId();
    }
    this._setSelection(sel);
  };

  this.blur = function() {
    if (this.el) {
      this.el.blur();
    }
  };

  this.focus = function() {
    if (this.isDisabled()) return;
    // console.log('Focusing surface %s explicitly with Surface.focus()', this.getId());
    // NOTE: FF is causing problems with dynamically activated contenteditables
    // and focusing
    if (platform.isFF) {
      this.domSelection.clear();
      this.el.getNativeElement().blur();
    }
    this._focus();
  };

  this.rerenderDOMSelection = function() {
    if (this.isDisabled()) return;
    if (inBrowser) {
      // console.log('Surface.rerenderDOMSelection', this.__id__);
      var sel = this.getSelection();
      if (sel.surfaceId === this.getId()) {
        this.domSelection.setSelection(sel);
      }
    }
  };

  this.getDomNodeForId = function(nodeId) {
    return this.el.getNativeElement().querySelector('*[data-id="'+nodeId+'"]');
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
    var sel = args.selection;
    if (!sel.isCollapsed()) {
      return deleteSelection(tx, args);
    }
    else if (sel.isPropertySelection() || sel.isNodeSelection()) {
      return deleteCharacter(tx, args);
    }
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

  /*
   * Handle document key down events.
   */
  this.onKeyDown = function(event) {
    // console.log('Surface.onKeyDown()', this.getId());

    var commandManager = this.context.commandManager;
    if ( event.which === 229 ) {
      // ignore fake IME events (emitted in IE and Chromium)
      return;
    }
    switch ( event.keyCode ) {
      case keys.LEFT:
      case keys.RIGHT:
        return this._handleLeftOrRightArrowKey(event);
      case keys.UP:
      case keys.DOWN:
        return this._handleUpOrDownArrowKey(event);
      case keys.ENTER:
        return this._handleEnterKey(event);
      case keys.SPACE:
        return this._handleSpaceKey(event);
      case keys.BACKSPACE:
      case keys.DELETE:
        return this._handleDeleteKey(event);
      case keys.HOME:
      case keys.END:
        return this._handleHomeOrEndKey(event);
      case keys.PAGEUP:
      case keys.PAGEDOWN:
        return this._handlePageUpOrDownKey(event);
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
        commandManager.executeCommand('redo');
      } else {
        commandManager.executeCommand('undo');
      }
      handled = true;
    }
    // Toggle strong: cmd+b ctrl+b
    else if (event.keyCode === 66 && (event.metaKey||event.ctrlKey)) {
      commandManager.executeCommand('strong');
      handled = true;
    }
    // Toggle emphasis: cmd+i ctrl+i
    else if (event.keyCode === 73 && (event.metaKey||event.ctrlKey)) {
      commandManager.executeCommand('emphasis');
      handled = true;
    }
    // Toggle link: cmd+k ctrl+k
    else if (event.keyCode === 75 && (event.metaKey||event.ctrlKey)) {
      commandManager.executeCommand('link');
      handled = true;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  this.onTextInput = function(event) {
    // console.log("TextInput:", event);
    event.preventDefault();
    event.stopPropagation();
    if (!event.data) return;
    // necessary for handling dead keys properly
    this._state.skipNextObservation=true;
    this.transaction(function(tx, args) {
      if (this.domSelection) {
        // trying to remove the DOM selection to reduce flickering
        this.domSelection.clear();
      }
      args.text = event.data;
      return this.insertText(tx, args);
    }.bind(this), { action: 'type' });
  };

  // Handling Dead-keys under OSX
  this.onCompositionStart = function() {
    // just tell DOM observer that we have everything under control
    this._state.skipNextObservation = true;
  };

  this.onTextInputShim = function(event) {
    // Filter out non-character keys
    if (
      // Catches most keys that don't produce output (charCode === 0, thus no character)
      event.which === 0 || event.charCode === 0 ||
      // Opera 12 doesn't always adhere to that convention
      event.keyCode === keys.TAB || event.keyCode === keys.ESCAPE ||
      // prevent combinations with meta keys, but not alt-graph which is represented as ctrl+alt
      Boolean(event.metaKey) || (Boolean(event.ctrlKey)^Boolean(event.altKey))
    ) {
      return;
    }
    var character = String.fromCharCode(event.which);
    this._state.skipNextObservation=true;
    if (!event.shiftKey) {
      character = character.toLowerCase();
    }
    if (character.length>0) {
      this.transaction(function(tx, args) {
        if (this.domSelection) {
          // trying to remove the DOM selection to reduce flickering
          this.domSelection.clear();
        }
        args.text = character;
        return this.insertText(tx, args);
      }.bind(this), { action: 'type' });
      event.preventDefault();
      event.stopPropagation();
      return;
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  // TODO: the whole mouse event based selection mechanism needs
  // to be redesigned. The current implementation works basically
  // though, there are some things which do not work well cross-browser
  // particularly, double- and triple clicks.
  // also it turned out to be problematic to react on mouse down instantly
  this.onMouseDown = function(event) {
    // console.log('mousedown on', this.getId());
    // event.stopPropagation();

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
    // TODO: what is this exactly?
    if ( event.which !== 1 ) {
      return;
    }
    // 'mouseDown' is triggered before 'focus' so we tell
    // our focus handler that we are already dealing with it
    // The opposite situation, when the surface gets focused e.g. using keyboard
    // then the handler needs to kick in and recover a persisted selection or such
    this._state.skipNextFocusEvent = true;

    // UX-wise, the proper way is to apply the selection on mousedown, and if a drag is started (range selection)
    // we could maybe map the selection during the drag, but finally once after mouse is released.
    // TODO: this needs to be solved properly; be aware of browser incompatibilities
    // HACK: not working in IE which then does not allow a range selection anymore
    // if (!platform.isIE) {
    //   // HACK: clearing the DOM selection, otherwise we have troubles with the old selection being in the way for the next selection
    //   this.domSelection.clear();
    //   setTimeout(function() {
    //     if (this.domSelection) {
    //       var sel = this.domSelection.getSelection();
    //       this.setSelection(sel);
    //     }
    //   }.bind(this));
    // }

    // Bind mouseup to the whole document in case of dragging out of the surface
    if (this.documentEl) {
      // TODO: we should handle mouse up only if we started a drag (and the selection has really changed)
      this.documentEl.on('mouseup', this.onMouseUp, this, { once: true });
    }
  };

  this.onMouseUp = function() {
    // console.log('mouseup on', this.getId());
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

  this.onDomMutations = function(e) {
    if (this._state.skipNextObservation) {
      this._state.skipNextObservation = false;
      return;
    }
    // Known use-cases:
    //  - Context-menu:
    //      - Delete
    //      - Note: copy, cut, paste work just fine
    //  - dragging selected text
    //  - spell correction
    console.info("We want to enable a DOM MutationObserver which catches all changes made by native interfaces (such as spell corrections, etc). Lookout for this message and try to set Surface.skipNextObservation=true when you know that you will mutate the DOM.", e);
  };

  this.onDrop = function(event) {
    // console.log('Received drop on Surface', this.getId(), event);
    this.context.dragManager.onDrop(event, this);
  };

  this.onNativeBlur = function() {
    // console.log('Native blur on surface', this.getId());
    var _state = this._state;
    _state.hasNativeFocus = false;
  };

  this.onNativeFocus = function() {
    // console.log('Native focus on surface', this.getId());
    var _state = this._state;
    _state.hasNativeFocus = true;
  };

  // Internal implementations

  // called whenever we receive props
  // used to compute fragments that get dispatched to TextProperties
  this._deriveInternalState = function(nextProps) {
    var _state = this._state;
    var oldFragments = _state.fragments;
    if (oldFragments) {
      forEach(oldFragments, function(frag, key) {
        if (this._getComponentForKey(key)) {
          _markAsDirty(_state, key);
        }
      }.bind(this));
    }
    var nextFragments = nextProps.fragments;
    if (nextFragments) {
      this._deriveFragments(nextFragments);
    }
  };

  // fragments are all dynamic informations that we are displaying
  // like annotations (such as selections)
  this._deriveFragments = function(newFragments) {
    // console.log('deriving fragments', newFragments, this.getId());
    var _state = this._state;
    _state.cursorFragment = null;
    // group fragments by property
    var fragments = {};
    _forEachFragment(newFragments, function(frag, owner) {
      var key = frag.path.toString();
      frag.key = key;
      // skip frags which are not rendered here
      if (!this._getComponentForKey(key)) return;
      // extract the cursor fragment for special treatment (not shown when focused)
      if (frag.type === 'cursor' && owner === 'local-user') {
        _state.cursorFragment = frag;
        return;
      }
      var propertyFrags = fragments[key];
      if (!propertyFrags) {
        propertyFrags = [];
        fragments[key] = propertyFrags;
      }
      propertyFrags.push(frag);
      _markAsDirty(_state, key);
    }.bind(this));
    _state.fragments = fragments;
    // console.log('derived fragments', fragments, window.clientId);
  };

  function _forEachFragment(fragments, fn) {
    forEach(fragments, function(frags, owner) {
      frags.forEach(function(frag) {
        fn(frag, owner);
      });
    });
  }

  // called by SurfaceManager to know which text properties need to be
  // updated because of model changes
  this._checkForUpdates = function(change) {
    var _state = this._state;
    Object.keys(change.updated).forEach(function(key) {
      if (this._getComponentForKey(key)) {
        _markAsDirty(_state, key);
      }
    }.bind(this));
    return _state.isDirty;
  };

  this._update = function(oldProps, oldState) {
    this._updateContentEditableState(oldState);
    this._updateProperties();
  };

  this._updateContentEditableState = function(oldState) {
    // ContentEditable management
    // Note: to be able to isolate nodes, we need to control
    // how contenteditable is used in a hieriarchy of surfaces.
    if (oldState.mode === 'co-focused') {
      this.el.off('mousedown', this._enableContentEditable, this);
    }
    if (!this.isEditable()) {
      this.el.setAttribute('contenteditable', false);
    } else if (this.state.mode !== oldState.mode) {
      switch(this.state.mode) {
        case 'co-focused':
          this.el.setAttribute('contenteditable', false);
          this.el.on('mousedown', this._enableContentEditable, this);
          break;
        default:
          this.el.setAttribute('contenteditable', true);
      }
    }
  };

  this._enableContentEditable = function() {
    this.el.setAttribute('contenteditable', true);
  };

  this._updateProperties = function() {
    var _state = this._state;
    var dirtyProperties = Object.keys(_state.dirtyProperties);
    for (var i = 0; i < dirtyProperties.length; i++) {
      this._updateProperty(dirtyProperties[i]);
    }
    _state.isDirty = false;
    _state.dirtyProperties = {};
  };

  function _markAsDirty(_state, key) {
    _state.isDirty = true;
    _state.dirtyProperties[key] = true;
  }

  this._updateProperty = function(key) {
    var _state = this._state;
    // hide the cursor fragment when focused
    var cursorFragment = this._hasNativeFocus() ? null : _state.cursorFragment;
    var frags = _state.fragments[key] || [];
    if (cursorFragment && cursorFragment.key === key) {
      frags = frags.concat([cursorFragment]);
    }
    var comp = this._getComponentForKey(key);
    if (comp) {
      comp.extendProps({
        fragments: frags
      });
    }
  };

  this._onSessionUpdate = function(update) {
    if (update.selection) {
      var newMode = this._deriveModeFromSelection(update.selection);
      if (this.state.mode !== newMode) {
        this.extendState({
          mode: newMode
        });
      }
    }
  };

  // helper to manage surface mode which is derived from the current selection
  this._deriveModeFromSelection = function(sel) {
    var surfaceId = sel.surfaceId;
    var id = this.getId();
    var mode;
    if (startsWith(surfaceId, id)) {
      if (surfaceId.length === id.length) {
        mode = 'focused';
      } else {
        mode = 'co-focused';
      }
    }
    return mode;
  };

  // surface parent is either a Surface or IsolatedNode
  this._getSurfaceParent = function() {
    return this.context.surfaceParent;
  };

  this._getComponentForKey = function(key) {
    return this._textProperties[key];
  };

  this._focus = function() {
    this._state.hasNativeFocus = true;
    // HACK: we must not focus explicitly in Chrome/Safari
    // as otherwise we get a crazy auto-scroll
    // Still, this is ok, as everything is working fine
    // there, without that (as opposed to FF/Edge)
    if (this.el && !platform.isWebkit) {
      this._state.skipNextFocusEvent = true;
      // ATTENTION: unfortunately, focusing the contenteditable does lead to auto-scrolling
      // in some browsers
      this.el.focus();
      this._state.skipNextFocusEvent = false;
    }
  };

  this._handleLeftOrRightArrowKey = function (event) {
    event.stopPropagation();

    var direction = (event.keyCode === keys.LEFT) ? 'left' : 'right';
    var selState = this.getDocumentSession().getSelectionState();
    var sel = selState.getSelection();
    // Note: collapsing the selection and let ContentEditable still continue doing a cursor move
    if (selState.isInlineNodeSelection() && !event.shiftKey) {
      event.preventDefault();
      this.setSelection(sel.collapse(direction));
      return;
    }

    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    window.setTimeout(function() {
      if (!this.isMounted()) return;
      var options = {
        direction: (event.keyCode === keys.LEFT) ? 'left' : 'right'
      };
      this._updateModelSelection(options);
    }.bind(this));
  };

  this._handleUpOrDownArrowKey = function (event) {
    event.stopPropagation();
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    window.setTimeout(function() {
      if (!this.isMounted()) return;
      var options = {
        direction: (event.keyCode === keys.UP) ? 'left' : 'right'
      };
      this._updateModelSelection(options);
    }.bind(this));
  };

  this._handleHomeOrEndKey = function (event) {
    event.stopPropagation();
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    window.setTimeout(function() {
      if (!this.isMounted()) return;
      var options = {
        direction: (event.keyCode === keys.HOME) ? 'left' : 'right'
      };
      this._updateModelSelection(options);
    }.bind(this));
  };

  this._handlePageUpOrDownKey = function (event) {
    event.stopPropagation();
    // Note: we need this timeout so that CE updates the DOM selection first
    // before we map it to the model
    window.setTimeout(function() {
      if (!this.isMounted()) return;
      var options = {
        direction: (event.keyCode === keys.PAGEUP) ? 'left' : 'right'
      };
      this._updateModelSelection(options);
    }.bind(this));
  };

  this._handleSpaceKey = function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.transaction(function(tx, args) {
      // trying to remove the DOM selection to reduce flickering
      this.domSelection.clear();
      args.text = " ";
      return this.insertText(tx, args);
    }.bind(this), { action: 'type' });
  };

  this._handleEnterKey = function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey) {
      this.transaction(function(tx, args) {
        return this.softBreak(tx, args);
      }.bind(this), { action: 'break' });
    } else {
      this.transaction(function(tx, args) {
        return this.break(tx, args);
      }.bind(this), { action: 'break' });
    }
  };

  this._handleDeleteKey = function (event) {
    event.preventDefault();
    event.stopPropagation();
    var direction = (event.keyCode === keys.BACKSPACE) ? 'left' : 'right';
    this.transaction(function(tx, args) {
      args.direction = direction;
      return this.delete(tx, args);
    }.bind(this), { action: 'delete' });
  };

  this._hasNativeFocus = function() {
    return Boolean(this._state.hasNativeFocus);
  };

  this._setSelection = function(sel) {
    // Since we allow the surface be blurred natively when clicking
    // on tools we now need to make sure that the element is focused natively
    // when we set the selection
    // This is actually only a problem on FF, other browsers set the focus implicitly
    // when a new DOM selection is set.
    // ATTENTION: in FF 44 this was causing troubles, making the CE unselectable
    // until the next native blur.
    // Should not be necessary anymore as this should be covered by this._focus()
    // which will eventually be called at the end of the update flow
    if (!sel.isNull() && sel.surfaceId === this.getId() && platform.isFF) {
      this._focus();
    }
    this.documentSession.setSelection(sel);
  };

  this._updateModelSelection = function(options) {
    var sel = this.domSelection.getSelection(options);
    // console.log('Surface: updating model selection', sel.toString());
    // NOTE: this will also lead to a rerendering of the selection
    // via session.on('update')
    this.setSelection(sel);
  };

  this._selectProperty = function(path) {
    var doc = this.getDocument();
    var text = doc.get(path);
    this.setSelection(doc.createSelection(path, 0, text.length));
  };

  // internal API for TextProperties to enable dispatching
  // TextProperty components are registered via path
  this._registerTextProperty = function(textPropertyComponent) {
    var path = textPropertyComponent.getPath();
    this._textProperties[path] = textPropertyComponent;
  };

  this._unregisterTextProperty = function(textPropertyComponent) {
    var path = textPropertyComponent.getPath();
    if (this._textProperties[path] === textPropertyComponent) {
      delete this._textProperties[path];
    }
  };

  this._getTextPropertyComponent = function(path) {
    return this._textProperties[path];
  };

  // TODO: we could integrate container node rendering into this helper
  // TODO: this helper should be available also in non surface context
  this._renderNode = function($$, nodeId) {
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

  /*
    Called when starting a transaction to populate the transaction
    arguments.
    ATM used only by ContainerEditor.
  */
  this._prepareArgs = function(args) { // eslint-disable-line
  };

  // Experimental: used by DragManager
  this.getSelectionFromEvent = function(event) {
    if (this.domSelection) {
      var domRange = Surface.getDOMRangeFromEvent(event);
      var sel = this.domSelection.getSelectionForDOMRange(domRange);
      sel.surfaceId = this.getId();
      return sel;
    }
  };

  this.setSelectionFromEvent = function(event) {
    var sel = this.getSelectionFromEvent(event);
    if (sel) {
      this._state.skipNextFocusEvent = true;
      this.setSelection(sel);
    } else {
      console.error('Could not create a selection from event.');
    }
  };

  // EXPERIMENTAL: get bounding box for current selection
  this.getBoundingRectangleForSelection = function() {
    var sel = this.getSelection();
    if (this.isDisabled() ||
        !sel || sel.isNull() ||
        sel.isNodeSelection() || sel.isCustomSelection()) return {};

    // TODO: selection rectangle should be calculated
    // relative to scrolling container, which either is
    // the parent scrollPane, or the body element
    var containerEl;
    if (this.context.scrollPane) {
      containerEl = this.context.scrollPane.refs.content.el.el;
    } else {
      containerEl = document.body;
    }

    var wsel = window.getSelection();
    var wrange;
    if (wsel.rangeCount > 0) {
      wrange = wsel.getRangeAt(0);
    }

    // having a DOM selection?
    if (wrange && wrange.collapsed) {
      // unfortunately, collapsed selections do not have a boundary rectangle
      // thus we need to insert a span temporarily and take its rectangle
      // if (wrange.collapsed) {
      var span = document.createElement('span');
      // Ensure span has dimensions and position by
      // adding a zero-width space character
      this._state.skipNextObservation = true;
      span.appendChild(window.document.createTextNode("\u200b"));
      wrange.insertNode(span);
      var rect = getRelativeBoundingRect(span, containerEl);
      var spanParent = span.parentNode;
      this._state.skipNextObservation = true;
      spanParent.removeChild(span);
      // Glue any broken text nodes back together
      spanParent.normalize();
      // HACK: in FF the DOM selection gets corrupted
      // by the span-insertion above
      if (platform.isFF) {
        this.rerenderDOMSelection();
      }
      return rect;
    } else {
      var nativeEl = this.el.el;
      if (sel.isCollapsed()) {
        var cursorEl = nativeEl.querySelector('.se-cursor');
        if (cursorEl) {
          return getRelativeBoundingRect(cursorEl, containerEl);
        } else {
          // TODO: in the most cases we actually do not have a
          // cursor element.
          // console.warn('FIXME: there should be a rendered cursor element.');
          return {};
        }
      } else {
        var selFragments = nativeEl.querySelectorAll('.se-selection-fragment');
        if (selFragments.length > 0) {
          return getRelativeBoundingRect(selFragments, containerEl);
        } else {
          console.warn('FIXME: there should be a rendered selection fragments element.');
          return {};
        }
      }
    }
  };

  this._sendOverlayHints = function() {
    // TODO: we need to rethink this.
    // The overlay is owned by the ScrollPane.
    // So the current solution is to send up hints
    // which are dispatched to the overlay instance.
    var selectionRect = this.getBoundingRectangleForSelection();
    this.send('updateOverlayHints', {
      rectangle: selectionRect
    });
  };

};

Component.extend(Surface);

Surface.getDOMRangeFromEvent = function(evt) {
  var range, x = evt.clientX, y = evt.clientY;

  // Try the simple IE way first
  if (document.body.createTextRange) {
    range = document.body.createTextRange();
    range.moveToPoint(x, y);
  }

  else if (!isUndefined(document.createRange)) {
    // Try Mozilla's rangeOffset and rangeParent properties,
    // which are exactly what we want
    if (!isUndefined(evt.rangeParent)) {
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

export default Surface;
